const zw = require("../../packages/zw");
const path = require("path");

module.exports = async(req, res, proxy, respond) => {
    const args = { headers: { "Cookie": req.user } };

    const query = (req.query.query || "")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/[-_]/g, " ");

    let { artistCount, artistOffset, albumCount, albumOffset, songCount, songOffset } = req.query;

    let artists = [];

    if (artistCount >= 1 && query) {
        const artistResults = await (await fetch(`${global.config.music}/search/?itemtype=artists&q=${encodeURIComponent(query)}&start=${artistOffset || 0}&limit=${artistCount || 20}`, args)).json();
        artists = (artistResults?.results || []).map(artist => ({
            id: artist?.artisthash,
            name: artist?.name,
            coverArt: artist?.image ? Buffer.from(JSON.stringify({ type: "artist", id: artist.image })).toString("base64") : undefined,
            albumCount: artist?.albumcount || 0,
            starred: undefined
        }));
    }

    let albums = [];

    if (albumCount >= 1 && query) {
        const albumResults = await (await fetch(`${global.config.music}/search/?itemtype=albums&q=${encodeURIComponent(query)}&start=${albumOffset || 0}&limit=${albumCount || 20}`, args)).json();
        albums = (albumResults?.results || []).map(album => ({
            id: album?.albumhash,
            name: album?.title,
            coverArt: album?.image ? Buffer.from(JSON.stringify({ type: "album", id: album.image })).toString("base64") : undefined,
            songCount: album?.trackcount || 0,
            created: album?.date ? new Date(album.date * 1000).toISOString() : undefined,
            duration: album?.duration || 0,
            artist: album?.albumartists?.[0]?.name,
            artistId: album?.albumartists?.[0]?.artisthash
        }));
    }

    let tracks = [];

    if (songCount >= 1 && query) {
        const trackResults = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${encodeURIComponent(query)}&start=${songOffset || 0}&limit=${songCount || 20}`, args)).json();
        tracks = (trackResults?.results || []).map(track => {
            const id = track?.trackhash && track?.filepath
                ? encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64"))
                : undefined;

            const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;

            return {
                id,
                parent: track?.albumhash,
                title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash
                    ? zw.inject(track.title, Buffer.from(JSON.stringify({ album: track.albumhash, id: track.trackhash })).toString("base64"))
                    : track?.title,
                album: track?.album,
                artist: track?.albumartists?.[0]?.name,
                isDir: false,
                coverArt: track?.image ? Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64") : undefined,
                created: new Date().toISOString(),
                duration: track?.duration || 0,
                bitRate: track?.bitrate || 0,
                track: track?.track || 0,
                year: track?.year || new Date().getFullYear(),
                suffix: extension || "mp3",
                contentType: `audio/${extension || "mpeg"}`,
                isVideo: false,
                discNumber: track?.disc || 1,
                size: track?.size || 1048576,
                path: track?.filepath,
                albumId: track?.albumhash,
                artistId: track?.albumartists?.[0]?.artisthash,
                albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash })),
                type: "music"
            };
        });
    }

    respond(res, req, {
        "subsonic-response": {
            searchResult3: {
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
