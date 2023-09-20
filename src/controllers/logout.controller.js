import { pool } from "../database/database.js";


//Definimos una función para cerrar la sesión actual
// const logoutdeprecate = async (req, res) => {
//     try {
//         const [result] = await pool.query("DELETE FROM token WHERE nameToken = ?", [
//             req.token,
//         ]);


//         if (result.affectedRows <= 0) {
//             return res.status(404).json({ message: "Token no encontrado" });
//         }

//         res.status(200).send("Sesion Cerrada Correctamente");

//     } catch (error) {
//         res.status(500).send({ error: "Error interno del servidor." })
//     }
// }

const logout = async (req, res) => {
    try {
        const authorizationHeader = req.headers['authorization'];
        if (!authorizationHeader) {
            return res.status(401).json({ message: 'No se proporcionó un token de autorización.' });
        }
        console.log(authorizationHeader);
        const token = authorizationHeader.split(' ')[1];


        // Elimina el token de la base 
        const [result] = await pool.query("DELETE FROM token WHERE nameToken = ?", [
            token
        ]);

        if (result.affectedRows <= 0) {
            return res.status(404).send({ message: "Token no encontrado" });
        }

        // Destruye la sesión para el usuario
        req.session.destroy((err) => {
            if (err) {
                console.error(err);
                return res.status(500).send({ error: "Error al cerrar la sesión" });
            }
            res.status(200).send({ message: "Sesión cerrada correctamente" });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Error interno del servidor." });
    }
};


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