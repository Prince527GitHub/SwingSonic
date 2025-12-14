const { get, safe } = require("../../packages/safe");

module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let { f } = req.query;

    const getAlbums = await (await fetch(`${global.config.music}/artist/${id}/albums?limit=7&all=false`, {
        headers: {
            "Cookie": req.user
        }
    })).json();
    const artist = await (await fetch(`${global.config.music}/artist/${id}`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const albums = safe(() => get(getAlbums, "albums", []).map(album => ({
        id: get(album, "albumhash"),
        name: get(album, "title"),
        coverArt: get(album, "image") ? Buffer.from(JSON.stringify({ type: "album", id: get(album, "image") })).toString("base64") : undefined,
        songCount: 0,
        created: get(album, "date") ? new Date(get(album, "date") * 1000).toISOString() : undefined,
        duration: 0,
        artist: get(album, "albumartists[0].name"),
        artistId: get(album, "albumartists[0].artisthash")
    })), []);

    const json = {
        "subsonic-response": {
            artist: {
                id: id,
                name: get(artist, "artist.name"),
                coverArt: get(artist, "artist.image") ? Buffer.from(JSON.stringify({ type: "artist", id: get(artist, "artist.image") })).toString("base64") : undefined,
                songCount: get(artist, "artist.trackcount"),
                created: new Date().toISOString(),
                duration: get(artist, "artist.duration"),
                artist: get(artist, "artist.name"),
                artistId: id,
                album: albums
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
