const axios = require('axios');

module.exports = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and Longitude are required' });
        }

        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`);
        const results = response.data.results;

        if (response.data.status !== 'OK') {
            console.error('Error from Google Maps API:', response.data.status, response.data.error_message);
            return res.status(500).json({ error: 'Error from Google Maps API', message: response.data.error_message });
        }

        let address = '';
        let country = '';

        if (results[0] && results[0].address_components) {
            const street = results[0].address_components.find(component => component.types.includes('route'))?.long_name;
            const city = results[0].address_components.find(component => component.types.includes('locality'))?.long_name;
            const countryComponent = results[0].address_components.find(component => component.types.includes('country'));
            
            address = `${street} in ${city}`;
            country = countryComponent?.long_name;
        }

        res.status(200).json({ latitude, longitude, address, country });
    } catch (error) {
        console.error('Error occurred while getting location:', error.message);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};