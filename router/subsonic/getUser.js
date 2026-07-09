module.exports = async (req, res, proxy, xml) => {
    let { username } = req.query;
    let f = [].concat(req.query.f).filter(Boolean)[0];

    const users = await (await fetch(`${global.config.music}/auth/users?simplified=true`)).json();
    const user = users.users.find(u => u.username === username);

    if (!user) {
        const json = {
            "subsonic-response": {
                status: "failed",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true,
                error: { code: 70, message: "User not found" }
            }
        };
        if (f === "json") return res.status(200).json(json);
        else return res.status(200).send(xml(json));
    }

    const json = {
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
    };

    if (f === "json") res.json(json);
    else res.send(xml(json));
};
