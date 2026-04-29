// Backend\api\metaApi.js
const axios = require("axios");

const metaApi = axios.create({
    baseURL: process.env.MT5_API_URL,
    headers: {
        "x-api-key": process.env.MT5_API_KEY,
    },
});

module.exports = { metaApi };
