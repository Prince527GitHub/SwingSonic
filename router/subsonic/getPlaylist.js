const { get, safe } = require("../../packages/safe");
const zw = require("../../packages/zw");

module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let { f, size, offset } = req.query;

    const playlist = await (await fetch(`${global.config.music}/playlists/${id}?no_tracks=false&start=${offset || "0"}&limit=${size || "50"}`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const output = safe(() => get(playlist, "tracks", []).map(track => ({
        id: get(track, "trackhash") && get(track, "filepath") ? encodeURIComponent(Buffer.from(JSON.stringify({ id: get(track, "trackhash"), path: get(track, "filepath") })).toString("base64")) : undefined,
        parent: "655",
        title: get(global, "config.server.api.subsonic.options.zw") && get(track, "title") && get(track, "albumhash") && get(track, "trackhash") ? zw.inject(get(track, "title"), Buffer.from(JSON.stringify({ album: get(track, "albumhash"), id: get(track, "trackhash") })).toString("base64")) : get(track, "title"),
        album: get(track, "album"),
        artist: get(track, "artists[0].name"),
        isDir: false,
        coverArt: get(track, "image") ? Buffer.from(JSON.stringify({ type: "album", id: get(track, "image") })).toString("base64") : undefined,
        created: new Date().toISOString(),
        duration: get(track, "duration"),
        bitRate: get(track, "bitrate"),
        track: get(track, "track"),
        year: new Date().getFullYear(),
        size: get(track, "extra.filesize"),
        isVideo: false,
        path: get(track, "filepath"),
        albumId: get(track, "albumhash"),
        artistId: get(track, "artists[0].artisthash"),
        type: "music"
    })), []);

    const json = {
        "subsonic-response": {
            playlist: {
                id: get(playlist, "info.id"),
                name: get(playlist, "info.name"),
                comment: "No comment",
                owner: "admin",
                public: true,
                songCount: get(playlist, "info.count"),
                duration: get(playlist, "info.duration"),
                created: 0, // 16 hours ago
                coverArt: get(playlist, "info.image") ? Buffer.from(JSON.stringify({ type: "playlist", id: get(playlist, "info.image") })).toString("base64") : undefined,
                entry: output
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
