const express = require("express");
const router = express.Router();

const proxy = require("../../packages/proxy");

router.get("/:id/image", async(req, res) => {
    const size = req.query.size === "small" ? "small" : "medium";

    proxy(res, req, `${global.config.music}/img/artist/${size}/${encodeURIComponent(req.params.id)}.webp`);
});

router.get("/:id", async(req, res) => {
    const artist = await (await fetch(`${global.config.music}/artist/${req.params.id}`, { headers: { "Cookie": req.user } })).json();
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
    router: router,
    name: "artist"
}
