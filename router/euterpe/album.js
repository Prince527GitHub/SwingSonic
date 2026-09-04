const express = require("express");
const router = express.Router();

const { mapTracks } = require("../../packages/track");
const { firstProperty } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const proxy = require("../../packages/proxy");

router.get("/:id/artwork", async (req, res) => {
    const size = req.query.size === "small" ? "small" : "medium";

    proxy(res, req, api.url(`/img/thumbnail/${size}/${encodeURIComponent(req.params.id)}.webp`));
});

router.get("/:id", async (req, res) => {
    const album = await api.album(req.user).getAlbumTracksAndInfo({ albumhash: req.params.id });
    if (album?.error || !album?.info) return res.sendStatus(404);

    const info = album.info || {};

    res.json({
        id: info.albumhash,
        title: info.title,
        artist: firstProperty(info.albumartists, "name"),
        artist_id: firstProperty(info.albumartists, "artisthash"),
        year: info.date ? new Date(info.date * 1000).getFullYear() : undefined,
        tracks: mapTracks(album.tracks)
    });
});

module.exports = {
    router,
    name: "album"
};
