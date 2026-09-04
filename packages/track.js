// TODO: Remove this file.
const { sortByProperty } = require("./utils");
const codecs = require("./codecs");
const path = require("path");

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
        artist: track?.artists?.[0]?.name,
        artist_id: track?.artists?.[0]?.artisthash,
        album_id: track?.albumhash,
        format: track?.filepath ? path.extname(track.filepath).slice(1) : undefined,
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
