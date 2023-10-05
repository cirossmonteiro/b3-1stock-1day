import dotenv from 'dotenv';
import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import JsZip from "jszip";
import StreamZip from 'node-stream-zip';
import dayjs from "dayjs";


import https from 'https';
import fs from 'fs';
import JSZip from 'jszip';
import { parse } from 'csv-parse';

const records = [];

const delay = (time: number) => new Promise(resolve => setTimeout(() => resolve(null), time*1000));

dotenv.config();
 
const PORT = parseInt(`${process.env.PORT}`);


const app = express();

app.use(morgan('tiny'));
 
app.use(cors());
 
app.use(helmet());
 
app.use(express.json());
 
app.use(async (req: Request, res: Response) => {
  const url = `https://arquivos.b3.com.br/apinegocios/tickercsv/${req.query.stock}/${req.query.date}`;
  https.get(url, (resp: { pipe: (arg0: any) => any; }) => resp.pipe(fs.createWriteStream('data.zip')));
  
  await delay(3);

  const zip = new StreamZip({
    file: 'data.zip',
    storeEntries: true
  });

  zip.on('ready', () => {
    for (const entry of Object.values(zip.entries())) {
      const zipDotTxtContents = zip.entryDataSync(entry.name).toString('utf8');
      const rows = zipDotTxtContents.split('\n').slice(1)
        .map(r => {
          const row = r.split(';');
          return {
            price: Number(row[3].replace(',', '.')),
            quantity: Number(row[4]),
            time: dayjs(row[0]+row[5], "YYYY-MM-DDHHmmssSSS").format()
          };
        });
      zip.close(() => res.json(rows));
    }
    
  });
})
 
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).send(error.message);
})

 
app.listen(PORT, () => console.log(`Server is running at ${PORT}.`));