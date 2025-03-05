const express = require("express");
const router = express.Router();

router.get("/public", (req, res) => res.json([]));

router.get("/user/views", async(req, res) => {
    const folders = await (await fetch(`${global.config.music}/folder`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": req.user
        },
        body: JSON.stringify({
            "folder": "$home",
            "tracks_only": false
        })
    })).json();

    const items = folders.folders.map(folder => ({
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

    console.log(`${req.baseUrl.toLowerCase()}${req.path.toLowerCase()}`)

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

// NOTE: This function still need to be refactored
router.get("/user/items", async(req, res) => {
    let { IncludeItemTypes, Limit, StartIndex, ParentId, AlbumArtistIds, Ids, MediaTypes } = req.query;

    if (ParentId && IncludeItemTypes === "Audio") {
        const folders = await (await fetch(`${global.config.music}/folder`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({
                "folder": "$home",
                "tracks_only": false
            })
        })).json();

        for (let index = 0; index < folders.folders.length; index++) {
            const folder = folders.folders[index];

            if (folder.path === ParentId) {
                IncludeItemTypes = "AllTracks";
                break;
            }
        }
    } else if (ParentId && !IncludeItemTypes) IncludeItemTypes = "Audio";

    let output = [];
    let albums = [];

    if ((IncludeItemTypes === "MusicAlbum" && !AlbumArtistIds) || (!IncludeItemTypes && !AlbumArtistIds && !MediaTypes)) {
        albums = await (await fetch(`${global.config.music}/getall/albums?start=${StartIndex || '0'}&limit=${Limit || '50'}&sortby=created_date&reverse=1`, {
            headers: {
                "Cookie": req.user
            }
        })).json();

        output = await Promise.all(await albums.items.map(async(album) => {
            const data = {
                "Name": album.title,
                "ServerId": "server",
                "Id": album.albumhash,
                "PremiereDate": "2010-02-03T00:00:00.0000000Z", // change
                "ChannelId": null,
                "RunTimeTicks": 0,
                "ProductionYear": album.date,
                "IsFolder": true,
                "Type": "MusicAlbum",
                "Artists": album.albumartists.map(artist => artist.name),
                "ArtistItems": album.albumartists.map(artist => ({
                    "Id": artist.artisthash,
                    "Name": artist.name
                })),
                "AlbumArtist": album.albumartists[0].name,
                "AlbumArtists": album.albumartists.map(artist => ({
                    "Id": artist.artisthash,
                    "Name": artist.name
                })),
                "ImageTags": {
                    "Primary" : album.albumhash
                },
                "UserData": {
                    "IsFavorite": false, // change
                    "LastPlayedDate": "2019-08-24T14:15:22Z", // change
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

            const favorite = await (await fetch(`${global.config.music}/favorites/check?hash=${album.albumhash}&type=album`, {
                headers: {
                    "Cookie": req.user
                }
            })).json();
            if (favorite.is_favorite) data.UserData.IsFavorite = true;

            return data;
        }));
    } else if (IncludeItemTypes === "MusicAlbum" && AlbumArtistIds) {
        albums = await (await fetch(`${global.config.music}/artist/${AlbumArtistIds}/albums?limit=7&all=false`, {
            headers: {
                "Cookie": req.user
            }
        })).json();
        albums.total = albums.appearances.length;

        output = albums.appearances.map(album => ({
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
            "Artists": album.albumartists.map(artist => artist.name),
            "ArtistItems": album.albumartists.map(artist => ({
                "Id": artist.artisthash,
                "Name": artist.name
            })),
            "AlbumArtist": album.albumartists[0].name,
            "AlbumArtists": album.albumartists.map(artist => ({
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
            albums = await (await fetch(`${global.config.music}/album`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({ albumhash: ParentId })
            })).json();

            if (albums?.error) {
                albums = await (await fetch(`${global.config.music}/playlists/${ParentId}?no_tracks=false`, {
                    headers: {
                        "Cookie": req.user
                    }
                })).json();
                console.log(albums)
            }

            albums.total = albums.tracks.length;

            if (albums.info?.albumartists) {
                output = albums.tracks.map(track => ({
                    "Album": track.album,
                    "AlbumArtist": track.albumartists[0].name,
                    "AlbumArtists": albums.info.albumartists.map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "AlbumId": track.albumhash,
                    "AlbumPrimaryImageTag": track.trackhash,
                    "ArtistItems": track.artists.map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "Artists": track.artists.map(artist => artist.name),
                    "BackdropImageTags": [],
                    "ChannelId": null,
                    "ChildCount": 0,
                    "Etag": track.trackhash,
                    "Genres": [
                        "Unknown"
                    ],
                    "Id": track.trackhash,
                    "ImageTags": {
                        "Primary": track.albumhash
                    },
                    "IndexNumber": track.track,
                    "IndexNumberEnd": albums.total,
                    "IsFolder": false,
                    "LocationType": "FileSystem",
                    "MediaType": "Audio",
                    "Name": track.title,
                    "ParentIndexNumber": 1,
                    "ParentPrimaryImageItemId": track.albumhash,
                    "PremiereDate": "2010-02-03T00:00:00.0000000Z", // change
                    "ProductionYear": albums.info.date,
                    "ProviderIds": {},
                    "RunTimeTicks": Math.round(track.duration * 9962075.847328244),
                    "ServerId": "server",
                    "SongCount": albums.total,
                    "Tags": [
                        "Unknown"
                    ],
                    "Type": "Audio",
                    "UserData": {
                        "IsFavorite": track.is_favorite,
                        "LastPlayedDate": "2019-08-24T14:15:22Z", // change
                        "Likes": false,
                        "PlaybackPositionTicks": 0,
                        "PlayCount": 0,
                        "Played": false,
                        "PlayedPercentage": 0,
                        "Rating": 0,
                        "UnplayedItemCount": 0,
                        "Key": track.albumhash
                    }
                }));
            } else {
                output = albums.tracks.map(track => ({
                    "Album": track.album,
                    "AlbumArtist": track.albumartists[0].name,
                    "AlbumArtists": track.albumartists.map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "AlbumId": track.albumhash,
                    "AlbumPrimaryImageTag": track.trackhash,
                    "ArtistItems": track.artists.map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "Artists": track.artists.map(artist => artist.name),
                    "BackdropImageTags": [],
                    "ChannelId": null,
                    "ChildCount": 0,
                    "Etag": track.trackhash,
                    "Genres": [
                        "Unknown"
                    ],
                    "Id": track.trackhash,
                    "ImageTags": {
                        "Primary": track.albumhash
                    },
                    "IndexNumber": track.track,
                    "IndexNumberEnd": albums.total,
                    "IsFolder": false,
                    "LocationType": "FileSystem",
                    "MediaType": "Audio",
                    "Name": track.title,
                    "ParentIndexNumber": 1,
                    "ParentPrimaryImageItemId": track.albumhash,
                    "PremiereDate": "2010-02-03T00:00:00.0000000Z", // change
                    "ProductionYear": track.date,
                    "ProviderIds": {},
                    "RunTimeTicks": Math.round(track.duration * 9962075.847328244),
                    "ServerId": "server",
                    "SongCount": albums.total,
                    "Tags": [
                        "Unknown"
                    ],
                    "Type": "Audio",
                    "UserData": {
                        "IsFavorite": track.is_favorite,
                        "LastPlayedDate": "2019-08-24T14:15:22Z", // change
                        "Likes": false,
                        "PlaybackPositionTicks": 0,
                        "PlayCount": 0,
                        "Played": false,
                        "PlayedPercentage": 0,
                        "Rating": 0,
                        "UnplayedItemCount": 0,
                        "Key": track.albumhash
                    }
                }));
            }
        } catch(err) {

        }
    } else if (IncludeItemTypes === "Playlist") {
        albums = await (await fetch(`${global.config.music}/playlists`, {
            headers: {
                "Cookie": req.user
            }
        })).json();
        albums.total = albums.data.length;

        output = albums.data.map(playlist => ({
            "Name": playlist.name,
            "ServerId": "server",
            "Id": String(playlist.id),
            "CanDelete": true,
            "SortName": playlist.name,
            "ChannelId": null,
            "RunTimeTicks": Math.round(playlist.duration * 9962075.847328244),
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
    // else if (IncludeItemTypes === "AllTracks") {
    //     const albumSize = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=1&sortby=created_date&reverse=1`)).json();
    //     albums = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=${albumSize.total}&sortby=created_date&reverse=1`)).json();

    //     for (let index = 0; index < albums.items.length; index++) {
    //         const album = albums.items[index];

    //         const tracks = await (await fetch(`${global.config.music}/album`, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify({ albumhash: album.albumhash })
    //         })).json();

    //         console.log(tracks)

    //         output = [
    //             ...output,
    //             tracks.tracks.map(track => ({
    //                 "Album": track.album,
    //                 "AlbumArtist": track.albumartists[0].name,
    //                 "AlbumArtists": tracks.info.albumartists.map(artist => ({
    //                     "Id": artist.artisthash,
    //                     "Name": artist.name
    //                 })),
    //                 "AlbumId": track.albumhash,
    //                 "AlbumPrimaryImageTag": track.trackhash,
    //                 "ArtistItems": track.artists.map(artist => ({
    //                     "Id": artist.artisthash,
    //                     "Name": artist.name
    //                 })),
    //                 "Artists": track.artists.map(artist => artist.name),
    //                 "BackdropImageTags": [],
    //                 "ChannelId": null,
    //                 "ChildCount": 0,
    //                 "Etag": track.trackhash,
    //                 "Genres": [
    //                     "Unknown"
    //                 ],
    //                 "Id": track.trackhash,
    //                 "ImageTags": {
    //                     "Primary": track.albumhash
    //                 },
    //                 "IndexNumber": track.track,
    //                 "IndexNumberEnd": tracks.total,
    //                 "IsFolder": false,
    //                 "LocationType": "FileSystem",
    //                 "MediaType": "Audio",
    //                 "Name": track.title,
    //                 "ParentIndexNumber": 1,
    //                 "ParentPrimaryImageItemId": track.albumhash,
    //                 "PremiereDate": "2010-02-03T00:00:00.0000000Z", // change
    //                 "ProductionYear": tracks.info.date,
    //                 "ProviderIds": {},
    //                 "RunTimeTicks": Math.round(track.duration * 9962075.847328244),
    //                 "ServerId": "server",
    //                 "SongCount": tracks.total,
    //                 "Tags": [
    //                     "Unknown"
    //                 ],
    //                 "Type": "Audio",
    //                 "UserData": {
    //                     "IsFavorite": track.is_favorite,
    //                     "LastPlayedDate": "2019-08-24T14:15:22Z", // change
    //                     "Likes": false,
    //                     "PlaybackPositionTicks": 0,
    //                     "PlayCount": 0,
    //                     "Played": false,
    //                     "PlayedPercentage": 0,
    //                     "Rating": 0,
    //                     "UnplayedItemCount": 0
    //                 }
    //             }))
    //         ]
    //     }
    // }

    if (Ids) {
        const id = Ids.split(",")[0];

        const albumSize = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=1&sortby=created_date&reverse=1`, {
            headers: {
                "Cookie": req.user
            }
        })).json();
        albums = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=${albumSize.total}&sortby=created_date&reverse=1`, {
            headers: {
                "Cookie": req.user
            }
        })).json();

        for (let index = 0; index < albums.items.length; index++) {
            const album = albums.items[index];

            const tracks = await (await fetch(`${global.config.music}/album`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.user
                },
                body: JSON.stringify({ albumhash: album.albumhash })
            })).json();

            if (tracks.tracks.find(track => track.trackhash === id)) {
                albums.total = tracks.total;
                output = tracks.tracks.map(track => ({
                    "Album": track.album,
                    "AlbumArtist": track.albumartists[0].name,
                    "AlbumArtists": tracks.info.albumartists.map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "AlbumId": track.albumhash,
                    "AlbumPrimaryImageTag": track.trackhash,
                    "ArtistItems": track.artists.map(artist => ({
                        "Id": artist.artisthash,
                        "Name": artist.name
                    })),
                    "Artists": track.artists.map(artist => artist.name),
                    "BackdropImageTags": [],
                    "ChannelId": null,
                    "ChildCount": 0,
                    "Etag": track.trackhash,
                    "Genres": [
                        "Unknown"
                    ],
                    "Id": track.trackhash,
                    "ImageTags": {
                        "Primary": track.albumhash
                    },
                    "IndexNumber": track.track,
                    "IndexNumberEnd": tracks.total,
                    "IsFolder": false,
                    "LocationType": "FileSystem",
                    "MediaType": "Audio",
                    "Name": track.title,
                    "ParentIndexNumber": 1,
                    "ParentPrimaryImageItemId": track.albumhash,
                    "PremiereDate": "2010-02-03T00:00:00.0000000Z", // change
                    "ProductionYear": tracks.info.date,
                    "ProviderIds": {},
                    "RunTimeTicks": Math.round(track.duration * 9962075.847328244),
                    "ServerId": "server",
                    "SongCount": tracks.total,
                    "Tags": [
                        "Unknown"
                    ],
                    "Type": "Audio",
                    "UserData": {
                        "IsFavorite": track.is_favorite,
                        "LastPlayedDate": "2019-08-24T14:15:22Z", // change
                        "Likes": false,
                        "PlaybackPositionTicks": 0,
                        "PlayCount": 0,
                        "Played": false,
                        "PlayedPercentage": 0,
                        "Rating": 0,
                        "UnplayedItemCount": 0
                    }
                }));
                break;
            }
        }
    }

    res.json({
        "Items": output,
        "TotalRecordCount": albums.total || 0,
        "StartIndex": Number(StartIndex) || 0
    });
});

router.get("/user/items/:id", async(req, res) => {
    const id = req.params.id;

    try {
        const albums = await (await fetch(`${global.config.music}/album`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({ albumhash: id })
        })).json();

        if (albums?.error) {
            const playlist = await (await fetch(`${global.config.music}/playlists/${id}?no_tracks=false`, {
                headers: {
                    "Cookie": req.user
                }
            })).json();

            const items = playlist.tracks.map(track => ({
                Album: track.album,
                AlbumArtist: track.artists[0].name,
                AlbumArtists: track.artists.map(artist => ({ Id: artist.artisthash, Name: artist.name })),
                AlbumId: track.albumhash,
                AlbumPrimaryImageTag: track.trackhash,
                ArtistItems: track.artists.map(artist => ({ Id: artist.artisthash, Name: artist.name })),
                Artists: track.artists.map(artist => artist.name),
                BackdropImageTags: [],
                ChannelId: null,
                ChildCount: 0,
                Etag: track.trackhash,
                Genres: ["Unknown"],
                Id: track.trackhash,
                ImageTags: { Primary: track.albumhash },
                IndexNumber: track.track,
                IndexNumberEnd: playlist.tracks.length,
                IsFolder: false,
                LocationType: "FileSystem",
                MediaType: "Audio",
                Name: track.title,
                ParentIndexNumber: 1,
                ParentPrimaryImageItemId: track.albumhash,
                PremiereDate: "2010-02-03T00:00:00.0000000Z",
                ProductionYear: track.created_date,
                ProviderIds: {},
                RunTimeTicks: Math.round(track.duration * 9962075.847328244),
                ServerId: "server",
                SongCount: playlist.tracks.length,
                Tags: ["Unknown"],
                Type: "Audio",
                UserData: { PlaybackPositionTicks: 0, PlayCount: 0, IsFavorite: false, Played: false }
            }));

            return res.json({
                Items: items,
                TotalRecordCount: playlist.info.count,
                StartIndex: 0,
                ServerId: "server"
            });
        }

        const items = albums.tracks.map(track => ({
            Album: track.album,
            AlbumArtist: track.albumartists[0].name,
            AlbumArtists: albums.info.albumartists.map(artist => ({ Id: artist.artisthash, Name: artist.name })),
            AlbumId: track.albumhash,
            AlbumPrimaryImageTag: track.trackhash,
            ArtistItems: track.artists.map(artist => ({ Id: artist.artisthash, Name: artist.name })),
            Artists: track.artists.map(artist => artist.name),
            BackdropImageTags: [],
            ChannelId: null,
            ChildCount: 0,
            Etag: track.trackhash,
            Genres: ["Unknown"],
            Id: track.trackhash,
            ImageTags: { Primary: track.albumhash },
            IndexNumber: track.track,
            IndexNumberEnd: albums.tracks.length,
            IsFolder: false,
            LocationType: "FileSystem",
            MediaType: "Audio",
            Name: track.title,
            ParentIndexNumber: 1,
            ParentPrimaryImageItemId: track.albumhash,
            PremiereDate: "2010-02-03T00:00:00.0000000Z",
            ProductionYear: albums.info.date,
            ProviderIds: {},
            RunTimeTicks: Math.round(track.duration * 9962075.847328244),
            ServerId: "server",
            SongCount: albums.tracks.length,
            Tags: ["Unknown"],
            Type: "Audio",
            UserData: { PlaybackPositionTicks: 0, PlayCount: 0, IsFavorite: false, Played: false }
        }));

        res.json({
            Items: items,
            TotalRecordCount: albums.tracks.length,
            StartIndex: 0,
            Name: albums.info.title,
            ServerId: "server",
            Id: albums.info.albumhash,
            Etag: albums.info.albumhash,
            DateCreated: "2024-03-04T00:39:33.730766Z",
            CanDelete: true,
            CanDownload: true,
            SortName: albums.info.title,
            PremiereDate: "2010-02-03T00:00:00.0000000Z",
            ExternalUrls: [],
            Path: "undefined",
            EnableMediaSourceDisplay: true,
            ChannelId: null,
            Taglines: [],
            Genres: albums.info.genres,
            CumulativeRunTimeTicks: Math.round(albums.info.duration * 9962075.847328244),
            RunTimeTicks: Math.round(albums.info.duration * 9962075.847328244),
            PlayAccess: "Full",
            ProductionYear: albums.info.date,
            RemoteTrailers: [],
            ProviderIds: {},
            IsFolder: true,
            ParentId: albums.info.albumhash,
            Type: "MusicAlbum",
            People: [],
            Studios: [],
            GenreItems: [],
            LocalTrailerCount: 0,
            UserData: {
                PlaybackPositionTicks: 0,
                PlayCount: 0,
                IsFavorite: albums.info.is_favorite,
                Played: false
            },
            RecursiveItemCount: albums.info.count,
            ChildCount: albums.info.count,
            SpecialFeatureCount: 0,
            DisplayPreferencesId: albums.info.albumhash,
            Tags: [],
            PrimaryImageAspectRatio: 1,
            Artists: albums.info.albumartists.map(artist => artist.name),
            ArtistItems: albums.info.albumartists.map(artist => ({ Name: artist.name, Id: artist.artisthash })),
            AlbumArtist: albums.info.albumartists[0].name,
            AlbumArtists: albums.info.albumartists.map(artist => ({ Name: artist.name, Id: artist.artisthash })),
            ImageTags: { Primary: albums.info.albumhash },
            BackdropImageTags: [],
            LocationType: "FileSystem",
            LockedFields: [],
            LockData: false
        });
    } catch (err) {
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

        const artist = await fetch(`${global.config.music}/artist/${id}/albums?limit=1&all=false`, {
            headers: {
                "Cookie": req.user
            }
        });
        const album = await fetch(`${global.config.music}/album`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({ albumhash: id })
        });

        const type = artist.ok ? "artist" : album.ok ? "album" : "track";
        if (type) await fetch(`${global.config.music}/favorite/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({
                type: type,
                hash: id
            })
        });

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

        const artist = await fetch(`${global.config.music}/artist/${id}/albums?limit=1&all=false`, {
            headers: {
                "Cookie": req.user
            }
        });
        const album = await fetch(`${global.config.music}/album`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({ albumhash: id })
        });

        const type = artist.ok ? "artist" : album.ok ? "album" : "track";
        if (type) await fetch(`${global.config.music}/favorite/remove`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({
                type: type,
                hash: id
            })
        });

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
    router: router,
    name: "users"
}