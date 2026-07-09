function envJSON(env) {
    const json = {};

    for (const line of env.split("\n")) {
        const i = line.indexOf("=");
        if (i === -1) continue;

        const key = line.slice(0, i);
        const value = parseValue(line.slice(i + 1));

        const parts = key.toLowerCase().split("_");
        let obj = json;

        for (let j = 0; j < parts.length; j++) {
            const part = parts[j];
            const next = parts[j + 1];

            if (j === parts.length - 1) {
                obj[part] = value;
                break;
            }

            if (/^\d+$/.test(next)) {
                obj[part] ??= [];
                obj[part][next] ??= {};
                obj = obj[part][next];
                j++;
            } else {
                obj[part] ??= {};
                obj = obj[part];
            }
        }
    }

    return json;
}

function envString() {
    return Object.entries(process.env)
        .filter(([key]) => key.startsWith("SERVER") || key.startsWith("MUSIC"))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
}

function parseValue(value) {
    if (value === "true" || value === "false") return value === "true";
    if (!Number.isNaN(Number(value))) return Number(value);
    return value;
}

module.exports = {
    envString,
    envJSON
};
