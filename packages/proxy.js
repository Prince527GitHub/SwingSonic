const { sanitizeCookie } = require("./cookie");
const { pipeline } = require("stream");
const https = require("https");
const http = require("http");

const HEADERS = ["set-cookie", "connection", "keep-alive", "proxy-connection"];

module.exports = (res, req, url) => {
    const target = new URL(url);
    const client = target.protocol === "https:" ? https : http;

    const cookie = sanitizeCookie(req.user);

    const proxy = client.get(
        {
            hostname: target.hostname,
            port: target.port,
            path: `${target.pathname}${target.search}`,
            headers: {
                ...(cookie && { Cookie: cookie }),
                "User-Agent": req.headers["user-agent"] ?? "Mozilla/5.0",
                Accept: req.headers.accept ?? "*/*",
                ...(req.headers.range && { Range: req.headers.range }),
                ...(req.headers["if-range"] && { "If-Range": req.headers["if-range"] })
            }
        },
        (response) => {
            if (res.destroyed) return response.destroy();

            const headers = { ...response.headers };
            HEADERS.forEach(header => delete headers[header]);

            if (req.url?.includes("/rest/download") && !headers["content-disposition"]) headers["content-disposition"] = "attachment";

            res.writeHead(response.statusCode, headers);

            pipeline(response, res, (err) => {
                if (err && !res.destroyed) {
                    console.error("[PROXY] Stream error:", err.message);
                    res.destroy();
                }
            });
        }
    );

    proxy.on("error", (err) => {
        console.error("[PROXY] Request error:", err.message);

        if (res.destroyed) return;

        if (res.headersSent) res.destroy();
        else {
            res.statusCode = 500;
            res.end("Error proxying request.");
        }
    });

    res.on("close", () => {
        if (!res.writableEnded && !proxy.destroyed) proxy.destroy();
    });
};
