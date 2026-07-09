const zw = require("../../packages/zw");
const path = require("path");

module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let f = [].concat(req.query.f).filter(Boolean)[0];

    const album = await (await fetch(`${global.config.music}/album`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": req.user
        },
        body: JSON.stringify({ albumhash: id })
    })).json();

    const info = album.info || {};
    const tracks = album.tracks || [];
    const albumReleaseDate = info.date ? new Date(info.date * 1000) : new Date();

    const output = {
        album: {
            id: info.albumhash,
            name: info.title,
            version: info.versions?.[0],
            artist: info.albumartists?.[0]?.name,
            artistId: info.albumartists?.[0]?.artisthash,
            coverArt: info.image ? Buffer.from(JSON.stringify({ type: "album", id: info.image })).toString("base64") : undefined,
            songCount: info.trackcount || 0,
            duration: info.duration || 0,
            playCount: info.playcount || 0,
            created: info.created_date ? new Date(info.created_date * 1000).toISOString() : new Date().toISOString(),
            year: albumReleaseDate.getFullYear(),
            genre: (info.genres || []).map(g => g?.name).join(", "),
            played: info.playcount > 0 && info.lastplayed ? new Date(info.lastplayed * 1000).toISOString() : undefined,
            genres: (info.genres || []).map(g => ({ name: g?.name })),
            artists: (info.albumartists || []).map(artist => ({
                id: artist?.artisthash,
                name: artist?.name,
                coverArt: artist?.image ? Buffer.from(JSON.stringify({ type: "artist", id: artist.image })).toString("base64") : undefined,
            })),
            displayArtist: info.albumartists?.[0]?.name,
            releaseTypes: info.type ? [info.type] : [],
            originalReleaseDate: {
                year: albumReleaseDate.getFullYear(),
                month: albumReleaseDate.getMonth() + 1,
                day: albumReleaseDate.getDate()
            },
            song: tracks.map(track => {
                const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;

                const song = {
                    id: track?.trackhash && track?.filepath ? encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")) : undefined,
                    parent: track?.albumhash,
                    isDir: false,
                    title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash
                        ? zw.inject(track.title, Buffer.from(JSON.stringify({ album: track.albumhash, id: track.trackhash })).toString("base64"))
                        : track?.title,
                    album: track?.album,
                    artist: track?.artists?.[0]?.name,
                    track: track?.track || 0,
                    year: albumReleaseDate.getFullYear(),
                    coverArt: track?.image ? Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64") : undefined,
                    suffix: extension || "mp3",
                    contentType: `audio/${extension || "mpeg"}`,
                    duration: track?.duration || 0,
                    bitRate: track?.bitrate || 0,
                    path: track?.filepath,
                    isVideo: false,
                    discNumber: track?.disc || 1,
                    created: info.created_date ? new Date(info.created_date * 1000).toISOString() : new Date().toISOString(),
                    size: track?.size || 1048576,
                    albumId: track?.albumhash,
                    artistId: track?.artists?.[0]?.artisthash,
                    type: "music",
                    artists: (track?.artists || []).map(a => ({ name: a?.name })),
                    displayArtist: track?.artists?.[0]?.name,
                    explicitStatus: track?.explicit ? "explicit" : "clean",
                };

                if (track?.is_favorite) {
                    song.starred = new Date().toISOString();
                }

                return song;
            }).sort((a, b) => (a?.track ?? 0) - (b?.track ?? 0))
        }
    }

    if (info.is_favorite) {
        output.album.starred = new Date().toISOString();
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
