const { getFileList } = require("../../packages/files");

const { hashPassword } = require("../../packages/crypto");
const { convertToXml } = require("../../packages/xml");
const proxy = require("../../packages/proxy");

const path = require("path");

async function checkPassword(input, salt, user) {
    if (!input || !user?.username) return false;

    try {
        let password;

        if (input.startsWith("enc:")) password = Buffer.from(input.substring(4), "hex").toString("utf-8");
        else if (salt) {
            const getUser = global.config.server.users.find(u => u.username === user.username);
            if (!getUser?.password) return false;

            const expectedHash = hashPassword(getUser.password, salt);
            if (expectedHash !== input) return false;

            password = getUser.password;
        } else password = input;

        const auth = await fetch(`${global.config.music}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user.username, password })
        });

        return auth?.headers?.get("set-cookie") || false;
    } catch {
        return false;
    }
}

function getF(req) {
    return [].concat(req.query.f).filter(Boolean)[0];
}

function respond(res, req, json) {
    const f = getF(req);
    if (f === "json") res.json(json);
    else res.send(convertToXml(json));
}

function error(status, code, message) {
    return {
        "subsonic-response": {
            status,
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true,
            ...(code ? { error: { code, message } } : {})
        }
    };
}

async function checkAuth(req, res, next) {
    let { u, p, t, s } = req.query;

    if (!u || (!p && (!t || !s))) return respond(res, req, error("unauthorized"));

    const users = await (await fetch(`${global.config.music}/auth/users?simplified=true`)).json();

    const user = users.users.find(user => user.username === u);
    if (!user) return respond(res, req, error("unauthorized"));

    if (!p) p = t;

    const token = await checkPassword(p, s, user);
    if (!token) return respond(res, req, error("unauthorized"));

    req.user = token;

    next();
}

module.exports = async(app) => {
    app.use("/rest/getOpenSubsonicExtensions.view", (req, res) => {
        respond(res, req, {
            "subsonic-response": {
                "openSubsonicExtensions": [],
                status: "ok",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true
            }
        });
    });

    app.use("/rest/*", checkAuth);

    const routeFiles = await getFileList(`${process.cwd()}/router/subsonic`, { type: ".js", recursively: false });

    routeFiles.map((value) => {
        if (!value.includes("index.js")) {
            const route = require(value);

            const name = path.basename(value).split(".js")[0];

            app.get(new RegExp(`^/rest/${name}(\\.view)?$`), async(req, res) => route(req, res, proxy, respond));
        }
    });

    app.use("/rest/*", (req, res) => {
        respond(res, req, {
            "subsonic-response": {
                status: "ok",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true
            }
        });
    });
}
