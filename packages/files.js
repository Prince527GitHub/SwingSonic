const { readdir } = require("fs/promises");
const { join } = require("path");

async function getFileList(dir, filter, depth = 0) {
    const files = [];

    for (const item of await readdir(dir, { withFileTypes: true })) {
        const file = join(dir, item.name);

        if (!item.isDirectory()) {
            if (item.name.endsWith(filter.type)) files.push(file);
            continue;
        }

        if (filter.recursively && depth < filter.maxDepth && !filter.exclusion?.includes(item.name))
            files.push(...await getFileList(file, filter, depth + 1));
    }

    return files;
}

module.exports = {
    getFileList
};
