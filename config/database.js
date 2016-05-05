/**
 * Database for storing user and message ...
 */

module.exports = {
    default: "mysql",
    connections: {
        mysql: {
            client: "mysql",
            connection: {
                host: "127.0.0.1",
                user: "root",
                password: "root",
                database: "test"
            }
        },
        pg: {
            client: 'pg',
            connection: process.env.PG_CONNECTION_STRING,
            searchPath: 'knex,public'
        },
        sqlite: {
            client: 'sqlite3',
            connection: {
                filename: "./mydb.sqlite"
            }
        }

    }
};