import { pool } from "../database/database.js";
import { compare } from '../utils/handlehash.js';
import jwt from "../utils/jwtToken.js";


const loginUser = async (req, res) => {
    try {

        const { correo_electronico, contraseña_usuario } = req.body;

        const [rows] = await pool.query(
            "SELECT * FROM usuarios WHERE correo_electronico = ?", correo_electronico);


        const compareencryp = await compare(contraseña_usuario, rows[0].contraseña_usuario);

        if (!compareencryp) {
            return res.status(401).send("Credenciales Invalidas!");
        }

        const [rol] = await pool.query(
            "SELECT * FROM rol WHERE ID_rol = ?", rows[0].Rol_ID_fk);

        const token = jwt(rows[0].ID_usuario, rol[0].nombre_rol)

        await pool.query(
            "INSERT INTO token (nameToken, Usuarios_ID_fk) values(?,?)",
            [token, rows[0].ID_usuario]
        );



        res.status(200).send({
            rol: rol[0].nombre_rol,
            nombre: rows[0].nombre_usuario + " " + rows[0].apellido_usuario,
            correo: rows[0].correo_electronico,
            telefono: rows[0].telefono_usuario,
            tokenSesion: token
        })

    } catch (error) {
        return res
            .status(500)
            .json({ message: "Algo salio mal al buscar tu usuarios", error });
    }
};


export const methods = {
    loginUser
};