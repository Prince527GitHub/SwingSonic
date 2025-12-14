const { get, safe } = require("../../packages/safe");
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

    const albumReleaseDate = get(album, "info.date") ? new Date(get(album, "info.date") * 1000) : new Date();

    const output = {
        album: {
            id: get(album, "info.albumhash"),
            name: get(album, "info.title"),
            version: get(album, "info.versions[0]"),
            artist: get(album, "info.albumartists[0].name"),
            artistId: get(album, "info.albumartists[0].artisthash"),
            coverArt: get(album, "info.image") ? Buffer.from(JSON.stringify({ type: "album", id: get(album, "info.image") })).toString("base64") : undefined,
            songCount: get(album, "info.trackcount"),
            duration: get(album, "info.duration"),
            playCount: get(album, "info.playcount"),
            created: get(album, "info.created_date") ? new Date(get(album, "info.created_date") * 1000).toISOString() : undefined,
            year: albumReleaseDate.getFullYear(),
            genre: safe(() => get(album, "info.genres", []).map(genre => genre?.name).join(", ")),
            played: get(album, "info.playcount") > 0 && get(album, "info.lastplayed") ? new Date(get(album, "info.lastplayed") * 1000).toISOString() : undefined,
            genres: safe(() => get(album, "info.genres", []).map(genre => ({ name: genre?.name })), []),
            artists: safe(() => get(album, "info.albumartists", []).map(artist => ({
                id: artist?.artisthash,
                name: artist?.name,
                coverArt: artist?.image ? Buffer.from(JSON.stringify({ type: "artist", id: artist.image })).toString("base64") : undefined,
            })), []),
            displayArtist: get(album, "info.albumartists[0].name"),
            releaseTypes: get(album, "info.type") ? [ get(album, "info.type") ] : [],
            originalReleaseDate: {
                year: albumReleaseDate.getFullYear(),
                month: albumReleaseDate.getMonth() + 1,
                day: albumReleaseDate.getDate()
            },
            song: safe(() => get(album, "tracks", []).map(track => {
                const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;

                const song = {
                    id: track?.trackhash && track?.filepath ? encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")) : undefined,
                    parent: track?.albumhash,
                    isDir: false,
                    title: get(global, "config.server.api.subsonic.options.zw") && track?.title && track?.albumhash && track?.trackhash 
                        ? zw.inject(track.title, Buffer.from(JSON.stringify({ album: track.albumhash, id: track.trackhash })).toString("base64")) 
                        : track?.title,
                    album: track?.album,
                    artist: get(track, "artists[0].name"),
                    track: track?.track,
                    year: albumReleaseDate.getFullYear(),
                    genre: get(track, "extra.genre[0]"),
                    coverArt: track?.image ? Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64") : undefined,
                    size: get(track, "extra.filesize"),
                    suffix: extension,
                    duration: track?.duration,
                    bitRate: track?.bitrate,
                    bitDepth: get(track, "extra.bitdepth"),
                    samplingRate: get(track, "extra.samplerate"),
                    channelCount: get(track, "extra.channels"),
                    path: track?.filepath,
                    isVideo: false,
                    discNumber: track?.disc,
                    created: get(album, "info.created_date") ? new Date(get(album, "info.created_date") * 1000).toISOString() : undefined,
                    albumId: track?.albumhash,
                    artistId: get(track, "extra.artist[0].artisthash"),
                    type: "music",
                    genres: get(album, "info.genres", []),
                    artists: safe(() => get(track, "extra.artist", []).map(artist => ({ name: artist })), []),
                    displayArtist: get(track, "extra.artist[0]"),
                    explicitStatus: track?.explicit ? "explicit" : "clean",
                };

                if (track?.is_favorite && get(album, "info.created_date")) {
                    song.starred = new Date(get(album, "info.created_date") * 1000).toISOString();
                }

                return song;
            }).sort((a, b) => (a?.track ?? 0) - (b?.track ?? 0)), [])
        }
    }

    if (get(album, "info.is_favorite") && get(album, "info.created_date")) {
        output.album.starred = new Date(get(album, "info.created_date") * 1000).toISOString();
    }

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
