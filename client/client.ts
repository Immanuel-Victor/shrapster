import net from "net";
import EventEmitter from "events";
import fs from 'fs'
import { getFile } from './files.ts'
import { getFileName, getFileOffsets, getIpInput, joinServer, handleUserInteraction } from "./terminal-kit";
import { terminal } from "terminal-kit";

const eventEmitter = new EventEmitter();
const client = net.createConnection({ host: "localhost", port: 1234 }, async () => {
    const response = await joinServer();
    client.write(response)
});

client.on("data", async (data) => {
    const commands = data.toString().trim().split("\n");
    commands.forEach(async command => {
        const messages = command.split(" ");
            if (messages[0] === 'CONFIRMJOIN' && messages[1]) {
                const menuInteraction = await handleUserInteraction();
                client.write(menuInteraction)
            }
    
            if(messages[0] === 'CONFIRMCREATEFILE') {
                terminal(`\n^GArquivo ^[white]${messages[1]} ^Gcriado com sucesso!\n`)
                const menuInteraction = await handleUserInteraction();
                client.write(menuInteraction)
                terminal.grabInput(false)
            }

            if(messages[0] === 'CONFIRMDELETEFILE') {
                terminal(`\n^RArquivo ^[white]${messages[1]} ^Rremovido com sucesso!\n`)
                const menuInteraction = await handleUserInteraction();
                client.write(menuInteraction)
                terminal.grabInput(false)
            }
            
            if(messages[0] === 'CONFIRMLEAVE') {
                terminal('Sentiremos sua falta\n');
                terminal.grabInput(false);
                process.exit()
            }
    
            if(messages[0] === 'FILE') {
                terminal(`\nArquivo ${messages[1]} encontrado com o usuário de ip ${messages[2]} de tamanho ${messages[3]} bytes`)
            }
    })
});

const server = net.createServer((socket: net.Socket) => {
    console.log('Client connected');
});

server.on("connection", async (socket: net.Socket) => {
    const connectionIP = await getIpInput();
    const fileName = await getFileName();
    const fileOffsets = await getFileOffsets();

    requestFile(connectionIP, fileName, fileOffsets[0], fileOffsets[1]);
    
    socket.on("data", async (data) => {
        const message = data.toString().trim().split(" ")
        if (message[0] === 'GET') {
            const filename = message[1];

            const offsets = message[2].split("-");
            const offsetStart = parseInt(offsets[0]);
            let offsetEnd: number | undefined = undefined;
            if(offsets[1]) {
                offsetEnd = parseInt(offsets[1])
            }

            const file = await getFile(filename, offsetStart, offsetEnd);

            socket.write(file);
        }

    })
});

const requestFile = (host: string, fileName: string, start: number, end?: number) => {
    const offsetString = end ? `${start}-${end}` : start.toString()
    console.log(`GET ${fileName} ${offsetString}`)
    const client = net.createConnection({ host, port: 1235 }, () => {
        console.log("Connected to host");
        client.write(`GET ${fileName} ${offsetString}`);
    });

    client.on("data", (data) => {
        console.log(data.toString());
        
        fs.writeFileSync(`${__dirname}/public/${fileName}`, data);
    })
}

server.listen(1235, '0.0.0.0', () => {
    console.log('Server listening on port 1235');
});