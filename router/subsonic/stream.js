const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async (req, res, proxy, respond) => {
    const id = req.query.id
    if (!id) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: {
                code: 10,
                message: "Required parameter 'id' is missing"
            }
        }
    });

    let decoded = codecs.decode(id);
    if (!decoded?.id || !decoded?.path) {
        const source = decoded?.id || id;

        try {
            const track = (await api.search(req.user).searchItems({ itemtype: "tracks", q: source, start: 0, limit: 1 }))?.results?.[0];

            if (track?.trackhash && track?.filepath) decoded = { id: track.trackhash, path: track.filepath };
        } catch { }
    }

    if (!decoded?.id || !decoded?.path) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: {
                code: 70,
                message: "Media file not found"
            }
        }
    });

    proxy(res, req, api.url(`/file/${decoded.id}/legacy?filepath=${encodeURIComponent(decoded.path)}`));
};
