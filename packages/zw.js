function inject(visible, content) {
    const bits = Array.from(content, char => char.charCodeAt(0).toString(2).padStart(8, "0")).join("");
    const hidden = Array.from(bits, bit => (bit === "1" ? "\u200B" : "\u200C")).join("");

    return `${visible}${hidden}`;
}

function extract(text) {
    const bits = [...text]
        .filter(char => char === "\u200B" || char === "\u200C")
        .map(char => (char === "\u200B" ? "1" : "0"))
        .join("");

    let result = "";
    for (let i = 0; i + 8 <= bits.length; i += 8)
        result += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));

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
};
