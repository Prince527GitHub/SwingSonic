const { shuffleArray } = require("../../packages/array");

module.exports = async(req, res, proxy, xml) => {
    let { size, f } = req.query;

    const albumsSize = (await (await fetch(`${global.config.music}/getall/albums?start=0&limit=1&sortby=created_date&reverse=1`, {
        headers: {
            "Cookie": req.user
        }
    })).json()).total;
    const albums = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=${albumsSize}&sortby=created_date&reverse=1`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    let output = [];
    for (let index = 0; index < albums.items.length; index++) {
        const album = albums.items[index];

        const tracks = await (await fetch(`${global.config.music}/album`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({ albumhash: album.albumhash })
        })).json();

        output.push(...tracks.tracks.map(track => ({
            id: track.trackhash,
            parent: track.albumhash,
            title: track.title,
            isDir: false,
            album: track.album,
            artist: track.artists[0].name,
            track: 0,
            coverArt: Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64"),
            size: track.extra.filesize,
            duration: track.duration,
            bitRate: track.bitrate
        })));
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
