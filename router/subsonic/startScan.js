const { firstProperty } = require("../../packages/utils");
const api = require("../../packages/swingmusic");

module.exports = async(req, res, proxy, respond) => {
    const scan = await api.settings(req.user).triggerScanGet();

    const tracks = await api.folder(req.user).getFolderTree({ folder: "$home", tracks_only: false });

    respond(res, req, {
        "subsonic-response": {
            scanStatus: {
                scanning: scan?.msg === "Scan triggered!",
                count: firstProperty(tracks?.folders, "count") ?? 0
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
