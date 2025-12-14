const { get } = require("../../packages/safe");

module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let { f, u, t, s } = req.query;

    const artist = await (await fetch(`${global.config.music}/artist/${id}`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const artistImage = get(artist, "artist.image");
    const image = artistImage ? Buffer.from(JSON.stringify({ type: "artist", id: artistImage })).toString("base64") : undefined;
    const link = image ? `${get(global, "config.server.url")}/rest/getCoverArt.view?id=${image}&u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}&s=${encodeURIComponent(s)}` : undefined;

    const json = {
        "subsonic-response": {
            artistInfo2: {
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
