const express = require("express");
const router = express.Router();

const { sanitizeCookie } = require("../../packages/cookie");
const decode = require("../../packages/decode");
const proxy = require("../../packages/proxy");

const { username, password } = global.config.server.users[0];

router.get("/:id/images/primary", async(req, res) => {
    const id = req.params.id;

    const decoded = decode.decode(id);

    // const artist = await fetch(`${global.config.music}/artist/${id}/albums?limit=1&all=false`);

    const auth = await fetch(`${global.config.music}/auth/login`, {
        method: "POST",
        body: JSON.stringify({
            username,
            password
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (!auth.ok) return res.sendStatus(401);

    req.user = sanitizeCookie(auth.headers.get("set-cookie"));

    const image = decoded?.album ?? decoded?.id ?? id;

    proxy(res, req, `${global.config.music}/img/thumbnail/medium/${image}.webp`);
});

router.use("/:id/file", getFile);
router.use("/:id/download", getFile);

async function getFile(req, res) {
    const id = req.params.id;

    const decoded = decode.decode(id);
    if (!decoded?.id || !decoded?.path) return res.sendStatus(404);

    const auth = await fetch(`${global.config.music}/auth/login`, {
        method: "POST",
        body: JSON.stringify({
            username,
            password
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (!auth.ok) return res.sendStatus(401);

    req.user = sanitizeCookie(auth.headers.get("set-cookie"));

    proxy(res, req, `${global.config.music}/file/${decoded.id}/legacy?filepath=${encodeURIComponent(decoded.path)}&container=mp3&quality=original`);
}

router.get("/:id/thememedia", (req, res) => res.json({
    ThemeVideosResult: { items: [], totalRecordCount: 0, startIndex: 0 },
    ThemeSongsResult: { items: [], totalRecordCount: 0, startIndex: 0 },
    SoundtrackSongsResult: { items: [], totalRecordCount: 0, startIndex: 0 }
}));

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
            Size: 1024,
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

router.get("/", (req, res) => res.json({ Items: [], TotalRecordCount: 0, StartIndex: 0 }));
router.get("/:id/similar", (req, res) => res.json({ Items: [], TotalRecordCount: 0, StartIndex: 0 }));

module.exports = {
    router: router,
    name: "items"
}
