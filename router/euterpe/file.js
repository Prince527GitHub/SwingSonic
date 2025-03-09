const express = require("express");
const router = express.Router();

const proxy = require("../../packages/proxy");

router.get("/:id", async(req, res) => {
    const id = req.query.id;

    const decoded = JSON.parse(id);

    proxy(res, req, `${global.config.music}/file/${decoded.id}/legacy?filepath=${decoded.path}&container=mp3&quality=original`);
});

module.exports = {
    router: router,
    name: "file"
}