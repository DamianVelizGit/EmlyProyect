import { pool } from "../database/database.js";


//Definimos una función para cerrar la sesión actual
const logout = async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM token WHERE nameToken = ?", [
            req.token,
        ]);


        if (result.affectedRows <= 0) {
            return res.status(404).json({ message: "Token no encontrado" });
        }

        res.status(200).send("Sesion Cerrada Correctamente");

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
        logout
};