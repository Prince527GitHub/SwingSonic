module.exports = async(req, res, proxy) => {
    const id = req.query.id;

    let decoded;
    try {
        const json = Buffer.from(decodeURIComponent(id), "base64").toString("utf-8");
        decoded = JSON.parse(json);
    } catch {
        decoded = null;
    }

    if (decoded) proxy(res, req, `${global.config.music}/img/${decoded.type === "artist" ? "artist" : "thumbnail"}/medium/${decoded.id}`);
    else proxy(res, req, `${global.config.music}/img/thumbnail/medium/${encodeURIComponent(id)}.webp`);
}
