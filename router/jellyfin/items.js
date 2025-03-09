const express = require("express");
const router = express.Router();

const proxy = require("../../packages/proxy");

const { username, password } = global.config.server.api.jellyfin.user;

function isBase64(str) {
    if (typeof str !== "string") return false;

    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) return false;

    if (str.length % 4 !== 0) return false;

    try {
        const decoded = Buffer.from(str, "base64").toString("utf8");
        return Buffer.from(decoded, "utf8").toString("base64") === str;
    } catch (e) {
        return false;
    }
}

function decodeId(id) {
    if (!isBase64(id)) return { id };

    try {
        const parsed = JSON.parse(Buffer.from(id, "base64").toString("utf-8"));
        console.log(parsed)
        return { id: parsed?.album ?? id };
    } catch {
        return { id };
    }
};

router.get("/:id/images/primary", async(req, res) => {
    const id = req.params.id;

    const decoded = decodeId(id);

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

    req.user = auth.headers.get("set-cookie");

    proxy(res, req, `${global.config.music}/img/thumbnail/medium/${decoded.id}.webp`);
});

router.use("/:id/file", getFile);
router.use("/:id/download", getFile);

async function getFile(req, res) {
    const id = req.params.id;

    const decoded = JSON.parse(Buffer.from(id, "base64").toString("utf-8"));

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

    req.user = auth.headers.get("set-cookie");

    proxy(res, req, `${global.config.music}/file/${decoded.id}/legacy?filepath=${decoded.path}&container=mp3&quality=original`);
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

router.get("/", (req, res) => res.json({ Items: [], TotalRecordCount: 0, StartIndex: 0 }));
router.get("/:id/similar", (req, res) => res.json({ Items: [], TotalRecordCount: 0, StartIndex: 0 }));

module.exports = {
    router: router,
    name: "items"
}