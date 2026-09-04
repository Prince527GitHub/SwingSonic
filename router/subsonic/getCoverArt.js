const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async(req, res, proxy) => {
    const id = req.query.id;

    const decoded = codecs.decode(id);

    if (decoded?.id) proxy(res, req, api.url(`/img/${decoded.type === "artist" ? "artist" : "thumbnail"}/medium/${decoded.id}`));
    else proxy(res, req, api.url(`/img/thumbnail/medium/${encodeURIComponent(id)}.webp`));
};
