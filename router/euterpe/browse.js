const express = require("express");
const router = express.Router();

const { clampedSize, parseIntOr, firstProperty } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");
const zw = require("../../packages/zw");

router.get("/", async (req, res) => {
    const { by = "album", order = "asc" } = req.query;

    const page = Math.max(parseIntOr(req.query.page, 1), 1);
    const perPage = clampedSize(req.query["per-page"], 10, 100);
    const orderBy = req.query["order-by"] || "name";

    if (!["album", "artist"].includes(by)) return res.sendStatus(400);
    if (!["asc", "desc"].includes(order) || !["id", "name"].includes(orderBy)) return res.sendStatus(400);

    const sortby = orderBy === "id" ? "created_date" : (by === "album" ? "title" : "name");
    const reverse = order === "desc" ? 1 : 0;
    const start = (page - 1) * perPage;

    const category = {
        album: {
            type: "albums",
            map: album => ({
                album: album.title && album.albumhash ? zw.inject(album.title, codecs.encode({ album: album.albumhash })) : album.title,
                artist: firstProperty(album.albumartists, "name") || "",
                album_id: album.albumhash
            })
        },
        artist: {
            type: "artists",
            map: artist => ({
                artist: artist.name && artist.artisthash ? zw.inject(artist.name, codecs.encode({ artist: artist.artisthash })) : artist.name,
                artist_id: artist.artisthash
            })
        }
    }[by];

    const page_data = await api.getAll(req.user).getAllItems(category.type, { start, limit: perPage, sortby, reverse });

    const data = (page_data.items || []).map(category.map);
    const total = page_data.total || 0;

    const pages_count = Math.ceil(total / perPage);
    const link = target => `/v1/browse/?by=${by}&page=${target}&per-page=${perPage}&order-by=${orderBy}&order=${order}`;

    res.json({
        pages_count,
        next: page < pages_count ? link(page + 1) : null,
        previous: page > 1 && page <= pages_count ? link(page - 1) : null,
        data
    });
});


module.exports = {
    router,
    name: "browse"
};
