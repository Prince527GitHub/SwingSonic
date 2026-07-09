const zw = require("../../packages/zw");

module.exports = async(req, res, proxy, respond) => {
    const id = req.query.id;

    let { size, offset } = req.query;

    const playlist = await (await fetch(`${global.config.music}/playlists/${id}?no_tracks=false&start=${offset || "0"}&limit=${size || "50"}`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const output = (playlist?.tracks || []).map(track => ({
        id: track?.trackhash && track?.filepath ? encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")) : undefined,
        parent: track?.albumhash || "0",
        title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash ? zw.inject(track.title, Buffer.from(JSON.stringify({ album: track.albumhash, id: track.trackhash })).toString("base64")) : track?.title,
        album: track?.album,
        artist: track?.artists?.[0]?.name,
        isDir: false,
        coverArt: track?.image ? Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64") : undefined,
        created: new Date().toISOString(),
        duration: track?.duration || 0,
        bitRate: track?.bitrate || 0,
        track: track?.track || 0,
        year: track?.year || new Date().getFullYear(),
        suffix: "mp3",
        contentType: "audio/mpeg",
        isVideo: false,
        discNumber: track?.disc || 1,
        size: track?.size || 1048576,
        path: track?.filepath,
        albumId: track?.albumhash,
        artistId: track?.artists?.[0]?.artisthash,
        albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash })),
        type: "music"
    }));

    const info = playlist?.info || {};

    respond(res, req, {
        "subsonic-response": {
            playlist: {
                id: info?.id,
                name: info?.name,
                comment: "No comment",
                owner: "admin",
                public: true,
                songCount: info?.count || 0,
                duration: info?.duration || 0,
                created: info?.last_updated
                    ? (typeof info.last_updated === "number" ? new Date(info.last_updated * 1000) : new Date(info.last_updated)).toISOString()
                    : new Date().toISOString(),
                changed: info?.last_updated
                    ? (typeof info.last_updated === "number" ? new Date(info.last_updated * 1000) : new Date(info.last_updated)).toISOString()
                    : new Date().toISOString(),
                coverArt: info?.image ? Buffer.from(JSON.stringify({ type: "playlist", id: info.image })).toString("base64") : undefined,
                entry: output
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
}
