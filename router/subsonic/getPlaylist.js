const zw = require("../../packages/zw");
const codecs = require("../../packages/codecs");

module.exports = async(req, res, proxy, respond) => {
    const id = req.query.id;

    let { size, offset } = req.query;

    const playlist = await (await fetch(`${global.config.music}/playlists/${id}?no_tracks=false&start=${offset || "0"}&limit=${size || "50"}`, { headers: { "Cookie": req.user } })).json();

    const output = (playlist?.tracks || []).map(track => ({
        id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined,
        parent: track?.albumhash || "0",
        title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash ? zw.inject(track.title, codecs.encode({ album: track.albumhash, id: track.trackhash })) : track?.title,
        album: track?.album,
        artist: track?.artists?.[0]?.name,
        isDir: false,
        coverArt: track?.image ? codecs.encode({ type: "album", id: track.image }) : undefined,
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
        artistId: track?.artists?.[0]?.artisthash ? codecs.encode({ type: "artist", id: track.artists[0].artisthash }) : undefined,
        albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash ? codecs.encode({ type: "artist", id: a.artisthash }) : undefined })),
        type: "music",
        ...(track?.is_favorite ? { starred: new Date().toISOString() } : {})
    }));

    const info = playlist?.info || {};
    const owner = req.query.u || req.query.username || "admin";

    respond(res, req, {
        "subsonic-response": {
            playlist: {
                id: String(info?.id),
                name: info?.name,
                comment: "No comment",
                owner: owner,
                public: true,
                songCount: info?.count || 0,
                duration: info?.duration || 0,
                created: info?.last_updated ? (typeof info.last_updated === "number" ? new Date(info.last_updated * 1000) : new Date(info.last_updated)).toISOString() : new Date().toISOString(),
                changed: info?.last_updated ? (typeof info.last_updated === "number" ? new Date(info.last_updated * 1000) : new Date(info.last_updated)).toISOString() : new Date().toISOString(),
                coverArt: info?.image ? codecs.encode({ type: "playlist", id: info.image }) : undefined,
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
