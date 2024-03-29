module.exports = async(req, res, proxy, xml) => {
    let { f } = req.query;

    const favorites = await (await fetch(`${global.config.music}/favorites`)).json();

    const artists = favorites.artists.map(artist => ({
        id: artist.artisthash,
        name: artist.name,
        coverArt: artist.image,
        albumCount: artist.albumcount,
        starred: new Date(artist.created_date * 1000).toISOString()
    }));

    const albums = favorites.albums.map(album => ({
        id: album.albumhash,
        name: album.title,
        artist: album.albumartists[0].artisthash,
        artistId: album.albumartists[0].name,
        coverArt: album.image,
        songCount: album.count,
        duration: album.duration,
        created: new Date(album.created_date * 1000).toISOString(),
        starred: new Date(album.created_date * 1000).toISOString()
    }));

    const tracks = favorites.tracks.map(track => ({
        id: track.trackhash,
        parent: track.albumhash,
        title: track.title,
        album: track.album,
        artist: track.artists[0].name,
        isDir: "false",
        coverArt: track.image,
        created: new Date(track.created_date * 1000).toISOString(),
        starred: new Date(track.created_date * 1000).toISOString(),
        duration: track.duration,
        bitRate: track.bitrate,
        track: track.track,
        year: 2024,
        genre: "Unknown",
        size: 0,
        suffix: "mp3",
        contentType: "audio/mpeg",
        isVideo: "false",
        path: track.filepath,
        albumId: track.albumhash,
        artistId: track.artists[0].artisthash,
        type: "music"
    }));

    const json = {
        "subsonic-response": {
            starred2: {
                artist: artists,
                album: albums,
                song: tracks
            },
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}