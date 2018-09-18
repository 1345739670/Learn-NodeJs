const puppeteer = require('puppeteer')
const url = require('url');
const baseurl = `http://www.dilidili.wang/`

const sleep = time => new Promise(resolve => {
  setTimeout(resolve, time)
})

;(async () => {
  console.log('Start visit the target page')

  const browser = await puppeteer.launch({
    args: ['--disable-dev-shm-usage,--no-sandbox'],
    dumpio: false
  })

  const page = await browser.newPage()
  await page.goto(baseurl, {
    waitUntil: 'networkidle2'
  })
  console.log('页面跳转成功')

  // await sleep(3000)
  
  const result = await page.evaluate(() => {
    var $ = window.$
    var items = $('.small.book>a')
    var links = []

    if (items.length >= 1) {
      items.each((index, item) => {
        let it = $(item)
        let detailLink = it.attr('href')
        let title = it.find('figcaption>p:first-child').text()
        let update = it.find('figcaption>p:last-child').text()
        let cover = it.find('figure img').attr('src')


        links.push({
          title,
          update,
          detailLink,
          cover
        })
      })
    }
    console.log('正在返回结果')
    return links
  })
  result.forEach((item,index,arr) => {
    item.cover = url.resolve(baseurl, item.cover)
    item.detailLink = url.resolve(baseurl, item.detailLink)
    item.anime = url.parse(item.detailLink, true).path.split("/")[2]
  });



  console.log('正在关闭浏览器')
  browser.close()
  console.log('浏览器已关闭')
  console.log(result)
  
  // process.send({result})
  // process.exit(0)
})()
