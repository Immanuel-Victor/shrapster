import { Server } from "socket.io";
require('dotenv').config()

const io = new Server({ 
    cors: {
        origin: `http://localhost:${process.env.CLIENT_PORT || 5173}`
    }
 });

io.on("connection", (socket) => {
  console.log('listening')
  socket.emit("hello", "aaaaaaaaaa", () => { console.log ('hi')})
  socket.emit('foo', "eventFoo")
});


io.listen(Number(process.env.SERVER_PORT) || 4000);