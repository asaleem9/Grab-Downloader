import { Agent, request } from "undici";
import { create as contentDisposition } from "content-disposition-header";

import { destroyInternalStream } from "./manage.js";
import { getHeaders, closeRequest, closeResponse, pipe } from "./shared.js";

const defaultAgent = new Agent();

export default async function (streamInfo, res) {
    const abortController = new AbortController();
    const shutdown = () => (
        closeRequest(abortController),
        closeResponse(res),
        destroyInternalStream(streamInfo.urls)
    );

    try {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Content-disposition', contentDisposition(streamInfo.filename));

        const { body: stream, headers, statusCode } = await request(streamInfo.urls, {
            headers: {
                ...getHeaders(streamInfo.service),
                Range: streamInfo.range
            },
            signal: abortController.signal,
            maxRedirections: 16,
            dispatcher: defaultAgent,
        });

        res.status(statusCode);

        for (const headerName of ['accept-ranges', 'content-type']) {
            if (headers[headerName]) {
                res.setHeader(headerName, headers[headerName]);
            }
        }

        // forwarding a real content-length makes serverless platforms
        // (e.g. cloud run) treat the response as non-streamed and buffer
        // it, which they cap at 32 MiB - so large downloads fail. for
        // full (200) responses we instead expose the size as
        // Estimated-Content-Length, keeping the response chunked/streamed
        // while the client still gets a total for its progress bar.
        // ranged (206) responses keep content-length so seeking works.
        if (headers['content-length']) {
            if (statusCode === 206) {
                res.setHeader('content-length', headers['content-length']);
                if (headers['content-range']) {
                    res.setHeader('content-range', headers['content-range']);
                }
            } else {
                res.setHeader('Estimated-Content-Length', headers['content-length']);
            }
        }

        pipe(stream, res, shutdown);
    } catch {
        shutdown();
    }
}
