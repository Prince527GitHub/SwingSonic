module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    proxy(res, req, `${global.config.music}/file/${id}`);
}