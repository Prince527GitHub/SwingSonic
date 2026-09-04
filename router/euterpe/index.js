const { sanitizeCookie } = require("../../packages/cookie");
const { getFileList } = require("../../packages/files");

async function checkAuth(req, res, next) {
    if (["/login/token", "/login/token/"].includes(req.path)) return next();

    try {
        const auth = req.headers.authorization || (req.query.token && `Bearer ${req.query.token}`);
        if (!auth) return res.sendStatus(401);

        let credentials;

        if (auth.startsWith("Basic ")) credentials = Buffer.from(auth.slice(6), "base64").toString("utf8");
        else if (auth.startsWith("Bearer ")) credentials = auth.slice(7);
        else return res.sendStatus(401);

        const sep = credentials.indexOf(":");
        if (sep < 1) return res.sendStatus(401);

        const username = credentials.slice(0, sep);
        const password = credentials.slice(sep + 1);

        const response = await fetch(`${global.config.music}/auth/login`, {
            method: "POST",
            body: JSON.stringify({ username, password }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        req.user = sanitizeCookie(response?.headers?.get("set-cookie")) || false;
    } catch {
        return res.sendStatus(401);
    }

    if (!req.user) return res.sendStatus(401);

    next();
}

module.exports = async(app) => {
    app.use("/v1", checkAuth);

    const routeFiles = await getFileList(`${process.cwd()}/router/euterpe`, { type: ".js", recursively: false });

    routeFiles.map((value) => {
        if (!value.includes("index.js")) {
            const { name, router } = require(value);

            app.use(`/v1/${name}`, router);
        }
    });
}
