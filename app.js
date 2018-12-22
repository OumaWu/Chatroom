var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var ent = require('ent'); // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
var session = require("express-session")({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
})
var sharedsession = require("express-socket.io-session");

// Attach session
app.use(session);

// Share session with io sockets
io.use(sharedsession(session));


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

    socket.on('usr', (usr) => {
        usr = ent.encode(usr); // Escape unsafe characters
        // socket.usr = usr;
        //use session to store the user info
        socket.handshake.session.usr = usr;
        socket.handshake.session.save();
        socket.broadcast.emit('new_usr', usr);
        console.log('user ' + usr + ' has joined the conversation.');
    });

    socket.on('msg', (msg) => {
        msg = ent.encode(msg);
        socket.broadcast.emit('msg', { usr: socket.handshake.session.usr, content: msg });
        // console.log(`message form ${msg.usr}: ` + msg.content);
    });

    socket.on('disconnect', () => {
        // notify other clients when an user left the conversation
        socket.broadcast.emit('usr_left', socket.handshake.session.usr);
        console.log('user ' + socket.handshake.session.usr + ' has left the conversation.');
        delete socket.handshake.session.usr;
        socket.handshake.session.save();
    });

});


server.listen(8080);
// WARNING: app.listen(80) will NOT work here!