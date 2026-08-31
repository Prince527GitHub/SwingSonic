const decode = require("../../packages/decode");

module.exports = async(req, res, proxy, respond) => {
    let { id, time, submission } = req.query;

    let ids = [];
    let times = [];

    if (id) {
        const idList = Array.isArray(id) ? id : [id];
        for (const singleId of idList) {
            ids.push({ raw: singleId, decoded: decode.decode(singleId) });
        }
    }

    if (time) {
        times = Array.isArray(time) ? time : [time];
    }

    const isSubmission = submission !== "false";

    for (let i = 0; i < ids.length; i++) {
        const item = ids[i];
        const decoded = item.decoded;
        const trackId = decoded?.id || item.raw;

        if (isSubmission) {
            let trackInfo = decoded?.path ? await (await fetch(`${global.config.music}/folder/tracks/all?path=${encodeURIComponent(decoded.path)}`, { headers: { "Cookie": req.user } })).json() : { tracks: [] };

            let track;
            try {
                track = (trackInfo?.tracks || []).find(t => t?.trackhash === trackId);
            } catch {
                track = null;
            }

            const duration = track?.duration ?? 240;
            const ts = times[i] || time;
            const timestamp = ts > 10_000_000_000 ? Math.floor(parseInt(ts) / 1000) : (parseInt(ts) || Math.floor(Date.now() / 1000));

            await fetch(`${global.config.music}/logger/track/log`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({
                    "timestamp": timestamp,
                    "trackhash": trackId,
                    "duration": duration,
                    "source": "swingsonic",
                })
            });
        }
    }

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
