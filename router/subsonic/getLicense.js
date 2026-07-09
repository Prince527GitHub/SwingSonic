module.exports = async(req, res, proxy, xml) => {
    let f = [].concat(req.query.f).filter(Boolean)[0];

    const json = {
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
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}
