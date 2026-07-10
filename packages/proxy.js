const { pipeline } = require("stream");
const https = require("https");
const http = require("http");

module.exports = (res, req, url) => {
    const target = new URL(url);
    const module = target.protocol === "https:" ? https : http;

    const proxy = module.get(
        {
            hostname: target.hostname,
            port: target.port,
            path: `${target.pathname}${target.search}`,
            headers: {
                Cookie: req.user,
                "User-Agent": req.headers["user-agent"] ?? "Mozilla/5.0",
                Accept: req.headers.accept ?? "*/*",
                ...(req.headers.range && { Range: req.headers.range })
            }
        },
        (response) => {
            if (res.destroyed) return response.destroy();

            res.writeHead(response.statusCode, response.headers);

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
