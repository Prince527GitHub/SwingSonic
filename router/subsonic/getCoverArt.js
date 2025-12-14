const { safeDecode } = require("../../packages/safe");

module.exports = async(req, res, proxy) => {
    const id = req.query.id;

    const decoded = safeDecode(id);

    if (decoded) proxy(res, req, `${global.config.music}/img/${decoded.type === "artist" ? "artist" : "thumbnail"}/medium/${decoded.id}`);
    else proxy(res, req, `${global.config.music}/img/thumbnail/medium/${encodeURIComponent(id)}.webp`);
}
