const puppeteer = require('puppeteer')
// import DPlayer from 'DPlayer'
const url = `https://movie.douban.com/explore#!type=movie&tag=%E7%83%AD%E9%97%A8&sort=time&page_limit=20&page_start=0`

const sleep = time => new Promise(resolve => {
  setTimeout(resolve, time)
})

;(async () => {
  console.log('Start visit the target page')

  const browser = await puppeteer.launch({
    // 非沙箱模式
    args: ['--no-sandbox'],
    dumpio: false
  })

  const page = await browser.newPage()
  await page.goto(url, {
    waitUntil: 'networkidle2'
  })

  await sleep(3000);

  await page.waitForSelector('.more')

  for (let i = 0; i < 1; i++) {
    await sleep(3000)
    await page.click('.more')
  }

  const result = await page.evaluate(() => {
    var $ = window.$
    var items = $('.list-wp a')
    var links = []

    if (items.length >= 1) {
      items.each((index, item) => {
        let it = $(item)
        if (it.hasClass('item')) {
          let doubanId = it.find('div').data('id')
          let title = it.find('div img').attr('alt')
          let rate = Number(it.find('strong').text())
          let poster = String(it.find('div img').attr('src')).replace('s_ratio', 'l_ratio')

          links.push({
            doubanId,
            title,
            rate,
            poster
          })
        }
        
      })
    }
    return links
  })
  browser.close()
  // console.log(result)
  process.send({result})
  process.exit(0)
})()

