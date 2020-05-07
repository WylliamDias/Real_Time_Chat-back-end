const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config({
  path: process.env.PATH_SECRET,
});

const server = require('http').Server(app);
const io = require('socket.io')(server);

const router = require('./router');

app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:3000',
  })
);
app.use(express.json());
app.use('/', router);

io.on('connection', socket => {
  socket.on('sendMsg', data => {
    socket.broadcast.emit('newMsg', {
      text: data.text,
      owner: data.owner,
    });
  });
  console.log(socket.id);
});

server.listen(8000);
