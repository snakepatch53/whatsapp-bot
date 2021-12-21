const Client = require('whatsapp-web.js').Client;
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const DriveEntries = require('./drive-entries.js');
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
client.on('ready', async () => {
    console.log("Ready Whatsapp!");
    await DriveEntries.loadData();
    client.on('message', (message) => DriveEntries.drive(message, client));
});

client.initialize();