export function parseRegex(input){
    const match = input.match(/^\/(.*)\/([a-z]*)$/i);
    if (match) {
        return new RegExp(match[1], match[2]);
    }
    return new RegExp(input);
}
