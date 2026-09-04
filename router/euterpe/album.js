const express = require("express");
const router = express.Router();

const { firstProperty, yearFromTimestamp, sortByProperty, ext } = require("../../packages/utils");
const codecs = require("../../packages/codecs");
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
        year: yearFromTimestamp(info.date),
        tracks: sortByProperty((album.tracks || []).map(track => ({
            id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined,
            album: track?.album,
            title: track?.title,
            track: track?.track || 0,
            artist: firstProperty(track?.artists, "name"),
            artist_id: firstProperty(track?.artists, "artisthash"),
            album_id: track?.albumhash,
            format: ext(track?.filepath),
            duration: (track?.duration || 0) * 1000,
        })), "track")
    });
});

module.exports = {
    router,
    name: "album"
};
