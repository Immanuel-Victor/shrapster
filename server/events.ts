import net from 'net'
import { UserList, File } from '../types';
import { parseRegex } from '../utils';

const userList: UserList = {};

export const handleEvents = (eventEmitter) => {
    eventEmitter.on("JOIN", (socket: net.Socket, connectionId: string, clientIP: string) => {
        console.log("connectionId connection: ", connectionId)
        console.log(`Client ${clientIP} joined.`);
        if (!userList[connectionId]) userList[connectionId] = { ip: clientIP, files: [] };
        socket.write(`CONFIRMJOIN\n`);
        console.log(userList);
    });

    eventEmitter.on("CREATEFILE", (socket: net.Socket, connectionId: string, filename: string, size: number) => {
        if (userList[connectionId]) {
            const file: File = { filename, size };
            userList[connectionId].files.push(file);
            socket.write(`CONFIRMCREATEFILE ${filename}\n`);
        }
    });

    eventEmitter.on("DELETEFILE", (socket: net.Socket, connectionId: string, fileName: string) => {
        if (userList[connectionId]) {
            {
                userList[connectionId].files = userList[connectionId].files.filter(file => file.filename != fileName);
                socket.write(`CONFIRMDELETEFILE ${fileName}\n`);
            }
        }
    });

    eventEmitter.on("SEARCH", (socket: net.Socket, connectionId: string, searchPattern: string) => {
        const resultList: {
            filename: string,
            ipAddress: string,
            sizeInBytes: number,
        }[] = [];
        const regexPattern = parseRegex(searchPattern)
  
        for (let conId in userList) {
            userList[conId].files.filter(file => file.filename.match(regexPattern)).forEach(foundFile => resultList.push({
                filename: foundFile.filename,
                ipAddress: userList[conId].ip,
                sizeInBytes: foundFile.size
            }))
        }

        let fileList = ''

        for (const file of resultList) {
            fileList += `FILE ${file.filename} ${file.ipAddress} ${file.sizeInBytes}\n`
        }

        socket.write(fileList)
    });

    eventEmitter.on("LEAVE", (socket: net.Socket, connectionId: string) => {
        logoutUser(connectionId);
        console.log(userList);
        socket.write(`CONFIRMLEAVE\n`);
    });

}

export const logoutUser = (connectionId: string) => {
    if (userList[connectionId]) delete userList[connectionId];
}