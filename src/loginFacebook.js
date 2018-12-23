require('dotenv').config()
const fs = require('fs-extra')
const path = require('path')
var crypto = require('crypto')

const loginFacebook = async page => {
  const loggedCheck = async page => {
    try {
      await page.waitForSelector('#bluebarRoot', { timeout: 10000 })
      return true
    } catch (err) {
      return false
    }
  }

  const fetchCookies = async email => {
    let filePath = path.join(__dirname, 'facebookCache.json')
    let facebookCache = {}
    try {
      facebookCache = await fs.readJSON(filePath)
    } catch (error) {}

    const key = crypto
      .createHash('md5')
      .update(email)
      .digest('hex')
    let cookies = facebookCache[key]
    return cookies
  }

  const saveCookies = async (email, cookies) => {
    let filePath = path.join(__dirname, 'facebookCache.json')
    let facebookCache = {}
    try {
      facebookCache = await fs.readJSON(filePath)
    } catch (error) {}
    const key = crypto
      .createHash('md5')
      .update(email)
      .digest('hex')

    facebookCache[key] = cookies
    try {
      await fs.outputFile(filePath, JSON.stringify(facebookCache))
    } catch (error) {}
  }

  const { EMAIL, PASS } = process.env
  let isLogged = false
  const cookies = await fetchCookies(EMAIL)

  if (cookies) {
    console.log('Try to use cookies from cache..')
    await page.setCookie(...cookies)
    await page.goto('https://facebook.com')
    isLogged = await loggedCheck(page)
  }

  if (!isLogged) {
    console.log(`Cookies from cache didn't work, try to login..`)
    await page.goto('https://facebook.com')
    await page.type('#email', EMAIL)
    await page.type('#pass', PASS)
    await page.click('#loginbutton input')
    await page.waitForNavigation()
    isLogged = await loggedCheck(page)
  }

  if (!isLogged) {
    throw new Error('Incorrect username or password!')
  }

  // Get cookies and refresh them in store cache
  console.log(`Saving new cookies to cache..`)
  const newCookies = await page.cookies()
  await saveCookies(EMAIL, newCookies)
}

module.exports = {
  loginFacebook: loginFacebook,
}
