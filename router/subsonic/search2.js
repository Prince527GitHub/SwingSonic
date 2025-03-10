module.exports = async(req, res, proxy, xml) => {
    const query = req.query.query;

    let { artistCount, artistOffset, albumCount, albumOffset, songCount, songOffset, f } = req.query;

    let artists = [];

    if (artistCount >= 1 && query) {
        try {
            artists = await (await fetch(`${global.config.music}/search/?itemtype=artists&q=${query}&start=${artistOffset || '0'}&limit=${artistCount || '50'}`, {
                headers: {
                    "Cookie": req.user
                }
            })).json();
            artists = artists.results.map(artist => ({
                id: artist.artisthash,
                name: artist.name
            }));
        } catch (error) {
            console.log(error);
        }
    }

    let albums = [];

    if (albumCount >= 1 && query) {
        try {
            albums = await (await fetch(`${global.config.music}/search/?itemtype=albums&q=${query}&start=${albumOffset || '0'}&limit=${albumCount || '50'}`, {
                headers: {
                    "Cookie": req.user
                }
            })).json();
            albums = albums.results.map(album => ({
                id: album.albumhash,
                parent: album.albumhash,
                title: album.title,
                artist: album.albumartists[0].name,
                isDir: "true",
                coverArt: Buffer.from(JSON.stringify({ type: "album", id: album.image })).toString("base64")
            }));
        } catch (error) {
            console.log(error);
        }
    }

    let tracks = [];

    if (songCount >= 1 && query) {
        try {
            tracks = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${query}&start=${songOffset || '0'}&limit=${songCount || '50'}`, {
                headers: {
                    "Cookie": req.user
                }
            })).json();
            tracks = tracks.results.map(track => ({
                id: track.trackhash,
                parent: track.albumhash,
                title: track.title,
                isDir: false,
                album: track.album,
                artist: track.albumartists[0].name,
                track: 0,
                year: 2024,
                genre: "Unknown",
                coverArt: Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64"),
                size: 0,
                contentType: "audio/mpeg",
                suffix: "mp3",
                isVideo: false
            }));
        } catch (error) {
            console.log(error);
        }
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