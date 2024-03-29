const express = require("express");
const router = express.Router();

router.get("/info*", (req, res) => res.json({
    LocalAddress: global.config.server.url,
    ServerName: "Swingfin",
    Version: "10.8.13",
    ProductName: "Swingfin Server",
    OperatingSystem: "Nodejs",
    Id: "server",
    StartupWizardCompleted: true
}));

router.get("/endpoint", (req, res) => res.json({
    IsLocal: true,
    IsInNetwork: true
}));

module.exports = {
    router: router,
    name: "system"
}