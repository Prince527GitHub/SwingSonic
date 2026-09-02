const zw = require("../../packages/zw");

module.exports = async(req, res, proxy, respond) => {
    let { title } = req.query;

    const headers = {
        "Content-Type": "application/json",
        "Cookie": req.user
    };

    let track;

    if (global?.config?.server?.api?.subsonic?.options?.zw) {
        let info = null;

        try {
            info = JSON.parse(Buffer.from(zw.extract(title), "base64").toString("utf8"));
        } catch {}

        if (info?.album) {
            let album = null;

            try {
                album = await (await fetch(`${global.config.music}/album`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ albumhash: info.album })
                })).json();
            } catch {}

            track = (album?.tracks || []).find(t => t?.trackhash === info?.id);
        }
    } else {
        title = title
            .replace(/[-_]/g, " ")
            .replace(/[^\p{L}\p{N} ]/gu, "")
            .trim();

        let search = null;

        if (title) {
            try {
                search = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${encodeURIComponent(title)}&start=0&limit=1`, { headers })).json();
            } catch {}
        }

        track = search?.results?.[0];
    }

    const lyrics = {};

    if (track) {
        const body = {
            trackhash: track?.trackhash,
            filepath: track?.filepath,
            album: track?.album,
            title: global?.config?.server?.api?.subsonic?.options?.zw ? zw.filter(track?.title) : track?.title,
            artist: track?.albumartists?.[0]?.name || track?.artists?.[0]?.name || ""
        };

        let getLyrics = null;
        try {
            getLyrics = await (await fetch(`${global.config.music}/lyrics`, { method: "POST", headers, body: JSON.stringify(body) })).json();
        } catch {}

        if (!getLyrics || getLyrics?.error) {
            try {
                getLyrics = await (await fetch(`${global.config.music}/plugins/lyrics/search`, { method: "POST", headers, body: JSON.stringify(body) })).json();
            } catch {}
        }

        if (getLyrics?.lyrics) {
            lyrics.artist = body.artist;
            lyrics.title = body.title;

            try {
                lyrics.value = (getLyrics.lyrics || []).map(line => line?.text).join("\n");
            } catch {
                lyrics.value = "";
            }
        }
    }

    respond(res, req, {
        "subsonic-response": {
            lyrics: lyrics,
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
}
