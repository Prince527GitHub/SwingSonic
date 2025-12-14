const { get, safe } = require("../../packages/safe");

module.exports = async(req, res, proxy, xml) => {
    let { f } = req.query;

    const favorites = await (await fetch(`${global.config.music}/favorites`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const artists = safe(() => get(favorites, "artists", []).map(artist => ({
        name: get(artist, "name"),
        id: get(artist, "artisthash"),
        starred: get(artist, "date") ? new Date(get(artist, "date") * 1000).toISOString() : undefined
    })), []);

    const albums = safe(() => get(favorites, "albums", []).map(album => ({
        id: get(album, "albumhash"),
        parent: get(album, "albumhash"),
        title: get(album, "title"),
        album: get(album, "title"),
        isDir: "true",
        coverArt: get(album, "image") ? Buffer.from(JSON.stringify({ type: "album", id: get(album, "image") })).toString("base64") : undefined,
        created: get(album, "date") ? new Date(get(album, "date") * 1000).toISOString() : undefined,
        starred: get(album, "date") ? new Date(get(album, "date") * 1000).toISOString() : undefined
    })), []);

    const tracks = safe(() => get(favorites, "tracks", []).map(track => ({
        id: get(track, "trackhash"),
        parent: get(track, "albumhash"),
        isDir: false,
        title: get(track, "title"),
        album: get(track, "album"),
        artist: get(track, "artists[0].name"),
        track: get(track, "track"),
        genre: get(track, "extra.genre[0]"),
        coverArt: get(track, "image") ? Buffer.from(JSON.stringify({ type: "album", id: get(track, "image") })).toString("base64") : undefined,
        size: get(track, "extra.filesize"),
        duration: get(track, "duration"),
        bitRate: get(track, "bitrate"),
        bitDepth: get(track, "extra.bitdepth"),
        samplingRate: get(track, "extra.samplerate"),
        channelCount: get(track, "extra.channels"),
        path: get(track, "filepath"),
        isVideo: false,
        discNumber: get(track, "disc"),
        albumId: get(track, "albumhash"),
        artistId: get(track, "extra.artist[0].artisthash"),
        type: "music",
        artists: safe(() => get(track, "extra.artist", []).map(artist => ({ name: artist })), []),
        displayArtist: get(track, "extra.artist[0]"),
        explicitStatus: get(track, "explicit") ? "explicit" : "clean",
        starred: new Date(0).toISOString(),
    })), []);

    const json = {
        "subsonic-response": {
            starred: {
                artist: artists,
                album: albums,
                song: tracks
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
