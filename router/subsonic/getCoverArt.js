function safeDecodeId(id) {
    try {
        const json = Buffer.from(id, "base64").toString("utf-8");
        return JSON.parse(json);
    } catch {
        return null;
    }
}

module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    const decoded = safeDecodeId(id);

    if (decoded) {
        proxy(res, req, `${global.config.music}/img/${decoded.type === "artist" ? "artist" : "thumbnail"}/medium/${decoded.id}`);
    } else {
        // обычный Subsonic coverArt id
        proxy(res, req, `${global.config.music}/img/thumbnail/medium/${encodeURIComponent(id)}.webp`);
    }
}
