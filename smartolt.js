const request = require('request');

const SMART_SESSION_KEY = '266815c6f6b14aa388341ada3795cfd5';

const fetch_http = function (url, method) {
    const options = {
        'method': method,
        'url': url,
        'headers': {
            'X-Token': SMART_SESSION_KEY
        }
    };
    return new Promise(function (resolve, reject) {
        request(options, function (error, response) {
            if (error) return reject(error);
            try {
                resolve(JSON.parse(response.body));
            } catch (e) {
                reject(e);
            }
        });
    });
}



module.exports = {
    get_all_onus_details: function (action) {
        fetch_http('https://moronanet.smartolt.com/api/onu/get_all_onus_details', 'GET').then(res => action(res.onus));
    },
    get_all_cellphone_numbers: function (action) {
        fetch_http('https://moronanet.smartolt.com/api/onu/get_all_onus_details', 'GET').then(res => {
            let numbers = [];
            res.onus.forEach(number => {
                number = ((parseInt(number.address) + "").trim()).toString();
                if (number.length == 12) {
                    numbers.push(number);
                }
            });
            action(numbers);
        });
    },
    unconfigured_onus: function (action) {
        fetch_http('https://moronanet.smartolt.com/api/onu/unconfigured_onus', 'GET').then(res => action(res.response));
    }
}