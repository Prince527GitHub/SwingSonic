const decode = require("../../packages/decode");

module.exports = async(req, res, proxy, respond) => {
    const id = req.query.id;
    if (!id) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: { code: 10, message: "Required parameter 'id' is missing" }
        }
    });

    let decoded = decode.decode(id);
    if (!decoded?.id || !decoded?.path) {
        const source = decoded?.id || id;

        try {
            const cookie = req.user;

            const search = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${encodeURIComponent(source)}&start=0&limit=1`, { headers: { Cookie: cookie } })).json();

            const track = search?.results?.[0];
            if (track?.trackhash && track?.filepath) decoded = { id: track.trackhash, path: track.filepath };
        } catch {}
    }

    if (!decoded?.id || !decoded?.path) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: { code: 70, message: "Media file not found" }
        }
    });

    proxy(res, req, `${global.config.music}/file/${decoded.id}/legacy?filepath=${encodeURIComponent(decoded.path)}`);
}
