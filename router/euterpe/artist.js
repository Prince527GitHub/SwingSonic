const express = require("express");
const router = express.Router();

const api = require("../../packages/swingmusic");
const proxy = require("../../packages/proxy");

router.get("/:id/image", async (req, res) => {
    const size = req.query.size === "small" ? "small" : "medium";

    proxy(res, req, api.url(`/img/artist/${size}/${encodeURIComponent(req.params.id)}.webp`));
});

router.get("/:id", async (req, res) => {
    const artist = await api.artist(req.user).getArtist(req.params.id);
    if (!artist?.artist) return res.sendStatus(404);

    const info = artist.artist;

    res.json({
        id: info.artisthash,
        name: info.name,
        album_count: info.albumcount || 0,
        track_count: info.trackcount || 0,
    });
});

module.exports = {
    router,
    name: "artist"
};
