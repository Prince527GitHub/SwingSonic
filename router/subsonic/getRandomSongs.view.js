const { shuffleArray } = require("../../packages/array");

module.exports = async(req, res, proxy, xml) => {
    let { size, f } = req.query;

    const albumsSize = (await (await fetch(`${global.config.music}/getall/albums?start=0&limit=1&sortby=created_date&reverse=1`)).json()).total;
    const albums = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=${albumsSize}&sortby=created_date&reverse=1`)).json();

    let output = [];
    for (let index = 0; index < albums.items.length; index++) {
        const album = albums.items[index];

        const tracks = await (await fetch(`${global.config.music}/album`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ albumhash: album.albumhash })
        })).json();

        output.push(...tracks.tracks.map(track => ({
            "id": track.trackhash,
            "parent": track.albumhash,
            "title": track.title,
            "isDir": "false",
            "album": track.album,
            "artist": track.artists[0].name,
            "track": 0,
            "year": 2024,
            "genre": "Unknown",
            "coverArt": track.image,
            "size": 0,
            "contentType": "audio/mpeg",
            "suffix": "mp3",
            "duration": track.duration,
            "bitRate": track.bitrate
        })));
    }

    output = shuffleArray(output);

    output = output.slice(0, size || 10);

    const json = {
        "subsonic-response": {
            "randomSongs": {
                "song": output
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}