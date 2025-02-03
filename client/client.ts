import net from "net";
import EventEmitter from "events";
import fs from 'fs'

const eventEmitter = new EventEmitter();

const client = net.createConnection({ host: "localhost", port: 1234 }, () => {
    client.write("JOIN 123");
});

client.on("data", (data) => {
    console.log(data.toString());

})

const server = net.createServer((socket: net.Socket) => {
    console.log('Client connected');
});

server.on("connection", (socket: net.Socket) => {
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

const getFile = (filename: string, start: number, end?: number) => {
    return new Promise<Buffer>((resolve, reject) => {
        const offsets = end ? { start, end } : { start };
        const chunks: (string | Buffer<ArrayBufferLike>)[] = [];
    
        const stream = fs.createReadStream(`${__dirname}/public/${filename}`, offsets);
    
        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });
        
        stream.on('end', () => {
            resolve(Buffer.concat(chunks as any[]))
        });
        
        stream.on('error', (err) => {
            console.log(err.message)
            reject(Buffer.from("Erro ao ler o arquivo"));
        });

    })
}

const requestFile = (host: string, fileName: string, start: number, end?: number) => {
    const offsetString = end ? `${start}-${end}` : start.toString()
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

requestFile("localhost", "aaa.txt", 0, 10);