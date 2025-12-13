const { safeDecodeId } = require("../../packages/decodeId");

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
