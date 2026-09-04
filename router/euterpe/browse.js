const express = require("express");
const router = express.Router();

const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");
const zw = require("../../packages/zw");

// TODO: Cleanup this entire file. It's a mess.
router.get("/", async (req, res) => {
    const { by = "album", order = "asc" } = req.query;

    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const perPage = Math.min(Math.max(Number.parseInt(req.query["per-page"], 10) || 10, 1), 100);
    const orderBy = req.query["order-by"] || "name";

    if (!["album", "artist"].includes(by)) return res.sendStatus(400);
    if (!["asc", "desc"].includes(order) || !["id", "name"].includes(orderBy)) return res.sendStatus(400);

    const sortby = orderBy === "id" ? "created_date" : (by === "album" ? "title" : "name");
    const reverse = order === "desc" ? 1 : 0;
    const start = (page - 1) * perPage;

    let results = [];
    if (by === "album") {
        const albums = await api.getAll(req.user).getAllItems("albums", { start, limit: perPage, sortby, reverse });

        results = albums.items.map(album => ({
            album: album.title && album.albumhash ? zw.inject(album.title, codecs.encode({ album: album.albumhash })) : album.title,
            artist: album.albumartists?.[0]?.name || "",
            album_id: album.albumhash
        }));

        results.total = albums.total;
    } else if (by === "artist") {
        const artists = await api.getAll(req.user).getAllItems("artists", { start, limit: perPage, sortby, reverse });

        results = artists.items.map(artist => ({
            artist: artist.name && artist.artisthash ? zw.inject(artist.name, codecs.encode({ artist: artist.artisthash })) : artist.name,
            artist_id: artist.artisthash
        }));

        results.total = artists.total;
    }

    const max = Math.ceil((results.total || 0) / perPage);
    const link = (target) => `/v1/browse/?by=${by}&page=${target}&per-page=${perPage}&order-by=${orderBy}&order=${order}`;

    res.json({
        pages_count: max,
        next: page < max ? link(page + 1) : null,
        previous: page > 1 && page <= max ? link(page - 1) : null,
        data: results
    });
});

module.exports = {
    router,
    name: "browse"
};
