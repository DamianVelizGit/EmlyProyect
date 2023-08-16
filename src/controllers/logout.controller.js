import { pool } from "../database/database.js";


//Definimos una función para cerrar la sesión actual
const logout = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).send({ error: "Error interno del servidor." })
    }
}


//Definimos una función para cerrar todas las sesiones
const logoutAll = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).send({ error: "Error interno del servidor." })
    }
}

export const methods = {

};