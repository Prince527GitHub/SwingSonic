const { getFileList } = require("../../packages/files");

const { hashPassword } = require("../../packages/crypto");
const { convertToXml } = require("../../packages/xml");
const proxy = require("../../packages/proxy");

const path = require("path");

async function checkPassword(string, salt, user) {
    if (string) {
        const auth = await fetch(`${global.config.music}/auth/login`, {
            method: "POST",
            body: JSON.stringify({
                username: user.username,
                password: string
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        return auth?.headers?.get("set-cookie") || false;
    } else if (string.startsWith("enc:")) {
        try {
            const encodedData = string.substring(4);
            const decodedString = Buffer.from(encodedData, "hex").toString("utf-8");

            const auth = await fetch(`${global.config.music}/auth/login`, {
                method: "POST",
                body: JSON.stringify({
                    username: user.username,
                    password: decodedString
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            return auth?.headers?.get("set-cookie") || false;
        } catch (error) {
            return false;
        }
    } else {
        if (string && salt && password) {
            try {
                // You would have to unhash the password to keep this.
                const hashed = hashPassword(password, salt);
                return hashed === string;
            } catch (error) {
                return false;
            }
        } else return false;
    }
}

async function checkAuth(req, res, next) {
    let { u, p, t, s, f } = req.query;

    const json = {
        "subsonic-response": {
            status: "unauthorized",
            version: "1.16.1"
        }
    }

    if (!u || (!p && (!t || !s))) {
        if (f === "json") return res.json(json);
        else return res.send(convertToXml(json));
    }

    const users = await (await fetch(`${global.config.music}/auth/users?simplified=true`)).json();

    const user = users.users.find(user => user.username === u);
    if (!user) {
        if (f === "json") return res.json(json);
        else return res.send(convertToXml(json));
    }

    if (!p) p = t;

    const token = await checkPassword(p, s, user);
    if (!token) {
        if (f === "json") return res.json(json);
        else return res.send(convertToXml(json));
    }

    req.user = token;

    next();
}

module.exports = async(app) => {
    app.use("/rest/*", checkAuth);

    const routeFiles = await getFileList(`${process.cwd()}/router/subsonic`, { type: ".js", recursively: false });

    routeFiles.map((value) => {
        if (!value.includes("index.js")) {
            const route = require(value);

            const name = path.basename(value).split(".js")[0];

            app.get(new RegExp(`^/rest/${name}(\\.view)?$`), async(req, res) => route(req, res, proxy, convertToXml));
        }
    });

    app.use("/rest/*", (req, res, next) => {
        let { f } = req.query;

        const json = {
            "subsonic-response": {
                status: "ok",
                version: "1.16.1"
            }
        }

        if (f === "json") res.status(200).json(json);
        else res.status(200).send(convertToXml(json));
    });
}