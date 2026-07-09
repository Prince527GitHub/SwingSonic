const path = require("path");

module.exports = async(req, res, proxy, respond) => {
    const favorites = await (await fetch(`${global.config.music}/favorites`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const artists = (favorites?.artists || []).map(artist => ({
        name: artist?.name,
        id: artist?.artisthash,
        starred: artist?.date ? new Date(artist.date * 1000).toISOString() : undefined
    }));

    const albums = (favorites?.albums || []).map(album => ({
        id: album?.albumhash,
        parent: album?.albumhash,
        title: album?.title,
        album: album?.title,
        isDir: "true",
        coverArt: album?.image ? Buffer.from(JSON.stringify({ type: "album", id: album.image })).toString("base64") : undefined,
        created: album?.date ? new Date(album.date * 1000).toISOString() : undefined,
        starred: album?.date ? new Date(album.date * 1000).toISOString() : undefined
    }));

    const tracks = (favorites?.tracks || []).map(track => {
        const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;
        return {
            id: track?.trackhash,
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
            starred: {
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
