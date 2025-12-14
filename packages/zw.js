function inject(visible, hidden) {
    let binary = "";
    for (const char of hidden) binary += char.charCodeAt(0).toString(2).padStart(8, "0");

    let hiddenChars = "";
    for (const bit of binary) hiddenChars += bit === "1" ? "\u200B" : "\u200C";

    return visible + hiddenChars;
}

function extract(text) {
    let binary = "";
    for (let char of text) {
        if (char === "\u200B") binary += "1";
        else if (char === "\u200C") binary += "0";
    }

    let result = "";
    for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.substring(i, i + 8);
        if (byte.length === 8) result += String.fromCharCode(parseInt(byte, 2));
    }

    return result;
}

function filter(text) {
    // eslint-disable-next-line no-misleading-character-class
    return text.replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, "");
}

module.exports = {
    inject,
    extract,
    filter
}