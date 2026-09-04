const express = require("express");
const router = express.Router();

// TODO: Cleanup this entire file.
const { createArray, clampedSize, parseIntOr, sortByProperty, ext, firstProperty } = require("../../packages/utils");
const codecs = require("../../packages/codecs");
const api = require("../../packages/swingmusic");
const zw = require("../../packages/zw");

async function getAlbumTracks(albumhash, user) {
    const album = await api.album(user).getAlbumTracksAndInfo({ albumhash });
    if (album?.error || !album?.info) return [];

    return sortByProperty((album.tracks || []).map(track => ({
        id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined,
        album: track?.album,
        title: track?.title,
        track: track?.track || 0,
        artist: firstProperty(track?.artists, "name"),
        artist_id: firstProperty(track?.artists, "artisthash"),
        album_id: track?.albumhash,
        format: ext(track?.filepath),
        duration: (track?.duration || 0) * 1000,
    })), "track");
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

    const result = tracks.map(track => ({
        id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined,
        album: track?.album,
        title: track?.title,
        track: track?.track || 0,
        artist: firstProperty(track?.artists, "name"),
        artist_id: firstProperty(track?.artists, "artisthash"),
        album_id: track?.albumhash,
        format: ext(track?.filepath),
        duration: (track?.duration || 0) * 1000,
    }));

    res.json(result);
});

module.exports = {
    router,
    name: "search"
};
