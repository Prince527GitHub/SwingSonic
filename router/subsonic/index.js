const { getFileList } = require("../../packages/files");

const { sanitizeCookie } = require("../../packages/cookie");
const { hashPassword } = require("../../packages/crypto");
const { toArray } = require("../../packages/utils");

const api = require("../../packages/swingmusic");
const proxy = require("../../packages/proxy");
const xml = require("../../packages/xml");

const path = require("path");

async function checkPassword(input, salt, user) {
    if (!input || !user?.username) return false
    try {
        let password

        if (input.startsWith("enc:")) password = Buffer.from(input.substring(4), "hex").toString("utf-8")
        else if (salt) {
            const getUser = global.config.server.users.find(u => u.username === user.username)
            if (!getUser?.password) return false

            const hash = hashPassword(getUser.password, salt)
            if (hash !== input) return false

            password = getUser.password
        } else password = input

        const response = await api.request("/auth/login", { method: "POST", body: { username: user.username, password }, raw: true });

        return sanitizeCookie(response?.headers?.get("set-cookie")) || false;
    } catch {
        return false;
    }
}

function respond(res, req, json) {
    const format = toArray(req.query.f).find(Boolean);

    if (format === "json") res.json(json);
    else res.send(xml(json));
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
    }
}

async function checkAuth(req, res, next) {
    let { u, p, t, s } = req.query;

    if (!u || (!p && (!t || !s))) return respond(res, req, error("unauthorized"));

    const users = await api.auth().getAllUsers({ simplified: true })

    const user = users.users.find(user => user.username === u);
    if (!user) return respond(res, req, error("unauthorized"));

    if (!p) p = t;

    const token = await checkPassword(p, s, user);
    if (!token) return respond(res, req, error("unauthorized"));

    req.user = token;

    next();
}

module.exports = async(app) => {
    app.use("/rest/getOpenSubsonicExtensions.view", (req, res) =>
        respond(res, req, {
            "subsonic-response": {
                "openSubsonicExtensions": [],
                status: "ok",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true
            }
        })
    );

    app.use("/rest", checkAuth);

    const routes = await getFileList(`${process.cwd()}/router/subsonic`, { type: ".js", recursively: false });

    routes.map((value) => {
        if (!value.includes("index.js")) {
            const route = require(value);

            const name = path.basename(value).split(".js")[0];
            const handler = route.handler || route;

            app.get(new RegExp(`^/rest/${name}(\\.view)?$`), async (req, res) => handler(req, res, proxy, respond));

            if (route.aliases) {
                for (const alias of route.aliases) {
                    app.get(new RegExp(`^/rest/${alias}(\\.view)?$`), async (req, res) => handler(req, res, proxy, respond));
                }
            }
        }
    });

    app.use("/rest", (req, res) =>
        respond(res, req, {
            "subsonic-response": {
                status: "ok",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true
            }
        })
    );
};
