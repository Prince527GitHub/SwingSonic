const { toArray } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async (req, res, proxy, respond) => {
    let { playlistId, name, songId } = req.query;
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

    // TODO: Cleanup this, I don't like it.
    const playlist = await api.playlist(req.user).createPlaylist({ name });
    const pl = playlist?.playlist || {};

    if (songId)
        for (const sid of toArray(songId))
            await api.playlist(req.user).addItemToPlaylist({ playlistid: pl?.id }, { itemtype: "tracks", itemhash: codecs.id(sid) });

    // TODO: Cleanup this, I don't like it.
    const lastUpdated = pl?.last_updated;
    const createdDate = lastUpdated ? (typeof lastUpdated === "number" ? new Date(lastUpdated * 1000) : new Date(lastUpdated)) : new Date();

    const owner = req.query.u || req.query.username || "admin";

    respond(res, req, {
        "subsonic-response": {
            playlist: {
                id: String(pl?.id),
                name: pl?.name,
                comment: "No comment",
                owner: owner,
                public: true,
                songCount: pl?.count || 0,
                duration: pl?.duration || 0,
                created: createdDate.toISOString(),
                changed: createdDate.toISOString(),
                coverArt: pl?.image ? codecs.encode({ type: "playlist", id: pl.image }) : undefined
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
