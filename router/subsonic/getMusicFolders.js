module.exports = async(req, res, proxy, respond) => {
    const folders = await (await fetch(`${global.config.music}/folder`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": req.user
        },
        body: JSON.stringify({
            "folder": "$home",
            "tracks_only": false
        })
    })).json();

    const output = (folders?.folders || []).map((folder, index) => ({
        id: index,
        name: folder?.name
    }));

    respond(res, req, {
        "subsonic-response": {
            musicFolders: {
                musicFolder: output
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
}
