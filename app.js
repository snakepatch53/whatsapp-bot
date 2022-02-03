const {
    Client,
    MessageMedia
} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const DriveEntries = require('./drive-entries.js');
const cluster = require('cluster');

//#region functions
const main = function () {
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

    // Guarde los valores de la sesión en el archivo después de una autenticación exitosa 
    client.on('authenticated', (session) => {
        sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
            if (err) console.error(err);
        });
    });

    // Generar codigo QR
    client.on('qr', (qr) => qrcode.generate(qr, 'small'));

    // Mensaje de bienvenida
    client.on('ready', async () => {
        console.log("Ready Whatsapp!");
        await DriveEntries.loadData();
        await DriveEntries.sendMsgUsers(client, "Hannbot esta listo!");
        client.on('message', (message) => {
            console.log(message.body + " ==> " + message.from);
            DriveEntries.drive(message, client, MessageMedia)
        });
    });

    client.initialize();
}
//#endregion



if (cluster.isMaster) {
    cluster.fork();
    cluster.on('exit', function (worker, code, signal) {
        if (code != 123321) cluster.fork();
    });
}
if (cluster.isWorker) {
    main();
}