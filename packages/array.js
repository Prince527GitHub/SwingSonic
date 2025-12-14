function createArray(array, size, offset) {
    if (offset < 0 || offset >= array.length) return [];

    const newArray = array.slice(offset, offset + size);
    return newArray;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function sortByProperty(arr, property) {
    if (arr.length === 0 || !property) return [];

    if (!Object.prototype.hasOwnProperty.call(arr[0], property)) throw new Error(`Property '${property}' not found in objects`);

    arr.sort((a, b) => {
        if (a[property] < b[property]) return -1;
        if (a[property] > b[property]) return 1;
        return 0;
    });

    return arr;
}

module.exports = {
    sortByProperty,
    shuffleArray,
    createArray
}