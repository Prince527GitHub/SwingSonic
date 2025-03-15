const zw = require("../../packages/zw");

// TODO: Make ZW support behind a flag
module.exports = async(req, res, proxy, xml) => {
    const args = { headers: { "Cookie": req.user } };

    const query = req.query.query
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/[-_]/g, " ");

    let { artistCount, artistOffset, albumCount, albumOffset, songCount, songOffset, f } = req.query;

    let artists = [];

    if (artistCount >= 1 && query) {
        artists = await (await fetch(`${global.config.music}/search/?itemtype=artists&q=${query}&start=${artistOffset || 0}&limit=${artistCount || 50}`, args)).json();
        artists = artists.results.map(artist => ({
            id: artist.artisthash,
            name: artist.name
        }));
    }

    let albums = [];

    if (albumCount >= 1 && query) {
        albums = await (await fetch(`${global.config.music}/search/?itemtype=albums&q=${query}&start=${albumOffset || 0}&limit=${albumCount || 50}`, args)).json();
        albums = albums.results.map(album => ({
            id: album.albumhash,
            parent: album.albumhash,
            title: album.title,
            artist: album.albumartists[0].name,
            isDir: "true",
            coverArt: Buffer.from(JSON.stringify({ type: "album", id: album.image })).toString("base64")
        }));
    }

    let tracks = [];

    if (songCount >= 1 && query) {
        tracks = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${query}&start=${songOffset || 0}&limit=${songCount || 50}`, args)).json();
        tracks = tracks.results.map(track => ({
            id: encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")),
            parent: track.albumhash,
            title: global.config.server.api.subsonic.options.zw ? zw.inject(track.title, Buffer.from(JSON.stringify({ album: track.albumhash, id: track.trackhash })).toString("base64")) : track.title,
            isDir: false,
            album: track.album,
            artist: track.albumartists[0].name,
            track: 0,
            year: 2024,
            genre: "Unknown",
            coverArt: Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64"),
            size: 0,
            contentType: "audio/mpeg",
            suffix: "mp3",
            isVideo: false
        }));
    }

    const json = {
        "subsonic-response": {
            searchResult2: {
                artist: artists,
                album: albums,
                song: tracks
            },
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}