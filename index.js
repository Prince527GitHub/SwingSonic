const { envString, envJSON } = require("./packages/env");

try {
    global.config = require("./config.json");
} catch (e) {
    global.config = envJSON(envString(require('dotenv').config()));
}

console.log(`Why is docker so goofed: ${global.config}`, global.config);

if (!global.config) {
    console.log("\x1b[31m[ERROR] No config.json file found\x1b[0m");
    process.exit();
}

const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({ origin: "*" }));
app.use(require("./packages/logs"));

if (global.config.server.api.subsonic) require("./router/subsonic")(app);
if (global.config.server.api.jellyfin) require("./router/jellyfin")(app);
if (global.config.server.api.euterpe) require("./router/euterpe")(app);

app.listen(global.config.server.port, () => {
    console.log("\x1b[35m   ▄▄▄▄▄    ▄ ▄   ▄█    ▄     ▄▀    ▄▄▄▄▄   ████▄    ▄   ▄█ ▄█▄      ▄ \x1b[0m");
    console.log("\x1b[35m  █     ▀▄ █   █  ██     █  ▄▀     █     ▀▄ █   █     █  ██ █▀ ▀▄   █  \x1b[0m");
    console.log("\x1b[35m▄  ▀▀▀▀▄  █ ▄   █ ██ ██   █ █ ▀▄ ▄  ▀▀▀▀▄   █   █ ██   █ ██ █   ▀  █   \x1b[0m");
    console.log("\x1b[35m ▀▄▄▄▄▀   █  █  █ ▐█ █ █  █ █   █ ▀▄▄▄▄▀    ▀████ █ █  █ ▐█ █▄  ▄▀ █   \x1b[0m");
    console.log("\x1b[35m           █ █ █   ▐ █  █ █  ███                  █  █ █  ▐ ▀███▀      \x1b[0m");
    console.log("\x1b[35m            ▀ ▀      █   ██                       █   ██           ▀   \x1b[0m");
    console.log("\x1b[35m                                                                       \x1b[0m");

    console.log(`> \x1b[34mSubsonic\x1b[0m ${global.config.server.api.subsonic? "\x1b[32m\u2714\x1b[0m" : "\x1b[31m\u2718\x1b[0m"}`);
    console.log(`> \x1b[34mJellyfin\x1b[0m ${global.config.server.api.jellyfin? "\x1b[32m\u2714\x1b[0m" : "\x1b[31m\u2718\x1b[0m"}`);
    console.log(`> \x1b[34mEuterpe\x1b[0m ${global.config.server.api.euterpe? "\x1b[32m\u2714\x1b[0m" : "\x1b[31m\u2718\x1b[0m"}`);
});
