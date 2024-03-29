const express = require("express");
const router = express.Router();

router.get("/:id/items", async(req, res) => {
    const { id } = req.params;

    const playlist = await (await fetch(`${global.config.music}/playlist/${id}?no_tracks=false`)).json();

    const items = playlist.tracks.map(track => ({
        Name: track.title,
        ServerId: "server",
        Id: track.trackhash,
        PlaylistItemId: track.trackhash,
        PremiereDate: "2010-02-03T00:00:00.0000000Z",
        RunTimeTicks: Math.round(track.duration * 9962075.847328244),
        IndexNumber: track.track,
        ParentIndexNumber: track.track,
        IsFolder: false,
        Type: "Audio",
        UserData: { PlaybackPositionTicks: 0, PlayCount: 0, IsFavorite: false, Played: false },
        PrimaryImageAspectRatio: 1,
        Artists: track.artists.map(artist => artist.name),
        ArtistItems: track.artists.map(artist => ({
            Name: artist.name,
            Id: artist.artisthash
        })),
        Album: track.album,
        AlbumId: track.albumhash,
        AlbumPrimaryImageTag: track.albumhash,
        AlbumArtist: track.albumartists[0].name,
        AlbumArtists: track.albumartists.map(artist => ({
            Name: artist.name,
            Id: artist.artisthash
        })),
        ImageTags: {
            Primary: track.albumhash
        },
        BackdropImageTags: [],
        LocationType: "FileSystem",
        MediaType: "Audio"
    }));

    res.json({
        Items: items,
        TotalRecordCount: playlist.info.count,
        StartIndex: 0
    });
});

module.exports = {
    router: router,
    name: "playlists"
}