const api = require("../../packages/swingmusic");

module.exports = async (req, res, proxy, respond) => {
    let { username } = req.query;

    const users = await api.auth().getAllUsers({ simplified: true });

    const user = users.users.find(u => u.username === username);
    if (!user) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: {
                code: 70,
                message: "User not found"
            }
        }
    });

    respond(res, req, {
        "subsonic-response": {
            user: {
                username: user.username,
                email: user.username,
                scrobblingEnabled: true,
                maxBitRate: 0,
                adminRole: true,
                settingsRole: true,
                downloadRole: true,
                uploadRole: true,
                playlistRole: true,
                coverArtRole: true,
                commentRole: true,
                podcastRole: true,
                shareRole: true,
                videoConversionRole: false,
                jukeboxRole: false,
                avatarRole: true,
                folderRole: true,
                streamRole: true
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
