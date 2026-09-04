// TODO: Remove this file.
const { sortByProperty, ext, firstProperty } = require("./utils");
const codecs = require("./codecs");

function encodeTrackId(track) {
    if (!track?.trackhash || !track?.filepath) return undefined;

    return encodeURIComponent(codecs.encode({ id: track.trackhash, path: track.filepath }));
}

function mapTrack(track) {
    return {
        id: encodeTrackId(track),
        album: track?.album,
        title: track?.title,
        track: track?.track || 0,
        artist: firstProperty(track?.artists, "name"),
        artist_id: firstProperty(track?.artists, "artisthash"),
        album_id: track?.albumhash,
        format: ext(track?.filepath),
        duration: (track?.duration || 0) * 1000,
    };
}

function mapTracks(tracks) {
    return sortByProperty((tracks || []).map(mapTrack), "track");
}

module.exports = {
    encodeTrackId,
    mapTrack,
    mapTracks
};
