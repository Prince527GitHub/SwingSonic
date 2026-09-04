const express = require("express");
const router = express.Router();

const api = require("../../packages/swingmusic");

router.get("/albumartists", async (req, res) => {
    const { StartIndex = "0", Limit = "50" } = req.query;

    const artists = await api.getAll(req.user).getAllItems("artists", { start: StartIndex, limit: Limit, sortby: "created_date", reverse: 1 });

    const items = (artists?.items || []).map(artist => ({
        Name: artist.name,
        Id: artist.artisthash,
        Type: "MusicArtist",
        UserData: {
            PlaybackPositionTicks: 0,
            PlayCount: 0,
            IsFavorite: false,
            Played: false
        },
        PrimaryImageAspectRatio: 1,
        LocationType: "FileSystem"
    }));

    res.json({
        Items: items,
        TotalRecordCount: artists?.total || 0,
        StartIndex: Number(StartIndex)
    });
});

module.exports = {
    router,
    name: "artists"
};
