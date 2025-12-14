const { get, safe } = require("../../packages/safe");
const zw = require("../../packages/zw");

module.exports = async(req, res, proxy, xml) => {
    let { title, f } = req.query;

    const headers = {
        "Content-Type": "application/json",
        "Cookie": req.user
    };

    let track;

    if (get(global, "config.server.api.subsonic.options.zw")) {
        const info = safe(() => JSON.parse(Buffer.from(zw.extract(title), "base64").toString("utf-8")));

        const album = await (await fetch(`${global.config.music}/album`, {
            method: "POST",
            headers,
            body: JSON.stringify({ albumhash: get(info, "album") })
        })).json();

        track = safe(() => get(album, "tracks", []).find(track => get(track, "trackhash") === get(info, "id")));
    } else {
        title = title
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .replace(/[-_]/g, " ");

        const search = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${title}&start=0&limit=1`, { headers })).json();

        track = get(search, "results[0]");
    }

    const lyrics = {};

    if (track) {
        const body = {
            trackhash: get(track, "trackhash"),
            filepath: get(track, "filepath"),
            album: get(track, "album"),
            title: get(global, "config.server.api.subsonic.options.zw") ? zw.filter(get(track, "title")) : get(track, "title"),
            artist: get(track, "albumartists[0].name") || get(track, "artists[0].name") || ""
        };

        let getLyrics = await (await fetch(`${global.config.music}/lyrics`, { method: "POST", headers, body: JSON.stringify(body) })).json();
        if (get(getLyrics, "error")) getLyrics = await (await fetch(`${global.config.music}/plugins/lyrics/search`, { method: "POST", headers, body: JSON.stringify(body) })).json();

        if (get(getLyrics, "lyrics")) {
            lyrics.artist = body.artist;
            lyrics.title = body.title;
            lyrics.value = safe(() => get(getLyrics, "lyrics", []).map(line => get(line, "text")).join("\n"), "");
        }
    }

    const json = {
        "subsonic-response": {
            lyrics: lyrics,
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
