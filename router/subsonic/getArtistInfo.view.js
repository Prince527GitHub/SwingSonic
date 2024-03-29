module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let { f } = req.query;

    const artist = await (await fetch(`${global.config.music}/artist/${id}`)).json();

    const json = {
        "subsonic-response": {
            artistInfo: {
                biography: "Unknown",
                musicBrainzId: id,
                lastFmUrl: `${global.config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                smallImageUrl: `${global.config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                mediumImageUrl: `${global.config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                largeImageUrl: `${global.config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                similarArtist: []
            },
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}