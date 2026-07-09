function format(bytes) {
    if (bytes < 1024) return `${bytes}`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)}K`;
    return `${(bytes / 1024 ** 2).toFixed(1)}M`;
}

module.exports = (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const time = Date.now() - start;
        const size = Number((req.method === "POST" ? req : res).get("Content-Length")) || 0;

        const status = res.statusCode;
        const color = status >= 500 ? 31 : status >= 400 ? 33 : status >= 300 ? 36 : status >= 200 ? 32 : 0;

        process.stdout.write(
            `\x1b[${color}m${status}\x1b[0m ` +
            `${req.method.padEnd(4)} ` +
            `${(time < 1000 ? `${time}` : `${(time / 1000).toFixed(1)}s`).padStart(5)} ` +
            `${format(size).padStart(7)} ` +
            `${req.originalUrl}\n`
        );
    });

    next();
};
