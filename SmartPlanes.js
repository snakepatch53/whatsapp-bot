const {
    chromium
} = require('playwright');

const ACCOUNT_USER = "admin";
const ACCOUNT_PASS = "admin";
const URL_NAVIGATE = 'http://167.71.189.123/admin/#ajax/usuarios?action=adduser';

const getData = async () => {
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

    //FORM PAGE1

    // Get "ZONAS"
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
    await page.click('button.btn.btn-default.sw-btn-next');
    await page.click('button.btn.btn-default.sw-btn-next');
    //FORM PAGE2
    // GET "PLANES INTERNET"

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

    // GET "POOLS IPV4"
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
    await browser.close();
    return {
        zones,
        planes,
        pools
    }
}

/*

NO TE OLVIDES DE DEVOLVER EL IP Y EL VLAN

*/
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
    await page.click('button.btn-loader.btn.btn-success.btn-finish');
    await browser.close();
}

module.exports = {
    getData,
    registerUser
}