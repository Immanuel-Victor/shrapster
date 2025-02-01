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
            socket.write(`CONFIRMCREATEFILE ${filename}`);
        }
    });

    eventEmitter.on("DELETEFILE", (socket: net.Socket, connectionId: string, fileName: string) => {
        if (userList[connectionId]) {
            {
                const index = userList[connectionId].files.findIndex(file => file.filename == fileName);
                if (index > -1) userList[connectionId].files.slice(index, 1);
                socket.write(`CONFIRMDELETEFILE ${fileName}`);
            }
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