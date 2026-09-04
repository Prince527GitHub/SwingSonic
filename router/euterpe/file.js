const express = require("express");
const router = express.Router();

const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");
const proxy = require("../../packages/proxy");

router.get("/:id", async (req, res) => {
    const decoded = codecs.decode(req.params.id);
    if (!decoded?.id || !decoded?.path) return res.sendStatus(404);

    proxy(res, req, api.url(`/file/${encodeURIComponent(decoded.id)}/legacy?filepath=${encodeURIComponent(decoded.path)}`));
});

module.exports = {
    router,
    name: "file"
};
