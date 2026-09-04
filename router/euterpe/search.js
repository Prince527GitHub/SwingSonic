const express = require("express");
const router = express.Router();

// TODO: Cleanup this entire file.
const { mapTrack, mapTracks } = require("../../packages/track");
const { createArray, clampedSize, parseIntOr } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const zw = require("../../packages/zw");

async function getAlbumTracks(albumhash, user) {
    const album = await api.album(user).getAlbumTracksAndInfo({ albumhash });
    if (album?.error || !album?.info) return [];

    return mapTracks(album.tracks);
}

router.get("/", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    const limit = clampedSize(req.query.limit, 50, 100);
    const start = Math.max(parseIntOr(req.query.start), 0);

    const search = await api.search(req.user).searchItems({ itemtype: "tracks", q: query, start, limit });

    const tracks = (search.results || []).filter(track => track.filepath && track.trackhash);

    const albumHashes = new Set();

    for (const track of tracks) {
        const hidden = zw.extract(track.album || "");
        if (hidden) {
            try {
                const data = JSON.parse(hidden);
                if (data.album) albumHashes.add(data.album);
            } catch { }
        }
        if (!albumHashes.has(track.albumhash) && track.albumhash) albumHashes.add(track.albumhash);
    }

    if (albumHashes.size > 0) {
        const albumTracks = await Promise.all(createArray([...albumHashes], Math.ceil(limit / 10)).map(hash => getAlbumTracks(hash, req.user)));
        const allTracks = albumTracks.flat();
        if (allTracks.length > 0) return res.json(allTracks);
    }

    const result = tracks.map(mapTrack);

    res.json(result);
});

module.exports = {
    router,
    name: "search"
};
