module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    const url = `${global.config.music}/file/${id}`;

    if (global.config.server.proxy) proxy(res, url);
    else res.redirect(url);
}