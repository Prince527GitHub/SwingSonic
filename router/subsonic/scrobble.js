const { safeDecodeId } = require("../../packages/decodeId");

module.exports = async(req, res, proxy, xml) => {
    let { f, id, time, submission } = req.query;

    const decoded = safeDecodeId(id);
    id = decoded ? decoded.id : id;

    if (submission) {
        let trackInfo = await (
            await fetch(`${global.config.music}/folder/tracks/all?path=${encodeURIComponent(decoded.path)}`, 
                { headers: { "Cookie": req.user } })
        ).json();

        const track = trackInfo.tracks.find(t => t.trackhash === id);
        
        // 240 is minimum duration for scrobbling in seconds
        const duration = track ? track.duration : 240;

        // convert milliseconds to seconds if needed
        time = time > 10_000_000_000 ? Math.floor(time / 1000) : time; 

        let response = await fetch(`${global.config.music}/logger/track/log`, {
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
        if (!response.ok) {
            console.log(`Failed to scrobble track with id ${id}: ${response.status} ${response.statusText}`);
        }
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
