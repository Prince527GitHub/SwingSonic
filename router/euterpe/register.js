const express = require("express");
const router = express.Router();

router.post("/token", async(req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.sendStatus(401);

    res.json({ token: auth.replace(/^Bearer /, "") });
});

module.exports = {
    router: router,
    name: "register"
}
