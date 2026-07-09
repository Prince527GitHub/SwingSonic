module.exports = async(req, res, proxy, respond) => {
    const id = req.query.id;

    const getAlbums = await (await fetch(`${global.config.music}/artist/${id}/albums?limit=7&all=false`, {
        headers: {
            "Cookie": req.user
        }
    })).json();
    const artist = await (await fetch(`${global.config.music}/artist/${id}`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const albums = (getAlbums?.albums || []).map(album => ({
        id: album?.albumhash,
        name: album?.title,
        coverArt: album?.image ? Buffer.from(JSON.stringify({ type: "album", id: album.image })).toString("base64") : undefined,
        songCount: album?.trackcount || 0,
        created: album?.date ? new Date(album.date * 1000).toISOString() : undefined,
        duration: album?.duration || 0,
        artist: album?.albumartists?.[0]?.name,
        artistId: album?.albumartists?.[0]?.artisthash
    }));

    respond(res, req, {
        "subsonic-response": {
            artist: {
                id: id,
                name: artist?.artist?.name,
                coverArt: artist?.artist?.image ? Buffer.from(JSON.stringify({ type: "artist", id: artist.artist.image })).toString("base64") : undefined,
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
