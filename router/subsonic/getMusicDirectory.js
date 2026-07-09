const zw = require("../../packages/zw");
const path = require("path");

module.exports = async(req, res, proxy, respond) => {
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

    let decoded;
    try {
        const json = Buffer.from(decodeURIComponent(id), "base64").toString("utf-8");
        decoded = JSON.parse(json);
    } catch {
        decoded = null;
    }

    const effectiveId = decoded?.id || id;

    const album = await (await fetch(`${global.config.music}/album`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": req.user
        },
        body: JSON.stringify({ albumhash: effectiveId })
    })).json();

    if (album?.error || !album?.info) {
        const artist = await (await fetch(`${global.config.music}/artist/${effectiveId}`, {
            headers: { "Cookie": req.user }
        })).json();

        if (artist?.artist) {
            const albumList = await (await fetch(`${global.config.music}/artist/${effectiveId}/albums?all=false`, {
                headers: { "Cookie": req.user }
            })).json();

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
                coverArt: a?.image ? Buffer.from(JSON.stringify({ type: "album", id: a.image })).toString("base64") : undefined,
                created: a?.date ? new Date(a.date * 1000).toISOString() : undefined
            }));

            return respond(res, req, {
                "subsonic-response": {
                    directory: {
                        id: effectiveId,
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
                error: { code: 70, message: "Directory not found" }
            }
        });
    }

    const info = album.info || {};
    const tracks = album.tracks || [];
    const albumReleaseDate = info.date ? new Date(info.date * 1000) : new Date();

    const children = tracks.map(track => {
        const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;

        return {
            id: track?.trackhash && track?.filepath ? encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")) : undefined,
            parent: effectiveId,
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
            artists: (track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash })),
            albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash })),
            displayArtist: track?.artists?.[0]?.name,
        };
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
}
