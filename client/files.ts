import fs from 'fs';
import path from 'path';

export const getFile = (filename: string, start: number, end?: number) => {
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

export const readPublicFiles = () => {
    const publicFolder = path.join(`${__dirname}`, 'public/');
    const fileNames = fs.readdirSync(publicFolder);

    const files = fileNames.map(file => {
        const size = fs.statSync(`${publicFolder}${file}`).size;
        return { name: file, size };
    });

    return files;
}