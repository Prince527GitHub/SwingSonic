module.exports = async (req, res, proxy, respond) => {
    respond(res, req, {
        "subsonic-response": {
            license: {
                valid: true,
                email: "admin@swingsonic",
                key: "opensource",
                date: new Date().toISOString()
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
