import net from 'net'
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { File } from '../types';
import { logoutUser } from './events';

export const handleSocket = (socket: net.Socket, eventEmitter: EventEmitter) => {

    const connectionId = v4()
    socket.on('data', (data) => {
        const commands = data.toString().trim().split("\n");
        commands.forEach(async command => {
            const messages = command.toString().trim().split(" ");
            if (messages[0] === 'JOIN' && messages[1]) {
                const ipAddress = messages[1]
                eventEmitter.emit("JOIN", socket, connectionId, ipAddress)
            }
    
            if (messages[0] === 'CREATEFILE' && messages[1] && messages[2]) {
                const fileName = messages[1];
                const fileSize = messages[2];
                eventEmitter.emit('CREATEFILE', socket, connectionId, fileName, fileSize)
            }
    
            if (messages[0] === 'DELETEFILE' && messages[1]) {
                const fileName = messages[1];
                eventEmitter.emit('DELETEFILE', socket, connectionId, fileName)
            }
    
            if (messages[0] === 'SEARCH' && messages[1]) {
                const pattern = messages[1];
                eventEmitter.emit('SEARCH', socket, connectionId, pattern)
            }
    
            if (messages[0] === 'LEAVE') {
                eventEmitter.emit('LEAVE', socket, connectionId)
            }
        })
    });

    socket.on('error', () => {
        console.log('Forcefull Disconection')
        logoutUser(connectionId)
    })

    socket.on('end', () => {
        console.log('Client disconnected');
        logoutUser(connectionId);
        //Remove user from list -> socket.end bypasses LEAVE command, so it's necessary to repeat the logic
    });

}