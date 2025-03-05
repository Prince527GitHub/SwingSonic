const express = require("express");
const router = express.Router();

const { sortByProperty } = require("../../packages/array");

router.get("/", async(req, res) => {
    const { by = "album", page = 1, order } = req.query;

    const perPage = req.query["per-page"];
    const orderBy = req.query["order-by"];

    const reverse = order === "asc" ? 1 : 0;
    const start = (page - 1) * perPage;

    let results = [];
    if (by === "album") {
        const albums = await (await fetch(`${global.config.music}/getall/albums?start=${start}&limit=${perPage}&sortby=title&reverse=${reverse}`, {
            headers: {
                "Cookie": req.user
            }
        })).json();

        results = albums.items.map(album => ({
            album: album.title,
            artist: album.albumartists[0].name,
            album_id: album.albumhash
        }));

        if (orderBy === "id") results = sortByProperty(results, "album_id");

        results.total = albums.total;
    } else if (by === "artist") {
        const artists = await (await fetch(`${global.config.music}/getall/artists?start=${start}&limit=${perPage}&sortby=name&reverse=${reverse}`, {
            headers: {
                "Cookie": req.user
            }
        })).json();

        results = artists.items.map(artist => ({
            artist: artist.name,
            artist_id: artist.artisthash
        }));

        if (orderBy === "id") results = sortByProperty(results, "artist_id");

        results.total = artists.total;
    }

    const max = Math.round(results.total / perPage) || 0;

    res.json({
        pages_count: max,
        next: max > page ? `/v1/browse/?page=${Number(page) + 1}&per-page=${perPage}` : null,
        previous: max > page ? `/v1/browse/?page=${Number(page) - 1}&per-page=${perPage}` : null,
        data: results
    });
});

module.exports = {
    router: router,
    name: "browse"
}