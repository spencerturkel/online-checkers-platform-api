import express, { json } from 'express';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(json());

app.all('*', (req, res) => res.send('Hello, world'));

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
