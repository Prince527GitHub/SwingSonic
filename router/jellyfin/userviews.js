const express = require("express");
const router = express.Router();

const api = require("../../packages/swingmusic");

router.get("/", async (req, res) => {
    const folders = await api.folder(req.user).getFolderTree({ folder: "$home", tracks_only: false });

    const items = folders.folders.map(folder => ({
        Name: folder.name,
        ServerId: "server",
        Id: folder.name,
        Etag: "tag",
        DateCreated: "2024-03-04T00:39:17.500887Z",
        CanDelete: false,
        CanDownload: false,
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

module.exports = {
    router,
    name: "userviews"
};
