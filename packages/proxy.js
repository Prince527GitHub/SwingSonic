const { Readable } = require("stream");

module.exports = async (res, req, url) => {
    try {
        const headers = {
            "Cookie": req.user,
            "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
            "Accept": req.headers["accept"] || "*/*",
            "Connection": "keep-alive",
        };

        if (req.headers["range"]) headers["Range"] = req.headers["range"];

        const response = await fetch(url, { headers });

        const forwarded = {};

        response.headers.forEach((value, key) => forwarded[key] = value);

        res.writeHead(response.status, forwarded);

        Readable.fromWeb(response.body).pipe(res);
    } catch (error) {
        console.error("Proxy error:", error.message);
        res.status(500).send("Error proxying request.");
    }
};
