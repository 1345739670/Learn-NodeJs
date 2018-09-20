/**
 * @file ZSC_aqpx_html.js
 * @desc 获取中山学院实验室安全培训与准入考试系统的在线练习页面代码
 * @author Mr.stupidbird <1345739670@qq.com>
 * @date 2018-09-11
 */

let http = require('http')
let url = 'http://aqpx.zsc.edu.cn'

http.get(url, function (res) {
    let html = ''

    res.on('data', function(data) {
        html += data
    })

    res.on('end', function() {
        console.log(html);
    })

}).on('error', function(e) {
    console.log('error:' + e);
})