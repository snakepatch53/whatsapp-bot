const SmartOlt = require('./SmartOlt.js');
const SmartPlanes = require('./SmartPlanes.js');

// PROPERTIES
let SMART_PLANES_DATA = [];
let SMART_OLT_DATA = [];
const AUTORIZED_USERS = [{
    name: "Ideasoft",
    number: "593980199938@c.us",
    password: "56781234"
}];

const STORAGE = {
    selected_onu: null,
    selected_zone: null,
    selected_plan_download: null,
    selected_plan_upload: null,
    client_name: null,
}

let SESSIONS = [];

// METHODS
const getPrincipalMenu = function () {
    return [
        "MENU PRINCIPAL",
        "1) Autorizar ONU",
        "2) Listar ONU en 'Warnning'",
        "3) Listar ONU en 'Critico'"
    ]
}

const setRoute = function ($session, route) {
    console.log(route);
    $session.route = route;
};


const getMenu = function (options) {
    let menu = "";
    for (let i = 0; i < options.length; i++) {
        menu += `${options[i]}\n`;
    }
    return menu;
}

const getUnconfiguredOnus = function () {
    const onus = SMART_OLT_DATA.onus;
    if (onus.length > 0) {
        let onus_str = "";
        SMART_OLT_DATA.onus.forEach(function (onu, index) {
            onus_str += `${ index + 1 }) SERIAL: ${ onu.serial }, BOARD: ${ onu.board }, PORT: ${ onu.port }.\n`;
        });
        return onus_str;
    }
    return false;
}

const getOnuByIndex = function (index) {
    const onus = SMART_OLT_DATA.onus;
    if (onus.length > 0) {
        return onus[index];
    }
    return false;
}

const getZones = function () {
    const max_zones = 15;
    const zones = SMART_OLT_DATA.zones;
    if (zones.length > 0) {
        let zones_str = "";
        for (let i = 0; i < zones.length && i < max_zones; i++) {
            zones_str += `${ zones[i].id }) ${ zones[i].name }.\n`;
        }
        return zones_str;
    }
    return false;
}

const getZoneById = function (id) {
    const zones = SMART_OLT_DATA.zones;
    if (zones.length > 0) {
        for (let i = 0; i < zones.length; i++) {
            if (zones[i].id == id) {
                return zones[i];
            }
        }
    }
    return false;
}

const getPlanOlt = function (tipo) {
    const speed = tipo == "download" ? SMART_OLT_DATA.speed_download : SMART_OLT_DATA.speed_upload;
    if (speed.length > 0) {
        let speed_str = "";
        for (let i = 0; i < speed.length; i++) {
            speed_str += `${ speed[i].id }) ${ speed[i].name }.\n`;
        }
        return speed_str;
    }
    return false;
}

const getPlanOltById = function (id, tipo) {
    const speed = tipo == "download" ? SMART_OLT_DATA.speed_download : SMART_OLT_DATA.speed_upload;
    if (speed.length > 0) {
        for (let i = 0; i < speed.length; i++) {
            if (speed[i].id == id) {
                return speed[i];
            }
        }
    }
    return false;
}



module.exports = {
    drive: async function (message, client) {
        const {
            from,
            to,
            body
        } = message;
        const command = body.toLowerCase();

        //#region  VERIFICAR SESSION
        $session = SESSIONS.find(session => session.number == from);
        if (!$session) {
            const session = {
                number: from,
                user: null,
                route: null
            };
            SESSIONS.push(session);
            $session = session;
        }
        //#endregion

        //#region LOGIN
        if (command.includes("/login")) {
            if ($session.user) {
                client.sendMessage(from, "Ya estas logueado");
                return;
            }
            const $user = AUTORIZED_USERS.find(user => user.number === from);
            if (!$user) {
                client.sendMessage(from, "Usuario no autorizado!");
                return;
            }
            setRoute($session, "login");
            client.sendMessage(from, "Ingrese su contraseña");
            return;
        }
        //#endregion

        //#region LOGOUT
        if (command.includes("/logout")) {
            if (!$session.user) {
                client.sendMessage(from, "No estas logueado");
                return;
            }
            SESSIONS = SESSIONS.filter(session => session.number !== from);
            client.sendMessage(from, "Sesion cerrada");
            client.sendMessage(from, "Por favor, borre la conversacion por seguridad");
            return;
        }
        //#endregion

        //#region VERIFICAR SESION
        if ($session.route == "login") {
            const user = AUTORIZED_USERS.find(user => user.number === from);
            if (user.password === body) {
                $session.user = user;
                setRoute($session, "home");
                client.sendMessage(from, "Bienvenido " + user.name);
                client.sendMessage(from, getMenu(getPrincipalMenu()));
                return;
            }
            client.sendMessage(from, "Contraseña incorrecta");
            return;
        }
        //#endregion

        //#region HOME
        $route = $session.route == null ? "" : $session.route;
        if ($route.includes("home")) {
            // Rama autorizar
            if ($route.includes("1")) {

                if ($route.includes("name")) {
                    STORAGE.client_name = body;
                    client.sendMessage(from, "Espera un momento...");

                    const signal = await SmartOlt.autorize(STORAGE.selected_onu.href, STORAGE.selected_zone.id, STORAGE.selected_plan_download.id, STORAGE.selected_plan_upload.id, STORAGE.client_name);
                    client.sendMessage(from, "ONU autorizada!");
                    client.sendMessage(from, "SEÑAL: " + signal);
                    setRoute($session, "home");
                    client.sendMessage(from, getMenu(getPrincipalMenu()));
                    return;
                }

                if ($route.includes("speed_upload")) {
                    const speed_upload = getPlanOltById(parseInt(command), "upload");
                    if (speed_upload) {
                        setRoute($session, "home/1/name");
                        STORAGE.selected_plan_upload = speed_upload;
                        client.sendMessage(from, "Escribe el nombre del cliente (SMART OLT):");
                        return;
                    }
                    client.sendMessage(from, "Opcion incorrecrta");
                    return;
                }

                if ($route.includes("speed_download")) {
                    const speed_download = getPlanOltById(parseInt(command), "download");
                    if (speed_download) {
                        setRoute($session, "home/1/speed_upload");
                        STORAGE.selected_plan_download = speed_download;
                        client.sendMessage(from, "Selecciona el plan de subida (SMART OLT)");
                        client.sendMessage(from, getPlanOlt("upload"));
                        return;
                    }
                    client.sendMessage(from, "Opcion incorrecrta");
                    return;
                }

                if ($route.includes("zone")) {
                    const zone = getZoneById(parseInt(command));
                    if (zone) {
                        setRoute($session, "home/1/speed_download");
                        STORAGE.selected_zone = zone;
                        client.sendMessage(from, "Selecciona el plan de descarga (SMART OLT)");
                        client.sendMessage(from, getPlanOlt("download"));
                        return;
                    }
                    client.sendMessage(from, "Opcion incorrecrta");
                    return;
                }

                const onu = getOnuByIndex(parseInt(command) - 1);
                if (onu) {
                    setRoute($session, "home/1/zone");
                    STORAGE.selected_onu = onu;
                    client.sendMessage(from, "Seleccione la zona (SMART OLT)");
                    client.sendMessage(from, getZones());
                    return;
                }
                client.sendMessage(from, "Opcion incorrecta");
                return;
            }
            if (command.includes("1")) {
                setRoute($session, "home/1");
                client.sendMessage(from, "Selecciona el ONT (SMART OLT):\n" + getUnconfiguredOnus());
                return;
            }

        }
        //#endregion


        // console.log(message);
    },
    loadData: async function () {
        SMART_PLANES_DATA = await SmartPlanes.getData();
        SMART_OLT_DATA = await SmartOlt.getData();
        console.log("Ready Scraping!");
    }
}