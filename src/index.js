const express = require('express')
const app = express()

const server = require('http').Server(app)

const io = require('socket.io')(server)

app.use(express.json())

io.on('connection', socket => {
  socket.on('sendMsg', data => {
    socket.broadcast.emit('newMsg', {
      text: data.text,
      id: data.id
    })
  })
})

server.listen(8000)
