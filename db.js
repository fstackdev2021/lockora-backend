const { Pool } = require("pg");

// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "vault",
//   password: "T#!ru2806",
//   port: 5432,
// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


module.exports = pool;