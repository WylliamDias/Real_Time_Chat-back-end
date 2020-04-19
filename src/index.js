const express = require('express')
const app = express()

const server = require('http').Server(app)

const io = require('socket.io')(server)

app.use(express.json())

app.get('/', (req, res) => {

})

io.on('connection', socket => {

  socket.on('sendMsg', data => {

    console.log(data)

    socket.broadcast.emit('newMsg', {
      text: data.text,
      id: data.id
    })
  })

  console.log(socket.id)
})

server.listen(8000)
