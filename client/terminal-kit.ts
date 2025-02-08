import termKit from 'terminal-kit'
import { getIPv4Address } from './ip'
import { readPublicFiles } from './files'
import { resolve } from 'path'

export const terminal = termKit.terminal()
const userCreatedFiles: string[] = []

function handleUserInteraction(): Promise<string> {
    const menuOptions = ["Criar Arquivo", "Buscar Arquivo", "Remover Arquivo", "Sair ->"]
    terminal("\n^cOlá, seja bem vindo!  O que você gostaria de fazer agora?")
    return new Promise((resolve) => {
        terminal.singleColumnMenu( menuOptions, (error, response) => {
            switch(response.selectedIndex) {
                case 0: 
                    resolve(createArchive());
                    break;
                case 1: 
                    resolve(searchArchives())
                    break;
                case 2:
                    resolve(deleteArchive(userCreatedFiles))
                    break;
                case 3:
                    resolve(leaveServer());
                    break
            }   
        })
    })
}

function createArchive(): Promise<string> {
    const archives = readPublicFiles();
    return new Promise((resolve) => {
        if (archives.length === 0) {
            terminal("\nVocê não tem arquivos. Adicione arquivos à sua pasta public para poder prosseguir!`\n");
            return resolve(handleUserInteraction());
        }
    
        const options = archives.map(archive => archive.name);

        terminal.gridMenu(options, (error, response) => {
            const file = archives[response.selectedIndex];
            terminal.grabInput(false)
            userCreatedFiles.push(archives[response.selectedIndex].name)
            resolve(`CREATEFILE ${file.name} ${file.size}\n`);
        })
    })
}

function deleteArchive(userCreatedFiles: string[]): Promise<string> {
    terminal("\n Ok, qual arquivo você gostaria de indisponibilizar no sistema?\n")

    return new Promise((resolve) => {
        if(userCreatedFiles.length === 0) {
            terminal("\nVocê não tem arquivos. Disponibilize arquivos na rede para prosseguir`\n")
            return resolve(handleUserInteraction());
        }
        terminal.gridMenu(userCreatedFiles, (error, response) => {
            const file = userCreatedFiles[response.selectedIndex];
            resolve(`DELETEFILE ${file}`)
        })
    })

}

function searchArchives(message: string = "\nCerto, por favor, informe o padrão com um regex, ou com um valor que você deseja buscar\n"): Promise<string> {
    terminal(message)

    return new Promise(resolve => {
        terminal.inputField((error, pattern) => {
            if (pattern) {
                resolve(`SEARCH ${pattern}`)
            } else {
                terminal("sinto muito, não entendi")
                resolve(searchArchives("\nVamos tentar novamente, digite um padrão ou valor de busca"))
            }
        })
   })
}

function leaveServer(): Promise<string> {
    terminal("\nVocê realmente quer sair do shrapster? [^GY^w|^RN^w]")

    return new Promise((resolve) => {
        terminal.singleLineMenu(["Sim", 'Não'], (error, response) => {
            if(response.selectedIndex === 0) {
                terminal("\n")
                terminal.grabInput(false)
                resolve(`LEAVE`)
            } else {
                resolve(handleUserInteraction());
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

function getIpInput(): Promise<string> {
    return new Promise((resolve) => {
        terminal("Com qual IP você gostaria de se conectar?")

        terminal.inputField((error, input) => {
            if (input) {
                resolve(input)
            } else {
                resolve("sinto muito, não entendi")
            }
        })
    })
}

function getFileName(): Promise<string> {
    return new Promise((resolve) => {
        terminal("Certo, agora qual arquivo você gostaria de receber?")

        terminal.inputField((error, input) => {
            if (input) {
                resolve(input)
            } else {
                resolve("sinto muito, não entendi")
            }
        })
    })
}

function getFileOffsets(): Promise<number[]> {
    return new Promise((resolve) => {
        terminal("Certo, quanto do arquivo você gostaria de receber? (Digite um offset no formato: 0-1000 ou 0)")

        terminal.inputField((error, input) => {
            if (input) {
                const offsets = input.split("-");
                const offsetStart = parseInt(offsets[0]);
                let offsetEnd: number | undefined = undefined;
                if(offsets[1]) {
                    offsetEnd = parseInt(offsets[1])
                    resolve([offsetStart,offsetEnd])
                }

                resolve([offsetStart])
                
            } else {
                resolve([0])
            }
        })
    })
}

export {
    getIpInput,
    getFileName,
    getFileOffsets,
    handleUserInteraction,
    joinServer,
    deleteArchive
}