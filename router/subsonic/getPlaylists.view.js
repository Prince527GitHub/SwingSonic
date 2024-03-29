module.exports = async(req, res, proxy, xml) => {
    let { f } = req.query;

    const playlists = await (await fetch(`${global.config.music}/playlists`)).json();

    const output = playlists.data.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        comment: "No comment",
        owner: "admin",
        public: true,
        songCount: playlist.count,
        duration: playlist.duration,
        created: playlist.last_updated,
        coverArt: playlist.image
    }));

    const json = {
        "subsonic-response": {
            playlists: {
                playlist: output
            },
            status: "ok",
            version: "1.16.1"
        }
    };

    if (f === "json") res.json(json);
    else res.send(xml(json));
}