const { toISOString, encodeId, firstProperty } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async (req, res, proxy, respond) => {
    const { id } = req.query;

    const hash = codecs.decode(id)?.id || id;

    const [albumData, artistData] = await Promise.all([
        api.artist(req.user).getArtistAlbums(hash, { limit: 7, all: false }),
        api.artist(req.user).getArtist(hash)
    ]);

    const artist = artistData?.artist;
    const artistId = encodeId(artist?.artisthash, "artist", codecs) || id;

    const albums = (albumData?.albums || []).map(album => ({
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
                id: artistId,
                name: artist?.name,
                coverArt: encodeId(artist?.image, "artist", codecs),
                albumCount: artist?.albumcount || 0,
                songCount: artist?.trackcount || 0,
                created: new Date().toISOString(),
                duration: artist?.duration || 0,
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
