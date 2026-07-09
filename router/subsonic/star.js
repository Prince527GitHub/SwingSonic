module.exports = async(req, res, proxy, respond) => {
    let { id, albumId, artistId } = req.query;

    let decoded;
    try {
        const json = Buffer.from(decodeURIComponent(id || albumId || artistId), "base64").toString("utf-8");
        decoded = JSON.parse(json);
    } catch {
        decoded = null;
    }
    if (decoded) {
        id = decoded?.id;
        albumId = decoded?.albumId;
        artistId = decoded?.artistId;
    }

    const type = id ? "track" : albumId ? "album" : artistId ? "artist" : null;
    if (type) await fetch(`${global.config.music}/favorites/add`, {
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

    respond(res, req, {
        "subsonic-response": {
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
}
