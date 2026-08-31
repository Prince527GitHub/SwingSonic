const express = require("express");
const router = express.Router();

const proxy = require("../../packages/proxy");
const decode = require("../../packages/decode");

router.get("/:id", async(req, res) => {
    const id = req.params.id;

    const decoded = decode.decode(id);

    proxy(res, req, `${global.config.music}/file/${decoded.id}/legacy?filepath=${encodeURIComponent(decoded.path)}&container=mp3&quality=original`);
});

module.exports = {
    router: router,
    name: "file"
}
