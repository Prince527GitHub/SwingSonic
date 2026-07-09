module.exports = async(req, res, proxy, xml) => {
    let { playlistId, name, comment, public: isPublic, songIdToAdd, songIdToRemove, songIndexToRemove } = req.query;
    let f = [].concat(req.query.f).filter(Boolean)[0];

    if (!playlistId) {
        const json = {
            "subsonic-response": {
                status: "failed",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true,
                error: { code: 10, message: "Required parameter 'playlistId' is missing" }
            }
        };
        if (f === "json") return res.json(json);
        else return res.send(xml(json));
    }

    if (songIdToAdd) {
        const idsToAdd = Array.isArray(songIdToAdd) ? songIdToAdd : [songIdToAdd];
        for (const sid of idsToAdd) {
            await fetch(`${global.config.music}/playlists/${playlistId}/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({ itemtype: "tracks", itemhash: sid })
            });
        }
    }

    if (songIdToRemove) {
        const idsToRemove = Array.isArray(songIdToRemove) ? songIdToRemove : [songIdToRemove];
        for (const sid of idsToRemove) {
            await fetch(`${global.config.music}/playlists/${playlistId}/remove-tracks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({ tracks: [{ trackhash: sid, index: 0 }] })
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
