const builder = require("xmlbuilder");

function convertToXml(jsonObj) {
    const root = Object.keys(jsonObj)[0];
    const xml = builder.create(root);

    buildXml(jsonObj[root], xml);

    return xml.end({ pretty: true });
}

function buildXml(obj, parent) {
    for (const key in obj) {
        const value = obj[key];
        const valid = convertToValidXmlName(key);

        if (Array.isArray(value)) value.forEach(item => addChild(parent, valid, item));
        else if (typeof value === "object" && value !== null) addChild(parent, valid, value);
        else if (value !== null && value !== undefined) parent.att(valid, value);
    }
}

function addChild(parent, key, item) {
    const child = parent.ele(key);

    if (typeof item === "object" && item !== null) buildXml(item, child);
    else if (item !== null && item !== undefined) child.text(item);
}

function convertToValidXmlName(name) {
    return name.replace(/^[^a-zA-Z_]+/, "_").replace(/[^a-zA-Z0-9_]/g, "_");
}

module.exports = {
    convertToValidXmlName,
    convertToXml
};
