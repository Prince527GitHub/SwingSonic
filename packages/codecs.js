function decode(id) {
    if (!id) return null;

    try {
        let raw = id;

        try {
            raw = decodeURIComponent(raw);
        } catch {}

        raw = raw.replace(/ /g, "+");

        try {
            const decoded = decodeURIComponent(raw);
            if (decoded !== raw && /^[A-Za-z0-9+/=]+$/.test(decoded.replace(/\s/g, ""))) raw = decoded;
        } catch {}

        return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    } catch {
        return null;
    }
}

function id(decoded) {
    return decode(decoded)?.id || decoded;
}

function encode(data) {
    return Buffer.from(JSON.stringify(data)).toString("base64");
}

module.exports = {
    encode,
    decode,
    id
};
