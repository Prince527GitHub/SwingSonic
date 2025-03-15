const zw = require("../../packages/zw");

module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let { f, size, offset } = req.query;

    const playlist = await (await fetch(`${global.config.music}/playlists/${id}?no_tracks=false&start=${offset || '0'}&limit=${size || '50'}`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const output = playlist.tracks.map(track => ({
        id: encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")),
        parent: "655",
        title: global.config.server.api.subsonic.options.zw ? zw.inject(track.title, Buffer.from(JSON.stringify({ album: track.albumhash, id: track.trackhash })).toString("base64")) : track.title,
        album: track.album,
        artist: track.artists[0].name,
        isDir: false,
        coverArt: Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64"),
        created: new Date().toISOString(),
        duration: track.duration,
        bitRate: track.bitrate,
        track: track.track,
        year: new Date().getFullYear(),
        size: 0,
        suffix: "mp3",
        contentType: "audio/mpeg",
        isVideo: false,
        path: track.filepath,
        albumId: track.albumhash,
        artistId: track.artists[0].artisthash,
        type: "music"
    }));

    const json = {
        "subsonic-response": {
            playlist: {
                id: playlist.info.id,
                name: playlist.info.name,
                comment: "No comment",
                owner: "admin",
                public: true,
                songCount: playlist.info.count,
                duration: playlist.info.duration,
                created: 0, // 16 hours ago
                coverArt: Buffer.from(JSON.stringify({ type: "playlist", id: playlist.info.image })).toString("base64"),
                entry: output
            },
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}