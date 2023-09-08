import { pool } from "../database/database.js";


//Controlador para obtener los empleados
const getUsersDeprecate = async (req, res) => {
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

let cachedUsers = null;
const cacheTimeout = 3600 * 1000; // Caché válida durante 1 hora (en milisegundos)

const getUsers = async (req, res) => {
    try {
        // Si los usuarios están en caché y no ha expirado, devuelve la caché
        if (cachedUsers !== null && Date.now() - cachedUsers.timestamp < cacheTimeout) {
            console.log('Obteniendo usuarios desde la caché...');
            return res.json(cachedUsers.data);
        }

        // Realiza la consulta a la base de datos seleccionando solo los campos necesarios
        const [rows] = await pool.query("SELECT * FROM usuarios");

        // Almacena los usuarios en la caché junto con la marca de tiempo
        cachedUsers = {
            data: rows,
            timestamp: Date.now(),
        };

        // Respondemos en formato JSON con los datos de la base de datos
        res.json(cachedUsers.data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener los usuarios" });
    }
};



//Controlador para obtener un empleado
// const getUserDeprecate = async (req, res) => {
//     try {

//         //Creamos la consulta para
//         const [rows] = await pool.query(
//             "SELECT * FROM usuarios WHERE ID_usuario = ?", req.params.id);
//         res.json(rows[0]);

//     } catch (error) {
//         return res
//             .status(500)
//             .json({ message: "Algo salio mal al buscar tu usuarios" });
//     }
// };


const getUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Verifica si el ID de usuario es un número entero válido
        if (!Number.isInteger(+userId)) {
            return res.status(400).json({ message: "ID de usuario no válido" });
        }

        // Realiza la consulta a la base de datos utilizando un parámetro
        const [rows] = await pool.query(
            "SELECT * FROM usuarios WHERE ID_usuario = ?",
            [userId]
        );

        // Verifica si se encontró un usuario con el ID especificado
        if (rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Devuelve los campos en formato JSON
        const user = rows[0];
        res.json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al buscar el usuario" });
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