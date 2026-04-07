const dns = require('dns');
const fs = require('fs');
dns.setServers(['8.8.8.8']);

const hostname = 'study.ub3rvhz.mongodb.net';
const creds = 'mikubaka2608_db_user:dPjhprrFZPK0jwVU';

dns.resolveSrv(`_mongodb._tcp.${hostname}`, (err, srvs) => {
    if (err) return console.error(err);
    dns.resolveTxt(hostname, (err, txts) => {
        if (err) return console.error(err);
        
        // Sort srvs to have a stable order if needed, but any order works.
        const hosts = srvs.map(s => `${s.name}:${s.port}`).join(',');
        
        // Options from TXT record
        const opts = txts.map(t => t.join('')).join('&');
        
        // Construct final URI
        const finalUri = `mongodb://${creds}@${hosts}/study?ssl=true&${opts}`;
        console.log('FINAL URI:', finalUri);
        
        let envStr = fs.readFileSync('.env', 'utf8');
        envStr = envStr.replace(/mongodb\+srv:\/\/[^@]+@study\.ub3rvhz\.mongodb\.net\/\??[^\n\r]*/g, finalUri);
        fs.writeFileSync('.env', envStr);
        console.log('Successfully updated .env with standard URI format!');
    });
});
