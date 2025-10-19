export interface QrisInput {
    qris: string;
    nominal: string;
    serviceFee?: {
        type: 'r' | 'p';
        amount: string;
    };
}

export interface QrisOutput {
    result: string;
}