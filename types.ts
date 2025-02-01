export type File = {
    filename: string;
    size: number;
}

export type UserList = {
    [id: string]: { ip: string, files: File[] }
}