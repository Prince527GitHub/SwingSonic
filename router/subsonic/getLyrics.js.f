module.exports = async(req, res, proxy, xml) => {
    let { title, f } = req.query;

    let track = await (await fetch(`${global.config.music}/search/tracks?q=${title || ""}`, {
        headers: {
            "Cookie": req.user
        }
    })).json();
    if (!track.error || track.tracks.length) track = track.tracks[0];

    const lyrics = {
        artist: track?.artists[0]?.name || "Undefined",
        title: track?.title || "Undefined",
        value: "Undefined",
    };

    if (track) {
        const body = {
            trackhash: track.trackhash,
            title: track.title,
            artist: track.albumartists[0]?.name || track.artists[0]?.name || "",
            filepath: track.filepath,
            album: track.album
        };

        let getLyrics = await fetch(`${global.config.music}/lyrics`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify(body)
        });

        if (!getLyrics.ok) getLyrics = await (await fetch(`${global.config.music}/plugins/lyrics/search`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify(body)
        })).json();
        else getLyrics = await getLyrics.json();

        lyrics.value = getLyrics.lyrics || "Lyrics not found";
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