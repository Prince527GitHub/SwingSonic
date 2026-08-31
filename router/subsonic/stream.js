const { convertToXml } = require("../../packages/xml");
const decode = require("../../packages/decode");

module.exports = async(req, res, proxy) => {
    const id = req.query.id;

    const decoded = decode.decode(id);

    if (!id) {
        const json = {
            "subsonic-response": {
                status: "failed",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true,
                error: { code: 10, message: "Required parameter 'id' is missing" }
            }
        };
        res.set("Content-Type", "text/xml");
        return res.status(200).send(convertToXml(json));
    }

    if (!decoded?.id || !decoded?.path) {
        const json = {
            "subsonic-response": {
                status: "failed",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true,
                error: { code: 70, message: "Media file not found" }
            }
        };
        res.set("Content-Type", "text/xml");
        return res.status(200).send(convertToXml(json));
    }

    proxy(res, req, `${global.config.music}/file/${decoded.id}/legacy?filepath=${encodeURIComponent(decoded.path)}`);
}
