const { XML } = require("bun");

function prim(value) {
    return value instanceof Date ? value.toISOString() : String(value);
}

function build(object) {
    if (object === null || object === undefined) return null;

    if (object instanceof Date) return object.toISOString();
    if (typeof object !== "object") return String(object);

    const out = {};
    for (const [name, value] of Object.entries(object)) {
        if (value === null || value === undefined) continue;
        const key = name.replace(/^[^a-zA-Z_]+/, "_").replace(/[^a-zA-Z0-9_]/g, "_");

        if (Array.isArray(value)) {
            const array = value
                .filter(item => item !== null && item !== undefined)
                .map(item => (typeof item === "object" ? build(item) : prim(item)));
            if (array.length) out[key] = array;
        } else if (typeof value === "object" && !(value instanceof Date)) out[key] = build(value);
        else out[`@${key}`] = prim(value);
    }

    return out;
}

module.exports = (object) => {
    const root = Object.keys(object)[0];
    if (!root) return "";

    return `<?xml version="1.0" encoding="UTF-8"?>\n${XML.stringify({ [root]: build(object[root]) }, null, 2)}`;
};
