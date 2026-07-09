module.exports = async(req, res, proxy, respond) => {
    const playlists = await (await fetch(`${global.config.music}/playlists`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const output = (playlists?.data || []).map(playlist => {
        const lastUpdated = playlist?.last_updated;
        const createdDate = lastUpdated
            ? (typeof lastUpdated === "number" ? new Date(lastUpdated * 1000) : new Date(lastUpdated))
            : new Date();
        return {
            id: playlist?.id,
            name: playlist?.name,
            comment: "No comment",
            owner: "admin",
            public: true,
            songCount: playlist?.count || 0,
            duration: playlist?.duration || 0,
            created: createdDate.toISOString(),
            changed: createdDate.toISOString(),
            coverArt: playlist?.image ? Buffer.from(JSON.stringify({ type: "playlist", id: playlist.image })).toString("base64") : undefined
        };
    });

    respond(res, req, {
        "subsonic-response": {
            playlists: {
                playlist: output
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
}
