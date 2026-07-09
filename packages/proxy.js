const { Readable } = require("stream");

module.exports = async (res, req, url) => {
    try {
        const response = await fetch(url, {
            headers: {
                Cookie: req.user,
                "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
                Accept: req.headers["accept"] || "*/*",
                Connection: "keep-alive",
                ...(req.headers["range"] && { Range: req.headers["range"] }),
            }
        });

        res.writeHead(response.status, {
            ...Object.fromEntries(response.headers),
            "accept-ranges": "bytes",
        });

        Readable.fromWeb(response.body)
            .on("error", (err) => console.error("[PROXY] Stream error:", err.message))
            .pipe(res);
    } catch (error) {
        console.error("Proxy error:", error.message);
        if (!res.headersSent) res.status(500).send("Error proxying request.");
    }
};
