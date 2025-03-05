const express = require("express");
const router = express.Router();

const proxy = require("../../packages/proxy");

router.get("/:id", async(req, res) => {
    const id = req.params.id;

    proxy(res, req, `${global.config.music}/file/${id}`);
});

module.exports = {
    router: router,
    name: "file"
}