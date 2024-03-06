const express = require("express");
const router = express.Router();

const proxy = require("../../packages/proxy");

router.get("/:id/universal", async(req, res) => {
    const id = req.params.id;

    const url = `${global.config.music}/file/${id}`;

    if (global.config.server.proxy) proxy(res, url);
    else res.redirect(url);
});

module.exports = {
    router: router,
    name: "audio"
}