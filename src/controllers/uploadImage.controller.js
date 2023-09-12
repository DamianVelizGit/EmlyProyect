import { pool } from "../database/database.js";
const multer = require('multer');


// Configuración de Multer para guardar las imágenes en el servidor
const storage = multer.memoryStorage(); // Almacenar las imágenes en memoria
const upload = multer({ storage: storage });


const uploadImage = async (req, res) => {
    try {
        upload.single('image')(req, res, async (err) => {
            if (err) {
                console.error('Error al cargar la imagen:', err);
                return res.status(400).send({ message: 'Error al cargar la imagen' });
            }

            const { user } = req;
            const imageBuffer = req.file.buffer; // El archivo de imagen en formato BLOB

            console.log(user[0].ID_usuario);

            // Verifica si el usuario existe en la base de datos
            const [userRows] = await pool.query(
                'SELECT * FROM usuarios WHERE ID_usuario = ?',
                [user[0].ID_usuario]
            );

            if (userRows.length === 0) {
                return res.status(404).send({ message: 'Usuario no encontrado' });
            }
            console.log('llego aqui');
            // Guardar la imagen en la base de datos y asociarla al usuario
            const sql = 'UPDATE usuarios SET imagen_usuario = ? WHERE ID_usuario = ?';

            await pool.query(sql, [imageBuffer, user[0].ID_usuario], (dbErr, result) => {
                if (dbErr) {
                    console.error('Error al insertar la imagen en la base de datos:', dbErr);
                    return res.status(500).send({ message: 'Error al insertar la imagen' });
                }

                console.log('Imagen cargada y asociada correctamente al usuario en la base de datos');
                res.status(200).send({ message: 'Imagen cargada y asociada correctamente al usuario' });
            });
        });
    } catch (error) {
        console.error('Error al procesar la imagen:', error);
        res.status(500).send({ message: 'Error al procesar la imagen' });
    }
};



export const methods = {
    uploadImage
};