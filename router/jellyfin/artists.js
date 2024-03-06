const express = require("express");
const router = express.Router();

router.get("/albumartists", async(req, res) => {
    let { StartIndex, Limit } = req.query;

    const artists = await (await fetch(`${global.config.music}/getall/artists?start=${StartIndex || '0'}&limit=${Limit || '50'}&sortby=created_date&reverse=1`)).json();

    const output = artists.items.map(artist => ({
        "Name": artist.name,
        "ServerId": "server",
        "Id": artist.artisthash,
        "SortName": artist.name,
        "ChannelId": null,
        "RunTimeTicks": 0,
        "Type": "MusicArtist",
        "UserData": {
            "PlaybackPositionTicks": 0,
            "PlayCount": 0,
            "IsFavorite": false,
            "Played": false
        },
        "PrimaryImageAspectRatio": 1,
        "LocationType": "FileSystem"
    }));

    res.json({
        "Items": output,
        "TotalRecordCount": artists.total,
        "StartIndex": 0
    });
});

module.exports = {
    router: router,
    name: "artists"
}