const { toISOString, parseIntOr, encodeId, firstProperty, audioFormat } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");
const zw = require("../../packages/zw");

module.exports = {
    aliases: ["search3"],
    handler: async (req, res, proxy, respond) => {
        const query = (req.query.query || "").replace(/[-_]/g, " ");

        let { artistCount, artistOffset, albumCount, albumOffset, songCount, songOffset } = req.query;

        // TODO: Cleanup these, I don't like it.
        artistCount = parseIntOr(artistCount, 20);
        albumCount = parseIntOr(albumCount, 20);
        songCount = parseIntOr(songCount, 20);
        artistOffset = parseIntOr(artistOffset);
        albumOffset = parseIntOr(albumOffset);
        songOffset = parseIntOr(songOffset);

        let artists = [];
        if (artistCount >= 1 && query) {
            // TODO: Merge response with artists
            const response = await api.search(req.user).searchItems({ itemtype: "artists", q: query, start: artistOffset, limit: artistCount });

            artists = (response?.results || []).map(artist => ({
                id: encodeId(artist?.artisthash, "artist", codecs),
                name: artist?.name,
                coverArt: encodeId(artist?.image, "artist", codecs),
                albumCount: artist?.albumcount || 0,
                starred: undefined
            }));
        }

        let albums = [];
        if (albumCount >= 1 && query) {
            // TODO: Merge response with albums
            const response = await api.search(req.user).searchItems({ itemtype: "albums", q: query, start: albumOffset, limit: albumCount });

            albums = (response?.results || []).map(album => ({
                id: album?.albumhash,
                name: album?.title,
                coverArt: encodeId(album?.image, "album", codecs),
                songCount: album?.trackcount || 0,
                created: toISOString(album?.date),
                duration: album?.duration || 0,
                artist: firstProperty(album?.albumartists, "name"),
                artistId: encodeId(album?.albumartists?.[0]?.artisthash, "artist", codecs)
            }));
        }

        let tracks = [];
        if (songCount >= 1 && query) {
            // TODO: Merge response with tracks
            const response = await api.search(req.user).searchItems({ itemtype: "tracks", q: query, start: songOffset, limit: songCount });

            tracks = (response?.results || []).map(track => {
                const id = track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : undefined;

                return {
                    id,
                    parent: track?.albumhash,
                    title: global?.config?.server?.api?.subsonic?.options?.zw && track?.title && track?.albumhash && track?.trackhash ? zw.inject(track.title, codecs.encode({ album: track.albumhash, id: track.trackhash })) : track?.title,
                    album: track?.album,
                    artist: firstProperty(track?.albumartists, "name"),
                    isDir: false,
                    coverArt: encodeId(track?.image, "album", codecs),
                    created: new Date().toISOString(),
                    duration: track?.duration || 0,
                    bitRate: track?.bitrate || 0,
                    track: track?.track || 0,
                    year: track?.year || new Date().getFullYear(),
                    ...audioFormat(track?.filepath),
                    isVideo: false,
                    discNumber: track?.disc || 1,
                    size: track?.size || 1048576,
                    path: track?.filepath,
                    albumId: track?.albumhash,
                    artistId: encodeId(track?.albumartists?.[0]?.artisthash, "artist", codecs),
                    albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: encodeId(a?.artisthash, "artist", codecs) })),
                    type: "music"
                }
            });
        }

        const key = (req.path || req.url || "").includes("search3") ? "searchResult3" : "searchResult2";

        respond(res, req, {
            "subsonic-response": {
                [key]: { artist: artists, album: albums, song: tracks },
                status: "ok",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true
            }
        });
    }
};
