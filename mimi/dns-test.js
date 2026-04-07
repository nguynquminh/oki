const dns = require('dns');
dns.setServers(['8.8.8.8']);

console.log('Resolving DNS for study.ub3rvhz.mongodb.net...');

dns.resolveSrv('_mongodb._tcp.study.ub3rvhz.mongodb.net', (err, srvs) => {
    if (err) {
        console.error('SRV Error:', err);
    } else {
        console.log('SRV Records:');
        console.log(JSON.stringify(srvs, null, 2));
    }
});

dns.resolveTxt('study.ub3rvhz.mongodb.net', (err, txts) => {
    if (err) {
        console.error('TXT Error:', err);
    } else {
        console.log('TXT Records:');
        console.log(JSON.stringify(txts, null, 2));
    }
});
