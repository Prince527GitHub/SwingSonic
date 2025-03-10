module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    const decode = JSON.parse(Buffer.from(id, "base64").toString("utf-8"));

    proxy(res, req, `${global.config.music}/img/${decode.type === "artist" ? "artist" : "thumbnail"}/medium/${decode.id}`);
}