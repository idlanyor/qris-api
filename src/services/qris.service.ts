class QrisService {
    validateInput(data: any): boolean {
        // Implement validation logic for QRIS input data
        return true; // Placeholder for actual validation
    }

    convert(qris: string, qty: string, tax?: string): string {
        qris = qris.slice(0, -4);
        const step1 = qris.replace("010211", "010212");
        const step2 = step1.split("5802ID");
        const uang = "54" + qty.length.toString().padStart(2, '0') + qty;

        const finalUang = tax ? uang + tax + "5802ID" : uang + "5802ID";
        const fix = step2[0].trim() + finalUang + step2[1].trim();
        return fix + this.convertCRC16(fix);
    }

    private convertCRC16(str: string): string {
        let crc = 0xFFFF;
        for (let c = 0; c < str.length; c++) {
            crc ^= str.charCodeAt(c) << 8;
            for (let i = 0; i < 8; i++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc <<= 1;
                }
            }
        }
        const hex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
        return hex;
    }
}

export default QrisService;