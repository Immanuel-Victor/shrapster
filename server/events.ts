import net from 'net'
import { UserList, File } from '../types';

const userList: UserList = {};

export const handleEvents = (eventEmitter) => {
    eventEmitter.on("JOIN", (socket: net.Socket, connectionId: string, clientIP: string) => {
        console.log("connectionId connection: ", connectionId)
        console.log(`Client ${clientIP} joined.`);
        if (!userList[connectionId]) userList[connectionId] = { ip: clientIP, files: [] };
        socket.write(`CONFIRMJOIN - You are registered with IP: ${clientIP}`);
        console.log(userList);

    });

    eventEmitter.on("CREATEFILE", (socket: net.Socket, connectionId: string, filename: string, size: number) => {
        if (userList[connectionId]) {
            const file: File = { filename, size };
            userList[connectionId].files.push(file);
            console.log(userList)
            socket.write(`CONFIRMCREATEFILE ${filename}`);
        }
    });

    eventEmitter.on("DELETEFILE", (socket: net.Socket, connectionId: string, fileName: string) => {
        if (userList[connectionId]) {
            {
                userList[connectionId].files = userList[connectionId].files.filter(file => file.filename != fileName);
                socket.write(`CONFIRMDELETEFILE ${fileName}`);
            }
            console.log(JSON.stringify(userList[connectionId]));
            
        }
    });

    eventEmitter.on("SEARCH", (socket: net.Socket, connectionId: string, searchPattern: string) => {
        const resultList: {
            filename: string,
            ipAddress: string,
            sizeInBytes: number,
        }[] = [];
        for (let conId in userList) {
            userList[conId].files.filter(file => file.filename.match(searchPattern)).forEach(foundFile => resultList.push({
                filename: foundFile.filename,
                ipAddress: userList[conId].ip,
                sizeInBytes: foundFile.size
            }))
        }
        if (!resultList) {
            socket.write("eu num sabo não, chefe :(")
        }
        for (const file of resultList) {
            socket.write(`FILE ${file.filename} ${file.ipAddress} ${file.sizeInBytes}`)
        }
    });

    eventEmitter.on("LEAVE", (socket: net.Socket, connectionId: string) => {
        if (userList[connectionId]) delete userList[connectionId];
        console.log(userList);
        socket.write(`CONFIRMLEAVE`);
    });

}