function decode(id) {
    if (!id) return null;

    try {
        return JSON.parse(Buffer.from(decodeURIComponent(id), "base64").toString("utf-8"));
    } catch {
        return null;
    }
}

function trackhash(id) {
    return decode(id)?.id || id;
}

module.exports = {
    decode,
    trackhash
};
