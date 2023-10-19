const mysql = require("mysql");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: null,
    database: "custom_pc"
});

connection.connect(function (error) {
    if (error) throw error;
    // console.log("Database Connection Created");
});
module.exports = connection;