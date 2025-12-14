function get(obj, path, fallback = undefined) {
    try {
        return path.split(".").reduce((current, prop) => {
            if (current === undefined || current === null) return fallback;

            const match = prop.match(/^(\w+)\[(\d+)\]$/);
            if (match) {
                const [, name, index] = match;
                return current[name]?.[parseInt(index)];
            }

            return current[prop];
        }, obj) ?? fallback;
    } catch {
        return fallback;
    }
}

function safe(fn, fallback = undefined) {
    try {
        const result = fn();
        return result === undefined || result === null ? fallback : result;
    } catch {
        return fallback;
    }
}

function safeDecode(id) {
    try {
        const json = Buffer.from(decodeURIComponent(id), "base64").toString("utf-8");
        return JSON.parse(json);
    } catch {
        return null;
    }
}

module.exports = {
    safeDecode,
    safe,
    get
}