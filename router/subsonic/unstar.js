const api = require("../../packages/swingmusic");

module.exports = async (req, res, proxy, respond) => {
    let { id, albumId, artistId } = req.query;

    const [type, hash] = id ? ["track", id] : albumId ? ["album", albumId] : artistId ? ["artist", artistId] : [];
    if (type) await api.favorites(req.user).removeFavorite({ type, hash });

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
