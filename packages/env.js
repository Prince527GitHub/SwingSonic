function envJSON(env) {
    const lines = env.split('\n');
    const json = {};

    lines.forEach(line => {
        const [key, value] = line.split('=');

        if (key && value) {
            let keys = key.split('_').map(k => k.toLowerCase());
            let objRef = json;
            let arrayIndex = null;

            const arrayKeyIndex = keys.findIndex(k => k.match(/^\d+$/));
            if (arrayKeyIndex !== -1) {
                arrayIndex = parseInt(keys[arrayKeyIndex]);
                keys = keys.slice(0, arrayKeyIndex);
            }

            keys.forEach((keyPart, index) => {
                if (!objRef[keyPart]) {
                    if (arrayIndex !== null && index === keys.length - 1) objRef[keyPart] = [];
                    else objRef[keyPart] = {};
                }

                if (index === keys.length - 1) {
                    if (arrayIndex !== null) {
                        if (!objRef[keyPart][arrayIndex]) objRef[keyPart][arrayIndex] = {};

                        if (key === `SERVER_USERS_${arrayIndex}_USERNAME`) objRef[keyPart][arrayIndex]['username'] = value;
                        else if (key === `SERVER_USERS_${arrayIndex}_PASSWORD`) objRef[keyPart][arrayIndex]['password'] = value;
                    } else objRef[keyPart] = parseValue(value);
                } else objRef = objRef[keyPart];
            });
        }
    });

    return json;
}

function envString(obj) {
    let envString = '';

    for (const key in obj.parsed) {
        if (Object.prototype.hasOwnProperty.call(obj.parsed, key)) {
            const value = obj.parsed[key];
            envString += `${key}=${value}\n`;
        }
    }

    return envString;
}

function parseValue(value) {
    if (value === 'true' || value === 'false') return value === 'true';
    else if (!isNaN(value)) return parseFloat(value);
    else return value;
}

module.exports = {
    envString,
    envJSON
}