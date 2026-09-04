const express = require("express");
const router = express.Router();

const { createArray, clampedSize, parseIntOr, sortByProperty, ext, firstProperty } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");
const zw = require("../../packages/zw");

router.get("/", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    const limit = clampedSize(req.query.limit, 50, 100);
    const start = Math.max(parseIntOr(req.query.start), 0);

    const found = await api.search(req.user).searchItems({ itemtype: "tracks", q: query, start, limit });
    const tracks = (found.results || []).filter(track => track.filepath && track.trackhash);

    const hashes = new Set();
    for (const track of tracks) {
        try {
            const embed = JSON.parse(zw.extract(track.album || ""));
            if (embed?.album) hashes.add(embed.album);
        } catch { }

        if (track.albumhash) hashes.add(track.albumhash);
    }

    if (hashes.size > 0) {
        const batches = await Promise.all(
            createArray([...hashes], Math.ceil(limit / 10)).map(async (hash) => {
                const album = await api.album(req.user).getAlbumTracksAndInfo({ albumhash: hash });
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
                    duration: (track?.duration || 0) * 1000
                })), "track");
            })
        );
        const combined = batches.flat();
        if (combined.length > 0) return res.json(combined);
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
        duration: (track?.duration || 0) * 1000
    }));

    res.json(result);
});

module.exports = {
    router,
    name: "search"
};
