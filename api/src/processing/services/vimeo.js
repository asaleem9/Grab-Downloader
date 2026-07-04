import HLS from "hls-parser";
import { env } from "../../config.js";
import { merge } from '../../misc/utils.js';

const resolutionMatch = {
    "3840": 2160,
    "2732": 1440,
    "2560": 1440,
    "2048": 1080,
    "1920": 1080,
    "1366": 720,
    "1280": 720,
    "960": 480,
    "640": 360,
    "426": 240
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

// vimeo revoked the hardcoded oauth client that the old api.vimeo.com
// flow relied on, so we go straight through the player config endpoint
// instead - it exposes progressive + hls streams for public videos with
// no auth at all. embed/domain-restricted videos don't serve the config
// directly, so we fall back to the tokened config_url embedded in the
// watch page.
const getConfig = async (id, password) => {
    const configUrl = new URL(`https://player.vimeo.com/video/${id}/config`);
    if (password) {
        configUrl.searchParams.set('h', password);
    }

    const direct = await fetch(configUrl, {
        headers: {
            'User-Agent': USER_AGENT,
            Referer: 'https://player.vimeo.com/',
        }
    })
    .then(r => r.ok ? r.json() : undefined)
    .catch(() => {});

    if (direct?.request) return direct;

    // fall back to the config url carried in the watch page (has a token)
    const page = await fetch(`https://vimeo.com/${id}${password ? `/${password}` : ''}`, {
        headers: { 'User-Agent': USER_AGENT }
    })
    .then(r => r.ok ? r.text() : '')
    .catch(() => '');

    const match = page.match(/"config_url":"(.+?)"/) || page.match(/"configUrl":"(.+?)"/);
    if (!match) return;

    let embeddedConfigUrl;
    try {
        embeddedConfigUrl = JSON.parse(`"${match[1]}"`);
    } catch {
        return;
    }

    return fetch(embeddedConfigUrl, { headers: { 'User-Agent': USER_AGENT } })
        .then(r => r.ok ? r.json() : undefined)
        .catch(() => {});
}

const compareQuality = (rendition, requestedQuality) => {
    const quality = parseInt(rendition);
    return Math.abs(quality - requestedQuality);
}

const getSubtitles = (config, subtitleLang) => {
    if (!subtitleLang) return;

    const track = config.request?.text_tracks?.find(
        t => t.lang?.startsWith(subtitleLang)
    );
    if (!track?.url) return;

    return new URL(track.url, "https://player.vimeo.com/").toString();
}

// progressive = plain muxed mp4 files, the nicest case
const getProgressive = (config, quality, subtitleLang) => {
    const progressive = config.request?.files?.progressive;
    if (!progressive?.length) return;

    const match = progressive.reduce((prev, next) => {
        const delta = {
            prev: compareQuality(prev.quality, quality),
            next: compareQuality(next.quality, quality)
        };
        return delta.prev < delta.next ? prev : next;
    });

    if (!match?.url) return;

    return {
        urls: match.url,
        subtitles: getSubtitles(config, subtitleLang),
        filenameAttributes: {
            resolution: `${match.width}x${match.height}`,
            qualityLabel: match.quality,
            extension: "mp4"
        },
        bestAudio: "mp3",
    }
}

const getHLS = async (config, obj) => {
    const hls = config.request?.files?.hls;
    const cdn = hls?.default_cdn;
    const urlMasterHLS = hls?.cdns?.[cdn]?.url
        || hls?.cdns?.akfire_interconnect_quic?.url
        || hls?.cdns?.fastly_skyfire?.url;

    if (!urlMasterHLS) return { error: "fetch.empty" };

    const masterHLS = await fetch(urlMasterHLS, { headers: { 'User-Agent': USER_AGENT } })
                            .then(r => r.text())
                            .catch(() => {});

    if (!masterHLS) return { error: "fetch.fail" };

    const variants = HLS.parse(masterHLS)?.variants?.sort(
        (a, b) => Number(b.bandwidth) - Number(a.bandwidth)
    );
    if (!variants || variants.length === 0) return { error: "fetch.empty" };

    let bestQuality;

    if (obj.quality < resolutionMatch[variants[0]?.resolution?.width]) {
        bestQuality = variants.find(v =>
            (obj.quality === resolutionMatch[v.resolution.width])
        );
    }

    if (!bestQuality) bestQuality = variants[0];

    const expandLink = (path) => {
        return new URL(path, urlMasterHLS).toString();
    };

    let urls = expandLink(bestQuality.uri);

    const audioPath = bestQuality?.audio[0]?.uri;
    if (audioPath) {
        urls = [
            urls,
            expandLink(audioPath)
        ]
    } else if (obj.isAudioOnly) {
        return { error: "fetch.empty" };
    }

    return {
        urls,
        isHLS: true,
        subtitles: getSubtitles(config, obj.subtitleLang),
        filenameAttributes: {
            resolution: `${bestQuality.resolution.width}x${bestQuality.resolution.height}`,
            qualityLabel: `${resolutionMatch[bestQuality.resolution.width]}p`,
            extension: "mp4"
        },
        bestAudio: "mp3",
    }
}

export default async function(obj) {
    let quality = obj.quality === "max" ? 9000 : Number(obj.quality);
    if (quality < 240) quality = 240;
    if (!quality || obj.isAudioOnly) quality = 9000;

    const config = await getConfig(obj.id, obj.password);
    if (!config?.request) {
        return { error: "fetch.empty" };
    }

    if (config.video?.duration > env.durationLimit) {
        return { error: "content.too_long" };
    }

    let response;

    // audio-only needs HLS (progressive files are muxed)
    if (obj.isAudioOnly) {
        response = await getHLS(config, { ...obj, quality });
    }

    // prefer progressive mp4, fall back to HLS
    if (!response || response.error) {
        response = getProgressive(config, quality, obj.subtitleLang)
            || await getHLS(config, { ...obj, quality });
    }

    if (!response) response = { error: "fetch.empty" };
    if (response.error) return response;

    const fileMetadata = {
        title: config.video?.title,
        artist: config.video?.owner?.name,
    };

    if (response.subtitles) {
        fileMetadata.sublanguage = obj.subtitleLang;
    }

    return merge(
        {
            fileMetadata,
            filenameAttributes: {
                service: "vimeo",
                id: obj.id,
                title: fileMetadata.title,
                author: fileMetadata.artist,
            }
        },
        response
    );
}
