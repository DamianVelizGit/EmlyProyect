import { pool } from "../database/database.js";


const CreateOrder = async (req, res) => {
    try {
        const id_usuario = req.user[0].ID_usuario; //ID de usuario autenticado desde el token

        // Asegúrate de que el usuario esté autenticado
        if (!id_usuario) {
            return res.status(401).send({ status: 'UNAUTHORIZED', message: 'Usuario no autenticado.' });
        }

        // Iniciar una transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insertar la nueva orden de compra
            const [result] = await connection.query('INSERT INTO ordenes (id_usuario_fk, estado) VALUES (?, ?)', [id_usuario, 'Pendiente']);

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

                // Restar la cantidad vendida del stock del producto
                await connection.query('UPDATE productos SET cantidad_stock = cantidad_stock - ? WHERE ID_producto = ?', [product.cantidad, product.id_producto]);
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


// Ruta para cancelar una orden y restaurar el stock
const CancelOrder = async (req, res) => {
  try {
    const { id_orden } = req.body;
    // Verifica que el ID de la orden sea un número válido
    if (isNaN(id_orden)) {
      return res.status(400).send({ status: 'BAD_REQUEST', message: 'ID de orden inválido.' });
    }

    // Inicia una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Obtiene el estado de la orden
      const [orderStatus] = await connection.query('SELECT estado FROM ordenes WHERE ID_orden = ?', [id_orden]);

      // Verifica si la orden existe y está en estado "Pendiente"
      if (orderStatus.length === 0 || orderStatus[0].estado !== 'Pendiente') {
        return res.status(400).send({ status: 'BAD_REQUEST', message: 'No se puede cancelar una orden que no está en estado "Pendiente".' });
      }

      // Obtiene los productos de la orden a cancelar
      const [orderProducts] = await connection.query('SELECT id_producto, cantidad FROM detalles_orden WHERE id_orden_fk = ?', [id_orden]);

      // Restaura el stock de los productos
      for (const product of orderProducts) {
        await connection.query('UPDATE productos SET cantidad_stock = cantidad_stock + ? WHERE ID_producto = ?', [product.cantidad, product.id_producto]);
      }

      // Cancela la orden
      await connection.query('UPDATE ordenes SET estado = ? WHERE ID_orden = ?', ['Cancelada', id_orden]);

      // Confirma la transacción
      await connection.commit();

      return res.status(200).send({ status: 'SUCCESS', message: 'Orden cancelada exitosamente.' });
    } catch (error) {
      // Si hay un error, deshace la transacción y maneja el error
      await connection.rollback();
      console.error(error);
      return res.status(500).send({ status: 'FAILED', message: 'Error al cancelar la orden.' });
    } finally {
      // Cierra la conexión
      connection.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
  }
};


export const methods = {
    CreateOrder,
    ViewOrders,
    CancelOrder
};