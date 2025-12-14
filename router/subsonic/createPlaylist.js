const { get } = require("../../packages/safe");

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
                id: get(playlist, "playlist.id"),
                name: get(playlist, "playlist.name"),
                comment: "No comment",
                owner: "admin",
                public: true,
                songCount: get(playlist, "playlist.count"),
                duration: get(playlist, "playlist.duration"),
                created: get(playlist, "playlist.last_updated"),
                coverArt: get(playlist, "playlist.image") ? Buffer.from(JSON.stringify({ type: "playlist", id: get(playlist, "playlist.image") })).toString("base64") : undefined
            },
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
