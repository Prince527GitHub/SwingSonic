module.exports = async (req, res, proxy, respond) => {
    respond(res, req, {
        "subsonic-response": {
            scanStatus: {
                scanning: false,
                count: 0
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
