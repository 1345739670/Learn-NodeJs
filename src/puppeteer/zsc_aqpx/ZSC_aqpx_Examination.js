/**
 * @file ZSC_aqpx_Examination.js
 * @desc 进入中山学院实验室安全培训与准入考试系统进行考试
 * @author Mr.stupidbird <1345739670@qq.com>
 * @date 2018-09-13
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

let url = 'http://aqpx.zsc.edu.cn';

const ANSWERPATH = './sample/ZSC_aqpx.json';
// const ANSWERPATH = './sample/ZSC_aqpx_compress.json';

const config = {
    username: '2015010304001',
    password: '232731'
}
const waitOptions = {
    waitUntil: 'networkidle0'
}

const sleep = time => new Promise(resolve => {
    setTimeout(resolve, time)
})

;(async () => {
    let problemSet = ''
    let readStream = fs.createReadStream(path.join(__dirname, ANSWERPATH));

    readStream.on('open',function(fd){
        console.log('题集文件已打开');
        console.log('开始读取题集文件...');
    });

    readStream.on('readable', function() {
        console.log('on readable');
    });

    readStream.on('data',function(data){
        problemSet += data
    });

    readStream.on('end',function(){
        try {
            problemSet = JSON.parse(problemSet);
        } catch(e) {
            console.log('parsing error');
        }
    });

    readStream.on('close',function(){
        console.log('题集文件已关闭');
    });

    readStream.on('error',function(err){
        console.log(`读取文件失败: ${err}`);
    });
    
    console.log('Start Puppeteer')
    const browser = await puppeteer.launch({
        headless: false,
        // slowMo: 250 // 减慢 250 毫秒
    })
    console.log('Startup puppeteer completed')

    console.log('Create an instance of Page')
    const page = await browser.newPage()

    
    async function navigationPromise(waitOptions) {
        console.log('wait for navigation...');
        let navigationPromise = 
            await page.waitForNavigation(waitOptions)
                .catch(e => console.log('waitForNavigation:' + e));
        console.log('navigation finished');
        return navigationPromise
    }
    
    //设置视窗大小为 1920x1080
    await page.setViewport({width:1920, height:1080}).catch(e => console.log(`setViewport Error: ${e}`));
    console.log('Start visit the home page')
    await page.goto(url, {
        waitUntil: 'networkidle2'
    }).catch(e => console.log(`go to home page Error: ${e}`));
  
    await page.waitForSelector('a.layui-btn.layui-btn-normal.layui-btn-small')
    let Jumptologinpage = await page.$('a.layui-btn.layui-btn-normal.layui-btn-small')
    await Jumptologinpage.click()
    await navigationPromise(waitOptions)

    // 登录页面
    await page.waitForSelector('#username')
    await page.type('#username', config.username);
    await page.waitForSelector('#password')
    await page.type('#password', config.password);

    await page.waitForSelector('.submit.local')
    let submit = await page.$('.submit.local')
    await submit.click()
    await navigationPromise(waitOptions)

    await page.waitForSelector('#i_5')
    let onlineExamination = await page.$('#i_5')
    await onlineExamination.click()
    await navigationPromise(waitOptions);
    
    // 点击进入考场按钮
    console.log('点击进入考场')
    const intoExaminationButton = 
            await page.waitForSelector('.table4 td:nth-child(7) > a')
                .catch((e) => {
                    console.log('waitForSelector:' + e)
                })
    console.log('intoExaminationButton ready')
    
    console.log(`监听浏览器 dialog 事件...`);
    page.once('dialog', async dialog => {
        await dialog.accept().catch(e => console.log(`dialog accept Error: ${e}`));
    });
    
    // console.log(browser.pages());
    // console.log(browser.targets());

    // 打开试卷页面后的操作
    console.log(`监听考试页面弹窗...`);
    let examPage
    browser.once('targetcreated', async target => {
        examPage = await target.page().catch(e => console.log(`get examPage Error: ${e}`));
        console.log('试卷页面获取完毕');
        examPage.setViewport({width:1920, height:1080}).catch(e => console.log(`examPage setViewport Error: ${e}`));;
    })
    
    await intoExaminationButton.click().then(() => console.log('click finish')).catch(e => console.log(`intoExamination Error: ${e}`))

    await navigationPromise(waitOptions).catch(e => console.log(`navigation: ${e}`))


    while (!(null === readStream.read())) {
        console.log('等待文件读取完毕');
    }
    // 
    while (!examPage) {
        console.log(examPage);
        console.log('等待试卷页面的获取');
        setTimeout(() => {
            return
        }, 3000);
    }
    console.log(`监听考试页面控制台...`);
    examPage.on('console', msg => {
          console.log(`console: ${msg.text()}`);
    });

    // 整个试卷的题目
    // await page.waitForSelector('.table9 > tbody > tr:nth-child(3)')

    
    // 所有选择题
    // choiceQuestions = 
    // i = await examPage.$eval('#labExamName',i => i.innerText)
    // console.log(`i: ${i}`);

    // 实验写法啊
    // // 在题集中匹配答案
    // function getRightKey(problemSet, matchTitle, type) {
    //     let rightKey
    //     try {
    //         for (let i = 1,len = problemSet.length; i <= len; i++) {
    //             // console.log(`正在匹配第${i}题`);
    //             let problem = problemSet[i];
    //             // console.log(`problem.title: ${problem.title}`);
    //             if (problem.title.indexOf(matchTitle) >= 0) {
    //                 // 如果是选择题
    //                 // if(problem.type === type)
    //                 if (type === 'C') {
    //                     return problem.rightKey
    //                 }
    //             }
    //         }
    //     } catch (e) {
    //         console.log(`getRightKey: ${e}`)
    //     }
    // }
    
    // let choiceQuestionsEle = await examPage.$$('#DataGridA #Table2 > tbody');
    // let answers = []
    // await choiceQuestionsEle.forEach(async (ele, index) => {
    //     let title = await ele.$eval('tr:first-child span', span => span.innerText.slice(3))
    //     console.log(`ele: ${ele}`);
    //     console.log(`title: ${title}`);
    //     let rightKey = getRightKey(problemSet, title, 'C')
    //     console.log(`第 ${index + 1} 道题题目答案: ${rightKey}`);
    //     // await ele.$(`tr:nth-child(2) tbody input[value=${rightKey}]`).click()
    //     //         .catch(e => console.log(`click on the ${index + 1} choiceQuestion Error: ${e}`))
    //     let input = await ele.$(`tr:nth-child(2) tbody input[value=${rightKey}]`)
    //     await input.click().catch(e => console.log(`click on the ${index + 1} choiceQuestion Error: ${e}`))
    //     // console.log(`tr:nth-child(2) tbody input[value=${rightKey}]`);
    //     console.log(`input: ${input}`);
    //     answers.push(rightKey)

    // });
    // console.log(`756794`);
    // console.log(`总答案: ${answers}`);


    
    // key = await page.$$eval(inputSelector, inputs => inputs.map(i => i.value))

    

    await examPage.evaluate((problemSet) => {
        const optionsMap = {
            'A': 0,
            'B': 1,
            'C': 2,
            'D': 3,
            'E': 4,
        }
        let answers = []
        // 在题集中匹配答案
        function getRightKey(problemSet, matchTitle, type) {
            let rightKey
            for (let i = 0, len = problemSet.length; i < len; i++) {
                // console.log(`正在匹配第${i + 1}题`);
                let problem = problemSet[i];
                // console.log(`problem.title: ${problem.title}`);
                if (problem.title.indexOf(matchTitle) >= 0) {
                    // 防止题目相同，题型不同的情况
                    if(problem.type === type) {
                        rightKey = problem.rightKey
                    }
                }
            }

            // 如果找不到答案
            if (!rightKey) {
                console.log(`找不到`);
                console.log(rightKey);
                rightKey = 'A'
            }
            return rightKey
        }

        // 解析多选题答案
        function parseMulChoice(unparsedAnswer) {
            return unparsedAnswer.split('|').filter(Boolean)
        }

        // 单选题
        console.log(`开始做单选题`);
        document.querySelectorAll('#DataGridA #Table2 > tbody')
        document.querySelectorAll('#DataGridA #Table2 > tbody').forEach((ele, index)=> {
            console.log(`正在做单选题第 ${index + 1} 道题`);
            let title = ele.querySelector('tr:first-child span').innerText.slice(3);
            console.log(`第 ${index + 1} 道题题目: ${title}`);
            let rightKey = getRightKey(problemSet, title, 'A')
            console.log(`第 ${index + 1} 道单选题答案: ${rightKey}`);

            ele.querySelector(`tr:nth-child(2) tbody input[value=${rightKey}]`).click()

            // 调试用：
            // answers.push(rightKey)
        });
        console.log(`单选题已做完`);

        // 多选题
        console.log(`开始做多选题`);
        document.querySelectorAll('#DataGridB #Table2 > tbody').forEach((ele, index)=> {
            console.log(`正在做多选题第 ${index + 1} 道题`);
            let title = ele.querySelector('tr:first-child span').innerText.slice(3);
            console.log(`第 ${index + 1} 道多选题题目: ${title}`);
            let rightKey = getRightKey(problemSet, title, 'B')
            console.log(`第 ${index + 1} 道多选题答案: ${rightKey}`);
            rightKey = parseMulChoice(rightKey)
            rightKey.forEach((rightKey, index) => {
                console.log(`第 ${index + 1} 个多选题答案: ${rightKey}`);
                // console.log(key);
                ele.querySelectorAll(`tr:nth-child(2) tbody input`)[`${optionsMap[rightKey]}`].click()
            })
        });

        // 判断题
        console.log(`开始做判断题`);
        document.querySelectorAll('#DataGridC #Table2 > tbody').forEach((ele, index)=> {
            console.log(`正在做判断题第 ${index + 1} 道题`);
            let title = ele.querySelector('tr:first-child span').innerText.slice(3);
            console.log(`第 ${index + 1} 道判断题题目: ${title}`);
            let rightKey = getRightKey(problemSet, title, 'C')
            console.log(`第 ${index + 1} 道判断题答案: ${rightKey}`);
            ele.querySelector(`tr:nth-child(2) tbody input[value=${rightKey}]`).click()
        });

        // 调试用：
        // console.log(`总答案: ${answers}`);
        return '答题完毕'
    }, problemSet).then((v) => {
        console.log(`${v}`)
    }).catch(e => console.log(`evaluateHandle Error: ${e}`));
    console.log(`监听试卷页面 dialog 事件...`);
    examPage.once('dialog', async dialog => {
        await dialog.accept().catch(e => console.log(`dialog accept Error: ${e}`));
    });
    // console.log(`${exam}`);
    // exam.then((v) => console.log(`v`))
    console.log(`123`);
    

    let submitBtn = await examPage.$('#btnjj')
    await submitBtn.click().then(() => console.log('Hand over finish')).catch(e => console.log(`Hand over Error: ${e}`))

    // 查看分数
    console.log('正在查看分数')
    // $eval('#labExamName',i => i.innerText)
    let score = 
            await page.$eval('.table4 td:nth-child(5) font', f => f.innerText)
                .catch((e) => {
                    console.log('get score Error:' + e)
                })
    console.log(`本次得分: ${score}`)

    // writerStream = fs.createWriteStream(path.join(__dirname, './sample/ZSC_aqpxtest.html'));
    // writerStream.write(html, 'UTF8');
    // writerStream.end();


    // 10s
    // sleep(10000)

    console.log('正在关闭浏览器')
    await browser.close().then(() => console.log('Browser closed'));
  
})()