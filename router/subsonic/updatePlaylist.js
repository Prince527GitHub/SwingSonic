const { toArray, parseIntOr } = require("../../packages/utils");
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
            error: {
                code: 10,
                message: "Required parameter 'playlistId' is missing"
            }
        }
    });

    for (const sid of toArray(songIdToAdd))
        await api.playlist(req.user).addItemToPlaylist({ playlistid: playlistId }, { itemtype: "tracks", itemhash: codecs.id(sid) });

    for (const sid of toArray(songIdToRemove))
        await api.playlist(req.user).removeTracksFromPlaylist({ playlistid: playlistId }, { tracks: [{ trackhash: codecs.id(sid), index: 0 }] });

    for (const idx of toArray(songIndexToRemove))
        await api.playlist(req.user).removeTracksFromPlaylist({ playlistid: playlistId }, { tracks: [{ index: parseIntOr(idx), trackhash: "" }] });

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
