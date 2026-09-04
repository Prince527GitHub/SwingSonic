const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async(req, res, proxy, respond) => {
    let { id, albumId, artistId } = req.query;

    const decoded = codecs.decode(id || albumId || artistId);
    if (decoded) ({ id, albumId, artistId } = decoded);

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
