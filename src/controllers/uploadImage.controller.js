import { pool } from "../database/database.js";
const sharp = require('sharp');


const addUserAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ error: "No se proporcionó una imagen para subir." });
        }

        const { user } = req;
        const buffer = await sharp(req.file.buffer).resize({
            width: 250,
            height: 250
        }).png({ compressionLevel: 9 }).toBuffer();

        const imagenBuffer = buffer;

        // Realiza la actualización en la base de datos
        const updateQuery = "UPDATE usuarios SET imagen_usuario = ? WHERE ID_usuario = ?";
        const [result] = await pool.query(updateQuery, [imagenBuffer, user[0].ID_usuario]);

        if (result.affectedRows === 0) {
            // Si la actualización no realizó cambios, responde con un mensaje
            return res.status(200).send({ status: "SUCCESS", message: "No se realizaron cambios en el usuario." });
        } else if (result.affectedRows === 1) {
            // Si la actualización fue exitosa, responde con un mensaje
            return res.status(200).send({ status: "SUCCESS", message: "Usuario actualizado exitosamente." });
        } else {
            // En otros casos, la actualización no fue exitosa
            return res.status(404).send({ status: "ERROR", message: "Usuario no encontrado o múltiples usuarios actualizados." });
        }
    } catch (error) {
        res.status(500).send({ msg: error });
    }
};

const ViewUserAvatar = async (req, res) => {
    try {
        const { user } = req;
        if (!user[0].imagen_usuario) {
            return res.status(404).send({ status: "ERROR", message: "No posee una imagen" });
        }
        res.set('Content-Type', 'image/png');
        res.send(user[0].imagen_usuario);
    } catch (error) {
        // Maneja errores aquí
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
}

const addProductImg = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ error: "No se proporcionó una imagen para subir." });
        }
        if (!req.params.id) {
            return res.status(400).send({ error: "No se proporcionó un Identificador de Producto" });
        }

        const { id } = req.params;

        const { width, height } = await sharp(req.file.buffer).metadata();
        const maxDimension = 250;

        const aspectRatio = width / height;
        let newWidth, newHeight;

        if (width > height) {
            newWidth = maxDimension;
            newHeight = maxDimension / aspectRatio;
        } else {
            newHeight = maxDimension;
            newWidth = maxDimension * aspectRatio;
        }

        const buffer = await sharp(req.file.buffer)
            .resize(Math.floor(newWidth), Math.floor(newHeight))
            .png({ compressionLevel: 9 })
            .toBuffer();


        const imagenBuffer = buffer;

        // Realiza la actualización en la base de datos
        const updateQuery = "UPDATE productos SET Img_Producto = ? WHERE ID_producto = ?";
        const [result] = await pool.query(updateQuery, [imagenBuffer, id]);

        if (result.affectedRows === 0) {
            // Si la actualización no realizó cambios, responde con un mensaje
            return res.status(200).send({ status: "SUCCESS", message: "No se realizaron cambios en el producto." });
        } else if (result.affectedRows === 1) {
            // Si la actualización fue exitosa, responde con un mensaje
            return res.status(200).send({ status: "SUCCESS", message: "Producto actualizado exitosamente." });
        } else {
            // En otros casos, la actualización no fue exitosa
            return res.status(404).send({ status: "ERROR", message: "Prodcuto no encontrado." });
        }
    } catch (error) {
        res.status(500).send({ msg: error });
    }
};

const ViewProductImg = async (req, res) => {
    try {
        const { id } = req.params; // ID del producto

        // Realiza una consulta a la base de datos para obtener la imagen del producto según su ID
        const query = "SELECT Img_Producto FROM productos WHERE ID_producto = ?";
        const [result] = await pool.query(query, [id]);

        if (result.length === 1) {
            // Si se encontró el producto y su imagen, envía la imagen como respuesta
            const imagenBuffer = result[0].Img_Producto;
            res.set('Content-Type', 'image/png'); // Ajusta el tipo de contenido según el formato de imagen
            res.send(imagenBuffer);
        } else {
            // Si el producto no se encontró, envía una imagen predeterminada o un mensaje de error
            // Puedes personalizar esto según tus necesidades
            res.status(404).send('Imagen no encontrada');
        }
    } catch (error) {
        // Maneja errores aquí
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
}

export const methods = {
    addUserAvatar,
    ViewUserAvatar,
    addProductImg,
    ViewProductImg
};