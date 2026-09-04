const api = require("../../packages/swingmusic");

module.exports = async (req, res, proxy, respond) => {
    let { id, albumId, artistId } = req.query;

    // TODO: Cleanup this, I don't like it.
    const type = id ? "track" : albumId ? "album" : artistId ? "artist" : null;
    if (type) await api.favorites(req.user).removeFavorite({ type, hash: id || albumId || artistId });

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
