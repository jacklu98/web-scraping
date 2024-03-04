# web-scarping-puppeteer service
use `npm install` to install all dependencies \n
use `npm start` to start the service

use `http://localhost:3000/retrieve-home-listing` to get all data.
Or use `http://localhost:3000/retrieve-home-listing?page=22&pageSize=10` with query paramaters page/pageSize to get information as developer wants

use `http://localhost:3000/scrape` to start scraping, search and extract home listing information data and store in json.

> src/app.ts
The web service server.

> src/scrape.ts
start sraping the home listing data in the website and save such data into data.json file.

> src/data.json
store searched home listing information, with format { price, address, bedrooms, bathrooms, squareFootage }.