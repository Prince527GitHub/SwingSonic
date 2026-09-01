const path = require("path");

module.exports = async(req, res, proxy, respond) => {
    const favorites = await (await fetch(`${global.config.music}/favorites`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const artists = (favorites?.artists || []).map(artist => ({
        id: artist?.artisthash,
        name: artist?.name,
        coverArt: artist?.image ? Buffer.from(JSON.stringify({ type: "artist", id: artist.image })).toString("base64") : undefined,
        albumCount: artist?.albumcount || 0,
        starred: artist?.date ? new Date(artist.date * 1000).toISOString() : undefined
    }));

    const albums = (favorites?.albums || []).map(album => ({
        id: album?.albumhash,
        name: album?.title,
        artist: album?.albumartists?.[0]?.name,
        artistId: album?.albumartists?.[0]?.artisthash,
        coverArt: album?.image ? Buffer.from(JSON.stringify({ type: "album", id: album.image })).toString("base64") : undefined,
        songCount: album?.trackcount || 0,
        duration: album?.duration || 0,
        created: album?.date ? new Date(album.date * 1000).toISOString() : undefined,
        starred: album?.date ? new Date(album.date * 1000).toISOString() : undefined
    }));

    const tracks = (favorites?.tracks || []).map(track => {
        const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;
        return {
            id: track?.trackhash && track?.filepath ? encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")) : track?.trackhash,
            parent: track?.albumhash,
            isDir: false,
            title: track?.title,
            album: track?.album,
            artist: track?.artists?.[0]?.name,
            track: track?.track || 0,
            year: new Date().getFullYear(),
            coverArt: track?.image ? Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64") : undefined,
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
            artistId: track?.artists?.[0]?.artisthash,
            type: "music",
            artists: (track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash })),
            albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash })),
            displayArtist: track?.artists?.[0]?.name,
            explicitStatus: track?.explicit ? "explicit" : "clean",
            starred: new Date(0).toISOString(),
        };
    });

    respond(res, req, {
        "subsonic-response": {
            starred2: {
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
