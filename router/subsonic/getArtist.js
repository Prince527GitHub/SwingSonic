const { toISOString, encodeId, firstProperty } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

// TODO: Cleanup this, I don't like it.
module.exports = async(req, res, proxy, respond) => {
    const id = req.query.id;

    const decoded = codecs.decode(id);

    const effectiveId = decoded?.id || id;

    const getAlbums = await api.artist(req.user).getArtistAlbums(effectiveId, { limit: 7, all: false });

    const artist = await api.artist(req.user).getArtist(effectiveId);

    const encodedArtistId = encodeId(artist?.artist?.artisthash, "artist", codecs) || id;

    const albums = (getAlbums?.albums || []).map(album => ({
        id: album?.albumhash,
        name: album?.title,
        coverArt: encodeId(album?.image, "album", codecs),
        songCount: album?.trackcount || 0,
        created: toISOString(album?.date),
        duration: album?.duration || 0,
        artist: firstProperty(album?.albumartists, "name"),
        artistId: encodeId(album?.albumartists?.[0]?.artisthash, "artist", codecs)
    }));

    respond(res, req, {
        "subsonic-response": {
            artist: {
                id: encodedArtistId,
                name: artist?.artist?.name,
                coverArt: encodeId(artist?.artist?.image, "artist", codecs),
                albumCount: artist?.artist?.albumcount || 0,
                songCount: artist?.artist?.trackcount || 0,
                created: new Date().toISOString(),
                duration: artist?.artist?.duration || 0,
                album: albums
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
