const express = require("express");
const router = express.Router();

const { firstProperty, toJellyfinTicks } = require("../../packages/utils");
const api = require("../../packages/swingmusic");

router.get("/:id/items", async(req, res) => {
    const { id } = req.params;

    const playlist = await api.playlist(req.user).getPlaylist({ playlistid: id }, { no_tracks: false });

    const items = (playlist?.tracks || []).map(track => ({
        Name: track.title,
        ServerId: "server",
        Id: track.trackhash,
        PlaylistItemId: track.trackhash,
        PremiereDate: "2010-02-03T00:00:00.0000000Z",
        RunTimeTicks: toJellyfinTicks(track.duration),
        IndexNumber: track.track || 0,
        ParentIndexNumber: 1,
        IsFolder: false,
        Type: "Audio",
        UserData: {
            PlaybackPositionTicks: 0,
            PlayCount: 0,
            IsFavorite: false,
            Played: false
        },
        PrimaryImageAspectRatio: 1,
        Artists: (track.artists || []).map(artist => artist.name),
        ArtistItems: (track.artists || []).map(artist => ({ Name: artist.name, Id: artist.artisthash })),
        Album: track.album,
        AlbumId: track.albumhash,
        AlbumPrimaryImageTag: track.albumhash,
        AlbumArtist: firstProperty(track.albumartists, "name"),
        AlbumArtists: (track.albumartists || []).map(artist => ({ Name: artist.name, Id: artist.artisthash })),
        ImageTags: {
            Primary: track.albumhash
        },
        BackdropImageTags: [],
        LocationType: "FileSystem",
        MediaType: "Audio"
    }));

    res.json({
        Items: items,
        TotalRecordCount: playlist?.info?.count || 0,
        StartIndex: 0
    });
});

module.exports = {
    router,
    name: "playlists"
};
