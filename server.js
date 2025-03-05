const express = require('express');
const ldap = require('ldapjs');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const config = require('./config'); // Конфигурација на LDAP

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // За статички ресурси

// Функција за автентикација преку LDAP
function authenticate(username, password) {
    return new Promise((resolve, reject) => {
        const client = ldap.createClient({
            url: config.url
        });

        const userDN = `CN=${username},${config.baseDN}`;
        client.bind(userDN, password, (err) => {
            if (err) {
                reject('Неуспешна автентикација');
            } else {
                resolve(true);
            }
            client.unbind();
        });
    });
}

// Логирање на активности
function logActivity(username, action) {
    const log = {
        username,
        action,
        timestamp: new Date().toISOString()
    };

    const logFile = path.join(__dirname, 'activity_log.json');
    let logs = [];

    if (fs.existsSync(logFile)) {
        const existingLogs = fs.readFileSync(logFile, 'utf8');
        logs = JSON.parse(existingLogs);
    }

    logs.push(log);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf8');
    console.log(`Акцијата за ${username} е логирана.`);
}

// Пријавување (Login)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log('Прием на податоци:', username, password); // Лог за прием на податоците

    authenticate(username, password)  // Функцијата што проверува со Active Directory
        .then(() => {
            logActivity(username, 'Login');
            res.json({ success: true });
        })
        .catch(err => {
            logActivity(username, 'Failed login attempt');
            res.status(401).json({ success: false, message: 'Грешно корисничко име или лозинка.' });
        });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

const session = require('express-session');

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Кога корисникот се најави успешно
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    authenticate(username, password)
        .then(() => {
            req.session.user = username;  // Сними го корисникот во сесијата
            logActivity(username, 'Login');
            res.json({ success: true });
        })
        .catch(err => {
            res.status(401).json({ success: false, message: 'Грешно корисничко име или лозинка.' });
        });
});

// Провери дали корисникот е најавен
app.get('/index.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');  // Ако не е најавен, пренасочи на login
    }

    res.sendFile(path.join(__dirname, 'index.html'));  // Ако е најавен, сервирај index.html
});

// Пребарување (Search)
app.post('/search', (req, res) => {
    const { query } = req.body;
    const username = req.headers['username']; // Постави го корисничкото име во заглавие или тело на барањето

    logActivity(username, `Search for ${query}`);
    res.json({ success: true, message: `Пребарувачки резултати за: ${query}` });
});

// Почетна страна
app.get('/dashboard', (req, res) => {
    res.send('Добредојдовте на вашата контрола панел!');
});

// Започни сервер
app.listen(PORT, () => {
    console.log(`Серверот работи на http://localhost:${PORT}`);
});
