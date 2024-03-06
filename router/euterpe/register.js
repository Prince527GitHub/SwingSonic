const express = require("express");
const router = express.Router();

router.post("/token", async(req, res) => {
    const { username, password } = req.body;

    res.json({ token: `${username}:${password}` });
});

module.exports = {
    router: router,
    name: "register"
}