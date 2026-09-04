const { toArray } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async (req, res, proxy, respond) => {
    let { id, time, submission } = req.query;

    if (submission !== "false") {
        // TODO: Cleanup this, I don't like it.
        const ids = toArray(id).filter(Boolean).map(raw => ({ raw, decoded: codecs.decode(raw) }));
        const times = toArray(time).filter(Boolean);

        for (const [i, { raw, decoded }] of ids.entries()) {
            const trackhash = decoded?.id || raw;

            // TODO: Cleanup this, I don't like it.
            const duration = decoded?.path ? (await api.folder(req.user).getTracksInPath({ path: decoded.path }))?.tracks?.find(track => track?.trackhash === trackhash)?.duration ?? 240 : 240;

            const value = parseInt(times[i] || time);
            const timestamp = value > 10_000_000_000 ? Math.floor(value / 1000) : (value || Math.floor(Date.now() / 1000));

            await api.request("/logger/track/log", { method: "POST", auth: req.user, body: { timestamp, trackhash, duration, source: "swingsonic" } });
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
};
