const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, `bot-${new Date().toISOString().split('T')[0]}.log`);

const logger = {
    info: (msg) => {
        const timestamp = new Date().toISOString();
        const log = `[${timestamp}] ℹ️  ${msg}`;
        console.log(log);
        fs.appendFileSync(logFile, log + '\n');
    },
    error: (msg, err) => {
        const timestamp = new Date().toISOString();
        const errorMsg = err ? `${msg}\n${err instanceof Error ? err.stack : err}` : msg;
        const log = `[${timestamp}] ❌ ${errorMsg}`;
        console.error(log);
        fs.appendFileSync(logFile, log + '\n');
    },
    warn: (msg) => {
        const timestamp = new Date().toISOString();
        const log = `[${timestamp}] ⚠️  ${msg}`;
        console.warn(log);
        fs.appendFileSync(logFile, log + '\n');
    },
    debug: (msg) => {
        if (process.env.DEBUG === 'true') {
            const timestamp = new Date().toISOString();
            const log = `[${timestamp}] 🐛 ${msg}`;
            console.log(log);
            fs.appendFileSync(logFile, log + '\n');
        }
    },
};

module.exports = logger;