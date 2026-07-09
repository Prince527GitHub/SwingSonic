module.exports = async(req, res, proxy, respond) => {
    const scan = await (await fetch(`${global.config.music}/notsettings/trigger-scan`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const tracks = await (await fetch(`${global.config.music}/folder`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": req.user
        },
        body: JSON.stringify({ folder: "$home", tracks_only: false })
    })).json();

    const status = scan?.msg === "Scan triggered!";

    respond(res, req, {
        "subsonic-response": {
            scanStatus: {
                scanning: status,
                count: tracks?.folders?.[0]?.count ?? 0
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
}
