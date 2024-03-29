module.exports = async(req, res, proxy, xml) => {
    const query = req.query.query;

    let { artistCount, albumCount, songCount, f } = req.query;

    let artists = [];

    if (artistCount >= 1) {
        artists = await (await fetch(`${global.config.music}/search/artists?q=${query}`)).json();
        artists = artists.artists.map(artist => ({
            id: artist.artisthash,
            name: artist.name,
            coverArt: artist.image,
            albumCount: artist.albumcount
        }));
    }

    let albums = [];

    if (albumCount >= 1) {
        albums = await (await fetch(`${global.config.music}/search/albums?q=${query}`)).json();
        albums = albums.albums.map(album => ({
            id: album.albumhash,
            name: album.title,
            coverArt: album.image,
            songCount: 0,
            created: new Date(album.created_date * 1000).toISOString(),
            duration: 0,
            artist: album.albumartists[0].name,
            artistId: album.albumartists[0].artisthash
        }));
    }

    let tracks = [];

    if (songCount >= 1) {
        tracks = await (await fetch(`${global.config.music}/search/tracks?q=${query}`)).json();
        tracks = tracks.tracks.map(track => ({
            id: track.trackhash,
            parent: track.albumhash,
            title: track.title,
            album: track.album,
            artist: track.albumartists[0].name,
            isDir: "false",
            coverArt: track.image,
            created: "2007-03-15T06:46:06",
            duration: track.duration,
            bitRate: track.bitrate,
            track: 0,
            year: 2024,
            genre: "Unknown",
            size: 0,
            suffix: "mp3",
            contentType: "audio/mpeg",
            isVideo: "false",
            path: track.filepath,
            albumId: track.albumhash,
            artistId: track.albumartists[0].artisthash,
            type: "music"
        }));
    }

    const json = {
        "subsonic-response": {
            searchResult3: {
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