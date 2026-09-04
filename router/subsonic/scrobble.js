const codecs = require("../../packages/codecs");

module.exports = async (req, res, proxy, respond) => {
    let { id, time, submission } = req.query;

    if (submission !== "false") {
        const ids = (Array.isArray(id) ? id : id ? [id] : []).map(raw => ({ raw, decoded: codecs.decode(raw) }));
        const times = Array.isArray(time) ? time : time ? [time] : [];

        for (let i = 0; i < ids.length; i++) {
            const { raw, decoded } = ids[i];
            const trackhash = decoded?.id || raw;

            let duration = 240;
            if (decoded?.path) {
                const response = await (await fetch(`${global.config.music}/folder/tracks/all?path=${encodeURIComponent(decoded.path)}`, { headers: { "Cookie": req.user } })).json();

                duration = (response?.tracks || []).find(track => track?.trackhash === trackhash)?.duration ?? 240;
            }

            const value = parseInt(times[i] || time);
            const timestamp = value > 10_000_000_000 ? Math.floor(value / 1000) : (value || Math.floor(Date.now() / 1000));

            await fetch(`${global.config.music}/logger/track/log`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({
                    "timestamp": timestamp,
                    "trackhash": trackhash,
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
