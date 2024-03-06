const express = require("express");
const router = express.Router();

router.get("/programs/recommended", (req, res) => res.json({
    "Items": [],
    "TotalRecordCount": 0,
    "StartIndex": 0
}));

module.exports = {
    router: router,
    name: "livetv"
}