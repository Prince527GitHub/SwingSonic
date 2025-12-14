const { get, safe } = require("../../packages/safe");
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
        const artistResults = await (await fetch(`${global.config.music}/search/?itemtype=artists&q=${query}&start=${artistOffset || 0}&limit=${artistCount || 50}`, args)).json();
        artists = safe(() => get(artistResults, "results", []).map(artist => ({
            id: get(artist, "artisthash"),
            name: get(artist, "name")
        })), []);
    }

    let albums = [];

    if (albumCount >= 1 && query) {
        const albumResults = await (await fetch(`${global.config.music}/search/?itemtype=albums&q=${query}&start=${albumOffset || 0}&limit=${albumCount || 50}`, args)).json();
        albums = safe(() => get(albumResults, "results", []).map(album => ({
            id: get(album, "albumhash"),
            parent: get(album, "albumhash"),
            title: get(album, "title"),
            artist: get(album, "albumartists[0].name"),
            isDir: "true",
            coverArt: get(album, "image") ? Buffer.from(JSON.stringify({ type: "album", id: get(album, "image") })).toString("base64") : undefined
        })), []);
    }

    let tracks = [];

    if (songCount >= 1 && query) {
        const trackResults = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${query}&start=${songOffset || 0}&limit=${songCount || 50}`, args)).json();
        tracks = safe(() => get(trackResults, "results", []).map(track => ({
            id: get(track, "trackhash") && get(track, "filepath") ? encodeURIComponent(Buffer.from(JSON.stringify({ id: get(track, "trackhash"), path: get(track, "filepath") })).toString("base64")) : undefined,
            parent: get(track, "albumhash"),
            title: get(global, "config.server.api.subsonic.options.zw") && get(track, "title") && get(track, "albumhash") && get(track, "trackhash") ? zw.inject(get(track, "title"), Buffer.from(JSON.stringify({ album: get(track, "albumhash"), id: get(track, "trackhash") })).toString("base64")) : get(track, "title"),
            isDir: false,
            album: get(track, "album"),
            artist: get(track, "albumartists[0].name"),
            track: 0,
            coverArt: get(track, "image") ? Buffer.from(JSON.stringify({ type: "album", id: get(track, "image") })).toString("base64") : undefined,
            size: get(track, "extra.filesize"),
            isVideo: false
        })), []);
    }

    const json = {
        "subsonic-response": {
            searchResult2: {
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
