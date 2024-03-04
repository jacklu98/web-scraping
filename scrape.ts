import * as fs from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as userAgent from 'user-agents';

interface ListingData {
    price: string,
    address: string,
    bedrooms: string,
    bathrooms: string,
    squareFootage: string
}

puppeteer.use(StealthPlugin());

async function scrapeGoogleAndNavigateToZillow(searchQuery: String) {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    const baseURL = "https://www.homes.com/";
    await page.setUserAgent(userAgent.toString());
    await page.goto(baseURL);
    await page.waitForSelector('input[type="text"]');

    // Search for homes of city
    const city = 'Orlando, FL';
    await page.type('input[type="text"]', city);
    await page.keyboard.press('Enter');
    await page.waitForNavigation();
    
    // Extract URLs of the listings on the page
    let listingUrls = await extractListingUrls(page);

    const pageUrls = await extractPageUrls(page);
    for (const pageUrl of pageUrls) {
        const pageListingUrls = await scrapeListingUrls(browser, pageUrl);
        console.log(pageListingUrls);
        listingUrls = listingUrls.concat(pageListingUrls);
    }
    await page.close();

    // Extract information from accessing pages of URLs
    const listingsData: ListingData[] = [];
    for (const listingUrl of listingUrls) {
        const listingData = await scrapeListingData(browser, listingUrl);
        console.log(listingData);
        if(!listingData) continue;
        listingsData.push(listingData);
    }
    const data = JSON.stringify(listingsData);
    fs.writeFile('data.json', data, (err) => {
        if(err) {
            console.error(err);
            return;
        }
        console.log("save successfully");
    });

    await browser.close();
}

async function extractListingUrls(page: any): Promise<string[]> {
    const listingUrls = await page.evaluate(() => {
        const listingElements = document.querySelectorAll('.for-sale-content-container > a[href*="property"]');
        const urls = Array.from(listingElements).map(element => element.getAttribute('href'));
        return urls.filter(url => url?.startsWith('/'));
    });
    // attach complete URL
    return listingUrls.map((url: String) => 'https://www.homes.com' + url);
}

async function extractPageUrls(page: any): Promise<string[]> {
    const pageUrls = await page.evaluate(() => {
        const pageElements = document.querySelectorAll('li > a[role="link"]');
        const urls = Array.from(pageElements).map(element => element.getAttribute('href'));
        return urls.filter(url => url?.startsWith('/'));
    });
    // attach complete URL
    return pageUrls.map((url: String) => 'https://www.homes.com' + url);
}

async function scrapeListingUrls(browser: any, pageUrl: string): Promise<string[]> {
    const page = await browser.newPage();
    await page.goto(pageUrl);
    await page.waitForSelector('a[href*="property"]');

    const listingUrls = await extractListingUrls(page);

    await page.close();

    return listingUrls;
}

async function scrapeListingData(browser: any, listingUrl: string): Promise<ListingData | undefined> {
    const page = await browser.newPage();
    await page.goto(listingUrl);
    await page.waitForSelector('.listing-profile-container');

    try{
        // Extract house information
        const price = await page.$eval('.property-info-price', (el: HTMLElement) => el.textContent);
        const mainAddress = await page.$eval('.property-info-address-main', (el: HTMLElement) => el.textContent);
        const city = await page.$eval('.property-info-address-citystatezip > a:first-child', (el: HTMLElement) => el.textContent);
        const zipcode = await page.$eval('.property-info-address-citystatezip > a:nth-child(2)', (el: HTMLElement) => el.textContent);
        const bedrooms = await page.$eval('.beds > .property-info-feature-detail', (el: HTMLElement) => el.textContent);
        const bathrooms = await page.$eval('.divider ~ .property-info-feature > .property-info-feature-detail', (el: HTMLElement) => el.textContent);
        const squareFootage = await page.$eval('.sqft > .property-info-feature-detail', (el: HTMLElement) => el.textContent);

        await page.close();

        return {
            price,
            address: mainAddress.replace(/\n/g, '').trim() +' '+ city.replace(/\n/g, '').trim() +' '+ zipcode.replace(/\n/g, '').trim(),
            bedrooms,
            bathrooms,
            squareFootage
        };
    } catch(err) {
        return;
    }
}

scrapeGoogleAndNavigateToZillow('top home listing websites');