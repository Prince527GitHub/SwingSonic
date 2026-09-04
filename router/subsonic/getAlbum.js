const { sortByProperty } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");
const zw = require("../../packages/zw");
const path = require("path");

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
            parent: info.albumartists?.[0]?.artisthash || info.albumhash,
            isDir: true,
            isVideo: false,
            version: info.versions?.[0],
            artist: info.albumartists?.[0]?.name,
            artistId: info.albumartists?.[0]?.artisthash ? codecs.encode({ type: "artist", id: info.albumartists[0].artisthash }) : undefined,
            coverArt: info.image ? codecs.encode({ type: "album", id: info.image }) : codecs.encode({ type: "album", id: info.albumhash }),
            songCount: info.trackcount || 0,
            duration: info.duration || 0,
            playCount: info.playcount || 0,
            created: info.created_date ? new Date(info.created_date * 1000).toISOString() : new Date().toISOString(),
            year: albumReleaseDate.getFullYear(),
            genre: (info.genres || []).map(g => g?.name).join(", "),
            played: info.playcount > 0 && info.lastplayed ? new Date(info.lastplayed * 1000).toISOString() : undefined,
            genres: (info.genres || []).map(g => ({ name: g?.name })),
            artists: (info.albumartists || []).map(artist => ({
                id: artist?.artisthash ? codecs.encode({ type: "artist", id: artist.artisthash }) : undefined,
                name: artist?.name,
                coverArt: artist?.image ? codecs.encode({ type: "artist", id: artist.image }) : undefined,
            })),
            displayArtist: info.albumartists?.[0]?.name,
            releaseTypes: info.type ? [info.type] : [],
            originalReleaseDate: {
                year: albumReleaseDate.getFullYear(),
                month: albumReleaseDate.getMonth() + 1,
                day: albumReleaseDate.getDate()
            },
            song: sortByProperty(
                tracks.map(track => {
                    const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;

                    const song = {
                        id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined,
                        parent: track?.albumhash,
                        isDir: false,
                        title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash ? zw.inject(track.title, codecs.encode({ album: track.albumhash, id: track.trackhash })) : track?.title,
                        album: track?.album,
                        artist: track?.artists?.[0]?.name,
                        track: track?.track || 0,
                        year: albumReleaseDate.getFullYear(),
                        coverArt: track?.image ? codecs.encode({ type: "album", id: track.image }) : undefined,
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
                        artistId: track?.artists?.[0]?.artisthash ? codecs.encode({ type: "artist", id: track.artists[0].artisthash }) : undefined,
                        type: "music",
                        artists: (track?.artists || []).map(a => ({ id: a?.artisthash ? codecs.encode({ type: "artist", id: a.artisthash }) : "unknown", name: a?.name })),
                        albumArtists: (track?.albumartists || track?.artists || info.albumartists || []).map(a => ({ id: a?.artisthash ? codecs.encode({ type: "artist", id: a.artisthash }) : "unknown", name: a?.name })),
                        displayArtist: track?.artists?.[0]?.name,
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
