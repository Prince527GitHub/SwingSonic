module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    const artist = await fetch(`${global.config.music}/artist/${id.replace(/\.[^.]+$/, '')}/albums?limit=1&all=false`);

    const cover = `${global.config.music}/img/${artist.ok ? 'a': 't'}/${id}`;

    if (global.config.server.proxy) proxy(res, cover);
    else res.redirect(cover);
}