import QrisService from '../services/qris.service';
import { QrisInput, QrisOutput } from '../types/qris.type';

export class QrisController {
    private qrisService: QrisService;

    constructor() {
        this.qrisService = new QrisService();
    }

    public convert = (input: QrisInput): QrisOutput => {
        const { qris, nominal, serviceFee } = input;
        const convertedQris = this.qrisService.convert(qris, nominal, serviceFee?.amount);
        return { result: convertedQris };
    }
}