import { pool } from "../database/database.js";


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
            const [activeCart] = await connection.query('SELECT * FROM carritos WHERE id_usuario_fk = ? AND estado_carrito_fk = ?', [id_usuario, 1]); // activo tiene ID 1

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
            SELECT pec.id_producto_carrito, p.id_producto, p.nombre_producto, pec.cantidad, p.precio_unitario_producto
            FROM productos_en_carrito AS pec
            INNER JOIN productos AS p ON pec.id_producto = p.id_producto
            WHERE pec.id_carrito IN (
                SELECT id_carrito
                FROM carritos
                WHERE id_usuario_fk = ?
                AND estado_carrito_fk = 1
            )
        `;

        // Ejecuta la consulta SQL
        const [rows] = await pool.query(query, [id_usuario]);

        // Calcular el subtotal de cada producto y el total general del carrito
        let totalGeneral = 0;
        const productosEnCarrito = rows.map((row) => {
            const cantidad = row.cantidad;
            const precioUnitario = row.precio_unitario_producto;
            const subtotal = cantidad * precioUnitario;
            totalGeneral += subtotal;

            return {
                id_producto_carrito: row.id_producto_carrito,
                id_producto: row.id_producto,
                nombre_producto: row.nombre_producto,
                cantidad: cantidad,
                precio_unitario_producto: precioUnitario,
                subtotal: subtotal
            };
        });

        // Responde con la lista de productos en el carrito y el total general
        return res.status(200).send({ status: 'SUCCESS', data: productosEnCarrito, totalGeneral });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error al obtener el contenido del carrito.' });
    }
};

const countProductsInCart = async (req, res) => {
    try {
        const id_usuario = req.user[0].ID_usuario; // Obtén el ID de usuario autenticado desde el token

        const countQuery = `
            SELECT COUNT(pec.id_producto_carrito) as cantidad
            FROM productos_en_carrito AS pec
            INNER JOIN carritos AS c ON pec.id_carrito = c.id_carrito
            WHERE c.id_usuario_fk = ? AND c.estado_carrito_fk = 1
        `;

        const [countRows] = await pool.query(countQuery, [id_usuario]);

        // Responde con la cantidad de productos en el carrito activo
        return res.status(200).json({ status: 'SUCCESS', cantidadProductos: countRows[0].cantidad });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'FAILED', message: 'Error al contar los productos en el carrito activo.' });
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
            // Verificar si el producto está en el carrito del usuario y si el carrito está activo (estado 1)
            const [cartInfo] = await connection.query('SELECT pec.id_producto_carrito FROM productos_en_carrito AS pec INNER JOIN carritos AS c ON pec.id_carrito = c.id_carrito WHERE c.id_usuario_fk = ? AND pec.id_producto = ? AND c.estado_carrito_fk = 1', [id_usuario, id_producto]);

            if (cartInfo.length === 0) {
                // Si el producto no está en el carrito activo, devolver un error
                return res.status(404).send({ status: 'NOT_FOUND', message: 'Producto no encontrado en el carrito activo.' });
            }

            // Obtener el id_producto_carrito del producto en el carrito
            const id_producto_carrito = cartInfo[0].id_producto_carrito;
            // Eliminar el producto del carrito
            await connection.query('DELETE FROM productos_en_carrito WHERE id_producto_carrito = ?', [id_producto_carrito]);

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

const getTotalCart = async (req, res) => {
    try {
        const id_usuario = req.user[0].ID_usuario; // Obtén el ID de usuario autenticado desde el token

        // Verificar que el usuario esté autenticado
        if (!id_usuario) {
            return res.status(401).send({ status: 'UNAUTHORIZED', message: 'Usuario no autenticado.' });
        }

        // Realizar una consulta para obtener los productos en el carrito activo y calcular el total
        const [cartTotal] = await pool.query(
            'SELECT SUM(pec.cantidad * p.precio_unitario_producto) AS total FROM productos_en_carrito AS pec ' +
            'INNER JOIN carritos AS c ON pec.id_carrito = c.id_carrito ' +
            'INNER JOIN productos AS p ON pec.id_producto = p.ID_producto ' +
            'WHERE c.id_usuario_fk = ? AND c.estado_carrito_fk = 1',
            [id_usuario]
        );

        // Obtener el total calculado
        const total = cartTotal[0].total || 0;

        return res.status(200).send({ status: 'SUCCESS', total });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }
};





export const methods = {
    addtoCart,
    ViewToCart,
    updateCartItem,
    DeleteCartItem,
    getTotalCart,
    countProductsInCart
};