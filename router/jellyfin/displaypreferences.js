const express = require("express");
const router = express.Router();

router.all("/usersettings", async(req, res) => res.json({
    Id: "user",
    SortBy: "SortName",
    RememberIndexing: true,
    PrimaryImageHeight: 0,
    PrimaryImageWidth: 0,
    CustomPrefs: {},
    ScrollDirection: "Horizontal",
    ShowBackdrop: false,
    RememberSorting: true,
    SortOrder: "Ascending",
    ShowSidebar: true,
    Client: "emby"
}))

module.exports = {
    router: router,
    name: "displaypreferences"
}