import { pool } from "../database/database.js";
import { encrypt } from '../utils/handlehash.js';
import jwt from "../utils/jwtToken.js";

const addtoCart = async (req, res) => {
    try {
        // Validar que los parámetros sean números y que id_usuario esté presente
        const { id_producto, cantidad } = req.body;
        if (isNaN(id_producto) || isNaN(cantidad) || !req.user || !req.user[0].ID_usuario) {
            return res.status(400).send({ status: 'BAD_REQUEST', message: 'Parámetros de solicitud inválidos.' });
        }

        const id_usuario = req.user[0].ID_usuario;

        // Iniciar una transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Verificar si el usuario ya tiene un carrito activo
            let id_carrito = null;
            const [activeCart] = await connection.query('SELECT * FROM carritos WHERE id_usuario_fk = ? AND estado_carrito_fk = ?', [id_usuario, 1]); // Suponiendo que el estado activo tiene ID 1

            if (activeCart.length === 0) {
                // Si el usuario no tiene un carrito activo, crea uno con estado activo
                const [result] = await connection.query('INSERT INTO carritos (id_usuario_fk, estado_carrito_fk) VALUES (?, ?)', [id_usuario, 1]); // 1 representa el estado activo
                id_carrito = result.insertId; // ID del nuevo carrito creado
            } else {
                // Si el usuario ya tiene un carrito activo, obtén su ID
                id_carrito = activeCart[0].id_carrito;
            }

            // Verificar el stock disponible del producto
            const [productInfo] = await connection.query('SELECT cantidad_stock FROM productos WHERE ID_producto = ?', [id_producto]);

            if (productInfo.length === 0) {
                // Si no se encuentra información del producto, devolver un error
                return res.status(404).send({ status: 'NOT_FOUND', message: 'Producto no encontrado.' });
            }

            const stockDisponible = productInfo[0].cantidad_stock;

            if (cantidad > stockDisponible) {
                return res.status(400).send({ status: 'BAD_REQUEST', message: 'La cantidad solicitada excede el stock disponible.' });
            }

            // Verificar si el producto ya está en el carrito del usuario
            const [existingProduct] = await connection.query('SELECT * FROM productos_en_carrito WHERE id_carrito = ? AND id_producto = ?', [id_carrito, id_producto]);

            if (existingProduct.length === 0) {
                // Si el producto no está en el carrito, insertarlo
                await connection.query('INSERT INTO productos_en_carrito (id_carrito, id_producto, cantidad) VALUES (?, ?, ?)', [id_carrito, id_producto, cantidad]);
            } else {
                // Si el producto ya está en el carrito, actualizar la cantidad
                const newCantidad = existingProduct[0].cantidad + cantidad;

                if (newCantidad > stockDisponible) {
                    return res.status(400).send({ status: 'BAD_REQUEST', message: 'La cantidad solicitada excede el stock disponible.' });
                }

                await connection.query('UPDATE productos_en_carrito SET cantidad = ? WHERE id_carrito = ? AND id_producto = ?', [newCantidad, id_carrito, id_producto]);
            }

            // Confirmar la transacción
            await connection.commit();

            return res.status(201).send({ status: 'SUCCESS', message: 'Producto agregado al carrito exitosamente.' });
        } catch (error) {
            // Si hay un error, deshacer la transacción y manejar el error
            await connection.rollback();
            console.error(error);
            return res.status(500).send({ status: 'FAILED', message: 'Error al agregar el producto al carrito.' });
        } finally {
            // Cerrar la conexión
            connection.release();
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }
};

const ViewToCart = async (req, res) => {
    try {
        const id_usuario = req.user[0].ID_usuario; // Obtén el ID de usuario autenticado desde el token

        // Consulta para obtener los productos en el carrito del usuario
        const query = `
            SELECT pec.id_producto_carrito, p.nombre_producto, pec.cantidad, pec.precio_unitario
            FROM productos_en_carrito AS pec
            INNER JOIN productos AS p ON pec.id_producto = p.id_producto
            WHERE pec.id_carrito IN (
                SELECT id_carrito
                FROM carritos
                WHERE id_usuario_fk = ?
            )
        `;

        // Ejecuta la consulta SQL
        const [rows] = await pool.query(query, [id_usuario]);

        // Responde con la lista de productos en el carrito
        return res.status(200).json({ status: 'SUCCESS', data: rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'FAILED', message: 'Error al obtener el contenido del carrito.' });
    }
};


const updateCartItem = async (req, res) => {
    try {
        // Validar que los parámetros sean números y que id_usuario esté presente
        const { id_producto, cantidad } = req.body;
        if (isNaN(id_producto) || isNaN(cantidad) || !req.user || !req.user[0].ID_usuario) {
            return res.status(400).send({ status: 'BAD_REQUEST', message: 'Parámetros de solicitud inválidos.' });
        }

        const id_usuario = req.user[0].ID_usuario;

        // Iniciar una transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Verificar si el usuario tiene el producto en su carrito
            const [existingCartItem] = await connection.query('SELECT * FROM productos_en_carrito WHERE id_carrito IN (SELECT id_carrito FROM carritos WHERE id_usuario_fk = ?) AND id_producto = ?', [id_usuario, id_producto]);

            if (existingCartItem.length === 0) {
                // Si el producto no está en el carrito, devolver un error
                return res.status(404).send({ status: 'NOT_FOUND', message: 'Producto no encontrado en el carrito.' });
            }

            // Verificar el stock disponible del producto
            const [productInfo] = await connection.query('SELECT cantidad_stock FROM productos WHERE ID_producto = ?', [id_producto]);

            if (productInfo.length === 0) {
                // Si no se encuentra información del producto, devolver un error
                return res.status(404).send({ status: 'NOT_FOUND', message: 'Producto no encontrado.' });
            }

            const stockDisponible = productInfo[0].cantidad_stock;

            if (cantidad > stockDisponible) {
                return res.status(400).send({ status: 'BAD_REQUEST', message: 'La cantidad solicitada excede el stock disponible.' });
            }

            // Actualizar la cantidad del producto en el carrito
            await connection.query('UPDATE productos_en_carrito SET cantidad = ? WHERE id_carrito IN (SELECT id_carrito FROM carritos WHERE id_usuario_fk = ?) AND id_producto = ?', [cantidad, id_usuario, id_producto]);

            // Confirmar la transacción
            await connection.commit();

            return res.status(200).send({ status: 'SUCCESS', message: 'Cantidad de producto en el carrito actualizada exitosamente.' });
        } catch (error) {
            // Si hay un error, deshacer la transacción y manejar el error
            await connection.rollback();
            console.error(error);
            return res.status(500).send({ status: 'FAILED', message: 'Error al actualizar la cantidad del producto en el carrito.' });
        } finally {
            // Cerrar la conexión
            connection.release();
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }
};


const DeleteCartItem = async (req, res) => {
    try {
        const { id_producto } = req.params;
        const id_usuario = req.user[0].ID_usuario; // Obtén el ID de usuario autenticado desde el token

        // Validar que los parámetros sean números
        if (isNaN(id_producto) || isNaN(id_usuario)) {
            return res.status(400).send({ status: 'BAD_REQUEST', message: 'Parámetros de solicitud inválidos.' });
        }

        // Iniciar una transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Verificar si el producto está en el carrito del usuario
            const [existingProduct] = await connection.query('SELECT pec.id_producto_carrito FROM productos_en_carrito AS pec INNER JOIN carritos AS c ON pec.id_carrito = c.id_carrito WHERE c.id_usuario_fk = ? AND pec.id_producto = ?', [id_usuario, id_producto]);

            if (existingProduct.length === 0) {
                // Si el producto no está en el carrito, devolver un error
                return res.status(404).send({ status: 'NOT_FOUND', message: 'Producto no encontrado en el carrito.' });
            }
console.log(existingProduct[0].id_producto_carrito);
            // Eliminar el producto del carrito
            await connection.query('DELETE FROM productos_en_carrito WHERE id_producto_carrito = ?', [existingProduct[0].id_producto_carrito]);

            // Confirmar la transacción
            await connection.commit();

            return res.status(200).send({ status: 'SUCCESS', message: 'Producto eliminado del carrito exitosamente.' });
        } catch (error) {
            // Si hay un error, deshacer la transacción y manejar el error
            await connection.rollback();
            console.error(error);
            return res.status(500).send({ status: 'FAILED', message: 'Error al eliminar el producto del carrito.' });
        } finally {
            // Cerrar la conexión
            connection.release();
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }
};



export const methods = {
    addtoCart,
    ViewToCart,
    updateCartItem,
    DeleteCartItem
};