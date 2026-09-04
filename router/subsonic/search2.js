const codecs = require("../../packages/codecs");
const zw = require("../../packages/zw");
const path = require("path");

module.exports = async(req, res, proxy, respond) => {
    const args = { headers: { "Cookie": req.user } };

    const query = (req.query.query || "").replace(/[-_]/g, " ");

    let { artistCount, artistOffset, albumCount, albumOffset, songCount, songOffset } = req.query;

    artistCount = parseInt(artistCount) || 20;
    albumCount = parseInt(albumCount) || 20;
    songCount = parseInt(songCount) || 20;
    artistOffset = parseInt(artistOffset) || 0;
    albumOffset = parseInt(albumOffset) || 0;
    songOffset = parseInt(songOffset) || 0;

    let artists = [];

    if (artistCount >= 1 && query) {
        const response = await (await fetch(`${global.config.music}/search/?itemtype=artists&q=${encodeURIComponent(query)}&start=${artistOffset}&limit=${artistCount}`, args)).json();

        artists = (response?.results || []).map(artist => ({
            id: artist?.artisthash ? codecs.encode({ type: "artist", id: artist.artisthash }) : undefined,
            name: artist?.name,
            coverArt: artist?.image ? codecs.encode({ type: "artist", id: artist.image }) : undefined,
            albumCount: artist?.albumcount || 0,
            starred: undefined
        }));
    }

    let albums = [];

    if (albumCount >= 1 && query) {
        const response = await (await fetch(`${global.config.music}/search/?itemtype=albums&q=${encodeURIComponent(query)}&start=${albumOffset}&limit=${albumCount}`, args)).json();

        albums = (response?.results || []).map(album => ({
            id: album?.albumhash,
            name: album?.title,
            coverArt: album?.image ? codecs.encode({ type: "album", id: album.image }) : undefined,
            songCount: album?.trackcount || 0,
            created: album?.date ? new Date(album.date * 1000).toISOString() : undefined,
            duration: album?.duration || 0,
            artist: album?.albumartists?.[0]?.name,
            artistId: album?.albumartists?.[0]?.artisthash ? codecs.encode({ type: "artist", id: album.albumartists[0].artisthash }) : undefined
        }));
    }

    let tracks = [];

    if (songCount >= 1 && query) {
        const response = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${encodeURIComponent(query)}&start=${songOffset}&limit=${songCount}`, args)).json();

        tracks = (response?.results || []).map(track => {
            const id = track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined;

            const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;

            return {
                id,
                parent: track?.albumhash,
                title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash ? zw.inject(track.title, codecs.encode({ album: track.albumhash, id: track.trackhash })) : track?.title,
                album: track?.album,
                artist: track?.albumartists?.[0]?.name,
                isDir: false,
                coverArt: track?.image ? codecs.encode({ type: "album", id: track.image }) : undefined,
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
                artistId: track?.albumartists?.[0]?.artisthash ? codecs.encode({ type: "artist", id: track.albumartists[0].artisthash }) : undefined,
                albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash ? codecs.encode({ type: "artist", id: a.artisthash }) : undefined })),
                type: "music"
            };
        });
    }

    const key = (req.path || req.url || "").includes("search3") ? "searchResult3" : "searchResult2";

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
