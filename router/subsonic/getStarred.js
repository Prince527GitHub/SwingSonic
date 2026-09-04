const codecs = require("../../packages/codecs");
const path = require("path");

module.exports = async(req, res, proxy, respond) => {
    const favorites = await (await fetch(`${global.config.music}/favorites`, { headers: { "Cookie": req.user } })).json();

    const artists = (favorites?.artists || []).map(artist => ({
        id: artist?.artisthash ? codecs.encode({ type: "artist", id: artist.artisthash }) : undefined,
        name: artist?.name,
        coverArt: artist?.image ? codecs.encode({ type: "artist", id: artist.image }) : undefined,
        albumCount: artist?.albumcount || 0,
        starred: artist?.date ? new Date(artist.date * 1000).toISOString() : undefined
    }));

    const albums = (favorites?.albums || []).map(album => ({
        id: album?.albumhash,
        parent: album?.albumhash,
        title: album?.title,
        name: album?.title,
        album: album?.title,
        artist: album?.albumartists?.[0]?.name,
        artistId: album?.albumartists?.[0]?.artisthash ? codecs.encode({ type: "artist", id: album.albumartists[0].artisthash }) : undefined,
        isDir: "true",
        coverArt: album?.image ? codecs.encode({ type: "album", id: album.image }) : undefined,
        songCount: album?.trackcount || 0,
        duration: album?.duration || 0,
        created: album?.date ? new Date(album.date * 1000).toISOString() : undefined,
        starred: album?.date ? new Date(album.date * 1000).toISOString() : undefined
    }));

    const tracks = (favorites?.tracks || []).map(track => {
        const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;

        return {
            id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : track?.trackhash,
            parent: track?.albumhash,
            isDir: false,
            title: track?.title,
            album: track?.album,
            artist: track?.artists?.[0]?.name,
            track: track?.track || 0,
            year: new Date().getFullYear(),
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
            type: "music",
            artists: (track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash ? codecs.encode({ type: "artist", id: a.artisthash }) : undefined })),
            albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash ? codecs.encode({ type: "artist", id: a.artisthash }) : undefined })),
            displayArtist: track?.artists?.[0]?.name,
            explicitStatus: track?.explicit ? "explicit" : "clean",
            starred: new Date(0).toISOString(),
        };
    });

    const key = (req.path || req.url || "").includes("getStarred2") ? "starred2" : "starred";

    respond(res, req, {
        "subsonic-response": {
            [key]: {
                artist: artists,
                album: albums,
                song: tracks
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
}
