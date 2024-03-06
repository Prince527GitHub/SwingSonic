module.exports = async(req, res, proxy, xml) => {
    let { playlistId, name, songIdToAdd, songIdToRemove, f } = req.query;

    if (playlistId) {
        if (songIdToAdd) await fetch(`${global.config.music}/playlist/${playlistId}/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ itemtype: "track", itemhash: songIdToAdd })
        });

        if (songIdToRemove) await fetch(`${global.config.music}/playlist/${playlistId}/remove-tracks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ tracks: [{ trackhash: songIdToRemove, index: 0 }] })
        });

        if (name) {
            const formData = new FormData();
            formData.append("name", name);

            await fetch(`${global.config.music}/playlist/${playlistId}/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "multipart/form-data"
                },
                body: formData
            });
        }
    }

    const json = {
        "subsonic-response": {
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}