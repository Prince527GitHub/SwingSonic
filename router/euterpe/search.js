const express = require("express");
const router = express.Router();

const zw = require("../../packages/zw");
const { mapTrack, mapTracks } = require("../../packages/track");

async function getAlbumTracks(albumhash, user) {
    const album = await (await fetch(`${global.config.music}/album`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cookie": user },
        body: JSON.stringify({ albumhash })
    })).json();

    if (album?.error || !album?.info) return [];

    return mapTracks(album.tracks);
}

router.get("/", async(req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const start = Math.max(Number.parseInt(req.query.start, 10) || 0, 0);

    const search = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${encodeURIComponent(query)}&start=${start}&limit=${limit}`, { headers: { "Cookie": req.user } })).json();

    const tracks = (search.results || []).filter(track => track.filepath && track.trackhash);

    const albumHashes = new Set();
    for (const track of tracks) {
        const hidden = zw.extract(track.album || "");
        if (hidden) {
            try {
                const data = JSON.parse(hidden);
                if (data.album) albumHashes.add(data.album);
            } catch {}
        }
        if (!albumHashes.has(track.albumhash) && track.albumhash) {
            albumHashes.add(track.albumhash);
        }
    }

    if (albumHashes.size > 0) {
        const albumTracks = await Promise.all(
            [...albumHashes].slice(0, Math.ceil(limit / 10)).map(hash => getAlbumTracks(hash, req.user))
        );
        const allTracks = albumTracks.flat();
        if (allTracks.length > 0) return res.json(allTracks);
    }

    const result = tracks.map(mapTrack);

    res.json(result);
});

module.exports = {
    router: router,
    name: "search"
}
