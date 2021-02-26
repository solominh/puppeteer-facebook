const path = require('path');
const { createCacheManager } = require('./CacheManager');

// => redirect to https://www.netflix.com/vn-en/login
const LOGIN_PAGE_URL = 'https://netflix.com/login';
const CACHE_PATH = path.join(__dirname, 'netflixCache.cache');

const cacheManager = createCacheManager(CACHE_PATH, process.env.NETFLIX_CACHE_SECRET);

const getCookiesFromCache = async email => {
  try {
    const cache = await cacheManager.getCache();
    return cache[email];
  } catch (error) {
    console.log(error);
    return null;
  }
};

const saveCookiesToCache = async (email, cookies) => {
  try {
    let cache = await cacheManager.getCache();
    cache[email] = cookies;
    return await cacheManager.saveCache(cache);
  } catch (error) {
    console.log(error);
    return false;
  }
};

async function loginNetflix(page) {
  const loggedCheck = async page => {
    try {
      await page.waitForSelector('.account-menu-item', { timeout: 10000 });
      return true;
    } catch (err) {
      return false;
    }
  };

  const email = process.env.NETFLIX_EMAIL;
  const password = process.env.NETFLIX_PASSWORD;

  let isLogged = false;
  const cookies = await getCookiesFromCache(email);

  if (cookies) {
    console.log('Try to use cookies from cache..');
    await page.setCookie(...cookies);
    await page.goto(LOGIN_PAGE_URL);
    isLogged = await loggedCheck(page);
  }

  if (!isLogged) {
    console.log(`Cookies from cache didn't work, try to login..`);
    await page.goto(LOGIN_PAGE_URL);
    await page.type('#id_userLoginId', email);
    await page.type('#id_password', password);
    // await page.click('#bxid_rememberMe_true')
    await page.click('[data-uia="login-submit-button"]');
    await page.waitForNavigation();

    // Click profile
    await page.click('[data-profile-guid="TPW6C3SAQ5BBRFCZLUWDHOE2JM"]');

    isLogged = await loggedCheck(page);

    // Get cookies and refresh them in store cache
    console.log(`Saving new cookies to cache..`);
    const newCookies = await page.cookies();
    await saveCookiesToCache(email, newCookies);
  }

  if (!isLogged) {
    throw new Error('Incorrect username or password!');
  }
}

module.exports = {
  loginNetflix,
};
