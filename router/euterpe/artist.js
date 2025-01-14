const express = require("express");
const router = express.Router();

const proxy = require("../../packages/proxy");

router.get("/:id/image", async(req, res) => {
    const id = req.params.id;

    proxy(res, req, `${global.config.music}/img/thumbnail/medium/${id}.webp`);
});

module.exports = {
    router: router,
    name: "artist"
}