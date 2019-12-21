const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.json());
app.use(cors());

app.get( '/', function(req, res) {
   res.sendFile(path.join(__dirname + '/../public/index.html'));
});

app.get( '/test', () => res.json({'server': 'running'}) );

var clients = 0;
io.on('connection', function(socket) {
   clients++;
   console.log(clients);

   socket.on('disconnect', function () {
      clients--;
      console.log(clients);
      socket.broadcast.emit('test', clients);
   });

   socket.on('send', (data) => {
      console.log(`${data.author}: ${data.text}`);
      io.sockets.send({'text': data.text, 'author':data.author});
   });
   socket.broadcast.emit('test', clients);
});

server.listen(process.env.PORT || 5000, function() {
   console.log('listening on *:5000');
});
