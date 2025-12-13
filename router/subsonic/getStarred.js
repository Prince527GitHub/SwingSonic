module.exports = async(req, res, proxy, xml) => {
    let { f } = req.query;

    const favorites = await (await fetch(`${global.config.music}/favorites`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    const artists = favorites.artists.map(artist => ({
        name: artist.name,
        id: artist.artisthash,
        starred: new Date(artist.date * 1000).toISOString()
    }));

    const albums = favorites.albums.map(album => ({
        id: album.albumhash,
        parent: album.albumhash,
        title: album.title,
        album: album.title,
        isDir: "true",
        coverArt: Buffer.from(JSON.stringify({ type: "album", id: album.image })).toString("base64"),
        created: new Date(album.date * 1000).toISOString(),
        starred: new Date(album.date * 1000).toISOString()
    }));

    const tracks = favorites.tracks.map(track => ({
        id: track.trackhash,
        parent: track.albumhash,
        isDir: false,
        title: track.title,
        album: track.album,
        artist: track.artists[0].name,
        track: track.track,
        genre: track.extra.genre[0],
        coverArt: Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64"),
        size: track.extra.filesize,
        duration: track.duration,
        bitRate: track.bitrate,
        bitDepth: track.extra.bitdepth,
        samplingRate: track.extra.samplerate,
        channelCount: track.extra.channels,
        path: track.filepath,
        isVideo: false,
        discNumber: track.disc,
        albumId: track.albumhash,
        artistId: track.extra.artist[0].artisthash,
        type: "music",
        artists: track.extra.artist.map(artist => ({
            name: artist,
        })),
        displayArtist: track.extra.artist[0],
        explicitStatus: track.explicit ? "explicit" : "clean",
        starred: new Date(0).toISOString(),
    }));

    const json = {
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
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}
