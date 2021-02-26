const puppeteer = require('puppeteer')
const { loginFacebook } = require('./loginFacebook')

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
    
    await loginFacebook(page)
  } catch (error) {
    console.log(error)
  }


  console.log('Done.')
}

main()
