module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    const decoded = JSON.parse(id);

    proxy(res, req, `${global.config.music}/file/${decoded.id}/legacy?filepath=${decoded.path}&container=mp3&quality=original`);
}