module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let { f } = req.query;

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

    const albums = getAlbums.appearances.map(album => ({
        id: album.albumhash,
        name: album.title,
        coverArt: album.image,
        songCount: 0,
        created: new Date(album.date * 1000).toISOString(),
        duration: 0,
        artist: album.albumartists[0].name,
        artistId: album.albumartists[0].artisthash
    }));

    const json = {
        "subsonic-response": {
            artist: {
                id: id,
                name: artist.artist.name,
                coverArt: artist.artist.image,
                songCount: artist.artist.trackcount,
                created: new Date().toISOString(),
                duration: artist.artist.duration,
                artist: artist.artist.name,
                artistId: id,
                album: albums
            },
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}