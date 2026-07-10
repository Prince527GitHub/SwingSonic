const { Readable } = require("stream");

module.exports = async (res, req, url) => {
    const controller = new AbortController();

    req.on("close", () => controller.abort());

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Cookie: req.user,
                "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
                Accept: req.headers["accept"] || "*/*",
                ...(req.headers["range"] && { Range: req.headers["range"] }),
            }
        });

        res.writeHead(response.status, {
            ...Object.fromEntries(response.headers),
            "accept-ranges": "bytes",
        });

        Readable.fromWeb(response.body)
            .on("error", () => { if (!res.writableEnded) res.destroy(); })
            .pipe(res);
    } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Proxy error:", error.message);
        if (!res.headersSent) res.status(500).send("Error proxying request.");
    }
};
