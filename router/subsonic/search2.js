const zw = require("../../packages/zw");

module.exports = async(req, res, proxy, respond) => {
    const args = { headers: { "Cookie": req.user } };

    const query = req.query.query
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/[-_]/g, " ");

    let { artistCount, artistOffset, albumCount, albumOffset, songCount, songOffset } = req.query;

    let artists = [];

    if (artistCount >= 1 && query) {
        const artistResults = await (await fetch(`${global.config.music}/search/?itemtype=artists&q=${encodeURIComponent(query)}&start=${artistOffset || 0}&limit=${artistCount || 20}`, args)).json();
        artists = (artistResults?.results || []).map(artist => ({
            id: artist?.artisthash,
            name: artist?.name,
            starred: undefined
        }));
    }

    let albums = [];

    if (albumCount >= 1 && query) {
        const albumResults = await (await fetch(`${global.config.music}/search/?itemtype=albums&q=${encodeURIComponent(query)}&start=${albumOffset || 0}&limit=${albumCount || 20}`, args)).json();
        albums = (albumResults?.results || []).map(album => ({
            id: album?.albumhash,
            parent: album?.albumhash,
            title: album?.title,
            artist: album?.albumartists?.[0]?.name,
            isDir: "true",
            coverArt: album?.image ? Buffer.from(JSON.stringify({ type: "album", id: album.image })).toString("base64") : undefined
        }));
    }

    let tracks = [];

    if (songCount >= 1 && query) {
        const trackResults = await (await fetch(`${global.config.music}/search/?itemtype=tracks&q=${encodeURIComponent(query)}&start=${songOffset || 0}&limit=${songCount || 20}`, args)).json();
        tracks = (trackResults?.results || []).map(track => {
            const id = track?.trackhash && track?.filepath
                ? encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64"))
                : undefined;

            return {
                id,
                parent: track?.albumhash,
                title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash
                    ? zw.inject(track.title, Buffer.from(JSON.stringify({ album: track.albumhash, id: track.trackhash })).toString("base64"))
                    : track?.title,
                isDir: false,
                album: track?.album,
                artist: track?.albumartists?.[0]?.name,
                track: 0,
                coverArt: track?.image ? Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64") : undefined,
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
