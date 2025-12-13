module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let { f, u, t, s } = req.query;

    const artist = await (await fetch(`${global.config.music}/artist/${id}`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const image = Buffer.from(JSON.stringify({ type: "artist", id: artist.artist.image })).toString("base64");
    const link = `${global.config.server.url}/rest/getCoverArt.view?id=${image}&u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}&s=${encodeURIComponent(s)}`;

    const json = {
        "subsonic-response": {
            artistInfo: {
                biography: "Unknown",
                musicBrainzId: id,
                smallImageUrl: link,
                mediumImageUrl: link,
                largeImageUrl: link,
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}
