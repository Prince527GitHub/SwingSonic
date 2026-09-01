function sanitizeCookie(cookie) {
    if (!cookie) return cookie;

    return cookie
        .split(",")
        .map(c => c.split(";")[0].trim())
        .filter(Boolean)
        .join("; ");
}

module.exports = {
    sanitizeCookie
};
