const WebSocketServer = require('ws').Server,
    ChatServerManager = require('./managers/ChatServerManager'),
    wss = new WebSocketServer({ port: 1234 });

process.title = 'node-chat';

wss.on('connection', function connection(w) {
    
    let id = w.upgradeReq.headers['sec-websocket-key'];
    console.log('New Connection id :: ', id);

    w.on('message', function incoming(message) {
        let msgObject = JSON.parse(message),
            id = w.upgradeReq.headers['sec-websocket-key'],
            [messageToSend, toBroadCast] = ChatServerManager.CreateMessage(id, msgObject.action, msgObject.data);

        if (toBroadCast)
        {
            wss.broadcast(messageToSend);
        }
        else 
        {
            w.send(JSON.stringify(messageToSend));
        }
    });

    w.on('close', function() {
        let id = w.upgradeReq.headers['sec-websocket-key'];
        console.log('closing connection id: ' + id);
        ChatServerManager.UnregisterUser(id);
    });    
});

/**
 * Function to broadcast to all clients listening
 */
wss.broadcast = function broadcast(messageToSend) {
    let result = JSON.stringify(messageToSend);

    console.log("msg: " + result);
    wss.clients.forEach(function each(client) {
        client.send(result);
    });
};


