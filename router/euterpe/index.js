const { getFileList } = require("../../packages/files");

function checkAuth(req, res, next) {
    const login = ["/v1/login/token/", "/v1/register/token/"];

    if (global.config.server.users.length && !login.includes(req.originalUrl)) {
        try {
            const auth = req.headers["authorization"] || `Bearer ${req.query.token}`;
            const credentials = auth.split(' ')[1];
            const [username, password] = credentials.split(':');

            const user = global.config.server.users.find(user => user.username === username && user.password === password);
            if (!user) return res.sendStatus(401);
        } catch(err) {
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