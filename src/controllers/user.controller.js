import { pool } from "../database/database.js";
import { encrypt } from '../utils/handlehash.js';
import jwt from "../utils/jwtToken.js";


//Controlador para obtener los empleados
const getUsers = async (req, res) => {
    try {
        //Creamos la consulta para traer los empleados
        const [rows] = await pool.query("SELECT * FROM usuarios");
        //Respondemos en formato json lo que encontramos en la BD
        res.json(rows);
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ message: "Algo salio mal al ver los usuarios" });
    }
};



//Controlador para obtener un empleado
const getUser = async (req, res) => {
    try {

        //Creamos la consulta para
        const [rows] = await pool.query(
            "SELECT * FROM usuarios WHERE ID_usuario = ?", req.params.id);
        res.json(rows[0]);

    } catch (error) {
        return res
            .status(500)
            .json({ message: "Algo salio mal al buscar tu usuarios" });
    }
};



//Controlador para crear los usuario
const createUser = async (req, res) => {
    try {

        const { nombre_usuario, apellido_usuario, correo_electronico, contraseña_usuario, telefono_usuario, nit_usuario } = req.body;

        const passencryp = await encrypt(contraseña_usuario)
        console.log(passencryp);

        const rol = await pool.query(
            "SELECT * FROM rol WHERE nombre_rol = ?", "user");

        const estado = await pool.query(
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
                estado[0][0].ID_estado,
                rol[0][0].ID_rol
            ]
        );


        const token = jwt(rows.insertId, rol[0][0].nombre_rol)

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

const DeleteUser = async (req, res) => {
    try {

        const { id } = req.params;


        const estado = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?", "inactivo");


        const [result] = await pool.query(
            "UPDATE usuarios SET Estado_ID_fk = ? WHERE ID_usuario = ?",
            [estado[0][0].ID_estado, id]
        );

        //Se valida si el id existe en la bd
        if (result.affectedRows == 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.status(200).send("Usuario Eliminado Correctamente")

    } catch (error) {
        return res
            .status(500)
            .json({ message: "Algo salio mal al actualizar la informacion" });
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
    getUsers,
    getUser,
    DeleteUser,
    upload
};