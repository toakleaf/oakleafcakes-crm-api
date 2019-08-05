const config = require('../config');
const googleMapsClient = require('@google/maps').createClient({
  key: config.GOOGLE_MAPS_API_KEY
});

module.exports = googleMapsClient;
