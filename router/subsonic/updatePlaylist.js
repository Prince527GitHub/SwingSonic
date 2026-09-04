const codecs = require("../../packages/codecs");

module.exports = async(req, res, proxy, respond) => {
    let { playlistId, name, songIdToAdd = [], songIdToRemove = [], songIndexToRemove = [] } = req.query;

    if (!playlistId) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: { code: 10, message: "Required parameter 'playlistId' is missing" }
        }
    });

    if (songIdToAdd)
        for (const sid of [].concat(songIdToAdd))
            await fetch(`${global.config.music}/playlists/${playlistId}/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({ itemtype: "tracks", itemhash: codecs.id(sid) })
            });

    if (songIdToRemove)
        for (const sid of [].concat(songIdToRemove))
            await fetch(`${global.config.music}/playlists/${playlistId}/remove-tracks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({ tracks: [{ trackhash: codecs.id(sid), index: 0 }] })
            });

    if (songIndexToRemove)
        for (const idx of [].concat(songIndexToRemove)) {
            await fetch(`${global.config.music}/playlists/${playlistId}/remove-tracks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({ tracks: [{ index: parseInt(idx), trackhash: "" }] })
            });
        }

    if (name)
        await fetch(`${global.config.music}/playlists/${playlistId}/update`, {
            method: "PUT",
            headers: { "Cookie": req.user },
            body: new URLSearchParams({ name })
        });

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
