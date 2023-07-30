var mysql = require('mysql2');
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'qlalfqjsgh12!@',
    database: 'nodejs'
});
db.connect();

module.exports = db;