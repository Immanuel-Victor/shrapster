import termKit from 'terminal-kit'
import { getIPv4Address } from './ip'
import { readPublicFiles } from './files'
import { resolve } from 'path'
import { File } from '../types'
import { requestFile } from './client'

export const terminal = termKit.terminal()

function handleUserInteraction(userFiles: string[], peerList): Promise<string> {
    const menuOptions = ["Criar Arquivo", "Buscar Arquivo", "Remover Arquivo", "Baixar Arquivo", "Sair ->"]
    terminal("\n^cOlá, seja bem vindo!  O que você gostaria de fazer agora?")
    
    return new Promise((resolve) => {
        terminal.singleColumnMenu( menuOptions, (error, response) => {
            switch(response.selectedIndex) {
                case 0: 
                    resolve(createArchive(userFiles, peerList));
                    break;
                case 1: 
                    resolve(searchArchives())
                    break;
                case 2:
                    resolve(deleteArchive(userFiles, peerList))
                    break;
                case 3:
                    resolve(downloadFile(peerList,userFiles))
                    break;
                case 4:
                    resolve(leaveServer(userFiles, peerList));
                    break;
            }   
        })
    })
}

function createArchive(userCreatedFiles: string[], peerList): Promise<string> {
    const archives = readPublicFiles();
    return new Promise((resolve) => {
        if (archives.length === 0) {
            terminal("\n^RVocê não tem arquivos. Adicione arquivos à sua pasta public para poder prosseguir!\n");
            return resolve(handleUserInteraction(userCreatedFiles, peerList));
        }

        terminal("\n^GQual dos arquivos da sua pasta pública você gostaria de disponibilizar?")
    
        const options = archives.map(archive => archive.name);

        terminal.gridMenu(options, (error, response) => {
            const file = archives[response.selectedIndex];
            terminal.grabInput(false)
            resolve(`CREATEFILE ${file.name} ${file.size}\n`);
        })
    })
}

function deleteArchive(userCreatedFiles: string[], peerList): Promise<string> {
    return new Promise((resolve) => {
        if(userCreatedFiles.length === 0) {
            terminal("\n^RVocê não tem arquivos disponibilizados. Disponibilize arquivos na rede para prosseguir\n")
            return resolve(handleUserInteraction(userCreatedFiles, peerList));
        }

        terminal("\n^ROk, qual arquivo você gostaria de indisponibilizar no sistema?\n")

        terminal.gridMenu(userCreatedFiles, (error, response) => {
            const file = userCreatedFiles[response.selectedIndex];
            resolve(`DELETEFILE ${file}\n`)
        })
    })

}

function searchArchives(message: string = "\nCerto, por favor, informe o padrão com um regex, ou com um valor que você deseja buscar\n"): Promise<string> {
    terminal(message)

    return new Promise(resolve => {
        terminal.inputField((error, pattern) => {
            if (pattern) {
                console.log('\n', pattern)
                resolve(`SEARCH ${pattern}\n`)
                terminal.grabInput(false)
            } else {
                terminal("sinto muito, não entendi")
                resolve(searchArchives("\nVamos tentar novamente, digite um padrão ou valor de busca"))
            }
        })
   })
}

function leaveServer(userCreatedFiles: string[], peerList): Promise<string> {
    terminal("\nVocê realmente quer sair do shrapster? [^GY^w|^RN^w]")

    return new Promise((resolve) => {
        terminal.singleLineMenu(["Sim", 'Não'], (error, response) => {
            if(response.selectedIndex === 0) {
                terminal("\n")
                terminal.grabInput(false)
                resolve(`LEAVE\n`)
            } else {
                resolve(handleUserInteraction(userCreatedFiles, peerList));
            }
        })
    })
}

function joinServer(): Promise<string> {
   terminal("\nVocê gostaria de entrar no sharpster? [^GY^w|^RN^w]")

    return new Promise((resolve) => {
        terminal.singleLineMenu( ["Sim", 'Não'], (error, response) => {
            if(response.selectedIndex === 0) {
                const clientIp = getIPv4Address()
                terminal("\n")
                terminal.grabInput(false)
                resolve(`JOIN ${clientIp}\n`)
            } else {
                process.exit()
            }
        })
    })
}

function getIpInput(peerList, userCreatedFiles: string[]): Promise<string> {
    console.log(peerList)
    const peersArray = Object.keys(peerList)
    console.log(peerList)
    return new Promise((resolve) => {
        if(peerList.length === 0) {
            terminal("\n^RSinto muito, você não pesquisou nenhum arquivo, portanto não posso te indicar um peer para se conectar\n")
            resolve(handleUserInteraction(userCreatedFiles, peerList))
        }

        terminal("Com qual IP você gostaria de se conectar?")

        terminal.gridMenu(peersArray, (error, response) => {
            const peer = peersArray[response.selectedIndex];
            terminal.grabInput(false)
            resolve(peer);
        })
    })
}

function getFileName(connectionIP, peerList): Promise<string> {
    return new Promise((resolve) => {
        terminal("Qual arquivo você gostaria de baixar?")

        terminal.gridMenu(peerList[connectionIP].files.map(file => file.fileName), (error, response) => {
            const chosenFile = peerList[connectionIP].files.filter(file => file.fileName === response.selectedText)[0].fileName;
            terminal.grabInput(false)
            resolve(chosenFile);
        })
    })
}

function getFileOffsets(): Promise<number[]> {
    return new Promise((resolve) => {
        terminal("Quanto do arquivo você gostaria de receber? (Digite um offset no formato: 0-1000): ")

        terminal.inputField((error, input) => {
            if (input) {
                const offsets = input.split("-");
                const offsetStart = parseInt(offsets[0]);
                let offsetEnd: number | undefined = undefined;
                if(offsets[1]) {
                    offsetEnd = parseInt(offsets[1])
                    resolve([offsetStart,offsetEnd])
                }
                terminal.grabInput(false)
                resolve([offsetStart])
            } else {
                terminal.grabInput(false)
                resolve([0])
            }
        })
    })
}

async function downloadFile(peersList, userCreatedFiles): Promise<string> {
    const connectionIP = await getIpInput(peersList, userCreatedFiles);
    const fileName = await getFileName(connectionIP, peersList);
    const fileOffsets = await getFileOffsets();

    requestFile(connectionIP, fileName, fileOffsets[0], fileOffsets[1]);

    return handleUserInteraction(userCreatedFiles, peersList)
}

export {
    getIpInput,
    getFileName,
    getFileOffsets,
    handleUserInteraction,
    joinServer,
    deleteArchive
}