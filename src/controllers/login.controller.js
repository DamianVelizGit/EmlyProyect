import { pool } from "../database/database.js";
import { compare, encrypt } from '../utils/handlehash.js';
import jwt from "../utils/jwtToken.js";
import { EMAIL } from './../config.js';
import transporter from "../utils/mailer.js";


const loginUser = async (req, res) => {
    try {
        const { correo_electronico, contraseña_usuario } = req.body;

        //  Verificar si el correo existe en la base de datos antes de continuar.
        const [user] = await pool.query(
            'SELECT * FROM usuarios WHERE correo_electronico = ? LIMIT 1',
            [correo_electronico]
        );

        if (user.length === 0) {
            return res.status(401).send({ status: "ERROR", message: 'Credenciales incorrectas' });
        }

        //  Verificar las credenciales con una función segura de comparación de contraseñas.
        const isPasswordValid = await compare(contraseña_usuario, user[0].contraseña_usuario);

        if (!isPasswordValid) {
            return res.status(401).send({ status: "ERROR", message: 'Credenciales incorrectas' });
        }

        // Verificar el estado del usuario
        if (user[0].Estado_ID_fk !== 1) {
            return res.status(401).send({ status: "ERROR", message: 'Usuario inactivo' });
        }

        //  Obtener el rol del usuario
        const [rol] = await pool.query(
            "SELECT * FROM rol WHERE ID_rol = ?",
            user[0].Rol_ID_fk
        );

        // Genera un token JWT
        const token = jwt(user[0].ID_usuario, rol[0].nombre_rol);

        //  Insertar el token JWT en la base de datos 
        await pool.query(
            "INSERT INTO token (nameToken, Usuarios_ID_fk) values(?,?)",
            [token, user[0].ID_usuario]
        );
        //  Almacena el token JWT, ID de usuario y el rol en la sesión
        req.session.userId = user[0].ID_usuario;
        req.session.userRole = rol[0].nombre_rol;
        req.session.token = token;

        //  Devuelve la información del usuario con el token JWT
        const userData = {
            id: user[0].ID_usuario,
            rol: rol[0].nombre_rol,
            nombre: user[0].nombre_usuario + " " + user[0].apellido_usuario,
            correo: user[0].correo_electronico,
            telefono: user[0].telefono_usuario,
            tokenSesion: token
        }

        res.status(200).send({ status: "SUCCESS", message: 'Inicio de sesión exitoso', userData });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "ERROR", message: 'Error al iniciar sesión' });
    }
};



function checkLogin(req, res, next) {
    if (req.session.token && req.session.usuario) {
        // El usuario tiene una sesión válida
        return next();
    } else {
        // El usuario no tiene una sesión válida
        return res.status(401).json({ isAuthenticated: false });
    }
}

async function getUserByEmail(email) {
    try {
        // Realiza una consulta SQL para buscar el usuario por correo electrónico
        const query = "SELECT * FROM usuarios WHERE correo_electronico = ?";
        const [rows] = await pool.query(query, [email]);

        // Si se encuentra un usuario, devuelve el primer resultado ya que el correo es unico
        if (rows.length > 0) {
            return rows[0];
        }

        // Si no se encuentra un usuario, devuelve null
        return null;

    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "ERROR", message: 'Error al encontrar un usuario con ese correo electronico' });
    }
}

const forgotPass = async (req, res) => {
    try {
        const { email } = req.body;

        // Verificar si el correo existe en la base de datos antes de enviar el correo de recuperación
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(400).send({ success: false, message: "El correo electrónico no está registrado" });
        }

        // Generar un token de recuperación (código) de forma aleatoria
        const code = generateRecoveryCode();

        // Almacena el token de recuperación en la base de datos asociado al usuario
        const userId = parseInt(user.ID_usuario);
        if (isNaN(userId)) {
            return res.status(400).send({ success: false, message: 'El el ID de usuario deben ser valor numérico' });
        }
        // Colocamos la fecha de expiracion del token

        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        // Insertar el código de recuperación en la tabla code_recovery_pass
        const insertQuery = `
            INSERT INTO code_recovery_pass (code_user, User_fk, fecha_expiracion)
            VALUES (?, ?, ?)
        `;

        const [result] = await pool.query(insertQuery, [code, userId, formattedDate]);

        res.status(200).send({ success: true, message: 'Código de recuperación insertado con éxito', codeId: result.insertId });

        // Construye el HTML del correo con el token de recuperación (si deseas enviar el correo)
        // const contentHTML = `
        //   <h1>INFORMACIÓN DE RECUPERACIÓN</h1>
        //   <ul> 
        //     <li>Email: ${email}</li>
        //     <li>Token de recuperación: ${recoveryToken}</li>
        //   </ul>
        //   <p>Este es tu correo de recuperación</p>
        // `;

        // Envía el correo de recuperación (si deseas enviar el correo)
        // const result = await transporter.sendMail({
        //     from: `Emly-Store ${EMAIL}`,
        //     to: email,
        //     subject: "Recuperación de contraseña",
        //     html: contentHTML
        // });

        // console.log({ result });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error al enviar el correo electrónico de recuperación' });
    }
}

function generateRecoveryCode() {
    let code = "";
    for (let i = 0; i <= 4; i++) {
        let character = Math.ceil(Math.random() * 9);
        code += character;
    }
    return code;
}

const verifyRecoveryCode = async (req, res) => {
    try {
        const { code } = req.body;

        // Obtener el código de recuperación y la fecha actual
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        // Verificar si el código existe en la base de datos y está asociado a la fecha actual
        const query = `
            SELECT * FROM code_recovery_pass
            WHERE code_user = ? AND fecha_expiracion = ?
        `;

        const [results] = await pool.query(query, [code, formattedDate]);

        if (results.length === 0) {
            return res.status(400).send({ success: false, message: 'Código de recuperación no válido' });
        }

        // Si el código es válido, puedes realizar acciones adicionales aquí

        res.status(200).send({ success: true, message: 'Código de recuperación válido' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error al verificar el código de recuperación' });
    }
}


const resetPass = async (req, res) => {
    try {
        const { userId, newPassword, confirmPassword } = req.body;

        if (!newPassword || !confirmPassword) {
            return res.status(400).send({ status: "ERROR", message: "Faltan campos obligatorios" });
        }

        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Las contraseñas no coinciden" });
        }

        // Generar un hash seguro para la contraseña del usuario
        const hashedPassword = await encrypt(newPassword);

        // Realizar la actualización de la contraseña en la base de datos
        const updateQuery = "UPDATE usuarios SET contraseña_usuario = ? WHERE ID_usuario = ?";
        const [result] = await pool.query(updateQuery, [hashedPassword, userId]);

        if (result.affectedRows === 0) {
            // No se encontró el usuario con el ID proporcionado
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }

        return res.status(200).json({ success: true, message: "Contraseña actualizada con éxito" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error al actualizar la contraseña" });
    }
};



export const methods = {
    loginUser,
    checkLogin,
    forgotPass,
    resetPass,
    verifyRecoveryCode
};