# web-scarping-puppeteer service
use `npm install` to install all dependencies
> scrape.ts
use `node scrape.js` to start sraping the home listing data in the website and save such data into data.json file.

> data.json
store searched home listing information, with format { price, address, bedrooms, bathrooms, squareFootage }.

> src/app.ts
use `npx ts-node src/app.ts` to start the web service server.
use `http://localhost:3000/retrieve-home-listing` to get all data.
Or use `http://localhost:3000/retrieve-home-listing?page=22&pageSize=10` query paramaters page/pageSize to get any page information as developer wants
