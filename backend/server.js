const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const express = require('express')
const chats = require('./data/data')
const connectDB = require('./config/db')
const userRoutes = require('./routes/userRoutes')
const chatRoutes = require('./routes/chatRoutes')
const { errorHandler, notFound } = require('./middlewares/errorMiddleware')
const messageRoutes = require('./routes/messageRoutes')

connectDB()
const app = express()

app.use(express.json())

app.use('/api/user', userRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/message', messageRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, console.log(`server started on ${PORT}`))

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: 'http://localhost:3000'
    }
})

io.on('connection', (socket) => {
    console.log('connectd to socket')

    socket.on('setup', (userData) => {
        socket.join(userData._id)
        socket.emit('connected')
    })

    socket.on('join chat', (room) => {
        socket.join(room)
        console.log('User joined room '+room)
    })

    socket.on('typing', (room) => socket.in(room).emit('typing'))
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'))

    socket.on('new message', (newMessageRcvd) => {
        let chat = newMessageRcvd.chat
        if(!chat.users) return console.log('chat.users not defined')

        chat.users.forEach(user => {
            if(user._id == newMessageRcvd.sender._id) return

            socket.in(user._id).emit('message received', newMessageRcvd)
        })
    })

    socket.off('setup', () => {
        console.log('User Disconnected')
        socket.leave(userData._id)
    })
})