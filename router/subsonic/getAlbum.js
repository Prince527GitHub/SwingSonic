module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let { f } = req.query;

    const album = await (await fetch(`${global.config.music}/album`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": req.user
        },
        body: JSON.stringify({ albumhash: id })
    })).json();

    const output = {
        album: {
            id: album.info.albumhash,
            name: album.info.title,
            coverArt: album.info.image,
            songCount: album.info.count,
            created: new Date(album.info.date * 1000).toISOString(),
            duration: album.info.duration,
            artist: album.info.albumartists[0].name,
            artistId: album.info.albumartists[0].artisthash,
            song: album.tracks.map(track => {
                const song = {
                    id: encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")),
                    parent: track.albumhash,
                    title: track.title,
                    album: track.album,
                    artist: track.artists[0].name,
                    isDir: false,
                    coverArt: track.image,
                    created: new Date(album.info.created_date * 1000).toISOString(),
                    duration: track.duration,
                    bitRate: track.bitrate,
                    size: 0,
                    suffix: "mp3",
                    contentType: "audio/mpeg",
                    isVideo: false,
                    path: track.filepath,
                    albumId: track.albumhash,
                    artistId: track.artists[0].artisthash,
                    track: track.track,
                    type: "music",
                };

                if (track.is_favorite) song.starred = new Date(album.info.created_date * 1000).toISOString();

                return song;
            }).sort((a, b) => a.track - b.track)
        }
    }

    if (album.info.is_favorite) output.album.starred = new Date(album.info.created_date * 1000).toISOString();

    const json = {
        "subsonic-response": {
            ...output,
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}