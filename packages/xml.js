const xmlbuilder = require("xmlbuilder");

function convertToXml(jsonObj) {
    const rootKey = Object.keys(jsonObj)[0];
    const xml = xmlbuilder.create(rootKey);

    function convertToXmlObj(obj, parent) {
        for (const key in obj) {
            if (Array.isArray(obj[key])) {
                obj[key].forEach((item, index) => {
                    const validKey = convertToValidXmlName(key);
                    const child = parent.ele(validKey);
                    if (typeof item === 'object') convertToXmlObj(item, child);
                    else child.text(item);
                });
            } else if (typeof obj[key] === 'object') {
                const validKey = convertToValidXmlName(key);
                const child = parent.ele(validKey);
                convertToXmlObj(obj[key], child);
            } else {
                const validKey = convertToValidXmlName(key);
                parent.att(validKey, obj[key]);
            }
        }
    }

    convertToXmlObj(jsonObj[rootKey], xml);

    return xml.end({ pretty: true });
}

function convertToValidXmlName(name) {
    name = name.replace(/^[^a-zA-Z_]+/, '_');
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

module.exports = {
    convertToValidXmlName,
    convertToXml
}