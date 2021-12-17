const whatsapp_action = require('./whatsapp-action.js');

const NAVIGATE_INDEX = [];
const TEMPORAL_CACHE = {};

const navigate = {
    Mensaje_masivo: {

        
    },
    Opciones: {
        Opcion1: (data) => {
            data.client.sendMessage(data.message.from, 'Bienvenido a opcion1');
        },
        Opcion2: (data) => {
            data.client.sendMessage(data.message.from, 'Bienvenido a opcion2');
        }
    }
};

const get_navigate = () => {
    let navigate_now = navigate;
    for (let index of NAVIGATE_INDEX) {
        navigate_now = navigate_now[index];
    }
    return navigate_now;
}

module.exports = {
    print: function () {
        const navigate_now = get_navigate();
        let cont = 0;
        let string = `MENU \n${ NAVIGATE_INDEX.length > 0 ? cont + '. Atras.\n' : '' }`;
        for (let option in navigate_now) {
            cont++;
            string += cont + '. ' + option + '.\n';
        }
        return string;
    },
    match: function (message, client) {
        const navigate_now = get_navigate();
        let cont = 0;
        if (message.body == cont || message.body == "atras") {
            NAVIGATE_INDEX.pop();
            client.sendMessage(message.from, this.print());
        }
        for (let option in navigate_now) {
            cont++;
            if (message.body == option || message.body == cont) {
                if (typeof (navigate_now[option]) == "object") {
                    NAVIGATE_INDEX.push(option);
                    client.sendMessage(message.from, this.print());
                } else {
                    let data = {
                        message,
                        client
                    };
                    navigate_now[option](data);
                }
                return;
            }
        }
    }
}