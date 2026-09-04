const { shuffleArray } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");
const path = require("path");

module.exports = async (req, res, proxy, respond) => {
    let { size } = req.query;

    size = Math.min(parseInt(size) || 10, 500);

    const total = (await api.getAll(req.user).getAllItems("albums", { start: 0, limit: 1, sortby: "created_date", reverse: 1 }))?.total ?? 50;
    const albums = await api.getAll(req.user).getAllItems("albums", { start: 0, limit: total, sortby: "created_date", reverse: 1 });

    // TODO: Simplify this, I don't like it.
    let output = [];
    for (const album of albums?.items || []) {
        const tracks = await api.album(req.user).getAlbumTracksAndInfo({ albumhash: album?.albumhash });

        output.push(...(tracks?.tracks || []).map(track => {
            const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined
            return {
                id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined,
                parent: track?.albumhash,
                title: track?.title,
                isDir: false,
                album: track?.album,
                artist: track?.artists?.[0]?.name,
                track: track?.track || 0,
                year: tracks?.info?.date ? new Date(tracks.info.date * 1000).getFullYear() : new Date().getFullYear(),
                coverArt: track?.image ? codecs.encode({ type: "album", id: track.image }) : undefined,
                suffix: extension || "mp3",
                contentType: `audio/${extension || "mpeg"}`,
                duration: track?.duration || 0,
                bitRate: track?.bitrate || 0,
                path: track?.filepath,
                isVideo: false,
                discNumber: track?.disc || 1,
                created: new Date().toISOString(),
                size: track?.size || 1048576,
                albumId: track?.albumhash,
                artistId: track?.artists?.[0]?.artisthash ? codecs.encode({ type: "artist", id: track.artists[0].artisthash }) : undefined,
                albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash ? codecs.encode({ type: "artist", id: a.artisthash }) : undefined })),
                type: "music"
            }
        }));
    }

    output = shuffleArray(output).slice(0, size);

    respond(res, req, {
        "subsonic-response": {
            randomSongs: { song: output },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
