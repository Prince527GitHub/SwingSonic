const codecs = require("../../packages/codecs");
const zw = require("../../packages/zw");

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
            starred: undefined
        }));
    }

    let albums = [];

    if (albumCount >= 1 && query) {
        const response = await (await fetch(`${global.config.music}/search/?itemtype=albums&q=${encodeURIComponent(query)}&start=${albumOffset}&limit=${albumCount}`, args)).json();

        albums = (response?.results || []).map(album => ({
            id: album?.albumhash,
            parent: album?.albumhash,
            title: album?.title,
            artist: album?.albumartists?.[0]?.name,
            isDir: "true",
            coverArt: album?.image ? codecs.encode({ type: "album", id: album.image }) : undefined
        }));
    }

    let tracks = [];

    if (songCount >= 1 && query) {
        const response = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${encodeURIComponent(query)}&start=${songOffset}&limit=${songCount}`, args)).json();

        tracks = (response?.results || []).map(track => {
            const id = track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined;

            return {
                id,
                parent: track?.albumhash,
                title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash ? zw.inject(track.title, codecs.encode({ album: track.albumhash, id: track.trackhash })) : track?.title,
                isDir: false,
                album: track?.album,
                artist: track?.albumartists?.[0]?.name,
                track: 0,
                coverArt: track?.image ? codecs.encode({ type: "album", id: track.image }) : undefined,
                isVideo: false
            };
        });
    }

    respond(res, req, {
        "subsonic-response": {
            searchResult2: {
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
