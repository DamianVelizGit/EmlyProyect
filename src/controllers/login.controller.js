import { pool } from "../database/database.js";
import { compare, encrypt } from '../utils/handlehash.js';
import jwt from "../utils/jwtToken.js";
import { EMAIL } from './../config.js';
import transporter from "../utils/mailer.js";


//***********************LOGIN*******************************/
const loginUser = async (req, res) => {
    try {
        //Obtenemos los datos desde el body de la solicitud
        const { correo_electronico, contraseña_usuario } = req.body;

        //  Verificar si el correo existe en la base de datos antes de continuar.
        const [user] = await pool.query(
            'SELECT * FROM usuarios WHERE correo_electronico = ? LIMIT 1',
            [correo_electronico]
        );
        //Verofoca que si la consulta no encontro nada las credenciales son invalidas
        if (user.length === 0) {
            return res.status(401).send({ status: "ERROR", message: 'Credenciales incorrectas' });
        }

        //  Verificar las credenciales con una función del middleware de comparación de contraseñas.
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


//***********************RECUPERACION DE CONTRASEÑA*******************************/
const forgotPass = async (req, res) => {
    try {
        const { email } = req.body;

        // Verificar si el correo existe en la base de datos antes de enviar el correo de recuperación
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(400).send({ success: false, message: "El correo electrónico no está registrado o no esta enviando un correo" });
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

        // Construye el HTML del correo con el token de recuperación 
        const contentHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <style>
        p, a, h1, h2, h3, h4, h5, h6 {font-family: 'Roboto', sans-serif !important;}
        h1{ font-size: 30px !important;}
        h2{ font-size: 25px !important;}
        h3{ font-size: 18px !important;}
        h4{ font-size: 16px !important;}
        p, a{font-size: 15px !important;}

        .imag{
            width: 20px;
            height: 20px;
        }
        .contA{
            margin: 0px 5px 0 5px;
        }
        .afooter{
            color: #ffffff !important; 
            text-decoration: none;
            font-size: 13px !important;
        }
        .title{
            color: #ffffff !important; 
        }
    </style>
</head>
<body>
    <div style="width: 100%; background-color: #e3e3e3;">
        <div style="padding: 20px 10px 20px 10px;">
            <!-- Titulo inicial -->
            <div style="background-color: #000000; padding: 10px 0px 10px 0px; width: 100%; text-align: center;">
                <h3 class="title">Emly-Store Codigo de Recuperacion</h3>
            </div>
            <!-- Titulo inicial -->

            <!-- Contenido principal -->
            <div style="background-color: #ffffff; padding: 20px 0px 5px 0px; width: 100%; text-align: center;">
                <h1>Codigo de recuperacion</h1>
                <p>Hemos recibido una solicitud de recuperación de cuenta asociada a tu correo electrónico. El código de recuperación que necesitarás para este proceso es el siguiente:

            Código de Recuperación: </p> <h2>${code}</h2>
            <p>Si no has solicitado un código de recuperación, te recomendamos encarecidamente que hagas caso omiso de este correo electrónico.Puedes contactarnos de inmediato si tienes alguna preocupación o sospecha de actividades no autorizadas en tu cuenta.
            </p>    

                <!-- Gracias -->
                <p>Gracias por tu tiempo.</p>
                <p style="margin-bottom: 50px;"><i>Atentamente:</i><br>Emly-Store</p>


            <!-- Contenido principal -->

            <!-- Footer -->
            <div style="background-color: #282828; color: #ffffff; padding: 5px 0px 0px 0px; width: 100%; text-align: center;">

                <h4>Soporte</h4>
                <p style="font-size: 13px; padding: 0px 20px 0px 20px;">
                    Comunícate con nosotros por los siguientes medios:<br>
                    Whatsapp: <a class="afooter" href="https://wa.me/50254873972">+502 5487 3972</a><br>
                </p>
                <p style="background-color: black; padding: 10px 0px 10px 0px; font-size: 12px !important;">
                    © 2023 Emly-Store, todos los derechos reservados.
                </p>
            </div>
            <!-- Footer -->



        </div>
    </div>
</body>
</html>
        `;

        // Envía el correo de recuperación 
        const result1 = await transporter.sendMail({
            from: `Emly-Store ${EMAIL}`,
            to: email,
            subject: "Recuperación de contraseña",
            html: contentHTML
            // attachments:
            // {
            //     filename: 'logo',
            //     path: './assets/logo.png',
            //     cid: 'logo',
            // }
        });

        res.status(200).send({ success: true, message: 'Código de recuperación enviado con exito, porfavor revise su bandeja de entrda o SPAM' });

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

        const [[results]] = await pool.query(query, [code, formattedDate]);

        if (results.length === 0) {
            return res.status(400).send({ success: false, message: 'Código de recuperación no válido' });
        }

        // Si el código es válido, puedes realizar acciones adicionales aquí

        res.status(200).send({ success: true, message: 'Código de recuperación válidado correctamente', iduser: results.User_fk });

    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error al verificar el código de recuperación' });
    }
}

const resetPass = async (req, res) => {
    try {
        const { userId, newPassword, confirmPassword } = req.body;

        if (!newPassword || !confirmPassword) {
            return res.status(400).send({ status: "ERROR", message: "Faltan campos obligatorios", state: "info", title: "Informacion" });
        }

        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            return res.status(400).send({ success: false, message: "Las contraseñas no coinciden", state: "warning", title: "Atencion" });
        }

        // Generar un hash seguro para la contraseña del usuario
        const hashedPassword = await encrypt(newPassword);

        // Realizar la actualización de la contraseña en la base de datos
        const updateQuery = "UPDATE usuarios SET contraseña_usuario = ? WHERE ID_usuario = ?";
        const [result] = await pool.query(updateQuery, [hashedPassword, userId]);

        if (result.affectedRows === 0) {
            // No se encontró el usuario con el ID proporcionado
            return res.status(404).json({ success: false, message: "Usuario no encontrado", state: "warning", title: "Atencion" });
        }

        return res.status(200).json({ success: true, message: "Contraseña actualizada con éxito", state: "success", title: "Cambio Exitoso" });
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