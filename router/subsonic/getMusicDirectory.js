const { toISOString, encodeId, firstProperty, audioFormat } = require("../../packages/utils");
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
            error: {
                code: 10,
                message: "Required parameter 'id' is missing"
            }
        }
    });

    const hash = codecs.decode(id)?.id || id;

    const album = await api.album(req.user).getAlbumTracksAndInfo({ albumhash: hash });
    if (album?.error || !album?.info) {
        const artist = await api.artist(req.user).getArtist(hash);
        if (artist?.artist) {
            const albumList = await api.artist(req.user).getArtistAlbums(hash, { all: false });

            const collection = Object.values(albumList?.albums || {}).flat();

            const children = collection.map(a => ({
                id: a?.albumhash,
                parent: hash,
                isDir: true,
                title: a?.title,
                album: a?.title,
                artist: firstProperty(a?.albumartists, "name"),
                coverArt: encodeId(a?.image, "album", codecs),
                created: toISOString(a?.date)
            }));

            return respond(res, req, {
                "subsonic-response": {
                    directory: {
                        id: hash,
                        name: artist.artist.name,
                        parent: undefined,
                        child: children
                    },
                    status: "ok",
                    version: "1.16.1",
                    type: "swingsonic",
                    serverVersion: "unknown",
                    openSubsonic: true
                }
            });
        }

        return respond(res, req, {
            "subsonic-response": {
                status: "failed",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true,
                error: {
                    code: 70,
                    message: "Directory not found"
                }
            }
        });
    }

    const info = album.info || {};
    const tracks = album.tracks || [];

    const year = info.date ? new Date(info.date * 1000).getFullYear() : new Date().getFullYear();

    const children = tracks.map(track => {
        return {
            id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined,
            parent: hash,
            isDir: false,
            title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash ? zw.inject(track.title, codecs.encode({ album: track.albumhash, id: track.trackhash })) : track?.title,
            album: track?.album,
            artist: firstProperty(track?.artists, "name"),
            track: track?.track || 0,
            year,
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
            artists: (track?.artists || []).map(a => ({ name: a?.name, id: encodeId(a?.artisthash, "artist", codecs) })),
            albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: encodeId(a?.artisthash, "artist", codecs) })),
            displayArtist: firstProperty(track?.artists, "name")
        }
    });

    respond(res, req, {
        "subsonic-response": {
            directory: {
                id: hash,
                name: info.title || info.albumhash,
                parent: undefined,
                starred: info.is_favorite ? new Date().toISOString() : undefined,
                child: children
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
