function decode(id) {
    if (!id) return null;

    try {
        let value = decodeURIComponent(id).replace(/ /g, "+");

        try {
            const decoded = decodeURIComponent(value);
            if (/^[A-Za-z0-9+/=]+$/.test(decoded.replace(/\s/g, ""))) value = decoded;
        } catch {}

        return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
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
