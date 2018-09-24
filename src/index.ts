import cors from 'cors';
import express, { json } from 'express';
import helmet from 'helmet';

const app = express();

const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      'http://localhost:8080', // front-end development URL
      'https://onlinecheckersplatform.com',
    ],
  }),
);
app.use(helmet());
app.use(json());

app.all('*', (req, res) => res.send('Hello, world'));

app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
