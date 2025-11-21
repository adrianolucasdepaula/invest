
import axios from 'axios';

async function validateApiPrecision() {
    const ticker = 'PETR4';
    const url = `http://localhost:3101/api/v1/assets/${ticker}/price-history?range=1mo`;

    try {
        console.log(`Fetching ${url}...`);
        const response = await axios.get(url);
        const data = response.data;

        if (!Array.isArray(data)) {
            console.error('Error: Response is not an array.', data);
            return;
        }

        if (data.length === 0) {
            console.warn('Warning: No price history data found for PETR4.');
            return;
        }

        console.log(`Received ${data.length} records.`);

        // Check for decimals in the first few records
        const hasDecimals = data.some(record => {
            const closeStr = record.close.toString();
            const adjStr = record.adjustedClose?.toString() || '';

            // Check if string representation has > 2 decimals
            const closeDecimals = closeStr.split('.')[1]?.length || 0;
            const adjDecimals = adjStr.split('.')[1]?.length || 0;

            if (closeDecimals > 2 || adjDecimals > 2) {
                console.log(`Found precise record: Date=${record.date}, Close=${record.close} (${closeDecimals} decimals), Adj=${record.adjustedClose} (${adjDecimals} decimals)`);
                return true;
            }
            return false;
        });

        if (hasDecimals) {
            console.log('SUCCESS: API returns values with > 2 decimals.');
        } else {
            console.log('WARNING: All API values have <= 2 decimals. Check serialization or data source.');
            // Print a sample to be sure
            console.log('Sample record:', data[0]);
        }

    } catch (error) {
        console.error('Error fetching API:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

validateApiPrecision();
