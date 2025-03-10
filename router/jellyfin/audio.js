const express = require("express");
const router = express.Router();

const proxy = require("../../packages/proxy");

router.get("/:id/*", async(req, res) => {
    const id = req.params.id;

    const decoded = JSON.parse(Buffer.from(decodeURIComponent(id), "base64").toString("utf-8"));

    proxy(res, req, `${global.config.music}/file/${decoded.id}/legacy?filepath=${encodeURIComponent(decoded.path)}&container=mp3&quality=original`);
});

module.exports = {
    router: router,
    name: "audio"
}