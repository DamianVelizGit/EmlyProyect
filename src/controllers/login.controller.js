import { pool } from "../database/database.js";
import { compare } from '../utils/handlehash.js';
import jwt from "../utils/jwtToken.js";

// const loginUserdeprecate = async (req, res) => {
//     try {
//         const { correo_electronico, contraseña_usuario } = req.body;

//         const [rows] = await pool.query(
//             "SELECT * FROM usuarios WHERE correo_electronico = ?", correo_electronico);


//         const compareencryp = await compare(contraseña_usuario, rows[0].contraseña_usuario);

//         if (!compareencryp) {
//             return res.status(401).send("Credenciales Invalidas!");
//         }

//         const [rol] = await pool.query(
//             "SELECT * FROM rol WHERE ID_rol = ?", rows[0].Rol_ID_fk);

//         const token = jwt(rows[0].ID_usuario, rol[0].nombre_rol)

//         await pool.query(
//             "INSERT INTO token (nameToken, Usuarios_ID_fk) values(?,?)",
//             [token, rows[0].ID_usuario]
//         );

//         const userData = {
//             rol: rol[0].nombre_rol,
//             nombre: rows[0].nombre_usuario + " " + rows[0].apellido_usuario,
//             correo: rows[0].correo_electronico,
//             telefono: rows[0].telefono_usuario,
//             tokenSesion: token
//         }

//         req.session.usuario = rows[0].nombre_usuario + " " + rows[0].apellido_usuario
//         req.session.rol = userData.rol
//         req.session.visitas = req.session.visitas ? ++req.session.visitas : 1
//         req.session.token = token
//         console.log(req.session.token);

//         res.status(200).send({userData})

//     } catch (error) {
//         console.log(error);
//         return res
//             .status(500)
//             .json({ message: "Algo salio mal al buscar tu usuarios", error });
//     }
// };



const loginUser = async (req, res) => {
    try {
        const { correo_electronico, contraseña_usuario } = req.body;

        // Realiza la autenticación de usuario y verifica el estado
        const [user] = await pool.query(
            'SELECT * FROM usuarios WHERE correo_electronico = ? LIMIT 1',
            [correo_electronico]
        );
        //Verifica si las credenciales son correctas
        if (user.length === 0 ||  !compare(contraseña_usuario, user[0].contraseña_usuario)) {
            return res.status(401).send({ status: "ERROR", message: 'Credenciales incorrectas' });
        }

        // Verifica el estado del usuario
        if (user[0].Estado_ID_fk !== 1) {
            return res.status(401).send({  status: "ERROR", message: 'Usuario inactivo' });
        }

        const [rol] = await pool.query(
        "SELECT * FROM rol WHERE ID_rol = ?", user[0].Rol_ID_fk);

        // Almacena el ID de usuario y el rol en la sesión
        req.session.userId = user[0].ID_usuario;
        req.session.userRole = rol[0].nombre_rol;

        // Genera un token JWT
        const token = jwt(user[0].ID_usuario, rol[0].nombre_rol);

        // Insertamos el token de sesion en la bd
        await pool.query(
            "INSERT INTO token (nameToken, Usuarios_ID_fk) values(?,?)",
            [token, user[0].ID_usuario]
        );

        // Almacena el token JWT en la sesión
        req.session.token = token;

        //Devolvemos un objeto con la informacion del usuario
        const userData = {
            rol: rol[0].nombre_rol,
            nombre: user[0].nombre_usuario + " " + user[0].apellido_usuario,
            correo: user[0].correo_electronico,
            telefono: user[0].telefono_usuario,
            tokenSesion: token
        }

        // Devuelve usuario junto con el mensaje de inicio de sesión exitoso
        res.status(200).send({ status: "susses", message: 'Inicio de sesión exitoso', userData });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "ERROR", message: 'Error al iniciar sesión' });
    }
};



function checkLogin(req, res, next) {
  if ( req.session.token && req.session.usuario) {
    // El usuario tiene una sesión válida
    return next();
  } else {
    // El usuario no tiene una sesión válida
    return res.status(401).json({ isAuthenticated: false });
  }
}


export const methods = {
    loginUser,
    checkLogin
};