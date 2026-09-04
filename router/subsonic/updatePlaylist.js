const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async (req, res, proxy, respond) => {
    let { playlistId, name, songIdToAdd = [], songIdToRemove = [], songIndexToRemove = [] } = req.query;
    if (!playlistId) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: { code: 10, message: "Required parameter 'playlistId' is missing" }
        }
    });

    // TODO: Cleanup these, I don't like it.
    if (songIdToAdd) for (const sid of [].concat(songIdToAdd))
        await api.playlist(req.user).addItemToPlaylist({ playlistid: playlistId }, { itemtype: "tracks", itemhash: codecs.id(sid) });

    if (songIdToRemove) for (const sid of [].concat(songIdToRemove))
        await api.playlist(req.user).removeTracksFromPlaylist({ playlistid: playlistId }, { tracks: [{ trackhash: codecs.id(sid), index: 0 }] });

    if (songIndexToRemove) for (const idx of [].concat(songIndexToRemove))
        await api.playlist(req.user).removeTracksFromPlaylist({ playlistid: playlistId }, { tracks: [{ index: parseInt(idx), trackhash: "" }] });

    if (name)
        await api.playlist(req.user).updatePlaylistInfo({ playlistid: playlistId }, new URLSearchParams({ name }));

    respond(res, req, {
        "subsonic-response": {
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
