
import {DB_HOST, DB_PORT,DB_DATABASE,DB_USER, DB_PASSWORD} from './../config.js'
import { createPool } from "mysql2/promise";

//Creamos la conexion a la base de datos SQL 
export const pool = createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    database: DB_DATABASE,
})
