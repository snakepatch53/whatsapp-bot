const {
    chromium
} = require('playwright');

const URL_NAVIGATE = 'https://moronanet.smartolt.com/onu/unconfigured';
const URL_NAVIGATE_ZONES = 'https://moronanet.smartolt.com/locations/listing';
const URL_NAVIGATE_SPEED = 'https://moronanet.smartolt.com/speed_profiles';
const ACCOUNT_USER = "gonzaloproducciones1@hotmail.com";
const ACCOUNT_PASS = "2fXXBzQ9djJG";

const getBrowser = async function () {
    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized', '--disable-infobars', '--disable-web-security', '--disable-site-isolation-trials'],
        slowMo: 100
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    return {
        browser,
        context,
        page
    };
}

const process_login = async function (page) {
    await page.goto(URL_NAVIGATE);
    await page.fill("input[name='identity']", ACCOUNT_USER);
    await page.fill("input[id='password']", ACCOUNT_PASS);
    await page.click("input[type='submit']");
    await page.goto(URL_NAVIGATE);
    // await page.waitForNavigation();
}

const getOnus = async function (page) {
    const onus = await page.evaluate(async () => {
        let data = [];
        let promise = new Promise((resolve, reject) => {
            let tr_array = [];
            const loop = setInterval(async () => {
                let $tr_element = await document.querySelectorAll("table.table.table-striped tr");
                if ($tr_element.length > 0) {
                    tr_array = $tr_element
                    clearInterval(loop);
                    resolve(tr_array);
                }
            }, 100);
        });
        tr_array = await promise;
        tr_array.forEach(async (tr_element) => {
            let td_array = tr_element.querySelectorAll("td");
            data.push({
                board: td_array[0].innerText,
                port: td_array[1].innerText,
                serial: td_array[2].innerText,
                type: td_array[3].innerText,
                href: td_array[4].querySelector("a").href
            });
        });
        return data;
    });
    return onus;
}

const getZones = async function (page) {
    await page.goto(URL_NAVIGATE_ZONES);
    const zones = await page.evaluate(async () => {
        let data = [];
        let promise = new Promise((resolve, reject) => {
            let tr_array = [];
            const loop = setInterval(async () => {
                let $tr_element = await document.querySelectorAll("table.table.table-striped tr");
                if ($tr_element.length > 0) {
                    tr_array = $tr_element
                    clearInterval(loop);
                    resolve(tr_array);
                }
            }, 100);
        });
        tr_array = await promise;
        tr_array.forEach(async (tr_element) => {
            let td_array = tr_element.querySelectorAll("td");
            data.push({
                name: td_array[0].querySelector("a").innerText,
                id: td_array[0].querySelector("a").href.replace(/^\D+/g, '')
            });
        });
        return data;
    });
    return zones;
}

const getSpeedProfiles = async function (page) {
    await page.goto(URL_NAVIGATE_SPEED);
    const speed = await page.evaluate(async () => {
        let promise = new Promise((resolve, reject) => {
            let tr_array_download = [];
            let tr_array_upload = [];
            const loop = setInterval(async () => {
                let $tables = await document.querySelectorAll("table.table.table-striped");
                let $table_download = await $tables[0];
                let $table_upload = await $tables[1];
                let $tr_download = await $table_download.querySelectorAll("tr");
                let $tr_upload = await $table_upload.querySelectorAll("tr");
                if ($tr_download.length > 0 && $tr_upload.length > 0) {
                    tr_array_download = $tr_download
                    tr_array_upload = $tr_upload
                    clearInterval(loop);
                    resolve({
                        tr_array_download,
                        tr_array_upload
                    });
                }
            }, 100);
        });
        let promise_data = await promise;
        tr_array_download = promise_data.tr_array_download;
        tr_array_upload = promise_data.tr_array_upload;

        let data_download = [];
        tr_array_download.forEach(async (tr_element) => {
            let td_array = tr_element.querySelectorAll("td");
            data_download.push({
                name: td_array[0].querySelector("a").innerText,
                id: td_array[0].querySelector("a").href.replace(/^\D+/g, '')
            });
        });

        let data_upload = [];
        tr_array_upload.forEach(async (tr_element) => {
            let td_array = tr_element.querySelectorAll("td");
            data_upload.push({
                name: td_array[0].querySelector("a").innerText,
                id: td_array[0].querySelector("a").href.replace(/^\D+/g, '')
            });
        });
        return {
            data_download,
            data_upload
        };
    });
    return speed;
}


// EXPORT FUNCTIONS
const getVlan = function (board, port) {
    return `1${ board }${ port < 10 ? "0"+port : port }`;
}

const getAllData = async function () {
    const {
        browser,
        context,
        page
    } = await getBrowser();

    //login
    await process_login(page);

    // get onus
    // const onus = await getOnus(page);
    const onus = [];

    //Get Zones
    const zones = await getZones(page);

    //Get Speed
    const speed = await getSpeedProfiles(page);


    await browser.close();
    return {
        onus,
        zones,
        speed_download: speed.data_download,
        speed_upload: speed.data_upload
    }
}

const getUnconfiguredOnus = async function () {
    const {
        browser,
        context,
        page
    } = await getBrowser();

    //login
    await process_login(page);

    // get onus
    const onus = await getOnus(page);

    await browser.close();
    return onus;
}

const autorize = async (href, client_zone, speed_download, speed_upload, client_name) => {
    const {
        browser,
        context,
        page
    } = await getBrowser();

    //login
    await process_login(page);

    //Select ONU
    await page.click(`a[href="${href}"]`);
    // await page.waitForNavigation();

    //Get Vlan
    const data_board = await page.inputValue("input.form-control[name='board']");
    const data_port = await page.inputValue("input.form-control[name='port']");
    const data_vlan = getVlan(data_board, data_port);

    // Set Vlan
    await page.evaluate(async (data_vlan) => {
        let promise = new Promise((resolve, reject) => {
            const loop = setInterval(async () => {
                $select_vlan = await document.querySelector("select[name='vlan_id']");
                $options_vlan = await $select_vlan.querySelectorAll("option");
                if (typeof ($select_vlan) != "undefined" && $options_vlan.length > 0) {
                    $options_vlan.forEach((option) => (option.innerText == data_vlan) ? option.selected = true : "");
                    clearInterval(loop);
                    resolve(data_vlan);
                }
            }, 100);
        });
        return await promise;
    }, data_vlan);


    // set zone
    await page.selectOption("select[id='location']", client_zone);

    // set speed_download
    await page.selectOption("select[id='download_speed']", speed_download);

    // set speed_upload
    await page.selectOption("select[id='upload_speed']", speed_upload);

    // Set Name
    await page.fill("input[name='location_name']", client_name);

    // SUBMIT AUTORIZE
    await page.click("button[id='auth_button']");

    // get Signal
    const signal = await page.evaluate(async () => {
        let promise = new Promise((resolve, reject) => {
            const loop = setInterval(async () => {
                $signal = await document.querySelector("#signal_wrapper");
                if (typeof ($signal) != "undefined" && $signal.innerText.trim() != "") {
                    clearInterval(loop);
                    resolve($signal.innerText);
                }
            }, 100);
        });
        return await promise;
    });

    // await page.waitForNavigation();

    await browser.close();
    return {
        signal,
        data_vlan
    };
}

module.exports = {
    getVlan,
    getAllData,
    getUnconfiguredOnus,
    autorize
}