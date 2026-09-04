const { toISOString, encodeId, firstProperty, audioFormat } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = {
    aliases: ["getStarred2"],
    handler: async (req, res, proxy, respond) => {
        const favorites = await api.favorites(req.user).getAllFavorites();

        const artists = (favorites?.artists || []).map(artist => ({
            id: encodeId(artist?.artisthash, "artist", codecs),
            name: artist?.name,
            coverArt: encodeId(artist?.image, "artist", codecs),
            albumCount: artist?.albumcount || 0,
            starred: toISOString(artist?.date)
        }));

        const albums = (favorites?.albums || []).map(album => ({
            id: album?.albumhash,
            parent: album?.albumhash,
            title: album?.title,
            name: album?.title,
            album: album?.title,
            artist: firstProperty(album?.albumartists, "name"),
            artistId: encodeId(album?.albumartists?.[0]?.artisthash, "artist", codecs),
            isDir: "true",
            coverArt: encodeId(album?.image, "album", codecs),
            songCount: album?.trackcount || 0,
            duration: album?.duration || 0,
            created: toISOString(album?.date),
            starred: toISOString(album?.date)
        }));

        const tracks = (favorites?.tracks || []).map(track => {
            return {
                id: track?.trackhash && track?.filepath ? encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath })) : track?.trackhash,
                parent: track?.albumhash,
                isDir: false,
                title: track?.title,
                album: track?.album,
                artist: firstProperty(track?.artists, "name"),
                track: track?.track || 0,
                year: new Date().getFullYear(),
                coverArt: encodeId(track?.image, "album", codecs),
                ...audioFormat(track?.filepath),
                duration: track?.duration || 0,
                bitRate: track?.bitrate || 0,
                path: track?.filepath,
                isVideo: false,
                discNumber: track?.disc || 1,
                created: new Date().toISOString(),
                size: track?.size || 1048576,
                albumId: track?.albumhash,
                artistId: encodeId(track?.artists?.[0]?.artisthash, "artist", codecs),
                type: "music",
                artists: (track?.artists || []).map(a => ({ name: a?.name, id: encodeId(a?.artisthash, "artist", codecs) })),
                albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: encodeId(a?.artisthash, "artist", codecs) })),
                displayArtist: firstProperty(track?.artists, "name"),
                explicitStatus: track?.explicit ? "explicit" : "clean",
                starred: new Date(0).toISOString()
            }
        });

        const key = (req.path || req.url || "").includes("getStarred2") ? "starred2" : "starred";

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
