import { Elysia } from 'elysia';
import { QrisController } from './controllers/qris.controller';
import { QrisInput } from './types/qris.type';

const app = new Elysia();


const qrisController = new QrisController();

app.post('/convert', ({ body }) => qrisController.convert(body as QrisInput));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`QRIS API is running on http://localhost:${PORT}`);
});