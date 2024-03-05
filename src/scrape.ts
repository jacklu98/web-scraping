import fs from 'fs';
import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import userAgent from 'user-agents';

interface ListingData {
    price: string | null,
    address: string | null,
    bedrooms: string | null,
    bathrooms: string | null,
    squareFootage: string | null
}

puppeteer.use(StealthPlugin());

const BASE_URL = "https://www.homes.com";

export async function scrapeHomeListing() {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    console.log("start scrape");
    await page.setUserAgent(userAgent.toString());
    await page.goto(BASE_URL);
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
        
        listingUrls = listingUrls.concat(pageListingUrls);
    }
    await page.close();

    // Extract information from accessing pages of URLs
    const listingsData: ListingData[] = [];
    for (const listingUrl of listingUrls) {
        const listingData = await scrapeListingData(browser, listingUrl);
        
        if(!listingData) continue;
        listingsData.push(listingData);
    }
    const data = JSON.stringify(listingsData);
    fs.writeFile('src/data.json', data, (err) => {
        if(err) {
            console.error(err);
            return;
        }
        console.log("save successfully");
    });

    await browser.close();
    return data;
}

async function extractListingUrls(page: Page): Promise<string[]> {
    const listingUrls = await page.evaluate(() => {
        const listingElements = document.querySelectorAll('.for-sale-content-container > a[href*="property"]');
        const urls = Array.from(listingElements).map(element => element.getAttribute('href'));
        return urls.filter(url => url?.startsWith('/'));
    });
    // attach complete URL
    return listingUrls.map((url: string | null) => url ? (BASE_URL + url) : BASE_URL);
}

async function extractPageUrls(page: Page): Promise<string[]> {
    const pageUrls = await page.evaluate(() => {
        const pageElements = document.querySelectorAll('li > a[role="link"]');
        const urls = Array.from(pageElements).map(element => element.getAttribute('href'));
        return urls.filter(url => url?.startsWith('/'));
    });
    // attach complete URL
    return pageUrls.map((url: string | null) => url ? (BASE_URL + url) : BASE_URL);
}

async function scrapeListingUrls(browser: Browser, pageUrl: string): Promise<string[]> {
    const page = await browser.newPage();
    await page.goto(pageUrl);
    await page.waitForSelector('a[href*="property"]');

    const listingUrls = await extractListingUrls(page);

    await page.close();

    return listingUrls;
}

async function scrapeListingData(browser: Browser, listingUrl: string): Promise<ListingData | undefined> {
    const page = await browser.newPage();
    await page.goto(listingUrl);
    await page.waitForSelector('.listing-profile-container');

    try{
        // Extract house information
        const price = await page.$eval('.property-info-price', (el: Element) => el.textContent);
        const mainAddress = await page.$eval('.property-info-address-main', (el: Element) => el.textContent);
        const city = await page.$eval('.property-info-address-citystatezip > a:first-child', (el: Element) => el.textContent);
        const zipcode = await page.$eval('.property-info-address-citystatezip > a:nth-child(2)', (el: Element) => el.textContent);
        const bedrooms = await page.$eval('.beds > .property-info-feature-detail', (el: Element) => el.textContent);
        const bathrooms = await page.$eval('.divider ~ .property-info-feature > .property-info-feature-detail', (el: Element) => el.textContent);
        const squareFootage = await page.$eval('.sqft > .property-info-feature-detail', (el: Element) => el.textContent);

        await page.close();

        return {
            price,
            address: mainAddress?.replace(/\n/g, '').trim() +' '+ city?.replace(/\n/g, '').trim() +' '+ zipcode?.replace(/\n/g, '').trim(),
            bedrooms,
            bathrooms,
            squareFootage
        };
    } catch(err) {
        return;
    }
}
