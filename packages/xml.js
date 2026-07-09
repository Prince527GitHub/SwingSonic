const xmlbuilder = require("xmlbuilder");

function convertToXml(jsonObj) {
    const rootKey = Object.keys(jsonObj)[0];
    const xml = xmlbuilder.create(rootKey);

    function convertToXmlObj(obj, parent, keyName) {
        if (Array.isArray(obj)) {
            obj.forEach(item => {
                const validKey = convertToValidXmlName(keyName);
                const child = parent.ele(validKey);
                if (typeof item === "object" && item !== null) {
                    convertToXmlObj(item, child, keyName);
                } else if (item !== null && item !== undefined) {
                    child.text(item);
                }
            });
            return;
        }
        for (const key in obj) {
            const value = obj[key];
            if (Array.isArray(value)) {
                value.forEach(item => {
                    const validKey = convertToValidXmlName(key);
                    const child = parent.ele(validKey);
                    if (typeof item === "object" && item !== null) {
                        convertToXmlObj(item, child, key);
                    } else if (item !== null && item !== undefined) {
                        child.text(item);
                    }
                });
            } else if (typeof value === "object" && value !== null) {
                const validKey = convertToValidXmlName(key);
                const child = parent.ele(validKey);
                convertToXmlObj(value, child, key);
            } else if (value !== null && value !== undefined) {
                const validKey = convertToValidXmlName(key);
                parent.att(validKey, value);
            }
        }
    }

    convertToXmlObj(jsonObj[rootKey], xml, rootKey);

    return xml.end({ pretty: true });
}

function convertToValidXmlName(name) {
    name = name.replace(/^[^a-zA-Z_]+/, "_");
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

module.exports = {
    convertToValidXmlName,
    convertToXml
}
