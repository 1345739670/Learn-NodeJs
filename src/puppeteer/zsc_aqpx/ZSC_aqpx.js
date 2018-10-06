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
    problemNum: 484,
    filePath: './sample/ZSC_aqpx.json'
    // filePath: './sample/ZSC_aqpx_gai.json'
}

let url = 'http://aqpx.zsc.edu.cn'

;(async () => {

    /**
     * @desc 点击页面中的元素并等待跳转
     * @param selector 选择器
     */
    async function clickEleToNavigation(selector) {
        try {
            let navigationPromise = page.waitForNavigation({waitUntil: 'networkidle0'});
            await page.waitForSelector(selector); 
            await page.click(selector);
            console.log('wait for navigation...');
            let navigation = await navigationPromise
            console.log('navigation finished');
            return navigation
        } catch (e) {
            console.log(e);
            }
    }

    // 判断问题类型
    async function getProblemType() {
        let typeName = {
            "A" : '四选一或三选一',
            "B" : '多选题',
            "C" : '二选一',
        },type
        console.log(`开始判断问题类型`);
        try {
            type = await page.$eval('#Table2 > tbody > tr:nth-child(3) > td > table', ele => ele.id.slice(-5,-4));
            console.log(`判断题目类型完毕：${typeName[type]}`);
        return type
        } catch (error) {
            console.log('getProblemType Error:' + e)
    }
    }
    
    // 判断 input 类型
    async function getInputType() {
        let inputType
        console.log(`开始判断 input 类型`);
        try {
            inputType = await page.$eval('#Table2 > tbody > tr:nth-child(3) > td > table > tbody input', ele => ele.type)
        console.log(`判断 input 类型完毕：${inputType}`);
        return inputType
        } catch (error) {
            console.log('getInputType Error:' + error);
    }
    }

    // 获取问题信息
    // 此处参数传递可优化
    async function getProblemInfo(type, inputType) {
        let strategy, title, options = {}, optionsText = [], key=[], inputSelector, rightKey, result = {}
        inputSelector = type === 'B' ? `input[type=checkbox]` : `input[type=radio]`;

        console.log(`开始获取问题信息`);

        try {
        title = await page.$eval('#ctl00_ContentPlaceHolder1_DataGridA_ctl02_labADataTitle b', ele => ele.innerText.slice(3))
                            .catch((e) => console.log('get title Error:' + e));
        console.log(`获取 title 完毕：${title}`);
        } catch (error) {
            console.log('getProblemInfo Error:' + e);
        }
        
        if (type === 'B') {
            key = await page.$$eval(`${inputSelector} + label`, inputs => inputs.map(l => l.innerText.slice(0,1)))
                                .catch((e) => console.log('get key Error:' + e));
        } else {
            key = await page.$$eval(inputSelector, inputs => inputs.map(i => i.value))
                                .catch((e) => console.log('get key Error:' + e));
        }
        console.log(`获取 key 完毕：${key}`);

        optionslength = await page.$$eval(inputSelector, inputs => inputs.length);
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
            } else {
                // 此处包含选项有3个或者4个  及多选 的情况 
                optionsTextSelector = `${inputSelector} + label`;
                console.log(`optionsTextSelector: ${optionsTextSelector}`);
                optionsText = await page.$$eval(optionsTextSelector, ls =>  ls.map(l => l.innerText.slice(2)));
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
                    key.forEach((k, index) => {
                        options[k] = optionsText[index]
                    })
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

    async function analysis(type) {
        let rightKey,identificationSelector
        let analysisbtn = await page.waitForSelector('#ctl00_ContentPlaceHolder1_btnOk')
            .catch(e => console.log('waitForbtnOkerror:' + e));
        await analysisbtn.click().catch(e => console.log('clickbtnOkerror:' + e));
        await page.waitFor(1000);
        // 对错提示       
        let identification = await page.$eval('#Table2 > tbody > tr:last-child  td  div', div => div.id)
                                .catch(e => console.log('getIdentification Error:' + e));
        // console.log(identification);
        // identification = ctl00_ContentPlaceHolder1_DataGridA_ctl02_divWrong ? ctl00_ContentPlaceHolder1_DataGridA_ctl02_divRight : 
        identification = (identification === 'ctl00_ContentPlaceHolder1_DataGridA_ctl02_divRight') ? true : false; 
        console.log(`get Identification:${identification}`);
        
        identificationSelector = identification ? '#ctl00_ContentPlaceHolder1_DataGridA_ctl02_divRight' : '#ctl00_ContentPlaceHolder1_DataGridA_ctl02_divWrong'
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

    

    

    // 正片开始！
    console.log('Start Puppeteer')
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {width: 1920, height: 1080},
        ignoreHTTPSErrors: true,
        executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
    })
    console.log('Startup puppeteer completed')

    console.log('Create an instance of Page')
    const page = await browser.newPage()
    
    console.log('Start visit the home page')
    await page.goto(url, {
        waitUntil: 'networkidle0'
    })
    // 点击跳转至登录页面
    await clickEleToNavigation('a.layui-btn.layui-btn-normal.layui-btn-small');
    console.log('跳转至登录页面，开始输入用户名和密码');

    await page.type('#username', config.username);
    await page.type('#password', config.password);
    console.log('输入完毕，开始跳转页面...');

    // 点击提交跳转至登录后的首页
    await clickEleToNavigation('.submit.local');
    console.log('跳转至登录后的首页');

    await clickEleToNavigation('#i_5');
    console.log('已进入开始考试页面');
    
    // 点击进入练习链接
    await clickEleToNavigation('.table4 td:last-child > a');
    console.log('已进入目标页面')

    await page.waitForSelector('#ctl00_ContentPlaceHolder1_UpdatePanel1')
    let results = []
    
    //for
    for (let i = 1, num = config.problemNum; i <= num; i++) {
        let type, inputType, result
        await page.waitFor(1000);
        console.log(`开始爬取第${i}道题`);
        try {
        type = await getProblemType().catch(e => console.log(`getProblemType Error: ${e}`));
        inputType = await getInputType().catch(e => console.log(`getInputType Error: ${e}`));
            result = await getProblemInfo(type, inputType).then(v => v).catch(e => console.log(`getProblemInfo Error: ${e}`))
        

        console.log(`开始装填数据`);
        results.push(result)
            
        console.log(`装填数据完毕`);
        // console.log(JSON.stringify(results));
        if (!(i === num)) {
            clicknextbtn()
        } else {
            console.log('数据爬取完毕');
            }
        } catch (error) {
            
        }
    }
    // for end
    
    writerStream = fs.createWriteStream(path.join(__dirname, config.filePath));
    writerStream.write(JSON.stringify(results), 'UTF8');
    writerStream.end();

    console.log('正在关闭浏览器')
    browser.close().then(() => console.log('Browser closed'));
  
  })()