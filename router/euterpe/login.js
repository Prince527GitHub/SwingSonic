const express = require("express");
const router = express.Router();

router.post("/token", async(req, res) => {
    const { username, password } = req.body;

    try {
        const response = await fetch(`${global.config.music}/auth/login`, {
            method: "POST",
            body: JSON.stringify({ username, password }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) return res.sendStatus(401);

        res.json({ token: `${username}:${password}` });
    } catch {
        res.sendStatus(502);
    }
});

module.exports = {
    router: router,
    name: "login"
}
