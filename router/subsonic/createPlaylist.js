module.exports = async(req, res, proxy, xml) => {
    let { playlistId, name, songId } = req.query;
    let f = [].concat(req.query.f).filter(Boolean)[0];

    if (playlistId) {
        return res.json({
            "subsonic-response": {
                status: "ok",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true
            }
        });
    }

    if (!name) {
        const json = {
            "subsonic-response": {
                status: "failed",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true,
                error: { code: 10, message: "Required parameter 'name' is missing" }
            }
        };
        if (f === "json") return res.json(json);
        else return res.send(xml(json));
    }

    const playlist = await (await fetch(`${global.config.music}/playlists/new`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": req.user
        },
        body: JSON.stringify({ name: name })
    })).json();

    const pl = playlist?.playlist || {};

    if (songId) {
        const songIds = Array.isArray(songId) ? songId : [songId];
        for (const sid of songIds) {
            await fetch(`${global.config.music}/playlists/${pl?.id}/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({ itemtype: "tracks", itemhash: sid })
            });
        }
    }

    const lastUpdated = pl?.last_updated;
    const createdDate = lastUpdated
        ? (typeof lastUpdated === "number" ? new Date(lastUpdated * 1000) : new Date(lastUpdated))
        : new Date();

    const json = {
        "subsonic-response": {
            playlist: {
                id: pl?.id,
                name: pl?.name,
                comment: "No comment",
                owner: "admin",
                public: true,
                songCount: pl?.count || 0,
                duration: pl?.duration || 0,
                created: createdDate.toISOString(),
                changed: createdDate.toISOString(),
                coverArt: pl?.image ? Buffer.from(JSON.stringify({ type: "playlist", id: pl.image })).toString("base64") : undefined
            },
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
