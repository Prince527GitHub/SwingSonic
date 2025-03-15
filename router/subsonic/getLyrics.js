const zw = require("../../packages/zw");

module.exports = async(req, res, proxy, xml) => {
    let { title, f } = req.query;

    const headers = {
        "Content-Type": "application/json",
        "Cookie": req.user
    };

    let track;

    if (global.config.server.api.subsonic.options.zw) {
        const info = JSON.parse(Buffer.from(zw.extract(title), "base64").toString("utf-8"));

        const album = await (await fetch(`${global.config.music}/album`, {
            method: "POST",
            headers,
            body: JSON.stringify({ albumhash: info.album })
        })).json();

        track = album.tracks.find(track => track.trackhash === info.id);
    } else {
        title = title
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .replace(/[-_]/g, " ");

        const search = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${title}&start=0&limit=1`, { headers })).json();

        track = search.results[0];
    }

    const lyrics = {};

    if (track) {
        const body = {
            trackhash: track.trackhash,
            filepath: track.filepath,
            album: track.album,
            title: global.config.server.api.subsonic.options.zw ? zw.filter(track.title) : track.title,
            artist: track.albumartists[0]?.name || track.artists[0]?.name || ""
        };

        let getLyrics = await (await fetch(`${global.config.music}/lyrics`, { method: "POST", headers, body: JSON.stringify(body) })).json();
        if (getLyrics.error) getLyrics = await (await fetch(`${global.config.music}/plugins/lyrics/search`, { method: "POST", headers, body: JSON.stringify(body) })).json();

        if (getLyrics.lyrics) {
            lyrics.artist = body.artist;
            lyrics.title = body.title;
            lyrics.value = getLyrics.lyrics.map(line => line.text).join("\n");
        }
    }

    const json = {
        "subsonic-response": {
            lyrics: lyrics,
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}
