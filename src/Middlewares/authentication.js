import { SECRET } from './../config.js'
import jsonToken from 'jsonwebtoken'
import { pool } from "../database/database.js";

const authentication = async (req, res, next) => {
    try {
        if (!req.header('Authorization')) {
            return res.status(401).send({ message: 'No se envio un token' })
        }
        const token = req.header('Authorization').replace("Bearer ", "")

        const tokenDecode = jsonToken.verify(token, SECRET)

        const [rol] = await pool.query("SELECT * FROM rol WHERE nombre_rol= ?", tokenDecode.rol);

        const [rows] = await pool.query("SELECT * FROM usuarios WHERE ID_usuario = ? AND Rol_ID_fk = ?", [tokenDecode.id, rol[0].ID_rol]);

        if (rows.length <= 0) {
            
            return res.status(404).json({ message: "Empleado no encontrado" });
        }
        req.user = rows
        req.token = token

        req.rol = rol[0].nombre_rol

        next()
    } catch (error) {

    }
}

module.exports = authentication