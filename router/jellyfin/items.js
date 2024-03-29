const express = require("express");
const router = express.Router();

const proxy = require("../../packages/proxy");
const { checkAuth } = require("./index");

router.get("/:id/images/primary", async(req, res) => {
    const id = req.params.id;

    const artist = await fetch(`${global.config.music}/artist/${id}/albums?limit=1&all=false`);

    const cover = `${global.config.music}/img/${artist.ok ? 'a': 't'}/${id}.webp`;

    if (global.config.server.proxy) proxy(res, cover);
    else res.redirect(cover);
});

router.use("/:id/file", checkAuth, getFile);
router.use("/:id/download", checkAuth, getFile);

async function getFile(req, res) {
    const id = req.params.id;

    const url = `${global.config.music}/file/${id}`;

    if (global.config.server.proxy) proxy(res, url);
    else res.redirect(url);
}

router.get("/:id/thememedia", checkAuth, (req, res) => res.json({
    ThemeVideosResult: { items: [], totalRecordCount: 0, startIndex: 0 },
    ThemeSongsResult: { items: [], totalRecordCount: 0, startIndex: 0 },
    SoundtrackSongsResult: { items: [], totalRecordCount: 0, startIndex: 0 }
}));

router.use("/:id/playbackinfo", checkAuth);

router.route("/:id/playbackinfo")
    .post(playBackInfo)
    .get(playBackInfo)

async function playBackInfo(req, res) {
    const { id } = req.params;

    res.json({
        MediaSources: [{
            Protocol: "File",
            Id: id,
            Path: `/items/${id}/download`,
            Type: "Default",
            Container: "mp3",
            Size: 0,
            Name: id,
            IsRemote: false,
            ETag: id,
            RunTimeTicks: 0,
            ReadAtNativeFramerate: false,
            IgnoreDts: false,
            IgnoreIndex: false,
            GenPtsInput: false,
            SupportsTranscoding: false,
            SupportsDirectStream: true,
            SupportsDirectPlay: true,
            IsInfiniteStream: false,
            RequiresOpening: false,
            RequiresClosing: false,
            RequiresLooping: false,
            SupportsProbing: true,
            MediaStreams: [{
                Codec: "mp3",
                TimeBase: "1/14112000",
                DisplayTitle: "MP3 - Stereo",
                IsInterlaced: false,
                ChannelLayout: "stereo",
                BitRate: 0,
                Channels: 0,
                SampleRate: 0,
                IsDefault: false,
                IsForced: false,
                Type: "Audio",
                Index: 0,
                IsExternal: false,
                IsTextSubtitleStream: false,
                SupportsExternalStream: false,
                Level: 0
            }],
            MediaAttachments: [],
            Formats: [],
            Bitrate: 0,
            RequiredHttpHeaders: {},
            DefaultAudioStreamIndex: 0
        }],
        PlaySessionId: "session"
    });
}

router.get("/", checkAuth, (req, res) => res.json({ Items: [], TotalRecordCount: 0, StartIndex: 0 }));
router.get("/:id/similar", checkAuth, (req, res) => res.json({ Items: [], TotalRecordCount: 0, StartIndex: 0 }));

module.exports = {
    router: router,
    name: "items"
}