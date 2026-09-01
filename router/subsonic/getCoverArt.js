const decode = require("../../packages/decode");

module.exports = async(req, res, proxy) => {
    const id = req.query.id;

    const decoded = decode.decode(id);

    if (decoded?.id) proxy(res, req, `${global.config.music}/img/${decoded.type === "artist" ? "artist" : "thumbnail"}/medium/${encodeURIComponent(decoded.id)}`);
    else proxy(res, req, `${global.config.music}/img/thumbnail/medium/${encodeURIComponent(id)}.webp`);
}
