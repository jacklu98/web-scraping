import * as fs from 'fs';
import * as express from 'express';

const app: express.Express = express();
const PORT = 3000;

app.get('/', (req: express.Request, res: express.Response)=>{
  res.send("web scraping");
})

app.get('/retrieve-home-listing', async (req: express.Request, res: express.Response) => {
    const page = req.query?.page as string;
    const pageSize = req.query?.pageSize as string;
    fs.readFile('data.json', 'utf8', (err, jsonString) => {
      if (err) {
        console.error('Error reading file:', err);
        return;
      }
      const data = JSON.parse(jsonString);
      let pageData = data;
      if(page && pageSize) {
        const startIndex = parseInt(page) * parseInt(pageSize);
        const endIndex = (parseInt(page) + 1) * parseInt(pageSize);
        if (startIndex > data.length) return [];
        pageData = data.slice(startIndex, endIndex <= data.length ? endIndex : data.length);
      }
      res.json(pageData);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});