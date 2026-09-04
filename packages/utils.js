const path = require("path");

function toArray(value) {
    return [].concat(value);
}

function first(value) {
    return toArray(value)[0];
}

function firstProperty(value, property) {
    return first(value)?.[property];
}

function fallback(value, defaultValue) {
    return value ?? defaultValue;
}

function encodeId(value, type, codecs) {
    return value != null
        ? codecs.encode({ type, id: value })
        : undefined;
}

function toISOString(timestamp) {
    return timestamp != null
        ? new Date(timestamp * 1000).toISOString()
        : undefined;
}

function createArray(array, size, offset = 0) {
    return offset >= 0 && offset < array.length
        ? array.slice(offset, offset + size)
        : [];
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function sortByProperty(array, property) {
    if (!array.length) return [];

    if (!(property in array[0])) throw new Error(`Property '${property}' not found`);

    return array.sort((a, b) =>
        a[property] < b[property] ? -1 :
        a[property] > b[property] ? 1 : 0
    );
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function parseIntOr(value, fallback = 0) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function clampedSize(value, fallback = 10, max = 500) {
    return clamp(parseIntOr(value, fallback), 1, max);
}

function ext(filepath) {
    return filepath ? path.extname(filepath).slice(1) : undefined;
}

function toTicks(seconds) {
    return Math.round((seconds || 0) * 10000000);
}

function flexibleISOString(value, fallback) {
    if (value == null) return fallback;
    const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
    return date.toISOString();
}

function audioFormat(filepath) {
    const suffix = ext(filepath) || "mp3";

    return {
        suffix,
        contentType: `audio/${suffix === "mp3" ? "mpeg" : suffix}`
    };
}

function yearFromTimestamp(timestamp, fallback) {
    return timestamp != null ? new Date(timestamp * 1000).getFullYear() : fallback;
}

function toJellyfinTicks(seconds) {
    return Math.round((seconds || 0) * 9962075.847328244);
}

function groupByFirstLetter(items) {
    const grouped = items.reduce((acc, item) => {
        const letter = (item?.name || "")?.charAt(0)?.toUpperCase() || "#";

        acc[letter] = acc[letter] || [];
        acc[letter].push(item);

        return acc;
    }, {});

    return Object
        .keys(grouped)
        .sort()
        .map(letter => ({ name: letter, artist: grouped[letter] }));
}

function primaryArtistName(artists) {
    return firstProperty(artists, "name");
}

function primaryArtistHash(artists) {
    return firstProperty(artists, "artisthash");
}

module.exports = {
    toArray,
    first,
    firstProperty,
    fallback,
    encodeId,
    toISOString,
    createArray,
    shuffleArray,
    sortByProperty,
    clamp,
    parseIntOr,
    clampedSize,
    ext,
    toTicks,
    flexibleISOString,
    audioFormat,
    yearFromTimestamp,
    toJellyfinTicks,
    groupByFirstLetter,
    primaryArtistName,
    primaryArtistHash
};
