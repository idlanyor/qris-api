class QrisService {
    validateInput(data: any): boolean {
        // Implement validation logic for QRIS input data
        return true; // Placeholder for actual validation
    }

    convert(qris: string, qty: string): string {
        qris = qris.slice(0, -4);
        const step1 = qris.replace("010211", "010212");
        const step2 = step1.split("5802ID");
        const uang = "54" + qty.length.toString().padStart(2, '0') + qty;

        const finalUang = uang + "5802ID";
        const fix = step2[0].trim() + finalUang + step2[1].trim();
        return fix + this.convertCRC16(fix);
    }

    extractMerchantName(qris: string): string {
        try {
            // EMV TLV: tag(2) + length(2) + value(length)
            let i = 0;
            while (i + 4 <= qris.length) {
                const tag = qris.slice(i, i + 2);
                const lenStr = qris.slice(i + 2, i + 4);
                const len = Number.parseInt(lenStr, 10);
                if (!Number.isFinite(len) || len < 0) break;
                const valStart = i + 4;
                const valEnd = valStart + len;
                const value = qris.slice(valStart, valEnd);
                if (tag === '59') return value;
                i = valEnd;
            }
        } catch {
            // ignore
        }
        return '';
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
