require('dotenv').config();
const puppeteer = require('puppeteer');
const path = require("path");

const {loginNetflix} = require('./loginNetflix')

const main = async (url) => {
  const browser = await puppeteer.launch({
    headless: false,
    // slowMo: 400,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications'],
    devtools: false
  });

  let pages = await browser.pages
  let page;
  if(pages.length === 0){
      page = await browser.newPage()
  }else{
      page = pages[0]
  }
  await page.setViewport({
    width: 1200,
    height: 900,
  });

  try {
    await loginNetflix(page, url);

    await page.goto(url);
    await page.click('["data-uia="play-button"]');
    await page.waitForNavigation();

    
    await page.addScriptTag({
      path: path.join(__dirname, "injectScript")
    })
  } catch (error) {
    console.log(error);
  }

  console.log('Done.');
};

const url ='https://www.netflix.com/title/81091393?s=i&trkid=254015180'
main(url);