const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'findash',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkDatabaseConnection() {
  const connection = await pool.promise().getConnection();
  try {
    await connection.ping();
    console.log(`Conexao com o banco ${process.env.DB_NAME || 'findash'} bem-sucedida!`);
  } finally {
    connection.release();
  }
}

module.exports = {
  query: (...args) => pool.promise().query(...args),
  execute: (...args) => pool.promise().execute(...args),
  getConnection: () => pool.promise().getConnection(),
  checkDatabaseConnection
};
