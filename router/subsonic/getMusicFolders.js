module.exports = async(req, res, proxy, xml) => {
    let { f } = req.query;

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

    const output = folders.folders.map(folder => ({
        "id": folder.path,
        "name": folder.name
    }));

    const json = {
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
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}
