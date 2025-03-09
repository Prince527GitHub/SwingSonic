const express = require("express");
const router = express.Router();

const path = require("path");

router.get("/", async(req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    const size = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=1&sortby=title&reverse=1`, {
        headers: {
            "Cookie": req.user
        }
    })).json();
    const albums = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=${size.total}&sortby=title&reverse=1`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    let result = [];
    if (albums.items.find(album => album.title === query)) {
        const id = (albums.items.find(album => album.title === query)).albumhash;

        const album = await (await fetch(`${global.config.music}/album`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({ albumhash: id })
        })).json();

        result = album.tracks.map(track => ({
            album: track.album,
            title: track.title,
            track: track.track,
            artist: track.artists[0].name,
            artist_id: track.artists[0].artisthash,
            id: track.trackhash,
            album_id: track.albumhash,
            format: path.extname(track.filepath).slice(1),
            duration: track.duration * 1000,
            track: track.track
        })).sort((a, b) => a.track - b.track);
    } else {
        const search = await (await fetch(`${global.config.music}/search/tracks?q=${query}`, {
            headers: {
                "Cookie": req.user
            }
        })).json();

        result = search.tracks.map(track => ({
            album: track.album,
            title: track.title,
            track: 1,
            artist: track.artists[0].name,
            artist_id: track.artists[0].artisthash,
            id: track.trackhash,
            album_id: track.albumhash,
            format: path.extname(track.filepath).slice(1),
            duration: track.duration * 1000
        }));
    }

    res.json(result);
});

module.exports = {
    router: router,
    name: "search"
}