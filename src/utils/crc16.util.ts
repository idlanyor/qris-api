function convertCRC16(str: string): string {
    function charCodeAt(str: string, i: number): number {
        return str.charCodeAt(i);
    }
    
    let crc: number = 0xFFFF;
    const strlen: number = str.length;

    for (let c = 0; c < strlen; c++) {
        crc ^= charCodeAt(str, c) << 8;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }

    let hex: string = (crc & 0xFFFF).toString(16).toUpperCase();
    if (hex.length === 3) hex = "0" + hex;
    return hex;
}

export { convertCRC16 };