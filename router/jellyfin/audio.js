const express = require("express");
const router = express.Router();

const codecs = require("../../packages/codecs");
const proxy = require("../../packages/proxy");

router.get("/:id/{*any}", async(req, res) => {
    const id = req.params.id;

    const decoded = codecs.decode(id);
    if (!decoded?.id || !decoded?.path) return res.sendStatus(404);

    proxy(res, req, `${global.config.music}/file/${decoded.id}/legacy?filepath=${encodeURIComponent(decoded.path)}&container=mp3&quality=original`);
});

module.exports = {
    router: router,
    name: "audio"
}
