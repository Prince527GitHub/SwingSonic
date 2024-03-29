const express = require("express");
const router = express.Router();

router.get("/albumartists", async(req, res) => {
    const { StartIndex = "0", Limit = "50" } = req.query;

    const artists = await (await fetch(`${global.config.music}/getall/artists?start=${StartIndex}&limit=${Limit}&sortby=created_date&reverse=1`)).json();

    const items = artists.items.map(artist => ({
        Name: artist.name,
        Id: artist.artisthash,
        Type: "MusicArtist",
        UserData: { PlaybackPositionTicks: 0, PlayCount: 0, IsFavorite: false, Played: false },
        PrimaryImageAspectRatio: 1,
        LocationType: "FileSystem"
    }));

    res.json({
        Items: items,
        TotalRecordCount: artists.total,
        StartIndex: Number(StartIndex)
    });
});

module.exports = {
    router: router,
    name: "artists"
}