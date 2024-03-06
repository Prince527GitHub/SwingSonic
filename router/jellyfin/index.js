const { getFileList } = require("../../packages/files");

module.exports = async(app) => {
    const routeFiles = await getFileList(`${process.cwd()}/router/jellyfin`, { type: ".js", recursively: false });

    routeFiles.map((value) => {
        if (!value.includes("index.js")) {
            const { name, router } = require(value);

            app.use(`/${name}`, router);
        }
    });
}