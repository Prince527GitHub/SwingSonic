const zw = require("../../packages/zw");
const path = require("path");

module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let { f } = req.query;

    const album = await (await fetch(`${global.config.music}/album`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": req.user
        },
        body: JSON.stringify({ albumhash: id })
    })).json();

    const albumReleaseDate = new Date(album.info.date * 1000);

    const output = {
        album: {
            id: album.info.albumhash,
            name: album.info.title,
            version: album.info.versions[0],
            artist: album.info.albumartists[0].name,
            artistId: album.info.albumartists[0].artisthash,
            coverArt: Buffer.from(JSON.stringify({ type: "album", id: album.info.image })).toString("base64"),
            songCount: album.info.trackcount,
            duration: album.info.duration,
            playCount: album.info.playcount,
            created: new Date(album.info.created_date * 1000).toISOString(),
            year: albumReleaseDate.getFullYear(),
            genre: album.info.genres.map(genre => genre.name).join(", "),
            played: album.info.playcount > 0 ? new Date(album.info.lastplayed * 1000).toISOString() : undefined,
            genres: album.info.genres.map(genre => ({ name: genre.name })),
            artists: album.info.albumartists.map(artist => ({
                id: artist.artisthash,
                name: artist.name,
                coverArt: Buffer.from(JSON.stringify({ type: "artist", id: artist.image })).toString("base64"),
            })),
            displayArtist: album.info.albumartists[0].name,
            releaseTypes: [ album.info.type ],
            originalReleaseDate: {
                year: albumReleaseDate.getFullYear(),
                month: albumReleaseDate.getMonth() + 1,
                day: albumReleaseDate.getDate()
            },
            song: album.tracks.map(track => {
                const extension = path.extname(track.filepath).slice(1);

                const song = {
                    id: encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")),
                    parent: track.albumhash,
                    isDir: false,
                    title: global.config.server.api.subsonic.options.zw ? zw.inject(track.title, Buffer.from(JSON.stringify({ album: track.albumhash, id: track.trackhash })).toString("base64")) : track.title,
                    album: track.album,
                    artist: track.artists[0].name,
                    track: track.track,
                    year: albumReleaseDate.getFullYear(),
                    genre: track.extra.genre[0],
                    coverArt: Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64"),
                    size: track.extra.filesize,
                    suffix: extension,
                    duration: track.duration,
                    bitRate: track.bitrate,
                    bitDepth: track.extra.bitdepth,
                    samplingRate: track.extra.samplerate,
                    channelCount: track.extra.channels,
                    path: track.filepath,
                    isVideo: false,
                    discNumber: track.disc,
                    created: new Date(album.info.created_date * 1000).toISOString(),
                    albumId: track.albumhash,
                    artistId: track.extra.artist[0].artisthash,
                    type: "music",
                    genres: album.info.genres,
                    artists: track.extra.artist.map(artist => ({
                        name: artist,
                    })),
                    displayArtist: track.extra.artist[0],
                    explicitStatus: track.explicit ? "explicit" : "clean",
                };

                if (track.is_favorite) song.starred = new Date(album.info.created_date * 1000).toISOString();

                return song;
            }).sort((a, b) => a.track - b.track)
        }
    }

    if (album.info.is_favorite) output.album.starred = new Date(album.info.created_date * 1000).toISOString();

    const json = {
        "subsonic-response": {
            ...output,
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
