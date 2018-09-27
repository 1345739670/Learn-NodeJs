const http = require('http');
const path = require('path');

const conf = require('./config/config');
const route = require('./helper/route');
const openUrl = require('./helper/openUrl');

class Server {
    constructor(config) {
        this.conf = Object.assign({}, conf, config);
    }

    start() {
        const server = http.createServer((req, res) => {
            const filePath = path.join(this.conf.root, req.url);
            route(req, res, filePath, this.conf);
        });
        
        server.listen(this.conf.port, this.conf.hotstname, () => {
            const addr = `http://${this.conf.hotstname}:${this.conf.port}`;
            console.info(`Server started at ${addr}`);
            openUrl(addr);
        });
    }
}

module.exports = Server;