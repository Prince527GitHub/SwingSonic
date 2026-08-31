const decode = require("../../packages/decode");

module.exports = async(req, res, proxy, respond) => {
    let { playlistId, name, songIdToAdd, songIdToRemove, songIndexToRemove } = req.query;

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

    if (songIdToAdd) {
        const idsToAdd = Array.isArray(songIdToAdd) ? songIdToAdd : [songIdToAdd];
        for (const sid of idsToAdd) {
            const trackhash = decode.trackhash(sid);
            await fetch(`${global.config.music}/playlists/${playlistId}/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({ itemtype: "tracks", itemhash: trackhash })
            });
        }
    }

    if (songIdToRemove) {
        const idsToRemove = Array.isArray(songIdToRemove) ? songIdToRemove : [songIdToRemove];
        for (const sid of idsToRemove) {
            const trackhash = decode.trackhash(sid);
            await fetch(`${global.config.music}/playlists/${playlistId}/remove-tracks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({ tracks: [{ trackhash, index: 0 }] })
            });
        }
    }

    if (songIndexToRemove) {
        const indices = Array.isArray(songIndexToRemove) ? songIndexToRemove : [songIndexToRemove];
        for (const idx of indices) {
            await fetch(`${global.config.music}/playlists/${playlistId}/remove-tracks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({ tracks: [{ index: parseInt(idx), trackhash: "" }] })
            });
        }
    }

    if (name) {
        const formData = new FormData();
        formData.append("name", name);

        await fetch(`${global.config.music}/playlists/${playlistId}/update`, {
            method: "PUT",
            headers: {
                "Cookie": req.user
            },
            body: formData
        });
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
