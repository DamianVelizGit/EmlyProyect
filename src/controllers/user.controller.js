import { pool } from "../database/database.js";
import { encrypt } from '../utils/handlehash.js';
import jwt from "../utils/jwtToken.js";



function sanitize(input) {
    // Remover caracteres no deseados o peligrosos utilizando una expresión regular
    return input.replace(/[\$'";]/g, ''); // Elimina caracteres como '$', "'", '"', ';'
}


const createUser = async (req, res) => {
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

        // Generar un hash seguro para la contraseña del usuario
        const hashedPassword = await encrypt(contraseña_usuario);

        // Verificar si el correo electrónico ya existe
        const [existingUser] = await pool.query("SELECT ID_usuario FROM usuarios WHERE correo_electronico = ?", [sanitizedCorreoElectronico]);

        if (existingUser.length > 0) { //Error http de conflicto
            return res.status(409).send({ status: "ERROR", message: "El correo electrónico ya está en uso" });
        }

        //Consulta a la bd para obtener el rol  usuario
        const [rol] = await pool.query(
            "SELECT * FROM rol WHERE nombre_rol = ?", "user");

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
        return res.status(500).send({ status: "ERROR", message: "Algo salió mal al crear un usuario" });
    }
};




//Controlador para crear los usuario
// const createUserdeprec = async (req, res) => {
//     try {

//         const { nombre_usuario, apellido_usuario, correo_electronico, contraseña_usuario, telefono_usuario, nit_usuario } = req.body;

//         const passencryp = await encrypt(contraseña_usuario)

//         const [rol] = await pool.query(
//             "SELECT * FROM rol WHERE nombre_rol = ?", "user");

//         const [estado] = await pool.query(
//             "SELECT * FROM estado WHERE Nom_estado = ?", "activo");

//         const [rows] = await pool.query(
//             `INSERT INTO usuarios ( 
//                 nombre_usuario, 
//                 apellido_usuario, 
//                 correo_electronico, 
//                 contraseña_usuario, 
//                 telefono_usuario, 
//                 nit_usuario,
//                 Estado_ID_fk,
//                 Rol_ID_fk) 
//                 values(?,?,?,?,?,?,?,?)`,
//             [
//                 nombre_usuario,
//                 apellido_usuario,
//                 correo_electronico,
//                 passencryp,
//                 telefono_usuario,
//                 nit_usuario,
//                 estado[0].ID_estado,
//                 rol[0].ID_rol
//             ]
//         );


//         const token = jwt(rows.insertId, rol[0].nombre_rol)

//         await pool.query(
//             "INSERT INTO token (nameToken, Usuarios_ID_fk) values(?,?)",
//             [token, rows.insertId]
//         );


//         res.status(201).send({
//             id: rows.insertId,
//             nombre_usuario,
//             apellido_usuario,
//             correo_electronico,
//             passencryp,
//             telefono_usuario,
//             nit_usuario,
//             token
//         })
//     } catch (error) {
//         return res
//             .status(500).send({ status: "ERROR", message: "Algo salio mal al crear un usuario" })
//     }
// };



const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_usuario, apellido_usuario, correo_electronico, telefono_usuario, nit_usuario } = req.body;

        const query =
            `
            UPDATE usuarios
            SET nombre_usuario=?, apellido_usuario=?, correo_electronico=?, telefono_usuario=?, nit_usuario=?
            WHERE ID_usuario=?
        `;
        const values = [nombre_usuario, apellido_usuario, correo_electronico, telefono_usuario, nit_usuario, id];

        const [result] = await pool.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).send({ status: "ERROR", message: "Usuario no encontrado" });
        }

        res.status(200).send({ status: "SUCCESS", message: "Usuario actualizado correctamente" });
    } catch (error) {
        return res.status(500).send({ status: "ERROR", message: "Algo salió mal al actualizar el usuario" });
    }
};


const upload = async (req, res) => {
    try {

    } catch (error) {
        return res
            .status(500).send({ status: "ERROR", message: "Algo salio mal al cargar la imagen" })
    }
}


const viewProfile = async (req, res) => {
    try {

        const { user } = req;

        res.status(200).send(user);

    } catch (error) {
        return res
            .status(500).status(500).send({ status: "ERROR", message: "Algo salio mal al ver el perfil" })
    }
}


export const methods = {
    createUser,
    upload,
    viewProfile,
    updateUser
};