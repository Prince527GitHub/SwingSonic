const express = require("express");
const router = express.Router();

const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

router.get("/public", (req, res) => res.json([]));

router.get("/user/views", async(req, res) => {
    const folders = await api.folder(req.user).getFolderTree({ folder: "$home", tracks_only: false });

    const items = (folders?.folders || []).map(folder => ({
        Name: folder.name,
        ServerId: "server",
        Id: folder.name,
        Etag: "tag",
        DateCreated: "2024-03-04T00:39:17.500887Z",
        CanDelete: false,
        CanDownload: true,
        SortName: "music",
        ExternalUrls: [],
        Path: folder.path,
        EnableMediaSourceDisplay: true,
        ChannelId: null,
        Taglines: [],
        Genres: [],
        RemoteTrailers: [],
        ProviderIds: {},
        IsFolder: true,
        ParentId: "0",
        Type: "CollectionFolder",
        People: [],
        Studios: [],
        GenreItems: [],
        LocalTrailerCount: 0,
        SpecialFeatureCount: 0,
        DisplayPreferencesId: "folder",
        Tags: [],
        CollectionType: "music",
        LocationType: "FileSystem",
        LockedFields: [],
        LockData: false
    }));

    res.json({
        Items: items,
        TotalRecordCount: items.length,
        StartIndex: 0,
        ServerId: "server"
    });
});

router.route("/authenticatebyname")
    .post(sendUser)
    .get(sendUser);

router.get("/user", sendUser);

function sendUser(req, res) {
    const { Pw: password, Username: username } = req.body;

    const userSettings = {
        Name: username,
        ServerId: "server",
        Id: "user",
        AccessToken: `${username}@${password}`,
        HasPassword: true,
        HasConfiguredPassword: true,
        HasConfiguredEasyPassword: false,
        EnableAutoLogin: false,
        LastLoginDate: "2024-03-04T19:59:39.5813857Z",
        LastActivityDate: "2024-03-04T19:59:39.5813857Z",
        Policy: {
            IsAdministrator: true,
            IsHidden: true,
            IsDisabled: false,
            BlockedTags: [],
            EnableUserPreferenceAccess: true,
            AccessSchedules: [],
            BlockUnratedItems: [],
            EnableRemoteControlOfOtherUsers: true,
            EnableSharedDeviceControl: true,
            EnableRemoteAccess: true,
            EnableLiveTvManagement: true,
            EnableLiveTvAccess: true,
            EnableMediaPlayback: true,
            EnableAudioPlaybackTranscoding: true,
            EnableVideoPlaybackTranscoding: true,
            EnablePlaybackRemuxing: true,
            ForceRemoteSourceTranscoding: false,
            EnableContentDeletion: true,
            EnableContentDeletionFromFolders: [],
            EnableContentDownloading: true,
            EnableSyncTranscoding: true,
            EnableMediaConversion: true,
            EnabledDevices: [],
            EnableAllDevices: true,
            EnabledChannels: [],
            EnableAllChannels: true,
            EnabledFolders: [],
            EnableAllFolders: true,
            InvalidLoginAttemptCount: 0,
            LoginAttemptsBeforeLockout: -1,
            MaxActiveSessions: 0,
            EnablePublicSharing: true,
            BlockedMediaFolders: [],
            BlockedChannels: [],
            RemoteClientBitrateLimit: 0,
            AuthenticationProviderId: "Jellyfin.Server.Implementations.Users.DefaultAuthenticationProvider",
            PasswordResetProviderId: "Jellyfin.Server.Implementations.Users.DefaultPasswordResetProvider",
            SyncPlayAccess: "CreateAndJoinGroups"
        },
        Configuration: {
            PlayDefaultAudioTrack: true,
            SubtitleLanguagePreference: "",
            DisplayMissingEpisodes: false,
            GroupedFolders: [],
            SubtitleMode: "Default",
            DisplayCollectionsView: false,
            EnableLocalPassword: false,
            OrderedViews: [],
            LatestItemsExcludes: [],
            MyMediaExcludes: [],
            HidePlayedInLatest: true,
            RememberAudioSelections: true,
            RememberSubtitleSelections: true,
            EnableNextEpisodeAutoPlay: true
        }
    }

    res.json({
        User: userSettings,
        ...userSettings,
    });
}

router.get("/user/items", async(req, res) => {
    let { IncludeItemTypes, Limit, StartIndex, ParentId, AlbumArtistIds, Ids, MediaTypes } = req.query;

    if (ParentId && IncludeItemTypes === "Audio") {
        const folders = await api.folder(req.user).getFolderTree({ folder: "$home", tracks_only: false });

        for (const folder of folders?.folders || []) {
            if (folder.path === ParentId) {
                IncludeItemTypes = "AllTracks";
                break;
            }
        }
    } else if (ParentId && !IncludeItemTypes) IncludeItemTypes = "Audio";

    let output = [];
    let albums = { items: [], total: 0 };

    if (!AlbumArtistIds && (IncludeItemTypes === "MusicAlbum" || (!IncludeItemTypes && !MediaTypes))) {
        albums = await api.getAll(req.user).getAllItems("albums", { start: StartIndex || "0", limit: Limit || "50", sortby: "created_date", reverse: 1 }) || { items: [], total: 0 };

        output = await Promise.all((albums?.items || []).map(async(album) => {
            const data = {
                "Name": album.title,
                "ServerId": "server",
                "Id": album.albumhash,
                "PremiereDate": "2010-02-03T00:00:00.0000000Z",
                "ChannelId": null,
                "RunTimeTicks": 0,
                "ProductionYear": album.date,
                "IsFolder": true,
                "Type": "MusicAlbum",
                "Artists": (album.albumartists || []).map(artist => artist.name),
                "ArtistItems": (album.albumartists || []).map(artist => ({
                    "Id": artist.artisthash,
                    "Name": artist.name
                })),
                "AlbumArtist": album.albumartists?.[0]?.name,
                "AlbumArtists": (album.albumartists || []).map(artist => ({
                    "Id": artist.artisthash,
                    "Name": artist.name
                })),
                "ImageTags": {
                    "Primary" : album.albumhash
                },
                "UserData": {
                    "IsFavorite": false,
                    "LastPlayedDate": "2019-08-24T14:15:22Z",
                    "Likes": false,
                    "PlaybackPositionTicks": 0,
                    "PlayCount": 0,
                    "Played": false,
                    "PlayedPercentage": 0,
                    "Rating": 0,
                    "UnplayedItemCount": 0
                },
                "BackdropImageTags": [],
                "LocationType": "FileSystem"
            }

            const favorite = await api.favorites(req.user).checkFavorite({ hash: album.albumhash, type: "album" });
            if (favorite?.is_favorite) data.UserData.IsFavorite = true;

            return data;
        }));
    } else if (IncludeItemTypes === "MusicAlbum" && AlbumArtistIds) {
        albums = await api.artist(req.user).getArtistAlbums(AlbumArtistIds, { limit: 7, all: false }) || { appearances: [], albums: [], singles_and_eps: [], compilations: [] };

        output = (albums?.appearances || []).map(album => ({
            "Name": album.title,
            "ServerId": "server",
            "Id": album.albumhash,
            "PremiereDate": "2010-02-03T00:00:00.0000000Z",
            "ChannelId": null,
            "RunTimeTicks": 0,
            "ProductionYear": album.date,
            "IsFolder": true,
            "Type": "MusicAlbum",
            "UserData": {
                "PlaybackPositionTicks": 0,
                "PlayCount": 0,
                "IsFavorite": false,
                "Played": false,
            },
            "Artists": (album.albumartists || []).map(artist => artist.name),
            "ArtistItems": (album.albumartists || []).map(artist => ({
                "Id": artist.artisthash,
                "Name": artist.name
            })),
            "AlbumArtist": album.albumartists?.[0]?.name,
            "AlbumArtists": (album.albumartists || []).map(artist => ({
                "Id": artist.artisthash,
                "Name": artist.name
            })),
            "ImageTags": {
                "Primary": album.albumhash
            },
            "BackdropImageTags": [],
            "LocationType": "FileSystem"
        }));
    } else if ((IncludeItemTypes === "Audio" || MediaTypes === "Audio,Video") && ParentId) {
        try {
            albums = await api.album(req.user).getAlbumTracksAndInfo({ albumhash: ParentId });

            if (albums?.error) {
                albums = await api.playlist(req.user).getPlaylist({ playlistid: ParentId }, { no_tracks: false });
            }

            const trackList = albums?.tracks || [];
            const albumInfo = albums?.info || {};

            if (albumInfo?.albumartists) {
                output = trackList.map(track => ({
                    "Album": track.album,
                    "AlbumArtist": track.albumartists?.[0]?.name,
                    "AlbumArtists": (albumInfo.albumartists || []).map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "AlbumId": track.albumhash,
                    "AlbumPrimaryImageTag": track.trackhash,
                    "ArtistItems": (track.artists || []).map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "Artists": (track.artists || []).map(artist => artist.name),
                    "BackdropImageTags": [],
                    "ChannelId": null,
                    "ChildCount": 0,
                    "Etag": encodeURIComponent(codecs.encode({ album: track.albumhash, id: track.trackhash, path: track.filepath })),
                    "Genres": ["Unknown"],
                    "Id": encodeURIComponent(codecs.encode({ album: track.albumhash, id: track.trackhash, path: track.filepath })),
                    "ImageTags": { "Primary": track.albumhash },
                    "IndexNumber": track.track || 0,
                    "IndexNumberEnd": trackList.length,
                    "IsFolder": false,
                    "LocationType": "FileSystem",
                    "MediaType": "Audio",
                    "Name": track.title,
                    "ParentIndexNumber": 1,
                    "ParentPrimaryImageItemId": track.albumhash,
                    "PremiereDate": "2010-02-03T00:00:00.0000000Z",
                    "ProductionYear": albumInfo.date,
                    "ProviderIds": {},
                    "RunTimeTicks": Math.round((track.duration || 0) * 9962075.847328244),
                    "ServerId": "server",
                    "SongCount": trackList.length,
                    "Tags": ["Unknown"],
                    "Type": "Audio",
                    "UserData": {
                        "IsFavorite": track.is_favorite,
                        "LastPlayedDate": "2019-08-24T14:15:22Z",
                        "Likes": false,
                        "PlaybackPositionTicks": 0,
                        "PlayCount": 0,
                        "Played": false,
                        "PlayedPercentage": 0,
                        "Rating": 0,
                        "UnplayedItemCount": 0,
                        "Key": track.albumhash
                    },
                    "track": track.track || 0
                })).sort((a, b) => a.track - b.track);
            } else {
                output = trackList.map(track => ({
                    "Album": track.album,
                    "AlbumArtist": track.albumartists?.[0]?.name,
                    "AlbumArtists": (track.albumartists || []).map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "AlbumId": track.albumhash,
                    "AlbumPrimaryImageTag": track.trackhash,
                    "ArtistItems": (track.artists || []).map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "Artists": (track.artists || []).map(artist => artist.name),
                    "BackdropImageTags": [],
                    "ChannelId": null,
                    "ChildCount": 0,
                    "Etag": encodeURIComponent(codecs.encode({ album: track.albumhash, id: track.trackhash, path: track.filepath })),
                    "Genres": ["Unknown"],
                    "Id": encodeURIComponent(codecs.encode({ album: track.albumhash, id: track.trackhash, path: track.filepath })),
                    "ImageTags": { "Primary": track.albumhash },
                    "IndexNumber": track.track || 0,
                    "IndexNumberEnd": trackList.length,
                    "IsFolder": false,
                    "LocationType": "FileSystem",
                    "MediaType": "Audio",
                    "Name": track.title,
                    "ParentIndexNumber": 1,
                    "ParentPrimaryImageItemId": track.albumhash,
                    "PremiereDate": "2010-02-03T00:00:00.0000000Z",
                    "ProductionYear": albumInfo.date || track.date,
                    "ProviderIds": {},
                    "RunTimeTicks": Math.round((track.duration || 0) * 9962075.847328244),
                    "ServerId": "server",
                    "SongCount": trackList.length,
                    "Tags": ["Unknown"],
                    "Type": "Audio",
                    "UserData": {
                        "IsFavorite": track.is_favorite,
                        "LastPlayedDate": "2019-08-24T14:15:22Z",
                        "Likes": false,
                        "PlaybackPositionTicks": 0,
                        "PlayCount": 0,
                        "Played": false,
                        "PlayedPercentage": 0,
                        "Rating": 0,
                        "UnplayedItemCount": 0,
                        "Key": track.albumhash
                    },
                    "track": track.track || 0
                })).sort((a, b) => a.track - b.track);
            }
        } catch { albums = { items: [], total: 0 }; }
    } else if (IncludeItemTypes === "Playlist") {
        const plResp = await api.playlist(req.user).sendAllPlaylists();
        const plData = plResp?.data || [];
        albums = { items: plData, total: plData.length };

        output = plData.map(playlist => ({
            "Name": playlist.name,
            "ServerId": "server",
            "Id": String(playlist.id),
            "CanDelete": true,
            "SortName": playlist.name,
            "ChannelId": null,
            "RunTimeTicks": Math.round((playlist.duration || 0) * 9962075.847328244),
            "IsFolder": true,
            "Type": "Playlist",
            "UserData": {
                "PlaybackPositionTicks": 0,
                "PlayCount": 0,
                "IsFavorite": false,
                "Played": false
            },
            "ChildCount": playlist.count,
            "SongCount": playlist.count,
            "PrimaryImageAspectRatio": 1,
            "ImageTags": {
                "Primary": playlist.image
            },
            "BackdropImageTags": [],
            "LocationType": "FileSystem",
            "MediaType": "Audio"
        }));
    }

    if (Ids) {
        const id = Ids.split(",")[0];

        const sizeResp = await api.getAll(req.user).getAllItems("albums", { start: 0, limit: 1, sortby: "created_date", reverse: 1 });
        const totalSize = sizeResp?.total || 50;

        const allAlbums = await api.getAll(req.user).getAllItems("albums", { start: 0, limit: totalSize, sortby: "created_date", reverse: 1 });

        for (const album of allAlbums?.items || []) {
            const tracksResp = await api.album(req.user).getAlbumTracksAndInfo({ albumhash: album.albumhash });

            const trackList = tracksResp?.tracks || [];
            const albumMatch = trackList.find(track => track.trackhash === id);

            if (albumMatch) {
                albums = tracksResp;
                output = trackList.map(track => ({
                    "Album": track.album,
                    "AlbumArtist": track.albumartists?.[0]?.name,
                    "AlbumArtists": (tracksResp?.info?.albumartists || []).map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "AlbumId": track.albumhash,
                    "AlbumPrimaryImageTag": track.trackhash,
                    "ArtistItems": (track.artists || []).map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "Artists": (track.artists || []).map(artist => artist.name),
                    "BackdropImageTags": [],
                    "ChannelId": null,
                    "ChildCount": 0,
                    "Etag": encodeURIComponent(codecs.encode({ album: track.albumhash, id: track.trackhash, path: track.filepath })),
                    "Genres": ["Unknown"],
                    "Id": encodeURIComponent(codecs.encode({ album: track.albumhash, id: track.trackhash, path: track.filepath })),
                    "ImageTags": { "Primary": track.albumhash },
                    "IndexNumber": track.track || 0,
                    "IndexNumberEnd": trackList.length,
                    "IsFolder": false,
                    "LocationType": "FileSystem",
                    "MediaType": "Audio",
                    "Name": track.title,
                    "ParentIndexNumber": 1,
                    "ParentPrimaryImageItemId": track.albumhash,
                    "PremiereDate": "2010-02-03T00:00:00.0000000Z",
                    "ProductionYear": tracksResp?.info?.date,
                    "ProviderIds": {},
                    "RunTimeTicks": Math.round((track.duration || 0) * 9962075.847328244),
                    "ServerId": "server",
                    "SongCount": trackList.length,
                    "Tags": ["Unknown"],
                    "Type": "Audio",
                    "UserData": {
                        "IsFavorite": track.is_favorite,
                        "LastPlayedDate": "2019-08-24T14:15:22Z",
                        "Likes": false,
                        "PlaybackPositionTicks": 0,
                        "PlayCount": 0,
                        "Played": false,
                        "PlayedPercentage": 0,
                        "Rating": 0,
                        "UnplayedItemCount": 0
                    },
                    "track": track.track || 0
                })).sort((a, b) => a.track - b.track);
                break;
            }
        }
    }

    res.json({
        "Items": output,
        "TotalRecordCount": albums?.total || output.length || 0,
        "StartIndex": Number(StartIndex) || 0
    });
});

router.get("/user/items/:id", async(req, res) => {
    const id = req.params.id;

    try {
        const albums = await api.album(req.user).getAlbumTracksAndInfo({ albumhash: id });

        if (albums?.error) {
            const playlist = await api.playlist(req.user).getPlaylist({ playlistid: id }, { no_tracks: false });

            const items = (playlist?.tracks || []).map(track => ({
                Album: track.album,
                AlbumArtist: track.artists?.[0]?.name,
                AlbumArtists: (track.artists || []).map(artist => ({ Id: artist.artisthash, Name: artist.name })),
                AlbumId: track.albumhash,
                AlbumPrimaryImageTag: track.trackhash,
                ArtistItems: (track.artists || []).map(artist => ({ Id: artist.artisthash, Name: artist.name })),
                Artists: (track.artists || []).map(artist => artist.name),
                BackdropImageTags: [],
                ChannelId: null,
                ChildCount: 0,
                Etag: encodeURIComponent(codecs.encode({ album: track.albumhash, id: track.trackhash, path: track.filepath })),
                Genres: ["Unknown"],
                Id: encodeURIComponent(codecs.encode({ album: track.albumhash, id: track.trackhash, path: track.filepath })),
                ImageTags: { Primary: track.albumhash },
                IndexNumber: track.track || 0,
                IndexNumberEnd: (playlist?.tracks || []).length,
                IsFolder: false,
                LocationType: "FileSystem",
                MediaType: "Audio",
                Name: track.title,
                ParentIndexNumber: 1,
                ParentPrimaryImageItemId: track.albumhash,
                PremiereDate: "2010-02-03T00:00:00.0000000Z",
                ProductionYear: "2010",
                ProviderIds: {},
                RunTimeTicks: Math.round((track.duration || 0) * 9962075.847328244),
                ServerId: "server",
                SongCount: (playlist?.tracks || []).length,
                Tags: ["Unknown"],
                Type: "Audio",
                UserData: { PlaybackPositionTicks: 0, PlayCount: 0, IsFavorite: false, Played: false }
            }));

            return res.json({
                Items: items,
                TotalRecordCount: playlist?.info?.count || 0,
                StartIndex: 0,
                ServerId: "server"
            });
        }

        const trackList = albums?.tracks || [];
        const albumInfo = albums?.info || {};

        const items = trackList.map(track => ({
            Album: track.album,
            AlbumArtist: track.albumartists?.[0]?.name,
            AlbumArtists: (albumInfo.albumartists || []).map(artist => ({ Id: artist.artisthash, Name: artist.name })),
            AlbumId: track.albumhash,
            AlbumPrimaryImageTag: track.trackhash,
            ArtistItems: (track.artists || []).map(artist => ({ Id: artist.artisthash, Name: artist.name })),
            Artists: (track.artists || []).map(artist => artist.name),
            BackdropImageTags: [],
            ChannelId: null,
            ChildCount: 0,
            Etag: encodeURIComponent(codecs.encode({ album: track.albumhash, id: track.trackhash, path: track.filepath })),
            Genres: ["Unknown"],
            Id: encodeURIComponent(codecs.encode({ album: track.albumhash, id: track.trackhash, path: track.filepath })),
            ImageTags: { Primary: track.albumhash },
            IndexNumber: track.track || 0,
            IndexNumberEnd: trackList.length,
            IsFolder: false,
            LocationType: "FileSystem",
            MediaType: "Audio",
            Name: track.title,
            ParentIndexNumber: 1,
            ParentPrimaryImageItemId: track.albumhash,
            PremiereDate: "2010-02-03T00:00:00.0000000Z",
            ProductionYear: albumInfo.date,
            ProviderIds: {},
            RunTimeTicks: Math.round((track.duration || 0) * 9962075.847328244),
            ServerId: "server",
            SongCount: trackList.length,
            Tags: ["Unknown"],
            Type: "Audio",
            UserData: { PlaybackPositionTicks: 0, PlayCount: 0, IsFavorite: false, Played: false, PlayedPercentage: 0, Rating: 0, UnplayedItemCount: 0, Key: track.albumhash },
            track: track.track || 0
        })).sort((a, b) => a.track - b.track);

        res.json({
            Items: items,
            TotalRecordCount: trackList.length,
            StartIndex: 0,
            Name: albumInfo.title,
            ServerId: "server",
            Id: albumInfo.albumhash,
            Etag: albumInfo.albumhash,
            DateCreated: "2024-03-04T00:39:33.730766Z",
            CanDelete: true,
            CanDownload: true,
            SortName: albumInfo.title,
            PremiereDate: "2010-02-03T00:00:00.0000000Z",
            ExternalUrls: [],
            Path: "undefined",
            EnableMediaSourceDisplay: true,
            ChannelId: null,
            Taglines: [],
            Genres: albumInfo.genres || [],
            CumulativeRunTimeTicks: Math.round((albumInfo.duration || 0) * 9962075.847328244),
            RunTimeTicks: Math.round((albumInfo.duration || 0) * 9962075.847328244),
            PlayAccess: "Full",
            ProductionYear: albumInfo.date,
            RemoteTrailers: [],
            ProviderIds: {},
            IsFolder: true,
            ParentId: albumInfo.albumhash,
            Type: "MusicAlbum",
            People: [],
            Studios: [],
            GenreItems: [],
            LocalTrailerCount: 0,
            UserData: {
                PlaybackPositionTicks: 0,
                PlayCount: 0,
                IsFavorite: albumInfo.is_favorite,
                Played: false
            },
            RecursiveItemCount: albumInfo.count,
            ChildCount: albumInfo.count,
            SpecialFeatureCount: 0,
            DisplayPreferencesId: albumInfo.albumhash,
            Tags: [],
            PrimaryImageAspectRatio: 1,
            Artists: (albumInfo.albumartists || []).map(artist => artist.name),
            ArtistItems: (albumInfo.albumartists || []).map(artist => ({ Name: artist.name, Id: artist.artisthash })),
            AlbumArtist: albumInfo.albumartists?.[0]?.name,
            AlbumArtists: (albumInfo.albumartists || []).map(artist => ({ Name: artist.name, Id: artist.artisthash })),
            ImageTags: { Primary: albumInfo.albumhash },
            BackdropImageTags: [],
            LocationType: "FileSystem",
            LockedFields: [],
            LockData: false
        });
    } catch {
        res.json({
            Items: [],
            TotalRecordCount: 0,
            StartIndex: 0,
            ServerId: "server"
        });
    }
});

router.route("/user/favoriteitems/:id")
    .post(async(req, res) => {
        const id = req.params.id;

        const artistRes = await api.request(`/artist/${id}/albums`, { method: "GET", auth: req.user, query: { limit: 1, all: false }, raw: true });
        const albumRes = await api.request("/album", { method: "POST", auth: req.user, body: { albumhash: id }, raw: true });

        const type = artistRes.ok ? "artist" : albumRes.ok ? "album" : "track";
        if (type) await api.favorites(req.user).toggleFavorite({ type, hash: id });

        res.json({
            Rating: 0,
            PlayedPercentage: 0,
            UnplayedItemCount: 0,
            PlaybackPositionTicks: 0,
            PlayCount: 0,
            IsFavorite: true,
            Likes: true,
            LastPlayedDate: "2019-08-24T14:15:22Z",
            Played: true,
            Key: id,
            ItemId: id,
            ServerId: "server"
        });
    })
    .delete(async(req, res) => {
        const id = req.params.id;

        const artistRes = await api.request(`/artist/${id}/albums`, { method: "GET", auth: req.user, query: { limit: 1, all: false }, raw: true });
        const albumRes = await api.request("/album", { method: "POST", auth: req.user, body: { albumhash: id }, raw: true });

        const type = artistRes.ok ? "artist" : albumRes.ok ? "album" : "track";
        if (type) await api.favorites(req.user).removeFavorite({ type, hash: id });

        res.json({
            Rating: 0,
            PlayedPercentage: 0,
            UnplayedItemCount: 0,
            PlaybackPositionTicks: 0,
            PlayCount: 0,
            IsFavorite: false,
            Likes: true,
            LastPlayedDate: "2019-08-24T14:15:22Z",
            Played: true,
            Key: id,
            ItemId: id,
            ServerId: "server"
        });
    });

module.exports = {
    router,
    name: "users"
};
