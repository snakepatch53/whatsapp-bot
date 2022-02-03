const SmartOlt = require('./SmartOlt.js');
const SmartPlanes = require('./SmartPlanes.js');
const AUTORIZED_USERS = require('./autorized_users.json');

// PROPERTIES
let SMART_PLANES_DATA = [];
let SMART_OLT_DATA = [];

const session = {
    selected_onu: null,
    selected_zone: null,
    selected_plan_download: null,
    selected_plan_upload: null,
    client_name: null,
}

let SESSIONS = [];

// METHODS
function getCapitalize(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

const getPrincipalMenu = function () {
    return [
        "MENU PRINCIPAL",
        "1) Autorizar ONU",
        "2) Listar ONU's"
    ]
}

const getHelpMenu = function () {
    return [
        "COMANDOS DISPONIBLES",
        "/help => Muestra este menu",
        "/login => Inicia sesión",
        "/logout => Cierra sesión",
        "/home => Regresa al menu principal",
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

const SmartOltFunctions = {

    getUnconfiguredOnus: async function () {
        const onus = await SmartOlt.getUnconfiguredOnus();
        SMART_OLT_DATA.onus = onus;
        if (onus.length > 0) {
            let onus_str = "";
            SMART_OLT_DATA.onus.forEach(function (onu, index) {
                onus_str += `${ index + 1 }) SERIAL: ${ onu.serial }, BOARD: ${ onu.board }, PORT: ${ onu.port }.\n`;
            });
            return onus_str;
        }
        return false;
    },

    getOnuByIndex: function (index) {
        const onus = SMART_OLT_DATA.onus;
        if (onus.length > 0) {
            return onus[index];
        }
        return false;
    },

    getZones: function () {
        const max_zones = 12;
        const zones = SMART_OLT_DATA.zones;
        if (zones.length > 0) {
            let zones_str = "";
            for (let i = 0; i < zones.length && max_zones > i; i++) {
                zones_str += `${ zones[i].id }) ${ getCapitalize(zones[i].name) }.\n`;
            }
            return zones_str;
        }
        return false;
    },

    getZoneById: function (id) {
        const max_zones = 12;
        const zones = SMART_OLT_DATA.zones;
        if (zones.length > 0) {
            for (let i = 0; i < zones.length && max_zones > i; i++) {
                if (zones[i].id == id) {
                    return zones[i];
                }
            }
        }
        return false;
    },

    getPlanOlt: function (tipo) {
        const max_options = 6;
        const speed = tipo == "download" ? SMART_OLT_DATA.speed_download : SMART_OLT_DATA.speed_upload;
        if (speed.length > 0) {
            let speed_str = "";
            for (let i = 0; i < speed.length && max_options > i; i++) {
                speed_str += `${ speed[i].id }) ${ speed[i].name }.\n`;
            }
            return speed_str;
        }
        return false;
    },

    getPlanOltById: function (id, tipo) {
        const max_options = 6;
        const speed = tipo == "download" ? SMART_OLT_DATA.speed_download : SMART_OLT_DATA.speed_upload;
        if (speed.length > 0) {
            for (let i = 0; i < speed.length && max_options > i; i++) {
                if (speed[i].id == id) {
                    return speed[i];
                }
            }
        }
        return false;
    }
}

const SmartPlanFunctions = {
    getZones: function () {
        // const max_zones = 12;
        const zones = SMART_PLANES_DATA.zones;
        if (zones.length > 0) {
            let zones_str = "";
            // for (let i = 0; i < zones.length && i < max_zones; i++) {
            for (let i = 0; i < zones.length; i++) {
                if (zones[i].name.trim() != "" && zones[i].value.trim() != "") {
                    zones_str += `${ zones[i].value }) ${ getCapitalize(zones[i].name) }.\n`;
                }
            }
            return zones_str;
        }
        return false;
    },
    getZoneById: function (id) {
        const zones = SMART_PLANES_DATA.zones;
        if (zones.length > 0) {
            for (let i = 0; i < zones.length; i++) {
                if (zones[i].value == id && (zones[i].name.trim() != "" && zones[i].value.trim() != "")) {
                    return zones[i];
                }
            }
        }
        return false;
    },
    getPlanes: function () {
        const max_planes = 6;
        const planes = SMART_PLANES_DATA.planes;
        if (planes.length > 0) {
            let planes_str = "";
            for (let i = 0; i < planes.length && max_planes > i; i++) {
                if (planes[i].name.trim() != "" && planes[i].value.trim() != "") {
                    planes_str += `${ planes[i].value }) ${ getCapitalize(planes[i].name) }.\n`;
                }
            }
            return planes_str;
        }
        return false;
    },
    getPlanById: function (id) {
        const max_planes = 6;
        const planes = SMART_PLANES_DATA.planes;
        if (planes.length > 0) {
            for (let i = 0; i < planes.length && max_planes > i; i++) {
                if (planes[i].value == id && (planes[i].name.trim() != "" && planes[i].value.trim() != "")) {
                    return planes[i];
                }
            }
        }
        return false;
    },
    getPoolByVlan: function (vlan) {
        const pools = SMART_PLANES_DATA.pools;
        if (pools.length > 0) {
            for (let i = 0; i < pools.length; i++) {
                if (pools[i].name.includes(`vlan${ vlan }`)) {
                    return pools[i];
                }
            }
        }
        return false;
    }
}

// EXPORT FUNCTIONS
const drive = async function (message, client, MessageMedia) {
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
            route: null,
            selected_onu: null,
            selected_zone: null,
            selected_plan_download: null,
            selected_plan_upload: null,
            client_name: null,
            selected_zone_plan: null,
            selected_speed_plan: null
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
        //#region General commands
        if (command.includes("/home")) {
            setRoute($session, "home");
            client.sendMessage(from, getMenu(getPrincipalMenu()));
            return;
        }
        if (command.includes("/help")) {
            setRoute($session, "home");
            client.sendMessage(from, getMenu(getHelpMenu()));
            return;
        }

        if (command.includes("/error")) {
            throw new Error('Error planificado');
        }


        if (command.includes("/stop")) {
            setRoute($session, "home/stop");
            client.sendMessage(from, "Ingrese la clave maestra: ");
            return;
        }

        if ($route == "home/stop") {
            if (body == "while(!vida)") {
                await client.sendMessage(from, "Sistema detenido!");
                await sendMsgUsers(client, "Hannbot se ha detenido!");
                setTimeout(() => process.exit(123321), 5000);
            } else {
                client.sendMessage(from, "Clave incorrecta!");
                client.sendMessage(from, "Escribe nuevamente la contraseña o escribe '/home' para volver al menu principal");
                return;
            }
        }
        //#endregion

        //#region Rama autorizar
        if ($route.includes("home/1")) {

            //SMART OLT
            //se ejecuta luego de elegir una ONT
            if ($route.includes("onu")) {
                const onu = SmartOltFunctions.getOnuByIndex(parseInt(command) - 1);
                if (onu) {
                    setRoute($session, "home/1/zone_ont");
                    session.selected_onu = onu;
                    client.sendMessage(from, "FORMULARIO SMART OLT");
                    client.sendMessage(from, "Seleccione la zona (SMART OLT):");
                    client.sendMessage(from, SmartOltFunctions.getZones());
                    return;
                }
                client.sendMessage(from, "Opcion incorrecta");
                return;
            }

            // se ejecuta luego de elegir una zona
            if ($route.includes("zone_ont")) {
                const zone = SmartOltFunctions.getZoneById(parseInt(command));
                if (zone) {
                    setRoute($session, "home/1/speed_download");
                    session.selected_zone = zone;
                    client.sendMessage(from, "Selecciona el plan de descarga (SMART OLT)");
                    client.sendMessage(from, SmartOltFunctions.getPlanOlt("download"));
                    return;
                }
                client.sendMessage(from, "Opcion incorrecrta");
                return;
            }

            // se ejecuta luego de elegir un plan de descarga
            if ($route.includes("speed_download")) {
                const speed_download = SmartOltFunctions.getPlanOltById(parseInt(command), "download");
                if (speed_download) {
                    setRoute($session, "home/1/speed_upload");
                    session.selected_plan_download = speed_download;
                    client.sendMessage(from, "Selecciona el plan de subida (SMART OLT)");
                    client.sendMessage(from, SmartOltFunctions.getPlanOlt("upload"));
                    return;
                }
                client.sendMessage(from, "Opcion incorrecrta");
                return;
            }

            // se ejecuta luego de elegir un plan de subida
            if ($route.includes("speed_upload")) {
                const speed_upload = SmartOltFunctions.getPlanOltById(parseInt(command), "upload");
                if (speed_upload) {
                    setRoute($session, "home/1/name");
                    session.selected_plan_upload = speed_upload;
                    client.sendMessage(from, "Escribe el nombre del cliente (SMART OLT):");
                    return;
                }
                client.sendMessage(from, "Opcion incorrecrta");
                return;
            }

            // se ejecuta luego de ingresar el nombre del cliente
            if ($route.includes("name")) {
                session.client_name = body;
                setRoute($session, "home/1/zone_plan");
                client.sendMessage(from, "FORMULARIO SMART PLAN");
                client.sendMessage(from, "Selecciona la zona (SMART PLAN):");
                client.sendMessage(from, SmartPlanFunctions.getZones());
                return;
            }

            // SMART PLANES
            // se ejecuta luego de seleccionar la zona del plan
            if ($route.includes("zone_plan")) {
                const zone = SmartPlanFunctions.getZoneById(parseInt(command));
                if (zone) {
                    setRoute($session, "home/1/speed_plan");
                    session.selected_zone_plan = zone;
                    client.sendMessage(from, "Selecciona el plan (SMART PLAN):");
                    client.sendMessage(from, SmartPlanFunctions.getPlanes());
                    return;
                }
                client.sendMessage(from, "Opcion incorrecrta");
                return;
            }

            // se ejecuta luego de seleccionar la velocidad del plan
            if ($route.includes("speed_plan")) {
                const plan = SmartPlanFunctions.getPlanById(parseInt(command));
                if (plan) {
                    session.selected_speed_plan = plan;
                    client.sendMessage(from, "Espera un momento...");
                    const {
                        signal,
                        data_vlan
                    } = await SmartOlt.autorize(session.selected_onu.href, session.selected_zone.id, session.selected_plan_download.id, session.selected_plan_upload.id, session.client_name);
                    client.sendMessage(from, "Ya falta poco...");
                    const pool_ipv4 = SmartPlanFunctions.getPoolByVlan(data_vlan);
                    const ipv4 = await SmartPlanes.registerUser(session.client_name, session.selected_zone_plan.value, session.selected_speed_plan.value, pool_ipv4.value);
                    client.sendMessage(from, "ONU autorizada y registrada!");
                    client.sendMessage(from, `SEÑAL: ${signal}\nVLAN: ${ data_vlan }\nIPV4: ${ipv4}`);
                    // power_onu.png
                    const mediaFile = MessageMedia.fromFilePath('./power_onu.png');
                    client.sendMessage(from, mediaFile);
                    setRoute($session, "home");
                    setTimeout(() => {
                        client.sendMessage(from, "Escribe '/home' para volver al menu principal");
                    }, 3000);
                    return;
                }
                client.sendMessage(from, "Opcion incorrecrta");
                return;
            }



        }
        if ($route == "home" && command.includes("1")) {
            setRoute($session, "home/1/onu");
            client.sendMessage(from, "Esperando ONT's...");
            const ont_list_str = await SmartOltFunctions.getUnconfiguredOnus();
            client.sendMessage(from, "Selecciona el ONT (SMART OLT):\n" + ont_list_str);
            return;
        }
        //#endregion

        //#region Rama "Obtener lista de ONT's
        if ($route.includes("home/2")) {
            client.sendMessage(from, "Espera un momento...");
            switch (command) {
                case "1":
                    client.sendMessage(from, "Consulta Warnning...");
                    break;
                case "2":
                    client.sendMessage(from, "Consulta Critical...");
                    break;
                default:
                    client.sendMessage(from, "Opcion incorrecta");
                    break;
            }
            setTimeout(() => {
                client.sendMessage(from, "Escribe '/home' para volver al menu principal");
            }, 3000);
            return;
        }
        if ($route == "home" && command.includes("2")) {
            setRoute($session, "home/2/onu");
            client.sendMessage(from, "ELIGE UNA OPCION (SMART OLT):\n 1) Obtener lista de ONT's en 'WARNNING'\n 2) Obtener lista de ONT's en 'CRITICAL'");
        }
        //#endregion
    }
    //#endregion


    // console.log(message);
}

const loadData = async function () {
    SMART_PLANES_DATA = await SmartPlanes.getAllData();
    SMART_OLT_DATA = await SmartOlt.getAllData();
    console.log("Ready Scraping!");
}

const sendMsgUsers = async function (client, msg) {
    for (let user of AUTORIZED_USERS) {
        await client.sendMessage(user.number, msg);
    }
}

module.exports = {
    drive,
    loadData,
    sendMsgUsers
}


// capitalize text



/*
ESTO AL FINAL

client.sendMessage(from, "Espera un momento...");
const signal = await SmartOlt.autorize(session.selected_onu.href, session.selected_zone.id, session.selected_plan_download.id, session.selected_plan_upload.id, session.client_name);
client.sendMessage(from, "ONU autorizada!");
client.sendMessage(from, "SEÑAL: " + signal);
setRoute($session, "home");
*/