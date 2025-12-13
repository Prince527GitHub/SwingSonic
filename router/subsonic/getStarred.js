module.exports = async(req, res, proxy, xml) => {
    let { f } = req.query;

    const favorites = await (await fetch(`${global.config.music}/favorites`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const artists = favorites.artists.map(artist => ({
        name: artist.name,
        id: artist.artisthash,
        starred: new Date(artist.created_date * 1000).toISOString()
    }));

    const albums = favorites.albums.map(album => ({
        id: album.albumhash,
        parent: album.albumhash,
        title: album.title,
        album: album.title,
        isDir: "true",
        coverArt: Buffer.from(JSON.stringify({ type: "album", id: album.image })).toString("base64"),
        created: new Date(album.created_date * 1000).toISOString(),
        starred: new Date(album.created_date * 1000).toISOString()
    }));

    const tracks = favorites.tracks.map(track => ({
        id: track.trackhash,
        parent: track.albumhash,
        title: track.title,
        album: track.album,
        artist: track.artists[0].name,
        isDir: false,
        coverArt: Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64"),
        created: new Date(0).toISOString(),
        starred: new Date(0).toISOString(),
        duration: track.duration,
        bitRate: track.bitrate,
        track: track.track,
        year: 2024,
        genre: "Unknown",
        size: track.extra.filesize,
        suffix: "mp3",
        contentType: "audio/mpeg",
        isVideo: false,
        path: track.filepath,
        albumId: track.albumhash,
        artistId: track.artists[0].artisthash,
        type: "music"
    }));

    const json = {
        "subsonic-response": {
            starred: {
                artist: artists,
                album: albums,
                song: tracks
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
