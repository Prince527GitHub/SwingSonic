module.exports = async(req, res, proxy, xml) => {
    let { f, id, albumId, artistId } = req.query;

    const type = id ? "track" : albumId ? "album" : artistId ? "artist" : null;
    if (type) await fetch(`${global.config.music}/favorites/remove`, {
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
