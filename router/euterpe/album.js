const express = require("express");
const router = express.Router();

const proxy = require("../../packages/proxy");
const { mapTracks } = require("../../packages/track");

router.get("/:id/artwork", async(req, res) => {
    const size = req.query.size === "small" ? "small" : "medium";

    proxy(res, req, `${global.config.music}/img/thumbnail/${size}/${encodeURIComponent(req.params.id)}.webp`);
});

router.get("/:id", async(req, res) => {
    const album = await (await fetch(`${global.config.music}/album`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": req.user
        },
        body: JSON.stringify({ albumhash: req.params.id })
    })).json();

    if (album?.error || !album?.info) return res.sendStatus(404);

    const info = album.info || {};

    res.json({
        id: info.albumhash,
        title: info.title,
        artist: info.albumartists?.[0]?.name,
        artist_id: info.albumartists?.[0]?.artisthash,
        year: info.date ? new Date(info.date * 1000).getFullYear() : undefined,
        tracks: mapTracks(album.tracks)
    });
});

module.exports = {
    router: router,
    name: "album"
}
