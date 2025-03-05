const axios = require("axios");

module.exports = async (res, req, url) => {
    try {
        const headers = {
            "Cookie": req.user,
            "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
            "Accept": req.headers["accept"] || "*/*",
            "Connection": "keep-alive",
        };

        if (req.headers["range"]) headers["Range"] = req.headers["range"];

        const response = await axios.get(url, {
            responseType: "stream",
            headers,
        });

        res.writeHead(response.status, response.headers);

        response.data.pipe(res);
    } catch (error) {
        console.error("Proxy error:", error.message);
        res.status(500).send("Error proxying request.");
    }
};
