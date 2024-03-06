const axios = require("axios");

module.exports = async(res, url) => {
    const response = await axios.get(url, { responseType: 'stream' });

    res.set('Content-Type', response.headers['content-type']);

    response.data.pipe(res);
} 