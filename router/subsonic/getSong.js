const path = require("path");

module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;
    let f = [].concat(req.query.f).filter(Boolean)[0];

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
        if (f === "json") return res.json(json);
        else return res.send(xml(json));
    }

    let decoded;
    try {
        const json = Buffer.from(decodeURIComponent(id), "base64").toString("utf-8");
        decoded = JSON.parse(json);
    } catch {
        decoded = null;
    }

    const trackId = decoded?.id || id;
    const filepath = decoded?.path;

    let track;
    if (filepath) {
        const trackInfo = await (await fetch(`${global.config.music}/folder/tracks/all?path=${encodeURIComponent(filepath)}`, { headers: { "Cookie": req.user } })).json();
        track = (trackInfo?.tracks || []).find(t => t?.trackhash === trackId);
    }

    if (!track) {
        const search = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${trackId}&start=0&limit=1`, { headers: { "Cookie": req.user } })).json();
        track = search?.results?.[0];
    }

    if (!track) {
        const json = {
            "subsonic-response": {
                status: "failed",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true,
                error: { code: 70, message: "Song not found" }
            }
        };
        if (f === "json") return res.json(json);
        else return res.send(xml(json));
    }

    const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;

    const song = {
        id: track?.trackhash && track?.filepath ? encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")) : track?.trackhash,
        parent: track?.albumhash,
        isDir: false,
        title: track?.title,
        album: track?.album,
        artist: track?.artists?.[0]?.name,
        track: track?.track || 0,
        year: track?.year || new Date().getFullYear(),
        coverArt: track?.image ? Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64") : undefined,
        suffix: extension || "mp3",
        contentType: `audio/${extension || "mpeg"}`,
        duration: track?.duration || 0,
        bitRate: track?.bitrate || 0,
        path: track?.filepath,
        isVideo: false,
        discNumber: track?.disc || 1,
        created: new Date().toISOString(),
        size: track?.size || 1048576,
        albumId: track?.albumhash,
        artistId: track?.artists?.[0]?.artisthash,
        type: "music",
        artists: (track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash })),
        albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash })),
        displayArtist: track?.artists?.[0]?.name,
    };

    const json = {
        "subsonic-response": {
            song: song,
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
