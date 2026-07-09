function createArray(array, size, offset = 0) {
    return offset >= 0 && offset < array.length ? array.slice(offset, offset + size) : [];
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

module.exports = {
    createArray,
    shuffleArray,
    sortByProperty
};
