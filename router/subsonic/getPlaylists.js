const { flexibleISOString, encodeId } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async (req, res, proxy, respond) => {
    const owner = req.query.u || req.query.username || "admin";

    const output = ((await api.playlist(req.user).sendAllPlaylists())?.data || []).map(playlist => {
        // TODO: Simplify this, I don't like it.
        const lastUpdated = playlist?.last_updated;
        const createdDate = lastUpdated ? new Date(flexibleISOString(lastUpdated)) : new Date();

        return {
            id: String(playlist?.id),
            name: playlist?.name,
            comment: "No comment",
            owner: owner,
            public: true,
            songCount: playlist?.count || 0,
            duration: playlist?.duration || 0,
            created: createdDate.toISOString(),
            changed: createdDate.toISOString(),
            coverArt: encodeId(playlist?.image, "playlist", codecs)
        }
    });

    respond(res, req, {
        "subsonic-response": {
            playlists: { playlist: output },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
