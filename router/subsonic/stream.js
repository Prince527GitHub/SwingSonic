module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    const decoded = JSON.parse(Buffer.from(decodeURIComponent(id), "base64").toString("utf-8"));

    // due to using of legacy endpoint, no need to specify container and quality
    proxy(res, req, `${global.config.music}/file/${decoded.id}/legacy?filepath=${encodeURIComponent(decoded.path)}`);
}
