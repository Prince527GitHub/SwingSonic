const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({ server_version: "3.0.0" });
});

module.exports = {
    router: router,
    name: "about"
};
