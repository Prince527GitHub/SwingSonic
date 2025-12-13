const { safeDecodeId } = require("../../packages/decodeId");

module.exports = async(req, res, proxy, xml) => {
    let { f, id, albumId, artistId } = req.query;

    const decoded = safeDecodeId(id || albumId || artistId);
    if (decoded) {
        id = decoded.id;
        albumId = decoded.albumId;
        artistId = decoded.artistId;
    }

    const type = id ? "track" : albumId ? "album" : artistId ? "artist" : null;
    if (type) {
        let result = await fetch(`${global.config.music}/favorites/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({
                "type": type,
                "hash": id || albumId || artistId
            })
        });
    } else {
        console.log("No id, albumId, or artistId provided to star endpoint");
    }

    const json = {
        "subsonic-response": {
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}
