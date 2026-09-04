const { createArray, shuffleArray, ext, clampedSize, encodeId, firstProperty } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async (req, res, proxy, respond) => {
    let { size } = req.query;

    size = clampedSize(size, 10, 500);

    const total = (await api.getAll(req.user).getAllItems("albums", { start: 0, limit: 1, sortby: "created_date", reverse: 1 }))?.total ?? 50;
    const albums = await api.getAll(req.user).getAllItems("albums", { start: 0, limit: total, sortby: "created_date", reverse: 1 });

    // TODO: Simplify this, I don't like it.
    let output = [];
    for (const album of albums?.items || []) {
        const tracks = await api.album(req.user).getAlbumTracksAndInfo({ albumhash: album?.albumhash });

        output.push(...(tracks?.tracks || []).map(track => {
            const extension = ext(track?.filepath);

            return {
                id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined,
                parent: track?.albumhash,
                title: track?.title,
                isDir: false,
                album: track?.album,
                artist: firstProperty(track?.artists, "name"),
                track: track?.track || 0,
                year: tracks?.info?.date ? new Date(tracks.info.date * 1000).getFullYear() : new Date().getFullYear(),
                coverArt: encodeId(track?.image, "album", codecs),
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
                artistId: encodeId(track?.artists?.[0]?.artisthash, "artist", codecs),
                albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: encodeId(a?.artisthash, "artist", codecs) })),
                type: "music"
            }
        }));
    }

    output = createArray(shuffleArray(output), size);

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
