import net from "net";
import EventEmitter from "events";
import { handleSocket } from "./socketHandler";
import { handleEvents } from "./events";

const eventEmitter = new EventEmitter();

const server = net.createServer((socket) => {
  console.log('Client connected');
  handleSocket(socket, eventEmitter);
});

handleEvents(eventEmitter);

server.listen(1234, () => {
  console.log('Server listening on port 1234');
});