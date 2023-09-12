import { pool } from "../database/database.js";
import { encrypt } from '../utils/handlehash.js';
import jwt from "../utils/jwtToken.js";


let cachedAdmin = null;
let cachedUsers = null;
const cacheTimeout = 1800 * 1000; // Caché válida durante 30 minutos (en milisegundos)

// Limpia la caché  después de una hora
setInterval(() => {
    cachedAdmin = null;
    cachedUsers = null;
}, cacheTimeout); // Expira la caché

//Funcion para limpiar los datos entrantes
function sanitize(input) {
    // Remover caracteres no deseados o peligrosos utilizando una expresión regular
    return input.replace(/[\$'";]/g, ''); // Elimina caracteres como '$', "'", '"', ';'
}


//***********************USUARIO*******************************/
//--------------------OBTENER USUARIOS------------------------*/

const getUsers = async (req, res) => {
    try {

        const excludedRoles = [3, 2];

        // Si los usuarios están en caché y no ha expirado, devuelve la caché
        if (cachedUsers !== null && Date.now() - cachedUsers.timestamp < cacheTimeout) {
            console.log('Obteniendo usuarios desde la caché...');
            return res.status(200).send(cachedUsers.data);
        }

        const [rows] = await pool.query("SELECT * FROM usuarios WHERE Rol_ID_fk NOT IN (?) AND Estado_ID_fk = ?", [excludedRoles, 1]);

        // Almacena los usuarios en la caché junto con la marca de tiempo
        cachedUsers = {
            data: rows,
            timestamp: Date.now(),
        };

        // Respondemos con los datos de la base de datos
        res.status(200).send(cachedUsers.data);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "ERROR", message: "Error al obtener los usuarios" });
    }
};


//--------------------OBTENER USUARIO ID------------------------*/

const getUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Verifica si el ID de usuario es un número entero válido
        if (!Number.isInteger(+userId)) {
            return res.status(400).send({ status: "ERROR", message: "ID de usuario no válido" });
        }

        // Realiza la consulta a la base de datos utilizando un parámetro
        const [userRows] = await pool.query(
            "SELECT * FROM usuarios WHERE ID_usuario = ?",
            [userId]
        );

        // Verifica si se encontró un usuario con el ID especificado
        if (userRows.length === 0) {
            return res.status(404).send({ status: "ERROR", message: "Usuario no encontrado" });
        }

        // Obtiene el ID del rol del usuario
        const userRoleId = userRows[0].Rol_ID_fk;

        // Realiza una consulta para obtener el nombre del rol del usuario
        const [roleRows] = await pool.query(
            "SELECT nombre_rol FROM rol WHERE ID_rol = ?",
            [userRoleId]
        );

        // Verifica si el usuario tiene el rol "user"
        if (roleRows.length === 0 || roleRows[0].nombre_rol !== "user") {
            return res.status(403).send({ status: "ERROR", message: "El ID no pertenece a un usuario" });
        }

        // Devuelve los campos del usuario
        const user = userRows[0];
        res.send({ status: "success", user });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "ERROR", message: "Error al buscar el usuario" });
    }
};

//--------------------ELIMINAR USUARIO ID------------------------*/
const DeleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica si el ID de usuario es un número entero válido
        if (!Number.isInteger(+id)) {
            return res.status(400).send({ status: "ERROR", message: "ID de usuario no válido" });
        }

        // Realiza la consulta a la base de datos para obtener el rol del usuario
        const [userRows] = await pool.query(
            "SELECT Rol_ID_fk FROM usuarios WHERE ID_usuario = ?",
            [id]
        );

        // Verifica si se encontró un usuario con el ID especificado
        if (userRows.length === 0) {
            return res.status(404).send({ status: "ERROR", message: "Usuario no encontrado" });
        }

        // Obtiene el ID del rol del usuario
        const userRoleId = userRows[0].Rol_ID_fk;

        // Realiza una consulta para obtener el nombre del rol del usuario
        const [roleRows] = await pool.query(
            "SELECT nombre_rol FROM rol WHERE ID_rol = ?",
            [userRoleId]
        );

        // Verifica si el usuario tiene el rol "user"
        if (roleRows.length === 0 || roleRows[0].nombre_rol !== "user") {
            return res.status(403).send({ status: "ERROR", message: "El ID no pertenece a un usuario" });
        }

        // Actualiza el estado del usuario a "inactivo"
        const [estado] = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?",
            ["inactivo"]
        );

        const query = "UPDATE usuarios SET Estado_ID_fk = ? WHERE ID_usuario = ?";
        const values = [estado[0].ID_estado, id];

        const [result] = await pool.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).send({ status: "ERROR", message: "Usuario no encontrado" });
        }

        res.status(200).send({ status: "SUCCESS", message: "Usuario desactivado correctamente" });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "ERROR", message: "Algo salió mal al desactivar el usuario" });
    }
};


//***********************ADMINISTRADOR**************************/
//--------------------OBTENER ADMINISTRADORES--------------------*/

const getAdministrators = async (req, res) => {
    try {
        const excludedRoles = [1]; // ID del rol de usuario

        // Si los administradores están en caché y no ha expirado, devuelve la caché
        if (cachedAdmin !== null && Date.now() - cachedAdmin.timestamp < cacheTimeout) {
            console.log('Obteniendo administradores desde la caché...');
            return res.status(200).send(cachedAdmin.data);
        }

        // Realiza la consulta a la base de datos seleccionando solo los campos necesarios
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE Rol_ID_fk NOT IN (?) AND Estado_ID_fk = ?", [excludedRoles, 1]);

        // Almacena los administradores en la caché junto con la marca de tiempo
        cachedAdmin = {
            data: rows,
            timestamp: Date.now(),
        };

        // Respondemos con los datos de la base de datos
        res.status(200).send(cachedAdmin.data);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "ERROR", message: "Error al obtener los Administradores" });
    }
};


//--------------------OBTENER ADMINISTRADOR ID--------------------*/
const getAdministrator = async (req, res) => {
    try {
        const userId = req.params.id;

        // Verifica si el ID de usuario es un número entero válido
        if (!Number.isInteger(+userId)) {
            return res.status(400).send({ status: "ERROR", message: "ID de Administrador no válido" });
        }

        // Realiza la consulta a la base de datos utilizando un parámetro
        const [userRows] = await pool.query(
            "SELECT * FROM usuarios WHERE ID_usuario = ?",
            [userId]
        );

        // Verifica si se encontró un usuario con el ID especificado
        if (userRows.length === 0) {
            return res.status(404).send({ status: "ERROR", message: "Administrador no encontrado" });
        }

        // Obtiene el ID del rol del usuario
        const userRoleId = userRows[0].Rol_ID_fk;

        // Realiza una consulta para obtener el nombre del rol del usuario
        const [roleRows] = await pool.query(
            "SELECT nombre_rol FROM rol WHERE ID_rol = ?",
            [userRoleId]
        );

        // Verifica si el usuario tiene el rol de administrador
        if (roleRows.length === 0 || roleRows[0].nombre_rol !== "administrator") {
            return res.status(403).send({ status: "ERROR", message: "El ID no pertenece a un administrador" });
        }

        // Devuelve los campos del usuario
        const user = userRows[0];
        res.send({ status: "success", user });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "ERROR", message: "Error al buscar el Administrador" });
    }
};


//--------------------BORRAR ADMINISTRADOR ID--------------------*/
const DeleteAdministrator = async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica si el ID de usuario es un número entero válido
        if (!Number.isInteger(+id)) {
            return res.status(400).send({ status: "ERROR", message: "ID de usuario no válido" });
        }

        // Realiza la consulta a la base de datos para obtener el rol del usuario
        const [userRows] = await pool.query(
            "SELECT Rol_ID_fk FROM usuarios WHERE ID_usuario = ?",
            [id]
        );

        // Verifica si se encontró un usuario con el ID especificado
        if (userRows.length === 0) {
            return res.status(404).send({ status: "ERROR", message: "Usuario no encontrado" });
        }

        // Obtiene el ID del rol del usuario
        const userRoleId = userRows[0].Rol_ID_fk;

        // Realiza una consulta para obtener el nombre del rol del usuario
        const [roleRows] = await pool.query(
            "SELECT nombre_rol FROM rol WHERE ID_rol = ?",
            [userRoleId]
        );

        // Verifica si el usuario tiene el rol "administrator"
        if (roleRows.length === 0 || roleRows[0].nombre_rol !== "administrator") {
            return res.status(403).send({ status: "ERROR", message: "El ID no pertenece a un administrador" });
        }

        // Actualiza el estado del administrador a "inactivo"
        const [estado] = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?",
            ["inactivo"]
        );

        const query = "UPDATE usuarios SET Estado_ID_fk = ? WHERE ID_usuario = ?";
        const values = [estado[0].ID_estado, id];

        const [result] = await pool.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).send({ status: "ERROR", message: "Administrador no encontrado" });
        }

        res.status(200).send({ status: "SUCCESS", message: "Administrador desactivado correctamente" });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "ERROR", message: "Algo salió mal al desactivar el administrador" });
    }
};


//--------------------CREAR ADMINISTRADOR--------------------*/

const createAdministrator = async (req, res) => {
    try {
        const {
            nombre_usuario,
            apellido_usuario,
            correo_electronico,
            contraseña_usuario,
            telefono_usuario,
            nit_usuario
        } = req.body;

        // Validar datos de entrada
        if (!nombre_usuario || !apellido_usuario || !correo_electronico || !contraseña_usuario || !telefono_usuario || !nit_usuario) {
            return res.status(400).send({ status: "ERROR", message: "Faltan campos obligatorios" });
        }

        // Sanitizar datos de entrada
        const sanitizedNombreUsuario = sanitize(nombre_usuario);
        const sanitizedApellidoUsuario = sanitize(apellido_usuario);
        const sanitizedCorreoElectronico = sanitize(correo_electronico);
        const sanitizedTelefonoUsuario = sanitize(telefono_usuario);
        const sanitizedNitUsuario = sanitize(nit_usuario);

        // Generar un hash seguro para la contraseña del administrador
        const hashedPassword = await encrypt(contraseña_usuario);

        // Verificar si el correo electrónico ya existe
        const [existingUser] = await pool.query("SELECT ID_usuario FROM usuarios WHERE correo_electronico = ?", [sanitizedCorreoElectronico]);

        if (existingUser.length > 0) { //Error http de conflicto
            return res.status(409).send({ status: "ERROR", message: "El correo electrónico ya está en uso" });
        }

        //Consulta a la bd para obtener el rol  usuario
        const [rol] = await pool.query(
            "SELECT * FROM rol WHERE nombre_rol = ?", "administrator");

        //Consulta a la base de datos para obtener el estado
        const [estado] = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?", "activo");


        // Insertar el nuevo usuario en la base de datos de manera segura con una consulta parametrizada
        const insertQuery = `
            INSERT INTO usuarios (
                nombre_usuario,
                apellido_usuario,
                correo_electronico,
                contraseña_usuario,
                telefono_usuario,
                nit_usuario,
                Estado_ID_fk,
                Rol_ID_fk
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const insertValues = [
            sanitizedNombreUsuario,
            sanitizedApellidoUsuario,
            sanitizedCorreoElectronico,
            hashedPassword,
            sanitizedTelefonoUsuario,
            sanitizedNitUsuario,
            estado[0].ID_estado,
            rol[0].ID_rol
        ];

        const [insertResult] = await pool.query(insertQuery, insertValues);

        const userId = insertResult.insertId;

        // Generar un token JWT para el usuario recién creado (asegúrate de usar una biblioteca JWT segura)
        const token = jwt(userId, rol[0].nombre_rol);

        // Insertar el token en la base de datos si es necesario
        await pool.query(
            "INSERT INTO token (nameToken, Usuarios_ID_fk) values(?,?)",
            [token, userId]
        );

        res.status(201).send({
            id: userId,
            nombre_usuario: sanitizedNombreUsuario,
            apellido_usuario: sanitizedApellidoUsuario,
            correo_electronico: sanitizedCorreoElectronico,
            telefono_usuario: sanitizedTelefonoUsuario,
            nit_usuario: sanitizedNitUsuario,
            token
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "ERROR", message: "Algo salió mal al crear un administrador" });
    }
};

//--------------------ACTUALIZAR ADMINISTRADOR--------------------*/
const updateAdministrator = async (req, res) => {
    try {
        const adminId = req.params.id; // Obtén el ID  de los parámetros de la URL
        const updatedFields = req.body; // Obtén los campos actualizados del cuerpo de la solicitud


        // Verifica que el ID  sea un número entero válido
        if (!Number.isInteger(+adminId)) {
            return res.status(400).send({ status: "ERROR", message: "ID del administrador no es válido." });
        }

        // Realiza la actualización en la base de datos
        const updateQuery = "UPDATE usuarios SET ? WHERE ID_usuario = ?";
        const [result] = await pool.query(updateQuery, [updatedFields, adminId]);

        if (result.affectedRows === 1) {
            // Si la actualización fue exitosa, responde con un código 200 (OK)
            return res.status(200).send({ status: "SUCCESS", message: "Adminsitrador actualizado exitosamente." });
        } else {
            // Si la actualización no fue exitosa , responde con un código 404 (Not Found)
            return res.status(404).send({ status: "ERROR", message: "Administrador no encontrado." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al actualizar el Administrador." });
    }
};



export const methods = {
    getUsers,
    getUser,
    DeleteUser,
    getAdministrators,
    getAdministrator,
    updateAdministrator,
    DeleteAdministrator,
    createAdministrator
};