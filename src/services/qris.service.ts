class QrisService {
    validatePayload(qris: string, nominal: string): string | null {
        if (!nominal || !/^\d{1,13}$/.test(nominal)) {
            return 'Nominal harus berupa angka (maks 13 digit)';
        }
        if (typeof qris !== 'string' || qris.length < 20) {
            return 'QRIS tidak valid atau terlalu pendek';
        }
        if (!qris.startsWith('000201')) {
            return 'QRIS tidak memiliki header 000201';
        }
        if (!qris.includes('5802ID')) {
            return 'QRIS tidak memiliki country code 58=ID';
        }
        const merchant = this.extractMerchantName(qris);
        if (!merchant) {
            return 'QRIS tidak memiliki tag 59 (Merchant Name)';
        }
        const crcIdx = qris.lastIndexOf('6304');
        if (crcIdx === -1 || crcIdx + 8 > qris.length) {
            return 'QRIS tidak memiliki CRC tag 63 yang valid';
        }
        const providedCrc = qris.slice(crcIdx + 4, crcIdx + 8).toUpperCase();
        const base = qris.slice(0, crcIdx);
        const calc = this.convertCRC16(base);
        if (!/^[0-9A-F]{4}$/.test(providedCrc)) {
            return 'CRC bukan hex 4 digit';
        }
        if (providedCrc !== calc) {
            return 'CRC tidak sesuai dengan payload';
        }
        return null;
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
