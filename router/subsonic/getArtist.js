const codecs = require("../../packages/codecs");

module.exports = async(req, res, proxy, respond) => {
    const id = req.query.id;

    const decoded = codecs.decode(id);
    const effectiveId = decoded?.id || id;

    const getAlbums = await (await fetch(`${global.config.music}/artist/${effectiveId}/albums?limit=7&all=false`, { headers: { "Cookie": req.user } })).json();
    const artist = await (await fetch(`${global.config.music}/artist/${effectiveId}`, { headers: { "Cookie": req.user } })).json();

    const encodedArtistId = artist?.artist?.artisthash ? codecs.encode({ type: "artist", id: artist.artist.artisthash }) : id;

    const albums = (getAlbums?.albums || []).map(album => ({
        id: album?.albumhash,
        name: album?.title,
        coverArt: album?.image ? codecs.encode({ type: "album", id: album.image }) : undefined,
        songCount: album?.trackcount || 0,
        created: album?.date ? new Date(album.date * 1000).toISOString() : undefined,
        duration: album?.duration || 0,
        artist: album?.albumartists?.[0]?.name,
        artistId: album?.albumartists?.[0]?.artisthash ? codecs.encode({ type: "artist", id: album.albumartists[0].artisthash }) : undefined
    }));

    respond(res, req, {
        "subsonic-response": {
            artist: {
                id: encodedArtistId,
                name: artist?.artist?.name,
                coverArt: artist?.artist?.image ? codecs.encode({ type: "artist", id: artist.artist.image }) : undefined,
                albumCount: artist?.artist?.albumcount || 0,
                songCount: artist?.artist?.trackcount || 0,
                created: new Date().toISOString(),
                duration: artist?.artist?.duration || 0,
                album: albums
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
}
