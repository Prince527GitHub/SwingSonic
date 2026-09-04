const { firstProperty } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const zw = require("../../packages/zw");

module.exports = async (req, res, proxy, respond) => {
    let { title } = req.query;

    let track;

    if (global?.config?.server?.api?.subsonic?.options?.zw) {
        let info = null;

        try {
            info = JSON.parse(Buffer.from(zw.extract(title), "base64").toString("utf8"));
        } catch { }

        if (info?.album) {
            try {
                track = ((await api.album(req.user).getAlbumTracksAndInfo({ albumhash: info.album }))?.tracks || []).find(t => t?.trackhash === info?.id);
            } catch { }
        }
    } else {
        title = title.replace(/[-_]/g, " ").replace(/[^\p{L}\p{N} ]/gu, "").trim();

        if (title) {
            try {
                track = (await api.search(req.user).searchItems({ itemtype: "tracks", q: title, start: 0, limit: 1 }))?.results?.[0];
            } catch { }
        }
    }

    const lyrics = {};

    if (track) {
        const body = {
            trackhash: track?.trackhash,
            filepath: track?.filepath,
            album: track?.album,
            title: global?.config?.server?.api?.subsonic?.options?.zw ? zw.filter(track?.title) : track?.title,
            artist: firstProperty(track?.albumartists, "name") || firstProperty(track?.artists, "name") || ""
        }

        let getLyrics = null;

        try {
            getLyrics = await api.lyrics(req.user).sendLyrics(body);
        } catch { }

        if (!getLyrics || getLyrics?.error) {
            try {
                getLyrics = await api.request("/plugins/lyrics/search", { method: "POST", auth: req.user, body });
            } catch { }
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
};
