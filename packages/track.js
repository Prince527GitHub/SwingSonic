const path = require("path");
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
        artist: track?.artists?.[0]?.name,
        artist_id: track?.artists?.[0]?.artisthash,
        album_id: track?.albumhash,
        format: track?.filepath ? path.extname(track.filepath).slice(1) : undefined,
        duration: (track?.duration || 0) * 1000,
    };
}

function mapTracks(tracks) {
    return (tracks || []).map(mapTrack).sort((a, b) => (a.track || 0) - (b.track || 0));
}

module.exports = {
    encodeTrackId,
    mapTrack,
    mapTracks
};
