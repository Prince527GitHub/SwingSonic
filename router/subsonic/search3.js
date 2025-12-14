const zw = require("../../packages/zw");

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
            name: artist.name,
            coverArt: Buffer.from(JSON.stringify({ type: "artist", id: artist.image })).toString("base64"),
            albumCount: artist.albumcount
        }));
    }

    let albums = [];

    if (albumCount >= 1 && query) {
        albums = await (await fetch(`${global.config.music}/search/?itemtype=albums&q=${query}&start=${albumOffset || 0}&limit=${albumCount || 50}`, args)).json();
        albums = albums.results.map(album => ({
            id: album.albumhash,
            name: album.title,
            coverArt: Buffer.from(JSON.stringify({ type: "album", id: album.image })).toString("base64"),
            songCount: 0,
            created: new Date(album.date * 1000).toISOString(),
            duration: 0,
            artist: album.albumartists[0].name,
            artistId: album.albumartists[0].artisthash
        }));
    }

    let tracks = [];

    if (songCount >= 1 && query) {
        tracks = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${query}&start=${songOffset || 0}&limit=${songCount || 50}`, args)).json();
        tracks = tracks.results.map(track => ({
            id: encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")),
            parent: track.albumhash,
            title: global.config.server.api.subsonic.options.zw ? zw.inject(track.title, Buffer.from(JSON.stringify({ album: track.albumhash, id: track.trackhash })).toString("base64")) : track.title,
            album: track.album,
            artist: track.albumartists[0].name,
            isDir: false,
            coverArt: Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64"),
            created: "2007-03-15T06:46:06",
            duration: track.duration,
            bitRate: track.bitrate,
            track: 0,
            size: track.extra.filesize,
            isVideo: false,
            path: track.filepath,
            albumId: track.albumhash,
            artistId: track.albumartists[0].artisthash,
            type: "music"
        }));
    }

    const json = {
        "subsonic-response": {
            searchResult3: {
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
