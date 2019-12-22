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

var clients = 0;
var messages = {};

io.on('connection', function(socket) {

   //test 
   
   socket.emit('test', 'ok');
   
   //couter
   
   clients++;
   const tag = clients;
   io.sockets.emit('counter', clients);
   console.log(clients);
   
   //default room
   
   var room = "default";
   socket.join(room);

   //send all cached messages of the room

   if(!messages[room]){
      messages[room] = [];
   }else{
      messages[room].map(msg => socket.emit('message', msg));
   }
   
   //disconnect
   
   socket.on('disconnect', function () {
      clients--;
      console.log(clients);
      io.sockets.emit('counter', clients);
   });
   
   //get in a room
   
   socket.on('get', function(nRoom){
      socket.leave(room);
      socket.emit('clear')
      room = nRoom;
      socket.join(nRoom);
      if(!messages[room]){
         messages[room] = [];
      }else{
         messages[room].map(msg => socket.emit('message', msg));
      }
   });
   
   //receive messages
	
   socket.on('send', (data) => {
      if(!data.author){ data.author = 'Guest'+tag; }
      
      if(data.author !== 'admin'){
         if(!messages[room]){
            messages[room] = [];
         }      
         
         messages[room].push(data);

         io.to(room).send({'text': data.text, 'author':data.author});
         
      }if(data.text == 'clear' && data.author == 'admin'){
         messages = [];
         io.sockets.emit('clear');
         
      }if(data.text == 'date' && data.author == 'admin'){
         socket.emit('message', {'text': Date(), 'author': 'server'});
         
      }if(data.text == 'count' && data.author == 'admin'){
         socket.emit('message', {'text': clients, 'author': 'server'});
         
      }
   });
});

server.listen(process.env.PORT || 5000, function() {
   console.log('listening on *:5000');
});
