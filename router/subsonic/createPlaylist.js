module.exports = async(req, res, proxy, xml) => {
    let { playlistId, name, f } = req.query;

    if (playlistId || !name) return res.json({
        "subsonic-response": {
            "status": "ok",
            "version": "1.16.1"
        }
    });

    const playlist = await (await fetch(`${global.config.music}/playlist/new`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": req.user
        },
        body: JSON.stringify({ name: name })
    })).json();

    const json = {
        "subsonic-response": {
            playlists: {
                id: playlist.playlist.id,
                name: playlist.playlist.name,
                comment: "No comment",
                owner: "admin",
                public: true,
                songCount: playlist.playlist.count,
                duration: playlist.playlist.duration,
                created: playlist.playlist.last_updated,
                coverArt: Buffer.from(JSON.stringify({ type: "playlist", id: playlist.playlist.image })).toString("base64")
            },
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}