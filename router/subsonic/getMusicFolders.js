const api = require("../../packages/swingmusic");

module.exports = async (req, res, proxy, respond) => {
    const output = ((await api.folder(req.user).getFolderTree({ folder: "$home", tracks_only: false }))?.folders || []).map((folder, index) => ({ id: index, name: folder?.name }));

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
};
