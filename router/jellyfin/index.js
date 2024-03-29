const { getFileList } = require("../../packages/files");

async function checkAuth(req, res, next) {
    const login = ["/branding/configuration", "/displaypreferences/usersettings", "/playback/bitratetest", "/quickconnect/enabled", "/sessions/capabilities/full", "/system/endpoint", "/system/info", "/system/info/public", "/users/authenticatebyname", "/users/public", "/users/user", "/userviews/","/branding/css"];

    const { server } = global.config;

    if (server.users.length && !login.includes(`${req.baseUrl.toLowerCase()}${req.path.toLowerCase()}`)) {
        const tokenHeader = req.headers["x-emby-token"] || req.headers["x-emby-authorization"] || req.headers["x-mediabrowser-token"] || req.headers["authorization"] || req.query.api_key || req.query.ApiKey;
        if (!tokenHeader) return res.sendStatus(401);

        const token = tokenHeader.includes('Token=') ? tokenHeader.match(/Token="([^"]*)"/)?.[1] : tokenHeader;
        if (!token) return res.sendStatus(401);

        const [username, password] = token.split("@");
        if (!server.users.some(user => user.username === username && user.password === password)) return res.sendStatus(401);
    }

    next();
}

module.exports = async(app) => {
    const routeFiles = await getFileList(`${process.cwd()}/router/jellyfin`, { type: ".js", recursively: false });

    routeFiles.map((value) => {
        if (!value.includes("index.js")) {
            const { name, router } = require(value);

            const exclude = ["items"];

            if (!exclude.includes(name)) app.use(`/${name}`, checkAuth, router);
            else app.use(`/${name}`, router);
        }
    });
}

module.exports.checkAuth = checkAuth;