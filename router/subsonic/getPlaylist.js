const { flexibleISOString, encodeId, firstProperty } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");
const zw = require("../../packages/zw");

module.exports = async (req, res, proxy, respond) => {
    // TODO: Simplify, I don't like it, why do we have two req.query.
    const id = req.query.id;

    let { size, offset } = req.query;

    const playlist = await api.playlist(req.user).getPlaylist({ playlistid: id }, { no_tracks: false, start: offset || "0", limit: size || "50" });

    const output = (playlist?.tracks || []).map(track => ({
        id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined,
        parent: track?.albumhash || "0",
        title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash ? zw.inject(track.title, codecs.encode({ album: track.albumhash, id: track.trackhash })) : track?.title,
        album: track?.album,
        artist: firstProperty(track?.artists, "name"),
        isDir: false,
        coverArt: encodeId(track?.image, "album", codecs),
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
        artistId: encodeId(track?.artists?.[0]?.artisthash, "artist", codecs),
        albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: encodeId(a?.artisthash, "artist", codecs) })),
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
                created: flexibleISOString(info?.last_updated, new Date().toISOString()),
                changed: flexibleISOString(info?.last_updated, new Date().toISOString()),
                coverArt: encodeId(info?.image, "playlist", codecs),
                entry: output
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
