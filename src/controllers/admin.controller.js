import { pool } from "../database/database.js";


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


const DeleteUser = async (req, res) => {
    try {

        const { id } = req.params;


        const [estado] = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?", "inactivo");


        const [result] = await pool.query(
            "UPDATE usuarios SET Estado_ID_fk = ? WHERE ID_usuario = ?",
            [estado[0].ID_estado, id]
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


export const methods = {
getUsers,
getUser,
DeleteUser
};