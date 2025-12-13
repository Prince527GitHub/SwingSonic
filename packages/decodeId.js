function safeDecodeId(id) {
    // Decode a base64-encoded JSON string safely
    // Returns the parsed object or null if decoding/parsing fails
    // contents { id: string, path: string }
    try {
        const json = Buffer.from(decodeURIComponent(id), "base64").toString("utf-8");
        return JSON.parse(json);
    } catch {
        return null;
    }
}

module.exports = {
    safeDecodeId
}
