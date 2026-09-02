const express = require("express");
const router = express.Router();

router.all("/{*any}", (req, res) => res.send("ok"))

module.exports = {
    router: router,
    name: "socket"
}
