const { ext, encodeId, firstProperty } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async(req, res, proxy, respond) => {
    const id = req.query.id;
    if (!id) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: { code: 10, message: "Required parameter 'id' is missing" }
        }
    });

    const decoded = codecs.decode(id);

    const trackId = decoded?.id || id;
    const filepath = decoded?.path;

    let track;

    if (filepath) track = (await api.folder(req.user).getTracksInPath({ path: filepath })?.tracks || []).find(t => t?.trackhash === trackId);
    if (!track) track = await api.search(req.user).searchItems({ itemtype: "tracks", q: trackId, start: 0, limit: 1 })?.results?.[0];

    if (!track) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: {
                code: 70,
                message: "Song not found"
            }
        }
    });

    const extension = ext(track?.filepath);

    const song = {
        id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : track?.trackhash,
        parent: track?.albumhash,
        isDir: false,
        title: track?.title,
        album: track?.album,
        artist: firstProperty(track?.artists, "name"),
        track: track?.track || 0,
        year: track?.year || new Date().getFullYear(),
        coverArt: encodeId(track?.image, "album", codecs),
        suffix: extension || "mp3",
        contentType: `audio/${extension || "mpeg"}`,
        duration: track?.duration || 0,
        bitRate: track?.bitrate || 0,
        path: track?.filepath,
        isVideo: false,
        discNumber: track?.disc || 1,
        created: new Date().toISOString(),
        size: track?.size || 1048576,
        albumId: track?.albumhash,
        artistId: encodeId(track?.artists?.[0]?.artisthash, "artist", codecs),
        type: "music",
        artists: (track?.artists || []).map(a => ({ name: a?.name, id: encodeId(a?.artisthash, "artist", codecs) })),
        albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: encodeId(a?.artisthash, "artist", codecs) })),
        displayArtist: firstProperty(track?.artists, "name"),
    }

    respond(res, req, {
        "subsonic-response": {
            song: song,
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
}
