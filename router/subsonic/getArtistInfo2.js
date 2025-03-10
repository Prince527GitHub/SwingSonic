module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let { f } = req.query;

    const artist = await (await fetch(`${global.config.music}/artist/${id}`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const image = Buffer.from(JSON.stringify({ type: "artist", id: artist.artist.image })).toString("base64");
    const link = `${global.config.server.url}/rest/getCoverArt.view?id=${image}`;

    const json = {
        "subsonic-response": {
            artistInfo2: {
                biography: "Unknown",
                musicBrainzId: id,
                lastFmUrl: link,
                smallImageUrl: link,
                mediumImageUrl: link,
                largeImageUrl: link,
                similarArtist: []
            },
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}