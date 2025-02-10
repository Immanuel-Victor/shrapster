import net from "net";
import EventEmitter from "events";
import fs from 'fs'
import { getFile } from './files.ts'
import { joinServer, handleUserInteraction } from "./terminal-kit";
import { terminal } from "terminal-kit";

const eventEmitter = new EventEmitter();
const client = net.createConnection({ host: "localhost", port: 1234 }, async () => {
    const response = await joinServer();
    client.write(response)
});

let userCreatedFiles: string[] = []
const peers = {}

client.on("data", async (data) => {
    const commands = data.toString().trim().split("\n");
    commands.forEach(async (command, index, commandArray) => {
        const messages = command.split(" ");
            if (messages[0] === 'CONFIRMJOIN' && messages[1]) {
                const menuInteraction = await handleUserInteraction(userCreatedFiles, peers);
                client.write(menuInteraction)
            }

            if(messages[0] === 'CONFIRMCREATEFILE') {
                terminal(`\n^GArquivo ^[white]${messages[1]} ^Gcriado com sucesso!\n`)
                userCreatedFiles.push(messages[1])
                const menuInteraction = await handleUserInteraction(userCreatedFiles, peers);
                client.write(menuInteraction)
                terminal.grabInput(false)
            }

            if(messages[0] === 'CONFIRMDELETEFILE') {
                terminal(`\n^RArquivo ^[white]${messages[1]} ^Rremovido com sucesso!\n`)
                userCreatedFiles = userCreatedFiles.filter((file) => file !== messages[1])
                const menuInteraction = await handleUserInteraction(userCreatedFiles, peers);
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
                if(!peers[messages[2]]) {
                    peers[messages[2]] = {
                        files: []
                    }
                }
                const newFile = { fileName: messages[1], size: parseInt(messages[3]) }
                const alreadyExists = (peers[messages[2]]['files'] as [] || undefined).findIndex((file: any) => (file.fileName == newFile.fileName && file.size == newFile.size)) > -1
                if (!alreadyExists) {
                    peers[messages[2]]['files'].push(newFile)
                }
                if (index == (commandArray.length - 1)) {
                    const menuInteraction = await handleUserInteraction(userCreatedFiles, peers);
                    client.write(menuInteraction)
                }
            }
    })
});

client.on("error", () => {
    clearClient();
})

const server = net.createServer((socket: net.Socket) => {});

server.on("connection", async (socket: net.Socket) => {
    socket.on("data", async (data) => {
        const message = data.toString().trim().split("\n")[0].split(" ")
        if (message[0] === 'GET') {
            const fileName = message[1];

            const offsets = message[2].split("-");
            const offsetStart = parseInt(offsets[0]);
            let offsetEnd: number | undefined = undefined;
            if(offsets[1]) {
                offsetEnd = parseInt(offsets[1])
            }

            const file = await getFile(fileName, offsetStart, offsetEnd);

            socket.write(file);
        }

    })
});

export const requestFile = (host: string, fileName: string, start: number, end?: number) => {
    const offsetString = end ? `${start}-${end}` : start.toString()
    const client = net.createConnection({ host, port: 1235 }, () => {
        client.write(`GET ${fileName} ${offsetString}\n`);
    });

    client.on("data", (data) => {
        fs.writeFileSync(`${__dirname}/public/${fileName}`, data);
    });

    client.on("error", () => {
        client.end()
    })
}

server.listen(1235, '0.0.0.0', () => {});


process.on('SIGINT', () => {
    clearClient()
});

const clearClient = () => {
    client.end();
    server.close();
    setTimeout(() => process.exit(), 500);
}