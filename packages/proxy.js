const http = require("http");
const https = require("https");

module.exports = (res, req, url) => {
    const target = new URL(url);

    const proxy = (target.protocol === "https:" ? https : http).get(
        {
            hostname: target.hostname,
            port: target.port,
            path: `${target.pathname}${target.search}`,
            headers: {
                Cookie: req.user,
                "User-Agent": req.headers["user-agent"] ?? "Mozilla/5.0",
                Accept: req.headers.accept ?? "*/*",
                ...(req.headers.range && { Range: req.headers.range }),
            },
        },
        (response) => {
            res.writeHead(response.statusCode, {
                ...response.headers,
                "accept-ranges": "bytes",
            });

            response.on("error", () => {
                if (!res.writableEnded) res.destroy();
            });

            response.pipe(res);
        },
    );

    proxy.on("error", (err) => {
        console.error("[PROXY]", err.message);
        if (!res.headersSent) res.status(500).send("Error proxying request.");
    });

    req.on("close", () => proxy.destroy());
};
