const smartolt = require('./smartolt.js');
const whatsapp_action = require('./whatsapp-action.js');
const router = require('./router.js');
const Client = require('whatsapp-web.js').Client;
const qrcode = require('qrcode-terminal');

var fs = require('fs');
let mensaje_tmp = '';

// Path where the session data will be stored
const SESSION_FILE_PATH = './session.json';

// Load the session data if it has been previously saved
let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}
// Use the saved values
const client = new Client({
    session: sessionData
});

// Save session values to the file upon successful auth
client.on('authenticated', (session) => {
    sessionData = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
        if (err) {
            console.error(err);
        }
    });
});

// Generar codigo QR
client.on('qr', (qr) => qrcode.generate(qr, 'small'));

// Mensaje de bienvenida
client.on('ready', () => {
    client.on('message', (message) => {
        const { from, to, body } = message;

        if (body.toLocaleLowerCase() == "/help") {
            let str = router.print(body);
            client.sendMessage(from, str);
        } else {
            router.match(message, client);
        }

        // switch (body.toLocaleLowerCase()) {
        //     case 'opciones':
        //         client.sendMessage(from, `
        //             opcion1. Mensaje masivo.
        //             opcion2. Lista de clientes.
        //             opcion3. Lista de clientes en Warnning.
        //         `);
        //         break;

        //     case 'opcion1':
        //         client.sendMessage(from, 'Ingrese el mensaje y luego escriba "opcion1_send"');
        //         break;

        //     case 'opcion1_send':
        //         smartolt.get_all_cellphone_numbers(numbers => {
        //             numbers.forEach(number => {
        //                 try {
        //                     client.sendMessage(number + '@c.us', mensaje_tmp);
        //                 } catch (error) {}
        //             });
        //             client.sendMessage(from, 'mensaje masivo enviado!');
        //         });
        //         break;

        //     case 'opcion2':
        //         smartolt.get_all_onus_details(function (res) {
        //             let clientes = ``;
        //             for (let i = 0; i < 10; i++) {
        //                 let item = res[i];
        //                 clientes += `${ item.name } = ${ item.signal } = ${ item.signal_1310 }\n`;
        //             }
        //             client.sendMessage(from, clientes);
        //         });
        //         break;

        //     case 'opcion3':
        //         smartolt.get_all_onus_details(function (res) {
        //             let clientes = ``;
        //             let cont = 0;
        //             for (let i = 0; i < res.length; i++) {
        //                 let item = res[i];
        //                 if (item.signal == "Warning" && cont <= 10) {
        //                     clientes += `${ item.name } = ${ item.signal } = ${ item.signal_1310 }\n`;
        //                     cont++;
        //                 }
        //             }
        //             client.sendMessage(from, clientes);
        //         });
        //         break;

        //     default:
        //         mensaje_tmp = body;
        //         break;
        // }

        // whatsapp_action.say_hello(client, from);

    });
    console.log("ready!");
});

client.initialize();