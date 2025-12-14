const { shuffleArray } = require("../../packages/array");
const { get, safe } = require("../../packages/safe");

module.exports = async(req, res, proxy, xml) => {
    let { type, size, offset, f } = req.query;

    const albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset || "0"}&limit=${size || "50"}&sortby=created_date&reverse=1`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    let output = safe(() => get(albums, "items", []).map(item => ({
        id: get(item, "item.albumhash") || get(item, "albumhash"),
        parent: get(item, "item.albumhash") || get(item, "albumhash"),
        title: get(item, "item.title") || get(item, "title"),
        artist: get(item, "item.albumartists[0].name") || get(item, "albumartists[0].name"),
        isDir: true,
        coverArt: (get(item, "item.image") || get(item, "image")) ? Buffer.from(JSON.stringify({ type: "album", id: get(item, "item.image") || get(item, "image") })).toString("base64") : undefined,
        userRating: 0,
        averageRating: 0
    })), []);

    if (type === "random") output = shuffleArray(output);

    const json = {
        "subsonic-response": {
            albumList: {
                album: output
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
