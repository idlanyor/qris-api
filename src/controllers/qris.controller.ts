import QrisService from '../services/qris.service';
import { QrisInput, QrisOutput } from '../types/qris.type';

export class QrisController {
    private qrisService: QrisService;

    constructor() {
        this.qrisService = new QrisService();
    }

    public convert = (input: QrisInput): QrisOutput => {
        const { qris, nominal } = input;
        const converted = this.qrisService.convert(qris, nominal);
        const merchantName = this.qrisService.extractMerchantName(qris);
        return { qris: converted, nominal, merchantName };
    }
}
