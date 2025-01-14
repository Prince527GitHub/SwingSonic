const axios = require("axios");

module.exports = async(res, req, url) => {
    const response = await axios.get(url, { responseType: 'stream', headers: { "Cookie": req.user } });

    const headers = ["content-type", "content-length", "content-disposition"];
    headers.forEach(header => response.headers[header] && res.set(header, response.headers[header]));

    response.data.pipe(res);
} 