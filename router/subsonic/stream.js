const { safeDecode, get } = require("../../packages/safe");

module.exports = async(req, res, proxy) => {
    const id = req.query.id;

    const decoded = safeDecode(id);

    if (decoded && get(decoded, "id") && get(decoded, "path"))
        proxy(res, req, `${global.config.music}/file/${get(decoded, "id")}/legacy?filepath=${encodeURIComponent(get(decoded, "path"))}`);
}
