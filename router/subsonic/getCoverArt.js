module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    // const artist = await fetch(`${global.config.music}/artist/${id.replace(/\.[^.]+$/, '')}/albums?limit=1&all=false`, {
    //     headers: {
    //         "Cookie": req.user
    //     }
    // });

    // const cover = `${global.config.music}/img/${artist.ok ? 'a': 't'}/${id}`;

    proxy(res, req, `${global.config.music}/img/thumbnail/medium/${id}`);
}