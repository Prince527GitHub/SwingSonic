const { sortByProperty, toISOString, encodeId, firstProperty, audioFormat } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");
const zw = require("../../packages/zw");

module.exports = async (req, res, proxy, respond) => {
    const id = req.query.id;
    if (!id) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: { code: 10, message: "Required parameter 'id' is missing" }
        }
    });

    const decoded = codecs.decode(id);

    const album = await api.album(req.user).getAlbumTracksAndInfo({ albumhash: decoded?.album || decoded?.id || id });
    if (album?.error || !album?.info) return respond(res, req, {
        "subsonic-response": {
            status: "failed",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            error: { code: 70, message: "Album not found" }
        }
    });

    const info = album.info || {};
    const tracks = album.tracks || [];
    // TODO: Cleanup this, I don't like it. This is a mess.
    const albumReleaseDate = info.date ? new Date(info.date * 1000) : new Date();

    // TODO: Cleanup this, I don't like it. This is a mess.
    const output = {
        album: {
            id: info.albumhash,
            name: info.title,
            title: info.title,
            album: info.title,
            parent: firstProperty(info.albumartists, "artisthash") || info.albumhash,
            isDir: true,
            isVideo: false,
            version: info.versions?.[0],
            artist: firstProperty(info.albumartists, "name"),
            artistId: encodeId(info.albumartists?.[0]?.artisthash, "artist", codecs),
            coverArt: encodeId(info.image, "album", codecs) || encodeId(info.albumhash, "album", codecs),
            songCount: info.trackcount || 0,
            duration: info.duration || 0,
            playCount: info.playcount || 0,
            created: toISOString(info.created_date) || toISOString(Date.now() / 1000),
            year: albumReleaseDate.getFullYear(),
            genre: (info.genres || []).map(g => g?.name).join(", "),
            played: info.playcount > 0 && info.lastplayed ? toISOString(info.lastplayed) : undefined,
            genres: (info.genres || []).map(g => ({ name: g?.name })),
            artists: (info.albumartists || []).map(artist => ({
                id: encodeId(artist?.artisthash, "artist", codecs),
                name: artist?.name,
                coverArt: encodeId(artist?.image, "artist", codecs),
            })),
            displayArtist: firstProperty(info.albumartists, "name"),
            releaseTypes: info.type ? [info.type] : [],
            originalReleaseDate: {
                year: albumReleaseDate.getFullYear(),
                month: albumReleaseDate.getMonth() + 1,
                day: albumReleaseDate.getDate()
            },
            song: sortByProperty(
                tracks.map(track => {
                    const song = {
                        id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined,
                        parent: track?.albumhash,
                        isDir: false,
                        title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash ? zw.inject(track.title, codecs.encode({ album: track.albumhash, id: track.trackhash })) : track?.title,
                        album: track?.album,
                        artist: firstProperty(track?.artists, "name"),
                        track: track?.track || 0,
                        year: albumReleaseDate.getFullYear(),
                        coverArt: encodeId(track?.image, "album", codecs),
                        ...audioFormat(track?.filepath),
                        duration: track?.duration || 0,
                        bitRate: track?.bitrate || 0,
                        path: track?.filepath,
                        isVideo: false,
                        discNumber: track?.disc || 1,
                        created: toISOString(info.created_date) || toISOString(Date.now() / 1000),
                        size: track?.size || 1048576,
                        albumId: track?.albumhash,
                        artistId: encodeId(track?.artists?.[0]?.artisthash, "artist", codecs),
                        type: "music",
                        artists: (track?.artists || []).map(a => ({ id: encodeId(a?.artisthash, "artist", codecs) || "unknown", name: a?.name })),
                        albumArtists: (track?.albumartists || track?.artists || info.albumartists || []).map(a => ({ id: encodeId(a?.artisthash, "artist", codecs) || "unknown", name: a?.name })),
                        displayArtist: firstProperty(track?.artists, "name"),
                        explicitStatus: track?.explicit ? "explicit" : "clean",
                    }

                    if (track?.is_favorite) song.starred = new Date().toISOString();

                    return song;
                }),
                "track"
            )
        }
    }

    if (info.is_favorite) output.album.starred = new Date().toISOString();

    respond(res, req, {
        "subsonic-response": {
            ...output,
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
