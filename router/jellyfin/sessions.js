const express = require("express");
const router = express.Router();

router.all("/*", (req, res) => res.status(204).send())

module.exports = {
    router: router,
    name: "sessions"
}