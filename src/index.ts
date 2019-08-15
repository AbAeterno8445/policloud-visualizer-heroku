import express from "express";
import path from "path";
import {FirebaseHandler} from "./firebaseHandler";

const http = require('http');
const socketIO = require('socket.io');

const app = express();
const port = process.env.PORT || 8000;
var server = http.Server(app);
var io = socketIO(server);

app.set( "views", path.join( __dirname, "views" ) );
app.set( "view engine", "ejs" );
app.use(express.static(__dirname + "/views"));

// Init firebase handler
const fbaseHandler: FirebaseHandler = new FirebaseHandler(io, 'usuarios/', 'conexiones/');

app.get( "/", ( req, res ) => {
  res.render("index");
} );

io.on('connection', function(socket: any) {
  // User joins the page, send data
  socket.on('join', function() {
    console.log("Received connection from", socket.id);
    var userList = fbaseHandler.userList;
    var connList = fbaseHandler.connectionList;
    
    io.sockets.connected[socket.id].emit('avaCount', {count: userList.length});
    userList.forEach(function(user) {
      io.sockets.connected[socket.id].emit('newUser',
      {
        uid: user.id,
        name: user.name,
        downloadURL: user.imagePath,
        color: user.color
      });
    });
    connList.forEach(function(conn) {
      io.sockets.connected[socket.id].emit('connUsers',
      {
        cid: conn.id,
        usr1: conn.originUser,
        usr2: conn.targetUser
      });
    });
  });
});

server.listen( port,() => {
  console.log( `Servidor iniciado: http://localhost:${ port }` );
} );
