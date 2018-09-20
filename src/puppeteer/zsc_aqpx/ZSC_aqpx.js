/**
 * @file ZSC_aqpx.js
 * @desc 爬取中山学院实验室安全培训与准入考试系统的练习题库
 * @author Mr.stupidbird <1345739670@qq.com>
 * @date 2018-09-11
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const config = {
    username: '2015010304001',
    password: '232731',
    problemNum: 484
}


let url = 'http://aqpx.zsc.edu.cn'

const sleep = time => new Promise(resolve => {
    setTimeout(resolve, time)
})


;(async () => {
    console.log('Start Puppeteer')
    const browser = await puppeteer.launch({
        // headless:false
    })
    console.log('Startup puppeteer completed')

    console.log('Create an instance of Page')
    const page = await browser.newPage()
    // const navigationPromise = page.waitForNavigation(waitOptions);
    const waitOptions = {
        waitUntil: 'networkidle0'
    }
    async function navigationPromise(waitOptions) {
        console.log('wait for navigation...');
        let navigationPromise = 
            await page.waitForNavigation(waitOptions)
                .catch(e => console.log('waitForNavigation:' + e));
        console.log('navigation finished');
        return navigationPromise
    }
    async function analysis(type) {
        var rightKey,identificationSelector
        let analysisbtn = await page.waitForSelector('#ctl00_ContentPlaceHolder1_btnOk')
            .catch(e => console.log('waitForbtnOkerror:' + e));
        await analysisbtn.click().catch(e => console.log('clickbtnOkerror:' + e));
        await sleep(1000)
        // 对错提示
        await page.waitForSelector('#Table2 > tbody > tr:last-child  td  div')
                        .catch(e => console.log('waitForidentification Error:' + e));
        let identification = await page.$eval('#Table2 > tbody > tr:last-child  td  div', div => div.id)
                                .catch(e => console.log('getIdentification Error:' + e));
        // console.log(identification);
        // identification = ctl00_ContentPlaceHolder1_DataGridA_ctl02_divWrong ? ctl00_ContentPlaceHolder1_DataGridA_ctl02_divRight : 
        identification = (identification === 'ctl00_ContentPlaceHolder1_DataGridA_ctl02_divRight') ? true : false; 
        console.log(`get Identification:${identification}`);
        
        if (identification) {
            // identificationSelector = await page.waitForSelector('#ctl00_ContentPlaceHolder1_DataGridA_ctl02_divRight');
            identificationSelector = '#ctl00_ContentPlaceHolder1_DataGridA_ctl02_divRight'
        } else {
            // identificationSelector =  await page.waitForSelector('#ctl00_ContentPlaceHolder1_DataGridA_ctl02_divWrong');
            identificationSelector =  '#ctl00_ContentPlaceHolder1_DataGridA_ctl02_divWrong'
        }
        if (type === 'B') {
            // 如果是多选题
            console.log('正在获取多选题正确答案');
            rightKey = await page.$eval(identificationSelector, div => {
                let originalText = div.innerText
                startindex = originalText.indexOf('：')
                // rightKey = originalText.slice(startindex + 1, -1)
                return originalText.slice(startindex + 1)
                // rightKeyArray = rightKey.split('|')
                // return originalText.slice(startindex + 1)
            })
            console.log(`rightKey: ${rightKey}`);
        } else if(type === 'C'){
            console.log('正在获取二选一正确答案');
            // 如果是二选一
            if (identification) {
                rightKey = 'Y'
            }else {
                rightKey = 'N'
            }
        } else {
            // 如果是四选一
            console.log('正在获取四选一正确答案');

            if (identification) {
                rightKey = 'A'
            }else {
                // await page.waitForSelector('#ctl00_ContentPlaceHolder1_DataGridA_ctl02_divWrong');
                rightKey = await page.$eval('#ctl00_ContentPlaceHolder1_DataGridA_ctl02_divWrong', div => div.innerText.slice(-1))
            }
        }
        console.log(`获取答案完毕: ${rightKey}`);
        return rightKey
    }

    // 点击第一个选项
    async function clickfirstoption(inputType) {
        inputSelector = `input[type=${inputType}]`;
        console.log(`clickfirstoption：${inputSelector}`);
        let AOption = await page.$(inputSelector).catch((e) => {
            console.log(`get AOption Error: ${e}`);
            for (let i = 0; i < 3; i++) {
                clickfirstoption(inputType)
            }
        });
        await AOption.click().catch((e) => {
            console.log(`AOption click Error: ${e}`);
        });
        console.log(`点击A选项完毕`);
        
    }

    // 点击下一题按钮
    async function clicknextbtn() {
        let clicknextbtn = await page.$('#ctl00_ContentPlaceHolder1_btnNext')
            .catch(e => console.log('clicknextbtnError:' + e));
        clicknextbtn.click().catch((e) => {
            console.log(`clicknextbtn click Error: ${e}`);
        });
    }

    //设置视窗大小为 1920x1080
    await page.setViewport({width:1920, height:1080});
    console.log('Start visit the home page')
    await page.goto(url, {
        waitUntil: 'networkidle2'
    })
  
    await page.waitForSelector('a.layui-btn.layui-btn-normal.layui-btn-small')
    let Jumptologinpage = await page.$('a.layui-btn.layui-btn-normal.layui-btn-small')
    await Jumptologinpage.click()

    await page.waitForSelector('#username')
    await page.type('#username', config.username);
    await page.waitForSelector('#password')
    await page.type('#password', config.password);

    await page.waitForSelector('.submit.local')
    let submit = await page.$('.submit.local')
    await submit.click()

    await page.waitForSelector('#i_5')
    let onlineExamination = await page.$('#i_5')
    await onlineExamination.click()
    await navigationPromise(waitOptions);
    
    console.log('开始点击进入练习')
    // 点击进入练习链接

    const intoPracticeButton = 
            await page.waitForSelector('.table4 td:last-child > a')
                .catch((e) => {
                    console.log('waitForSelector:' + e)
                })
    console.log('intoPracticeButton ready')
    await intoPracticeButton.click().then(() => console.log('click finish'))
    await navigationPromise(waitOptions).then(() => console.log('来到目标页面'))
    
    
    await page.waitForSelector('#ctl00_ContentPlaceHolder1_UpdatePanel1')
    let results = []
    
                
    // 判断问题类型
    async function getProblemType() {
        let typeName = {
            "A" : '四选一或三选一',
            "B" : '多选题',
            "C" : '二选一',
        }
        console.log(`开始判断问题类型`);
        await page.waitForSelector('#Table2 > tbody > tr:nth-child(3) > td > table').catch((e) => {
            console.log('waitForSelector:' + e)
        })
        // 判断题型是单选题还是多选题
        let type = await page.$eval('#Table2 > tbody > tr:nth-child(3) > td > table', ele => ele.id.slice(-5,-4))
                        .catch((e) => console.log('getTypeError:' + e));
        switch (type) {
            case 'A':
                console.log('四选一或三选一');
                break
            case 'B':
                console.log('多选题');
                break
            case 'C':
                console.log('二选一');
                break
        }
        console.log(`判断问题类型完毕：${typeName[type]}`);
        return type
    }
    
    // 判断 input 类型
    async function getInputType() {
        console.log(`开始判断 input 类型`);
        let inputType = await page.$eval('#Table2 > tbody > tr:nth-child(3) > td > table > tbody input', ele => ele.type)
                            .catch((e) => console.log('getinputTypeError:' + e));
        console.log(`判断 input 类型完毕：${inputType}`);
        return inputType
    }

    // 获取问题信息
    // 此处参数传递可优化
    async function getProblemInfo(type, inputType) {
        let paperid, title, options = {}, optionsText = [], key=[],inputSelector,rightKey,result = {}

        if (type === 'B') {
            inputSelector = `input[type=checkbox]`;
        } else {
            inputSelector = `input[type=radio]`;
        }
        console.log(inputSelector);
        console.log(`开始获取问题信息`);
        await page.waitForSelector('#ctl00_ContentPlaceHolder1_hf_paperid').catch((e) => {
            console.log('waitForSelector:' + e)
        })
        // paperid = await page.$eval('#ctl00_ContentPlaceHolder1_hf_paperid', ele => ele.value)
        //                         .catch((e) => console.log('get paperid Error:' + e));
        // console.log(`获取 paperid 完毕：${paperid}`);
        title = await page.$eval('#ctl00_ContentPlaceHolder1_DataGridA_ctl02_labADataTitle b', ele => ele.innerText.slice(3))
                            .catch((e) => console.log('get title Error:' + e));
        console.log(`获取 title 完毕：${title}`);
        
        // inputSelector = `input[type=${inputType}]`;
        if (type === 'B') {
            key = await page.$$eval(`inputSelector + label`, inputs => inputs.map(l => l.innerText.slice(0,1)))
                                .catch((e) => console.log('get key Error:' + e));
        } else {
            key = await page.$$eval(inputSelector, inputs => inputs.map(i => i.value))
                                .catch((e) => console.log('get key Error:' + e));
        }
        console.log(`获取 key 完毕：${key}`);
        optionslength = key.length;
        console.log(`获取 optionslength 完毕：${optionslength}`);

        // 获取选项文本
        try {
            console.log(`开始获取选项文本`);
            let optionsTextSelector
            if (type === 'C') {
                // 二选一
                optionsTextSelector = `${inputSelector} + label b`;
                console.log(`optionsTextSelector: ${optionsTextSelector}`);
                
                optionsText = await page.$$eval(optionsTextSelector, bs =>  bs.map(b => b.innerText))
                                        .catch((e) => console.log('get optionsText Error:' + e));;
                console.log(`真获取 optionsText 完毕：${optionsText}`);
            } else {
                // 此处包含选项有3个或者4个  及多选 的情况 
                optionsTextSelector = `${inputSelector} + label`;
                console.log(`optionsTextSelector: ${optionsTextSelector}`);
                optionsText = await page.$$eval(optionsTextSelector, ls =>  ls.map(l => l.innerText.slice(2)));
                console.log(`真获取 optionsText 完毕：${optionsText}`);
            }
            console.log(`获取 optionsText 完毕：${optionsText}`);
        } catch (error) {
            console.log('获取选项文本出错！');
            console.log('optionsText error' + error);
        }

        // 拼装数据
        console.log(`获取 optionsText.length 完毕：${optionsText.length}`);
        
        try {
            if (optionslength === optionsText.length) {
                console.log(`拼装options`);
                if (type === 'C' | type === 'A') {
                    // 二选一
                    key.forEach((k, index) => {
                        options[k] = optionsText[index]
                    })
                } 
            } else {
                console.log(`optionslength: ${optionslength}`);
                console.log(`optionsText: ${optionsText}`);
                throw new Error('选项长度出错！')
            }
        } catch (error) {
            console.log(`optionslength error: ${error}`);
        }

        await clickfirstoption(inputType).catch(e => console.log(`clickfirstoption Error: ${e}`));
        rightKey = await analysis(type).then(v => v).catch(e => console.log(`analysisError: ${e}`))

        result = {
            // paperid,
            title,
            type,
            options,
            optionslength,
            optionsText,
            key,
            rightKey
        }

        console.log(`getProblemInfo result : ${result.rightKey}`);
        
        return result
    }

    //for
    for (let i = 1, num = config.problemNum; i <= num; i++) {
        let type,inputType
        await sleep(1000)
        console.log(`开始爬取第${i}道题`);

        
        type = await getProblemType().catch(e => console.log(`getProblemType Error: ${e}`));
        inputType = await getInputType().catch(e => console.log(`getInputType Error: ${e}`));
        let result = await getProblemInfo(type,inputType).then(v => v).catch(e => console.log(`getProblemInfo Error: ${e}`))
        

        console.log(`开始装填数据`);
        results.push(result)
        // fs.appendFile(path.join(__dirname, './append2.json'), JSON.stringify(result), (err) => {
        //     if (err) {
        //         // 读文件是不存在报错 
        //         // 意外错误
        //         // 文件权限问题
        //         // 文件夹找不到(不会自动创建文件夹)
        //         console.log(`数据写入失败：${err}`);
        //     } else {
        //         fs.appendFile(path.join(__dirname, './append2.json'), ',', (err) => {
        //             if (err) console.log(`数据写入失败：${err}`);
        //             console.log('The "data to append" was appended to file!');
        //         });
        //         console.log(`数据写入成功：success`);
        //     }
        // });
        console.log(`装填数据完毕`);
        // console.log(JSON.stringify(results));
        if (!(i === num)) {
            clicknextbtn()
        } else {
            console.log('数据爬取完毕');
        }
    }
    // for end
    
    // await sleep(10000)

    // let html = await page.content()
    // console.log(html)

    writerStream = fs.createWriteStream(path.join(__dirname, './sample/ZSC_aqpx.json'));
    writerStream.write(JSON.stringify(results), 'UTF8');
    writerStream.end();

    console.log('正在关闭浏览器')
    browser.close().then(() => console.log('Browser closed'));
  
  })()