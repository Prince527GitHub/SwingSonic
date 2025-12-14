const { get, safe } = require("../../packages/safe");

module.exports = async(req, res, proxy, xml) => {
    let { f } = req.query;

    const playlists = await (await fetch(`${global.config.music}/playlists`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const output = safe(() => get(playlists, "data", []).map(playlist => ({
        id: get(playlist, "id"),
        name: get(playlist, "name"),
        comment: "No comment",
        owner: "admin",
        public: true,
        songCount: get(playlist, "count"),
        duration: get(playlist, "duration"),
        created: get(playlist, "last_updated"),
        coverArt: get(playlist, "image") ? Buffer.from(JSON.stringify({ type: "playlist", id: get(playlist, "image") })).toString("base64") : undefined
    })), []);

    const json = {
        "subsonic-response": {
            playlists: {
                playlist: output
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    };

    if (f === "json") res.json(json);
    else res.send(xml(json));
}
