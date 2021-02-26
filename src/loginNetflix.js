const puppeteer = require('puppeteer')
require('dotenv').config()
const fs = require('fs-extra')
const path = require('path')
var crypto = require('crypto')

const main = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        // slowMo: 400,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-notifications',
        ],
    })

    let page = await browser.newPage()
    await page.setViewport({
        width: 1200,
        height: 900,
    })

    try {

        await loginNetflix(page)
    } catch (error) {
        console.log(error)
    }


    console.log('Done.')
}

const getHashKey = str => {
    return crypto
        .createHash('md5')
        .update(str)
        .digest('hex')
}


// => redirect to https://www.netflix.com/vn-en/login
const LOGIN_PAGE_URL = 'https://netflix.com/login' 
const CACHE_PATH = path.join(__dirname, 'netflixCache.cache')



const getCookiesFromCache = async email => {
    try {
        const cache = await fs.readJSON(CACHE_PATH)
        return cache[email]
    } catch (error) {
        console.log(error)
        return null;
    }
}

const saveCookiesToCache = async (email, cookies) => {
    try {
        let cache;
        try {
         cache = await fs.readJSON(CACHE_PATH, { throws: false })
        } catch (error) {
            cache = {}
        }
        cache[email] = cookies
        await fs.outputJson(CACHE_PATH, cache);
        return true;
    } catch (error) {
        console.log(error)
        return false;
    }
}



async function loginNetflix(page) {

    const loggedCheck = async page => {
        return true;
        try {
            await page.waitForSelector('#ssrb_root_start', { timeout: 10000 })
            return true
        } catch (err) {
            return false
        }
    }

    const email = process.env.NETFLIX_EMAIL
    const password = process.env.NETFLIX_PASSWORD

    let isLogged = false
    const cookies = await getCookiesFromCache(email)

    if (cookies) {
        console.log('Try to use cookies from cache..')
        await page.setCookie(...cookies)
        await page.goto(LOGIN_PAGE_URL)
        isLogged = await loggedCheck(page)
    }

    if (!isLogged) {
        console.log(`Cookies from cache didn't work, try to login..`)
        await page.goto(LOGIN_PAGE_URL)
        await page.type('#id_userLoginId', email)
        await page.type('#id_password', password)
        // await page.click('#bxid_rememberMe_true')
        await page.click('[data-uia="login-submit-button"]')
        await page.waitForNavigation()


        // Click profile
        await page.click('[data-profile-guid="TPW6C3SAQ5BBRFCZLUWDHOE2JM"]')
        
        isLogged = await loggedCheck(page)
    }

    if (!isLogged) {
        throw new Error('Incorrect username or password!')
    }

    // Get cookies and refresh them in store cache
    console.log(`Saving new cookies to cache..`)
    const newCookies = await page.cookies()
    await saveCookiesToCache(email, newCookies)
}



main()
