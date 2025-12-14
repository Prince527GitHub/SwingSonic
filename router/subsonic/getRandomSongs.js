const { shuffleArray } = require("../../packages/array");
const { get, safe } = require("../../packages/safe");

module.exports = async(req, res, proxy, xml) => {
    let { size, f } = req.query;

    const albumsSize = get(await (await fetch(`${global.config.music}/getall/albums?start=0&limit=1&sortby=created_date&reverse=1`, {
        headers: {
            "Cookie": req.user
        }
    })).json(), "total", 50);
    const albums = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=${albumsSize}&sortby=created_date&reverse=1`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    let output = [];
    const albumItems = get(albums, "items", []);
    for (let index = 0; index < albumItems.length; index++) {
        const album = albumItems[index];

        const tracks = await (await fetch(`${global.config.music}/album`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({ albumhash: get(album, "albumhash") })
        })).json();

        output.push(...safe(() => get(tracks, "tracks", []).map(track => ({
            id: get(track, "trackhash"),
            parent: get(track, "albumhash"),
            title: get(track, "title"),
            isDir: false,
            album: get(track, "album"),
            artist: get(track, "artists[0].name"),
            track: 0,
            coverArt: get(track, "image") ? Buffer.from(JSON.stringify({ type: "album", id: get(track, "image") })).toString("base64") : undefined,
            size: get(track, "extra.filesize"),
            duration: get(track, "duration"),
            bitRate: get(track, "bitrate")
        })), []));
    }

    output = shuffleArray(output);

    output = output.slice(0, size || 10);

    const json = {
        "subsonic-response": {
            randomSongs: {
                song: output
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
