const express = require("express");
const router = express.Router();

const codecs = require("../../packages/codecs");
const proxy = require("../../packages/proxy");

router.get("/:id", async(req, res) => {
    const decoded = codecs.decode(req.params.id);
    if (!decoded?.id || !decoded?.path) return res.sendStatus(404);

    proxy(res, req, `${global.config.music}/file/${encodeURIComponent(decoded.id)}/legacy?filepath=${encodeURIComponent(decoded.path)}`);
});

module.exports = {
    router: router,
    name: "file"
}
