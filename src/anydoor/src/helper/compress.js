const {createGzip, createDeflate} = require('zlib')

module.exports = (rs, req, res) => {
    const acceptEncoding = req.headers['accept-encoding'];
    if (!acceptEncoding || !acceptEncoding.match(/\b(gzip|deflate)/)) {
        return
    } else if(acceptEncoding.match(/\b(gzip\b)/)) {
        res.setHeader('content-Encoding', 'gzip');
        return rs.pipe(createGzip());
    } else if(acceptEncoding.match(/\b(deflate\b)/)) {
        res.setHeader('content-Encoding', 'deflate');
        return rs.pipe(createDeflate());
    }

}