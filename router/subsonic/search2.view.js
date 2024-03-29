module.exports = async(req, res, proxy, xml) => {
    const query = req.query.query;

    let { artistCount, albumCount, songCount, f } = req.query;

    let artists = [];

    if (artistCount >= 1) {
        artists = await (await fetch(`${global.config.music}/search/artists?q=${query}`)).json();
        artists = artists.artists.map(artist => ({
            id: artist.artisthash,
            name: artist.name
        }));
    }

    let albums = [];

    if (albumCount >= 1) {
        albums = await (await fetch(`${global.config.music}/search/albums?q=${query}`)).json();
        albums = albums.albums.map(album => ({
            id: album.albumhash,
            parent: album.albumhash,
            title: album.title,
            artist: album.albumartists[0].name,
            isDir: "true",
            coverArt: album.image
        }));
    }

    let tracks = [];

    if (songCount >= 1) {
        tracks = await (await fetch(`${global.config.music}/search/tracks?q=${query}`)).json();
        tracks = tracks.tracks.map(track => ({
            id: track.trackhash,
            parent: track.albumhash,
            title: track.title,
            isDir: "false",
            album: track.album,
            artist: track.albumartists[0].name,
            track: 0,
            year: 2024,
            genre: "Unknown",
            coverArt: track.image,
            size: 0,
            contentType: "audio/mpeg",
            suffix: "mp3",
            isVideo: "false"
        }));
    }

    const json = {
        "subsonic-response": {
            searchResult2: {
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