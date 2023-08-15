import config from '../config.js';
import { createPool } from "mysql2/promise";

//Creamos una constante con los datos de conexion
const pool = createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
})


//Cremos una funcion que nos devolvera la variable de conexion
const getConnection = () => {
    return pool;
}


//Se exportaran las funciones dentro declaradas
module.exports = {
    getConnection
}