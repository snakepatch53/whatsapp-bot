const MORONANET_GROUP = '120363022595512844@g.us';


module.exports = {
    say_hello: function (client, from) {
        if (from == MORONANET_GROUP) {
            client.sendMessage(from, 'Hola!');
        }
    }
}

