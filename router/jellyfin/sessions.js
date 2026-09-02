const express = require("express");
const router = express.Router();

router.all("/{*any}", (req, res) => res.status(204).send())

module.exports = {
    router: router,
    name: "sessions"
}
