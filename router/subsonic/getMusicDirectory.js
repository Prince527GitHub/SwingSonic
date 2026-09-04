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
            error: {
                code: 10,
                message: "Required parameter 'id' is missing"
            }
        }
    });

    const decoded = codecs.decode(id);
    // TODO: Cleanup this, I don't like it.
    const effectiveId = decoded?.id || id;

    const album = await api.album(req.user).getAlbumTracksAndInfo({ albumhash: effectiveId });
    if (album?.error || !album?.info) {
        const artist = await api.artist(req.user).getArtist(effectiveId);
        if (artist?.artist) {
            const albumList = await api.artist(req.user).getArtistAlbums(effectiveId, { all: false });

            // TODO: Cleanup this, I don't like it.
            const allAlbums = [
                ...(albumList?.albums?.albums || []),
                ...(albumList?.albums?.appearances || []),
                ...(albumList?.albums?.compilations || []),
                ...(albumList?.albums?.singles_and_eps || [])
            ];

            const children = allAlbums.map(a => ({
                id: a?.albumhash,
                parent: effectiveId,
                isDir: true,
                title: a?.title,
                album: a?.title,
                artist: a?.albumartists?.[0]?.name,
                coverArt: a?.image ? codecs.encode({ type: "album", id: a.image }) : undefined,
                created: a?.date ? new Date(a.date * 1000).toISOString() : undefined
            }));

            return respond(res, req, {
                "subsonic-response": {
                    directory: { id: effectiveId, name: artist.artist.name, parent: undefined, child: children },
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
    // TODO: Cleanup this, I don't like it.
    const albumReleaseDate = info.date ? new Date(info.date * 1000) : new Date();

    const children = tracks.map(track => {
        const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;

        return {
            id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined,
            parent: effectiveId,
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
            artists: (track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash ? codecs.encode({ type: "artist", id: a.artisthash }) : undefined })),
            albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash ? codecs.encode({ type: "artist", id: a.artisthash }) : undefined })),
            displayArtist: track?.artists?.[0]?.name
        }
    });

    respond(res, req, {
        "subsonic-response": {
            directory: {
                id: effectiveId,
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
