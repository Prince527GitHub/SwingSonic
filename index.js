const config = require("./config.json");

const express = require("express");
const cors = require("cors");
const app = express();

const xmlbuilder = require("xmlbuilder");
const crypto = require("crypto");
const axios = require("axios");

function convertToXml(jsonObj) {
    const rootKey = Object.keys(jsonObj)[0];
    const xml = xmlbuilder.create(rootKey);

    function convertToXmlObj(obj, parent) {
        for (const key in obj) {
            if (Array.isArray(obj[key])) {
                obj[key].forEach((item, index) => {
                    const validKey = convertToValidXmlName(key);
                    const child = parent.ele(validKey);
                    if (typeof item === 'object') convertToXmlObj(item, child);
                    else child.text(item);
                });
            } else if (typeof obj[key] === 'object') {
                const validKey = convertToValidXmlName(key);
                const child = parent.ele(validKey);
                convertToXmlObj(obj[key], child);
            } else {
                const validKey = convertToValidXmlName(key);
                parent.att(validKey, obj[key]);
            }
        }
    }

    convertToXmlObj(jsonObj[rootKey], xml);

    return xml.end({ pretty: true });
}

function convertToValidXmlName(name) {
    name = name.replace(/^[^a-zA-Z_]+/, '_');
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

async function proxy(res, url) {
    const response = await axios.get(url, { responseType: 'stream' });

    res.set('Content-Type', response.headers['content-type']);

    response.data.pipe(res);
} 

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function hashPassword(password, salt) {
    const hash = crypto.createHash('md5');

    hash.update(password + salt);

    return hash.digest('hex');
}

function checkPassword(string, salt, password) {
    if (string.startsWith("enc:")) {
        try {
            const encodedData = string.substring(4);
            const decodedString = Buffer.from(encodedData, 'hex').toString('utf-8');
            return decodedString;
        } catch (error) {
            return false;
        }
    } else {
        if (string && salt && password) {
            try {
                const hashed = hashPassword(password, salt);
                return hashed === string;
            } catch (error) {
                return false;
            }
        } else return false;
    }
}

function checkAuth(req, res, next) {
    let { u, p, t, s, f } = req.query;

    const json = {
        "subsonic-response": {
            "status": "unauthorized",
            "version": "1.16.1"
        }
    }

    if (config.server.users.length) {
        if (!u || (!p && (!t || !s))) {
            if (f === "json") return res.json(json);
            else return res.send(convertToXml(json));
        }

        const user = config.server.users.find(user => user.username === u);
        if (!user) {
            if (f === "json") return res.json(json);
            else return res.send(convertToXml(json));
        }

        if (!p) p = t;

        if (!checkPassword(p, s, user.password)) {
            if (f === "json") return res.json(json);
            else return res.send(convertToXml(json));
        }
    }

    next();
}

function createArray(array, size, offset) {
    if (offset < 0 || offset >= array.length) return [];

    const newArray = array.slice(offset, offset + size);
    return newArray;
}

app.use(cors({ origin: "*" }));
app.use(require("./logs"));

app.use((req, res, next) => checkAuth(req, res, next));

app.get("/rest/getPlaylists.view", async(req, res) => {
    let { f } = req.query;

    const playlists = await (await fetch(`${config.music}/playlists`)).json();

    const output = playlists.data.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        comment: "No comment",
        owner: "admin",
        public: true,
        songCount: playlist.count,
        duration: playlist.duration,
        created: playlist.last_updated,
        coverArt: playlist.image
    }));

    const json = {
        "subsonic-response": {
            "playlists": {
                "playlist": output
            },
            "status": "ok",
            "version": "1.16.1"
        }
    };

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getPlaylist.view", async(req, res) => {
    const id = req.query.id;

    let { f } = req.query;

    const playlist = await (await fetch(`${config.music}/playlist/${id}?no_tracks=false`)).json();

    const output = playlist.tracks.map(track => ({
        "id": track.trackhash,
        "parent": "655",
        "title": track.title,
        "album": track.album,
        "artist": track.artists[0].name,
        "isDir": "false",
        "coverArt": track.image,
        "created": new Date(track.created_date * 1000).toISOString(),
        "duration": track.duration,
        "bitRate": track.bitrate,
        "track": track.track,
        "year": new Date(track.created_date * 1000).getFullYear(),
        "size": 0,
        "suffix": "mp3",
        "contentType": "audio/mpeg",
        "isVideo": "false",
        "path": track.filepath,
        "albumId": track.albumhash,
        "artistId": track.artists[0].artisthash,
        "type": "music"
    }));

    const json = {
        "subsonic-response": {
            "playlist": {
                "id": playlist.info.id,
                "name": playlist.info.name,
                "comment": "No comment",
                "owner": "admin",
                "public": true,
                "songCount": playlist.info.count,
                "duration": playlist.info.duration,
                "created": 0, // 16 hours ago
                "coverArt": playlist.info.image,
                "entry": output
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/createPlaylist.view", async(req, res) => {
    let { playlistId, name, f } = req.query;

    if (playlistId || !name) return res.json({
        "subsonic-response": {
            "status": "ok",
            "version": "1.16.1"
        }
    });

    const playlist = await (await fetch(`${config.music}/playlist/new`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: name })
    })).json();

    const json = {
        "subsonic-response": {
            "playlists": {
                id: playlist.playlist.id,
                name: playlist.playlist.name,
                comment: "No comment",
                owner: "admin",
                public: true,
                songCount: playlist.playlist.count,
                duration: playlist.playlist.duration,
                created: playlist.playlist.last_updated,
                coverArt: playlist.playlist.image
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/updatePlaylist.view", async(req, res) => {
    let { playlistId, name, songIdToAdd, songIdToRemove, f } = req.query;

    if (playlistId) {
        if (songIdToAdd) await fetch(`${config.music}/playlist/${playlistId}/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ itemtype: "track", itemhash: songIdToAdd })
        });

        if (songIdToRemove) await fetch(`${config.music}/playlist/${playlistId}/remove-tracks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ tracks: [{ trackhash: songIdToRemove, index: 0 }] })
        });

        if (name) {
            const formData = new FormData();
            formData.append("name", name);

            await fetch(`${config.music}/playlist/${playlistId}/remove-tracks`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'multipart/form-data; boundary=---------------------------33867228569274464331197929572'
                },
                body: formData
            });
        }
    }

    const json = {
        "subsonic-response": {
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getAlbumList2.view", async(req, res) => {
    let { type, size, offset, f } = req.query;

    let albums = await (await fetch(`${config.music}/getall/albums?start=${offset || '0'}&limit=${size || '50'}&sortby=${type === "alphabeticalByName" ? "title&reverse=" : type === "alphabeticalByArtist" ? "albumartists&reverse=" : "created_date&reverse=1"}`)).json();

    if (type === "starred") albums.items = createArray((await (await fetch(`${config.music}/albums/favorite?limit=0`)).json()).albums, size, offset);
    else if (type === "recent") {
        albums.items = createArray((await (await fetch(`${config.music}/home/recents/played?limit=${size + offset}`)).json()).items, size, offset);
        albums.items = albums.items.filter(item => item.type === "album");
    }

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

    const json = {
        "subsonic-response": {
            "albumList2": {
                "album": output
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getAlbumList.view", async(req, res) => {
    let { type, size, offset, f } = req.query;

    const albums = await (await fetch(`${config.music}/getall/albums?start=${offset || '0'}&limit=${size || '50'}&sortby=created_date&reverse=1`)).json();

    let output = albums.items.map(item => ({
        id: item.item?.albumhash || item.albumhash,
        parent: item.item?.albumhash || item.albumhash,
        title: item.item?.title || item.title,
        artist: item.item?.albumartists[0].name || item.albumartists[0].name,
        isDir: true,
        coverArt: item.item?.image || item.image,
        userRating: 0,
        averageRating: 0
    }));

    if (type === "random") output = shuffleArray(output);

    const json = {
        "subsonic-response": {
            "albumList": {
                "album": output
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getCoverArt.view", async(req, res) => {
    const id = req.query.id;

    const artist = await fetch(`${config.music}/artist/${id.replace(/\.[^.]+$/, '')}/albums?limit=1&all=false`);

    const cover = `${config.music}/img/${artist.ok ? 'a': 't'}/${id}`;

    if (config.server.proxy) proxy(res, cover);
    else res.redirect(cover);
});

app.get("/rest/getAlbum.view", async(req, res) => {
    const id = req.query.id;

    let { f } = req.query;

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

    const json = {
        "subsonic-response": {
            ...output,
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/stream.view", (req, res) => {
    const id = req.query.id;

    const url = `${config.music}/file/${id}`;

    if (config.server.proxy) proxy(res, url);
    else res.redirect(url);
});

app.get("/rest/download.view", (req, res) => {
    const id = req.query.id;

    const url = `${config.music}/file/${id}`;

    if (config.server.proxy) proxy(res, url);
    else res.redirect(url);
});

app.get("/rest/getArtists.view", async(req, res) => {
    let { f } = req.query;

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

    const json = {
        "subsonic-response": {
            "artists": {
                "index": organizedArtists
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getArtist.view", async(req, res) => {
    const id = req.query.id;

    let { f } = req.query;

    const getAlbums = await (await fetch(`${config.music}/artist/${id}/albums?limit=7&all=false`)).json();
    const artist = await (await fetch(`${config.music}/artist/${id}`)).json();

    const albums = getAlbums.appearances.map(album => ({
        id: album.albumhash,
        name: album.title,
        coverArt: album.image,
        songCount: 0,
        created: new Date(album.created_date * 1000).toISOString(),
        duration: 0,
        artist: album.albumartists[0].name,
        artistId: album.albumartists[0].artisthash
    }));

    const json = {
        "subsonic-response": {
            "artist": {
                "id": id,
                "name": artist.artist.name,
                "coverArt": artist.artist.image,
                "songCount": artist.artist.trackcount,
                "created": new Date(artist.artist.created_date * 1000).toISOString(),
                "duration": artist.artist.duration,
                "artist": artist.artist.name,
                "artistId": id,
                "album": albums
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getArtistInfo2.view", async(req, res) => {
    const id = req.query.id;

    let { f } = req.query;

    const artist = await (await fetch(`${config.music}/artist/${id}`)).json();

    const json = {
        "subsonic-response": {
            "artistInfo2": {
                "biography": "Unknown",
                "musicBrainzId": id,
                "lastFmUrl": `${config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                "smallImageUrl": `${config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                "mediumImageUrl": `${config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                "largeImageUrl": `${config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                "similarArtist": []
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getArtistInfo.view", async(req, res) => {
    const id = req.query.id;

    let { f } = req.query;

    const artist = await (await fetch(`${config.music}/artist/${id}`)).json();

    const json = {
        "subsonic-response": {
            "artistInfo": {
                "biography": "Unknown",
                "musicBrainzId": id,
                "lastFmUrl": `${config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                "smallImageUrl": `${config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                "mediumImageUrl": `${config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                "largeImageUrl": `${config.server.url}/rest/getCoverArt.view?id=${artist.artist.image}`,
                "similarArtist": []
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/search3.view", async(req, res) => {
    const query = req.query.query;

    let { artistCount, albumCount, songCount, f } = req.query;

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
            "year": 2024,
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

    const json = {
        "subsonic-response": {
            "searchResult3": {
                "artist": artists,
                "album": albums,
                "song": tracks
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/search2.view", async(req, res) => {
    const query = req.query.query;

    let { artistCount, albumCount, songCount, f } = req.query;

    let artists = [];

    if (artistCount >= 1) {
        artists = await (await fetch(`${config.music}/search/artists?q=${query}`)).json();
        artists = artists.artists.map(artist => ({
            "id": artist.artisthash,
            "name": artist.name
        }));
    }

    let albums = [];

    if (albumCount >= 1) {
        albums = await (await fetch(`${config.music}/search/albums?q=${query}`)).json();
        albums = albums.albums.map(album => ({
            "id": album.albumhash,
            "parent": album.albumhash,
            "title": album.title,
            "artist": album.albumartists[0].name,
            "isDir": "true",
            "coverArt": album.image
        }));
    }

    let tracks = [];

    if (songCount >= 1) {
        tracks = await (await fetch(`${config.music}/search/tracks?q=${query}`)).json();
        tracks = tracks.tracks.map(track => ({
            "id": track.trackhash,
            "parent": track.albumhash,
            "title": track.title,
            "isDir": "false",
            "album": track.album,
            "artist": track.albumartists[0].name,
            "track": 0,
            "year": 2024,
            "genre": "Unknown",
            "coverArt": track.image,
            "size": 0,
            "contentType": "audio/mpeg",
            "suffix": "mp3",
            "isVideo": "false"
        }));
    }

    const json = {
        "subsonic-response": {
            "searchResult2": {
                "artist": artists,
                "album": albums,
                "song": tracks
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getLyrics.view", async(req, res) => {
    let { title, f } = req.query;

    let track = await (await fetch(`${config.music}/search/tracks?q=${title || ""}`)).json();
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

        let getLyrics = await fetch(`${config.music}/lyrics`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!getLyrics.ok) getLyrics = await (await fetch(`${config.music}/plugins/lyrics/search`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })).json();
        else getLyrics = await getLyrics.json();

        lyrics.value = getLyrics.lyrics || "Lyrics not found";
    }

    const json = {
        "subsonic-response": {
            "lyrics": lyrics,
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getRandomSongs.view", async(req, res) => {
    let { size, f } = req.query;

    const albumsSize = (await (await fetch(`${config.music}/getall/albums?start=0&limit=1&sortby=created_date&reverse=1`)).json()).total;
    const albums = await (await fetch(`${config.music}/getall/albums?start=0&limit=${albumsSize}&sortby=created_date&reverse=1`)).json();

    let output = [];
    for (let index = 0; index < albums.items.length; index++) {
        const album = albums.items[index];

        const tracks = await (await fetch(`${config.music}/album`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ albumhash: album.albumhash })
        })).json();

        output.push(...tracks.tracks.map(track => ({
            "id": track.trackhash,
            "parent": track.albumhash,
            "title": track.title,
            "isDir": "false",
            "album": track.album,
            "artist": track.artists[0].name,
            "track": 0,
            "year": 2024,
            "genre": "Unknown",
            "coverArt": track.image,
            "size": 0,
            "contentType": "audio/mpeg",
            "suffix": "mp3",
            "duration": track.duration,
            "bitRate": track.bitrate
        })));
    }

    output = shuffleArray(output);

    output = output.slice(0, size || 10);

    const json = {
        "subsonic-response": {
            "randomSongs": {
                "song": output
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/startScan", async(req, res) => {
    let { f } = req.query;

    const scan = await (await fetch(`${config.music}/settings/trigger-scan`)).json();
    const tracks = await (await fetch(`${config.music}/folder`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ folder: "$home", tracks_only: false })
    })).json();

    const status = scan?.msg === "Scan triggered!" ? true : false;

    const json = {
        "subsonic-response": {
            "scanStatus": {
                "scanning": status,
                "count": tracks?.folders[0]?.count || 0
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getScanStatus", async(req, res) => {
    let { f } = req.query;

    const json = {
        "subsonic-response": {
            "scanStatus": {
                "scanning": false,
                "count": 0
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getStarred2.view", async(req, res) => {
    let { f } = req.query;

    const favorites = await (await fetch(`${config.music}/favorites`)).json();

    const artists = favorites.artists.map(artist => ({
        "id": artist.artisthash,
        "name": artist.name,
        "coverArt": artist.image,
        "albumCount": artist.albumcount,
        "starred": new Date(artist.created_date * 1000).toISOString()
    }));

    const albums = favorites.albums.map(album => ({
        "id": album.albumhash,
        "name": album.title,
        "artist": album.albumartists[0].artisthash,
        "artistId": album.albumartists[0].name,
        "coverArt": album.image,
        "songCount": album.count,
        "duration": album.duration,
        "created": new Date(album.created_date * 1000).toISOString(),
        "starred": new Date(album.created_date * 1000).toISOString()
    }));

    const tracks = favorites.tracks.map(track => ({
        "id": track.trackhash,
        "parent": track.albumhash,
        "title": track.title,
        "album": track.album,
        "artist": track.artists[0].name,
        "isDir": "false",
        "coverArt": track.image,
        "created": new Date(track.created_date * 1000).toISOString(),
        "starred": new Date(track.created_date * 1000).toISOString(),
        "duration": track.duration,
        "bitRate": track.bitrate,
        "track": track.track,
        "year": 2024,
        "genre": "Unknown",
        "size": 0,
        "suffix": "mp3",
        "contentType": "audio/mpeg",
        "isVideo": "false",
        "path": track.filepath,
        "albumId": track.albumhash,
        "artistId": track.artists[0].artisthash,
        "type": "music"
    }));

    const json = {
        "subsonic-response": {
            "starred2": {
                "artist": artists,
                "album": albums,
                "song": tracks
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.get("/rest/getStarred.view", async(req, res) => {
    let { f } = req.query;

    const favorites = await (await fetch(`${config.music}/favorites`)).json();

    const artists = favorites.artists.map(artist => ({
        "name": artist.name,
        "id": artist.artisthash,
        "starred": new Date(artist.created_date * 1000).toISOString()
    }));

    const albums = favorites.albums.map(album => ({
        "id": album.albumhash,
        "parent": album.albumhash,
        "title": album.title,
        "album": album.title,
        "isDir": "true",
        "coverArt": album.image,
        "created": new Date(album.created_date * 1000).toISOString(),
        "starred": new Date(album.created_date * 1000).toISOString()
    }));

    const tracks = favorites.tracks.map(track => ({
        "id": track.trackhash,
        "parent": track.albumhash,
        "title": track.title,
        "album": track.album,
        "artist": track.artists[0].name,
        "isDir": "false",
        "coverArt": track.image,
        "created": new Date(track.created_date * 1000).toISOString(),
        "starred": new Date(track.created_date * 1000).toISOString(),
        "duration": track.duration,
        "bitRate": track.bitrate,
        "track": track.track,
        "year": 2024,
        "genre": "Unknown",
        "size": 0,
        "suffix": "mp3",
        "contentType": "audio/mpeg",
        "isVideo": "false",
        "path": track.filepath,
        "albumId": track.albumhash,
        "artistId": track.artists[0].artisthash,
        "type": "music"
    }));

    const json = {
        "subsonic-response": {
            "starred": {
                "artist": artists,
                "album": albums,
                "song": tracks
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
});

app.use((req, res, next) => {
    let { f } = req.query;

    const json = {
        "subsonic-response": {
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.status(200).json(json);
    else res.status(200).send(convertToXml(json));
});

app.listen(config.server.port, () => {
    console.log("SwingSonic!");
});
