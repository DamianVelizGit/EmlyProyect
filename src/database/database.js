
import { DB_HOST, DB_PORT, DB_DATABASE, DB_USER, DB_PASSWORD } from './../config.js'
import { createPool } from "mysql2/promise";
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);



//Creamos la conexion a la base de datos SQL 
export const pool = createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
})

//Creamos una conexion para el uso del almacenamiento de sesiones
const options = {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
}

export const sessionStore = new MySQLStore(options);