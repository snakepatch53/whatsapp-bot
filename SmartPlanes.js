const {
    chromium
} = require('playwright');

const ACCOUNT_USER = "admin";
const ACCOUNT_PASS = "admin";
const URL_NAVIGATE = 'http://167.71.189.123/admin/#ajax/usuarios?action=adduser';

// GENERAL FUNCTIONS
const getBrowser = async function () {
    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
    await page.fill('input#login-login', ACCOUNT_USER);
    await page.fill('input#password-login', ACCOUNT_PASS);
    await page.click('button.btn.btn-success.btn-block.btn-lg');
    await page.waitForNavigation();
    await page.goto(URL_NAVIGATE);
}

const getZones = async function (page) {
    await page.fill("input[name='usuarios[nombre]']", "GET_DATA");
    const zones = await page.evaluate(async () => {
        let data = [];
        let promise = new Promise((resolve, reject) => {
            let options = [];
            const loop = setInterval(async () => {
                options = await document.querySelectorAll("select[name='config[zona]'] option");
                if (options.length > 0) {
                    clearInterval(loop);
                    resolve(options);
                }
            }, 100);
        });
        let options_array = [...await promise];
        for (let option of options_array) {
            data.push({
                name: option.innerText,
                value: option.value
            });
        };
        return data;
    });
    return zones;
}

const getPlanes = async function (page) {
    await page.click('button.btn.btn-default.sw-btn-next');
    await page.click('button.btn.btn-default.sw-btn-next');
    const planes = await page.evaluate(async () => {
        let eventChange = new Event("change");
        let $selectRouter = await document.querySelector("select[name='servicio[nodo]']");
        $selectRouter.selectedIndex = 2;
        $selectRouter.dispatchEvent(eventChange);

        let data = [];
        let promise = new Promise((resolve, reject) => {
            let options = [];
            const loop = setInterval(async () => {
                options = await document.querySelectorAll("select[name='servicio[idperfil]'] option");
                if (options.length > 0) {
                    clearInterval(loop);
                    resolve(options);
                }
            }, 100);
        });
        let options_array = [...await promise];
        for (let option of options_array) {
            data.push({
                name: option.innerText,
                value: option.value
            });
        };
        return data;
    });
    return planes;
}

const getPools = async function (page) {
    const pools = await page.evaluate(async () => {
        let eventChange = new Event("change");
        let $selectTipoIp = await document.querySelector("select[name='servicio[tipoipv4]']");
        $selectTipoIp.selectedIndex = 1;
        $selectTipoIp.dispatchEvent(eventChange);
        document.querySelector("select[name='servicio[redipv4]']").innerHTML = "";

        let data = [];
        let promise = new Promise((resolve, reject) => {
            let options = [];
            const loop = setInterval(async () => {
                options = await document.querySelectorAll("select[name='servicio[redipv4]'] option");
                if (options.length > 0) {
                    clearInterval(loop);
                    resolve(options);
                }
            }, 100);
        });
        let options_array = [...await promise];
        for (let option of options_array) {
            data.push({
                name: option.innerText,
                value: option.value
            });
        };
        return data;
    });
    return pools;
}

const getIpv4 = async (page) => {
    const pools = await page.evaluate(async () => {
        let promise = new Promise((resolve, reject) => {
            let options = [];
            const loop = setInterval(async () => {
                options = await document.querySelectorAll("ul.select2-selection__rendered li");
                if (options.length > 0) {
                    options.forEach(option => {
                        if (option.title.trim() != "") {
                            clearInterval(loop);
                            resolve(option.title);
                        }
                    });
                }
            }, 100);
        });
        const res = await promise;
        console.log(res);
        return res;
    });
    return pools;
}


// EXPORT FUNCTIONS
const getAllData = async () => {
    const {
        browser,
        context,
        page
    } = await getBrowser();

    //login
    process_login(page);

    // Get "ZONAS"
    const zones = await getZones(page);

    // GET "PLANES INTERNET"
    const planes = await getPlanes(page);

    // GET "POOLS IPV4"
    const pools = await getPools(page);

    await browser.close();
    return {
        zones,
        planes,
        pools
    }
}

const registerUser = async (user_name, user_zone, plan_internet, pool_ipv4) => {
    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized', '--disable-infobars', '--disable-web-security', '--disable-site-isolation-trials'],
        slowMo: 100
    });
    const context = await browser.newContext();

    const page = await context.newPage();
    await page.goto(URL_NAVIGATE);

    //login
    await page.fill('input#login-login', ACCOUNT_USER);
    await page.fill('input#password-login', ACCOUNT_PASS);
    await page.click('button.btn.btn-success.btn-block.btn-lg');
    await page.waitForNavigation();
    await page.goto(URL_NAVIGATE);

    //Form page1
    await page.fill("input[name='usuarios[nombre]']", user_name);
    await page.selectOption("select[name='config[zona]']", user_zone);
    await page.click('button.btn.btn-default.sw-btn-next');

    //Form page2
    await page.selectOption("select[name=plantilla]", "1");
    await page.selectOption("select[name='config[meses]']", "0");
    await page.click('button.btn.btn-default.sw-btn-next');

    //Form page3
    await page.selectOption("select[name='servicio[nodo]']", "2");
    await page.selectOption("select[name='servicio[idperfil]']", plan_internet);
    await page.selectOption("select[name='servicio[tipoipv4]']", "0");
    await page.selectOption("select[name='servicio[redipv4]']", pool_ipv4);
    const IPV4 = await getIpv4(page);
    
    await page.click('button.btn-loader.btn.btn-success.btn-finish');
    await browser.close();
    return IPV4;
}

module.exports = {
    getAllData,
    registerUser
}
