module.exports = async(req, res, proxy, xml) => {
    let { f } = req.query;

    const json = {
        "subsonic-response": {
            scanStatus: {
                scanning: false,
                count: 0
            },
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}