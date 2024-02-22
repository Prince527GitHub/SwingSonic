module.exports = (req, res, next) => {
    const KL = 1024;
    const MB = KL * KL;

    const startTime = Date.now();

    res.on('finish', () => {
        const reqTx = req.method + ' '.repeat(4 - req.method.length) + '\x1b[0m';

        const time = Date.now() - startTime;
        const timeStr = time < 1000 ? time.toString() : (time / 1000).toFixed(1) + 's';
        const timeTx = ' '.repeat(5 - timeStr.length) + timeStr;

        const size = parseInt((req.method === 'POST' ? req : res).get('Content-Length') || '0');
        const sizeStr = size < KL ? size.toString() : size < MB ? (size / KL).toFixed(1) + 'K' : (size / MB).toFixed(1) + 'M';
        const sizeTx = ' '.repeat(7 - sizeStr.length) + sizeStr;

        const stat = res.statusCode;
        const color = stat >= 500 ? 31 : stat >= 400 ? 33 : stat >= 300 ? 36 : stat >= 200 ? 32 : 0;
        const statTx = `\x1b[${color}m${stat}\x1b[0m`;

        const logTx = `${statTx} ${reqTx} ${timeTx} ${sizeTx} ${req.originalUrl}\n`;

        process.stdout.write(logTx);
    });

    next();
}