const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async(req, res, proxy, respond) => {
    let { id, albumId, artistId } = req.query;

    // TODO: Cleanup this, I don't like it.
    const decoded = codecs.decode(id || albumId || artistId);
    if (decoded) {
        id = decoded?.id;
        albumId = decoded?.albumId;
        artistId = decoded?.artistId;
    }

    // TODO: Cleanup this, I don't like it.
    const type = id ? "track" : albumId ? "album" : artistId ? "artist" : null;
    if (type) await api.favorites(req.user).toggleFavorite({ type, hash: id || albumId || artistId });

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
