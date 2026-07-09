const express = require("express");
const router = express.Router();

const path = require("path");

router.get("/", async(req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    const search = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${encodeURIComponent(query)}&start=0&limit=50`, { headers: { "Cookie": req.user } })).json();

    const result = (search.results || []).map(track => ({
        album: track.album,
        title: track.title,
        track: 1,
        artist: track.artists?.[0]?.name,
        artist_id: track.artists?.[0]?.artisthash,
        id: encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")),
        album_id: track.albumhash,
        format: path.extname(track.filepath || "").slice(1),
        duration: (track.duration || 0) * 1000,
    }));

    res.json(result);
});

module.exports = {
    router: router,
    name: "search"
}
