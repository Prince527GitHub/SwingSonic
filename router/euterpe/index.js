const { getFileList } = require("../../packages/files");

async function checkAuth(req, res, next) {
    const login = ["/v1/login/token/", "/v1/register/token/"];

    if (!login.includes(req.originalUrl)) {
        try {
            const auth = req.headers["authorization"] || `Bearer ${req.query.token}`;
            const credentials = auth.split(" ")[1];
            const [username, password] = credentials.split(":");

            const user = await fetch(`${global.config.music}/auth/login`, {
                method: "POST",
                body: JSON.stringify({
                    username,
                    password
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!user.ok) return res.sendStatus(401);

            req.user = user.headers.get("set-cookie");
        } catch {
            return res.sendStatus(401);
        }
    }

    next();
}

module.exports = async(app) => {
    app.use("/v1/*", checkAuth);

    const routeFiles = await getFileList(`${process.cwd()}/router/euterpe`, { type: ".js", recursively: false });

    routeFiles.map((value) => {
        if (!value.includes("index.js")) {
            const { name, router } = require(value);

            app.use(`/v1/${name}`, router);
        }
    });
}