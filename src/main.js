const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.json());
app.use(cors());

app.use(express.static('public'));

app.get( '/test', () => res.json({'server': 'running'}) );

function html(text) {
   return text.replace(/&/g, '&amp;').
      replace(/</g, '&lt;').  // it's not neccessary to escape >
      replace(/"/g, '&quot;').
      replace(/'/g, '&#039;');
}

var clients = {};
var messages = {};

io.on('connection', function(socket) {


   //test 

   socket.emit('test', {server: 'running'});


   //default room
   
   var room = "default";
   socket.join(room);


   //send all cached messages of the room
   // and configure the clients number

   if(!messages[room]){
      clients[room] = 1;
      messages[room] = [];
      console.log(clients);
   }else{
      clients[room] += 1;
      console.log(clients);
      messages[room].map(msg => socket.emit('message', msg));
   }


   //couter
   
   const tag = clients;
   io.sockets.emit('counter', clients[room]);


   //disconnect
   
   socket.on('disconnect', function () {
      clients[room] -= 1;
      io.sockets.emit('counter', clients[room]);
   });


   //get in a room
   
   socket.on('get', function(nRoom){
      socket.leave(room);
      socket.emit('clear')
      socket.join(nRoom);
      if(!messages[nRoom]){
         messages[nRoom] = [];
      }if(!clients[nRoom]){
         clients[room] -= 1;
         clients[nRoom] = 1;
         console.log(clients);
         io.sockets.emit('counter', clients[nRoom]);
         messages[nRoom].map(msg => socket.emit('message', msg));
      }else{
         clients[room] -= 1;
         clients[nRoom] += 1;
         console.log(clients);
         io.sockets.emit('counter', clients[room]);
         messages[nRoom].map(msg => socket.emit('message', msg));
      }
      room = nRoom;
   });


   //receive messages
	
   socket.on('send', (data) => {
      if(!data.author){ data.author = 'Guest'+tag; }
      
      if(data.author !== 'admin'){
         if(!messages[room]){
            messages[room] = [];
         }      
         
         messages[room].push(data);

         io.to(room).send({'text': html(data.text), 'author': html(data.author)});
         
      }if(data.text == 'clear' && data.author == 'admin'){
         messages[room] = [];
         io.sockets.emit('clear');
         
      }if(data.text == 'date' && data.author == 'admin'){
         socket.emit('message', {'text': Date(), 'author': 'server'});
         
      }if(data.text == 'count' && data.author == 'admin'){
         socket.emit('message', {'text': clients[room], 'author': 'server'});

      }
   });
});

server.listen(process.env.PORT || 5000, function() {
   console.log('listening on *: '+(process.env.PORT || 5000));
});
