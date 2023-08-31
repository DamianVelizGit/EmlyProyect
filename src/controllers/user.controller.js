import { pool } from "../database/database.js";
import { encrypt } from '../utils/handlehash.js';
import jwt from "../utils/jwtToken.js";



//Controlador para crear los usuario
const createUser = async (req, res) => {
    try {

        const { nombre_usuario, apellido_usuario, correo_electronico, contraseña_usuario, telefono_usuario, nit_usuario } = req.body;

        const passencryp = await encrypt(contraseña_usuario)

        const [rol] = await pool.query(
            "SELECT * FROM rol WHERE nombre_rol = ?", "user");

        const [estado] = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?", "activo");

        const [rows] = await pool.query(
            `INSERT INTO usuarios (
                nombre_usuario, 
                apellido_usuario, 
                correo_electronico, 
                contraseña_usuario, 
                telefono_usuario, 
                nit_usuario,
                Estado_ID_fk,
                Rol_ID_fk) 
                values(?,?,?,?,?,?,?,?)`,
            [
                nombre_usuario,
                apellido_usuario,
                correo_electronico,
                passencryp,
                telefono_usuario,
                nit_usuario,
                estado[0].ID_estado,
                rol[0].ID_rol
            ]
        );


        const token = jwt(rows.insertId, rol[0].nombre_rol)

        await pool.query(
            "INSERT INTO token (nameToken, Usuarios_ID_fk) values(?,?)",
            [token, rows.insertId]
        );


        res.status(201).send({
            id: rows.insertId,
            nombre_usuario,
            apellido_usuario,
            correo_electronico,
            passencryp,
            telefono_usuario,
            nit_usuario,
            token
        })
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Algo salio mal al crear un empleado", error });
    }
};



const upload = async (req, res) => {
    try {

    } catch (error) {
        return res
            .status(500)
            .json({ message: "Algo salio mal al cargar la imagen" });
    }
}





export const methods = {
    createUser,
    upload
};