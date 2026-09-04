const { toArray, flexibleISOString, encodeId } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async (req, res, proxy, respond) => {
    const { playlistId, name, songId, u, username } = req.query;
    if (playlistId) return res.json({
        "subsonic-response": {
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });

    if (!name) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: {
                code: 10,
                message: "Required parameter 'name' is missing"
            }
        }
    });

    const playlist = (await api.playlist(req.user).createPlaylist({ name }))?.playlist ?? {};

    for (const song of toArray(songId || []))
        await api.playlist(req.user).addItemToPlaylist({ playlistid: playlist?.id }, { itemtype: "tracks", itemhash: codecs.id(song) });

    const created = playlist?.last_updated ? new Date(flexibleISOString(playlist.last_updated)) : new Date();
    const owner = u || username || "admin";

    respond(res, req, {
        "subsonic-response": {
            playlist: {
                id: String(playlist?.id),
                name: playlist?.name,
                comment: "No comment",
                owner: owner,
                public: true,
                songCount: playlist?.count || 0,
                duration: playlist?.duration || 0,
                created: created.toISOString(),
                changed: created.toISOString(),
                coverArt: encodeId(playlist?.image, "playlist", codecs)
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
