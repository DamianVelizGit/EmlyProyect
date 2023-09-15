import { pool } from "../database/database.js";


const CreateOrder = async (req, res) => {
    try {
        const id_usuario = req.user[0].ID_usuario; //ID de usuario autenticado desde el token
        const fecha_creacion = new Date(); // Obtiene la fecha actual

        // Asegúrate de que el usuario esté autenticado
        if (!id_usuario) {
            return res.status(401).send({ status: 'UNAUTHORIZED', message: 'Usuario no autenticado.' });
        }

        // Iniciar una transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insertar la nueva orden de compra
            const [result] = await connection.query('INSERT INTO ordenes (id_usuario_fk, fecha_creacion, estado) VALUES (?, ?, ?)', [id_usuario, fecha_creacion, 'Pendiente']);

            // Obtener el ID de la orden recién creada
            const id_orden = result.insertId;

            // Mover productos desde el carrito a la orden
            const [cartProducts] = await connection.query(`
            SELECT pec.*
            FROM productos_en_carrito AS pec
            INNER JOIN carritos AS c ON pec.id_carrito = c.id_carrito
            WHERE c.id_usuario_fk = ? AND c.estado_carrito_fk = 1`, [id_usuario]);

            for (const product of cartProducts) {
                await connection.query('INSERT INTO detalles_orden (id_orden_fk, id_producto, cantidad) VALUES (?, ?, ?)', [id_orden, product.id_producto, product.cantidad]);
            }

            // Cambiar el estado del carrito a "pendiente"
            await connection.query('UPDATE carritos SET estado_carrito_fk = ? WHERE id_usuario_fk = ?', [2, id_usuario]);

            // Confirmar la transacción
            await connection.commit();

            return res.status(201).send({ status: 'SUCCESS', message: 'Orden de compra creada exitosamente.' });
        } catch (error) {
            // Si hay un error, deshacer la transacción y manejar el error
            await connection.rollback();
            console.error(error);
            return res.status(500).send({ status: 'FAILED', message: 'Error al crear la orden de compra.' });
        } finally {
            // Cerrar la conexión
            connection.release();
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }

};


const ViewOrders = async (req, res) => {
    try {
        const id_usuario = req.user[0].ID_usuario; // ID de usuario autenticado desde el token

        // Asegúrate de que el usuario esté autenticado
        if (!id_usuario) {
            return res.status(401).send({ status: 'UNAUTHORIZED', message: 'Usuario no autenticado.' });
        }

        // Consulta SQL para obtener las órdenes del usuario con detalles de productos y precios unitarios
        const query = `
            SELECT o.id_orden, o.fecha_creacion, o.estado, do.id_detalle, p.nombre_producto, do.cantidad, p.precio_unitario_producto
            FROM ordenes AS o
            INNER JOIN detalles_orden AS do ON o.id_orden = do.id_orden_fk
            INNER JOIN productos AS p ON do.id_producto = p.id_producto
            WHERE o.id_usuario_fk = ?
        `;

        const [orders] = await pool.query(query, [id_usuario]);

        // Formatear los datos para una respuesta más presentable
        const formattedOrders = [];
        for (const order of orders) {
            const existingOrder = formattedOrders.find((formattedOrder) => formattedOrder.id_orden === order.id_orden);
            if (!existingOrder) {
                formattedOrders.push({
                    id_orden: order.id_orden,
                    fecha_creacion: order.fecha_creacion,
                    estado: order.estado,
                    detalles: [],
                });
            }
            const formattedDetail = {
                id_detalle_orden: order.id_detalle_orden,
                nombre_producto: order.nombre_producto,
                cantidad: order.cantidad,
                precio_unitario: order.precio_unitario_producto,
            };
            const targetOrder = formattedOrders.find((formattedOrder) => formattedOrder.id_orden === order.id_orden);
            targetOrder.detalles.push(formattedDetail);
        }

        return res.status(200).send({ status: 'SUCCESS', orders: formattedOrders });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }
};



export const methods = {
    CreateOrder,
    ViewOrders
};