const { get, safe, safeDecode } = require("../../packages/safe");

module.exports = async(req, res, proxy, xml) => {
    let { f, id, time, submission } = req.query;

    const decoded = safeDecode(id);
    id = get(decoded, "id") || id;

    if (submission === "true") {
        let trackInfo = await (await fetch(`${global.config.music}/folder/tracks/all?path=${encodeURIComponent(get(decoded, "path"))}`, { headers: { "Cookie": req.user } })).json();

        const track = safe(() => get(trackInfo, "tracks", []).find(t => t?.trackhash === id));

        const duration = get(track, "duration", 240);

        time = time > 10_000_000_000 ? Math.floor(time / 1000) : time; 

        await fetch(`${global.config.music}/logger/track/log`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({
                "timestamp": time,
                "trackhash": id,
                "duration": duration,
                "source": "swingsonic",
            })
        });
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
