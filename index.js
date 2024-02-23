const config = require("./config.json");

const express = require('express');
const cors = require('cors');
const app = express();

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

app.use(cors({ origin: "*" }));
app.use(require("./logs"));

app.get("/rest/getPlaylists.view", (req, res) => {
    res.json({
        "subsonic-response": {
            "playlists": {
                "playlist": []
            },
            "xmlns": "http://subsonic.org/restapi",
            "status": "ok",
            "version": "1.16.1",
            "script": {
                "xmlns": "",
                "id": "bw-fido2-page-script"
            }
        }
    });
});

app.get("/rest/getAlbumList2.view", async(req, res) => {
    let { type, size, offset } = req.query;

    const albums = await (await fetch(`${config.music}/getall/albums?start=${offset || '0'}&limit=${size || '50'}&sortby=created_date&reverse=1`)).json();

    let output = albums.items.map(item => ({
        id: item.item?.albumhash || item.albumhash,
        name: item.item?.title || item.title,
        coverArt: item.item?.image || item.image,
        songCount: 0,
        created: new Date(item.item?.created_date || item.created_date * 1000).toISOString(),
        duration: 0,
        artist: item.item?.albumartists[0].name || item.albumartists[0].name,
        artistId: item.item?.albumartists[0].artisthash || item.albumartists[0].artisthash
    }));

    if (type === "random") output = shuffleArray(output);

    res.json({
        "subsonic-response": {
            "albumList2": {
                "album": output
            },
            "xmlns": "http://subsonic.org/restapi",
            "status": "ok",
            "version": "1.16.1",
            "script": {
                "xmlns": "",
                "id": "bw-fido2-page-script"
            }
        }
    });
});

app.get("/rest/getCoverArt.view", async(req, res) => {
    const id = req.query.id;

    const artist = await fetch(`${config.music}/artist/${id.replace(/\.[^.]+$/, '')}/albums?limit=1&all=false`);

    const cover = `${config.music}/img/${artist.ok ? 'a': 't'}/${id}`;

    res.redirect(cover);
});

app.get("/rest/getAlbum.view", async(req, res) => {
    const id = req.query.id;

    const album = await (await fetch(`${config.music}/album`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ albumhash: id })
    })).json();

    const output = {
        "album": {
            "id": album.info.albumhash,
            "name": album.info.title,
            "coverArt": album.info.image,
            "songCount": album.info.count,
            "created": new Date(album.info.created_date * 1000).toISOString(),
            "duration": album.info.duration,
            "artist": album.info.albumartists[0].name,
            "artistId": album.info.albumartists[0].artisthash,
            "song": album.tracks.map(track => ({
                "id": track.trackhash,
                "parent": track.albumhash,
                "title": track.title,
                "album": track.album,
                "artist": track.artists[0].name,
                "isDir": "false",
                "coverArt": track.image,
                "created": new Date(album.info.created_date * 1000).toISOString(),
                "duration": track.duration,
                "bitRate": track.bitrate,
                "size": 0,
                "suffix": "mp3",
                "contentType": "audio/mpeg",
                "isVideo": "false",
                "path": track.filepath,
                "albumId": track.albumhash,
                "artistId": track.artists[0].artisthash,
                "type": "music"
            }))
        }
    };

    res.json({
        "subsonic-response": {
            ...output,
            "xmlns": "http://subsonic.org/restapi",
            "status": "ok",
            "version": "1.16.1",
            "script": {
                "xmlns": "",
                "id": "bw-fido2-page-script"
            }
        }
    });
});

app.get("/rest/stream.view", (req, res) => {
    const id = req.query.id;

    res.redirect(`${config.music}/file/${id}`);
});

app.get("/rest/download.view", (req, res) => {
    const id = req.query.id;

    res.redirect(`${config.music}/file/${id}`);
});

app.get("/rest/getArtists.view", async(req, res) => {
    const size = (await (await fetch(`${config.music}/getall/artists?start=0&limit=1&sortby=created_date&reverse=1`)).json()).total;

    const artists = await (await fetch(`${config.music}/getall/artists?start=0&limit=${size}&sortby=created_date&reverse=1`)).json();

    const output = artists.items.map(item => ({
        id: item.artisthash,
        name: item.name,
        coverArt: item.image,
        albumCount: 0
    }));

    const groupedByLetter = output.reduce((acc, artist) => {
        const firstLetter = artist.name.charAt(0).toUpperCase();
        acc[firstLetter] = acc[firstLetter] || [];
        acc[firstLetter].push(artist);
        return acc;
    }, {});

    const organizedArtists = Object.keys(groupedByLetter).map(letter => ({
        name: letter,
        artist: groupedByLetter[letter]
    }));

    res.json({
        "subsonic-response": {
            "artists": {
                "index": organizedArtists
            },
            "xmlns": "http://subsonic.org/restapi",
            "status": "ok",
            "version": "1.16.1",
            "script": {
                "xmlns": "",
                "id": "bw-fido2-page-script"
            }
        }
    });
});

app.get("/rest/getArtist.view", async(req, res) => {
    const id = req.query.id;

    const artist = await (await fetch(`${config.music}/artist/${id}/albums?limit=7&all=false`)).json();

    const albums = artist.appearances.map(album => ({
        id: album.albumhash,
        name: album.title,
        coverArt: album.image,
        songCount: 0,
        created: new Date(album.created_date * 1000).toISOString(),
        duration: 0,
        artist: album.albumartists[0].name,
        artistId: album.albumartists[0].artisthash
    }));

    res.json({
        "subsonic-response": {
            "artist": {
                "id": id,
                "name": artist.artistname,
                "coverArt": `${id}.webp`,
                "songCount": "",
                "created": "",
                "duration": "",
                "artist": artist.artistname,
                "artistId": id,
                "album": albums
            },
            "xmlns": "http://subsonic.org/restapi",
            "status": "ok",
            "version": "1.16.1",
            "script": {
                "xmlns": "",
                "id": "bw-fido2-page-script"
            }
        }
    });
});

app.get("/rest/search3.view", async(req, res) => {
    const query = req.query.query;

    let { artistCount, albumCount, songCount } = req.query;

    let artists = [];

    if (artistCount >= 1) {
        artists = await (await fetch(`${config.music}/search/artists?q=${query}`)).json();
        artists = artists.artists.map(artist => ({
            "id": artist.artisthash,
            "name": artist.name,
            "coverArt": artist.image,
            "albumCount": artist.albumcount
        }));
    }

    let albums = [];

    if (albumCount >= 1) {
        albums = await (await fetch(`${config.music}/search/albums?q=${query}`)).json();
        albums = albums.albums.map(album => ({
            "id": album.albumhash,
            "name": album.title,
            "coverArt": album.image,
            "songCount": 0,
            "created": new Date(album.created_date * 1000).toISOString(),
            "duration": 0,
            "artist": album.albumartists[0].name,
            "artistId": album.albumartists[0].artisthash
        }));
    }

    let tracks = [];

    if (songCount >= 1) {
        tracks = await (await fetch(`${config.music}/search/tracks?q=${query}`)).json();
        tracks = tracks.tracks.map(track => ({
            "id": track.trackhash,
            "parent": track.albumhash,
            "title": track.title,
            "album": track.album,
            "artist": track.albumartists[0].name,
            "isDir": "false",
            "coverArt": track.image,
            "created": "2007-03-15T06:46:06",
            "duration": track.duration,
            "bitRate": track.bitrate,
            "track": 0,
            "year": 2023,
            "genre": "Unknown",
            "size": 0,
            "suffix": "mp3",
            "contentType": "audio/mpeg",
            "isVideo": "false",
            "path": track.filepath,
            "albumId": track.albumhash,
            "artistId": track.albumartists[0].artisthash,
            "type": "music"
        }));
    }

    res.json({
        "subsonic-response": {
            "searchResult3": {
                "artist": artists,
                "album": albums,
                "song": tracks
            },
            "xmlns": "http://subsonic.org/restapi",
            "status": "ok",
            "version": "1.16.1",
            "script": {
                "xmlns": "",
                "id": "bw-fido2-page-script"
            }
        }
    });
});

app.use((req, res, next) => {
    res.status(200).json({
        "subsonic-response": {
            "xmlns": "http://subsonic.org/restapi",
            "status": "ok",
            "version": "1.16.1",
            "script": {
                "xmlns": "",
                "id": "bw-fido2-page-script"
            }
        }
    });
});

app.use((req, res, next) => {
    res.status(200).json({
        "subsonic-response": {
            "xmlns": "http://subsonic.org/restapi",
            "status": "ok",
            "version": "1.16.1",
            "script": {
                "xmlns": "",
                "id": "bw-fido2-page-script"
            }
        }
    });
});

app.listen(config.port, () => {
    console.log("Swing Music to Subsonic");
});
