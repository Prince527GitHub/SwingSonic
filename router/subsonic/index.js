const { getFileList } = require("../../packages/files");

const { hashPassword } = require("../../packages/crypto");
const { convertToXml } = require("../../packages/xml");
const proxy = require("../../packages/proxy");

const path = require("path");

function checkPassword(string, salt, password) {
    if (string.startsWith("enc:")) {
        try {
            const encodedData = string.substring(4);
            const decodedString = Buffer.from(encodedData, 'hex').toString('utf-8');
            return decodedString;
        } catch (error) {
            return false;
        }
    } else {
        if (string && salt && password) {
            try {
                const hashed = hashPassword(password, salt);
                return hashed === string;
            } catch (error) {
                return false;
            }
        } else return false;
    }
}

function checkAuth(req, res, next) {
    let { u, p, t, s, f } = req.query;

    const json = {
        "subsonic-response": {
            status: "unauthorized",
            version: "1.16.1"
        }
    }

    if (global.config.server.users.length) {
        if (!u || (!p && (!t || !s))) {
            if (f === "json") return res.json(json);
            else return res.send(convertToXml(json));
        }

        const user = global.config.server.users.find(user => user.username === u);
        if (!user) {
            if (f === "json") return res.json(json);
            else return res.send(convertToXml(json));
        }

        if (!p) p = t;

        if (!checkPassword(p, s, user.password)) {
            if (f === "json") return res.json(json);
            else return res.send(convertToXml(json));
        }
    }

    next();
}

module.exports = async(app) => {
    app.use("/rest/*", checkAuth);

    const routeFiles = await getFileList(`${process.cwd()}/router/subsonic`, { type: ".js", recursively: false });

    routeFiles.map((value) => {
        if (!value.includes("index.js")) {
            const route = require(value);

            const name = path.basename(value).split(".js")[0];

            app.get(`/rest/${name}`, async(req, res) => route(req, res, proxy, convertToXml));
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