const express = require("express");
const router = express.Router();

const api = require("../../packages/swingmusic");

router.post("/token", async (req, res) => {
    const { username, password } = req.body;

    try {
        const response = await api.request("/auth/login", { method: "POST", body: { username, password }, raw: true });
        if (!response.ok) return res.sendStatus(401);

        res.json({ token: `${username}:${password}` });
    } catch {
        res.sendStatus(502);
    }
});

module.exports = {
    router,
    name: "login"
};
