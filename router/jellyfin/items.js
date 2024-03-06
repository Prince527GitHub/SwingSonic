const express = require("express");
const router = express.Router();

const proxy = require("../../packages/proxy");

router.get("/:id/images/primary", async(req, res) => {
    let id = req.params.id;

    const artist = await fetch(`${global.config.music}/artist/${id}/albums?limit=1&all=false`);

    // const albumSize = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=1&sortby=created_date&reverse=1`)).json();
    // const albums = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=${albumSize.total}&sortby=created_date&reverse=1`)).json();

    // for (let index = 0; index < albums.items.length; index++) {
    //     const album = albums.items[index];

    //     const tracks = await (await fetch(`${global.config.music}/album`, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify({ albumhash: album.albumhash })
    //     })).json();

    //     if (tracks.tracks.find(track => track.trackhash === id)) {
    //         id = tracks.info.albumhash;
    //         break;
    //     }
    // }

    const cover = `${global.config.music}/img/${artist.ok ? 'a': 't'}/${id}.webp`;

    if (global.config.server.proxy) proxy(res, cover);
    else res.redirect(cover);
});

router.get("/:id/file", async(req, res) => {
    const id = req.params.id;

    const url = `${global.config.music}/file/${id}`;

    if (global.config.server.proxy) proxy(res, url);
    else res.redirect(url);
});

router.get("/:id/download", async(req, res) => {
    const id = req.params.id;

    const url = `${global.config.music}/file/${id}`;

    if (global.config.server.proxy) proxy(res, url);
    else res.redirect(url);
});

router.get("/:id/thememedia", (req, res) => res.json({
    "ThemeVideosResult": {
        "OwnerId": "00000000000000000000000000000000",
        "Items": [],
        "TotalRecordCount": 0,
        "StartIndex": 0
    },
    "ThemeSongsResult": {
        "OwnerId": "00000000000000000000000000000000",
        "Items": [],
        "TotalRecordCount": 0,
        "StartIndex": 0
    },
    "SoundtrackSongsResult": {
        "OwnerId": "00000000000000000000000000000000",
        "Items": [],
        "TotalRecordCount": 0,
        "StartIndex": 0
    }
}));

router.get("/:id/playbackinfo", (req, res) => {
    const { id } = req.params;

    res.json({
        "MediaSources": [{
            "Protocol": "File",
            "Id": id,
            "Path": `/items/${id}/download`,
            "Type": "Default",
            "Container": "mp3",
            "Size": 0,
            "Name": id,
            "IsRemote": false,
            "ETag": id,
            "RunTimeTicks": 0,
            "ReadAtNativeFramerate": false,
            "IgnoreDts": false,
            "IgnoreIndex": false,
            "GenPtsInput": false,
            "SupportsTranscoding": false,
            "SupportsDirectStream": true,
            "SupportsDirectPlay": true,
            "IsInfiniteStream": false,
            "RequiresOpening": false,
            "RequiresClosing": false,
            "RequiresLooping": false,
            "SupportsProbing": true,
            "MediaStreams": [{
                "Codec": "mp3",
                "TimeBase": "1/14112000",
                "DisplayTitle": "MP3 - Stereo",
                "IsInterlaced": false,
                "ChannelLayout": "stereo",
                "BitRate": 0,
                "Channels": 0,
                "SampleRate": 0,
                "IsDefault": false,
                "IsForced": false,
                "Type": "Audio",
                "Index": 0,
                "IsExternal": false,
                "IsTextSubtitleStream": false,
                "SupportsExternalStream": false,
                "Level": 0
            }],
            "MediaAttachments": [],
            "Formats": [],
            "Bitrate": 0,
            "RequiredHttpHeaders": {},
            "DefaultAudioStreamIndex": 0
        }],
        "PlaySessionId": "9f584e0d261a4c9fb2da3528565869ca"
    });
});

router.get("/", async(req, res) => {
    res.json({
        "Items": [],
        "TotalRecordCount": 0,
        "StartIndex": 0
    });
});

router.get("/:id/similar", async(req, res) => {
    res.json({
        "Items": [],
        "TotalRecordCount": 0,
        "StartIndex": 0
    });
});

module.exports = {
    router: router,
    name: "items"
}