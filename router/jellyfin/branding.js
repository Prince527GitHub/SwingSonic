const express = require("express");
const router = express.Router();

router.all("/*", (req, res) => res.send("ok"));

module.exports = {
    router: router,
    name: "branding"
}