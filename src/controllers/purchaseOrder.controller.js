import { pool } from "../database/database.js";


const CreateOrder = async (req, res) => {
  try {
    const id_usuario = req.user[0].ID_usuario; //ID de usuario autenticado desde el token

    // Asegúrate de que el usuario esté autenticado
    if (!id_usuario) {
      return res.status(401).send({ status: 'UNAUTHORIZED', message: 'Usuario no autenticado.' });
    }

    // Genera un número aleatorio de 5 dígitos
    const randomNumber = Math.floor(10000 + Math.random() * 90000);

    // Genera el código único con el prefijo "EYCO" y el número aleatorio
    const ordenIdentificador = `EYCO${randomNumber}`;

    // Iniciar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insertar la nueva orden de compra
      const [result] = await connection.query('INSERT INTO ordenes (id_usuario_fk, estado, OrdenIdentificador) VALUES (?, ?, ?)', [id_usuario, 'Pendiente', ordenIdentificador]);

      // Obtener el ID de la orden recién creada
      const id_orden = result.insertId;

      // Mover productos desde el carrito a la orden
      const [cartProducts] = await connection.query(`
    SELECT pec.*, p.nombre_producto
    FROM productos_en_carrito AS pec
    INNER JOIN carritos AS c ON pec.id_carrito = c.id_carrito
    INNER JOIN productos AS p ON pec.id_producto = p.id_producto
    WHERE c.id_usuario_fk = ? AND c.estado_carrito_fk = 1
`, [id_usuario]);


      for (const product of cartProducts) {
        await connection.query('INSERT INTO detalles_orden (id_orden_fk, id_producto, cantidad) VALUES (?, ?, ?)', [id_orden, product.id_producto, product.cantidad]);

        // Restar la cantidad vendida del stock del producto
        await connection.query('UPDATE productos SET cantidad_stock = cantidad_stock - ? WHERE ID_producto = ?', [product.cantidad, product.id_producto]);
      }

      // Cambiar el estado del carrito a "pendiente"
      await connection.query('UPDATE carritos SET estado_carrito_fk = ? WHERE id_usuario_fk = ?', [2, id_usuario]);

      // Confirmar la transacción
      await connection.commit();

      return res.status(201).send({ status: 'SUCCESS', message: 'Orden de compra creada exitosamente.', products: cartProducts, OrdenID: ordenIdentificador });
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
  SELECT o.id_orden, o.fecha_creacion, o.estado, do.id_detalle, o.OrdenIdentificador, p.nombre_producto, do.cantidad, p.precio_unitario_producto
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
          OrderIdentificador: order.OrdenIdentificador,
          id_orden: order.id_orden,
          fecha_creacion: order.fecha_creacion,
          estado: order.estado,
          detalles: [],
          total_orden: 0, // Agregamos una propiedad para el total de la orden
        });
      }

      const formattedDetail = {
        id_detalle_orden: order.id_orden,
        nombre_producto: order.nombre_producto,
        cantidad: order.cantidad,
        precio_unitario: order.precio_unitario_producto,
        subtotal: order.cantidad * order.precio_unitario_producto, // Agregamos el subtotal del detalle
      };

      const targetOrder = formattedOrders.find((formattedOrder) => formattedOrder.id_orden === order.id_orden);
      targetOrder.detalles.push(formattedDetail);
      targetOrder.total_orden += formattedDetail.subtotal; // Actualizamos el total de la orden
    }

    return res.status(200).send({ status: 'SUCCESS', orders: formattedOrders });

  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
  }
};

const ViewOrderByIdentificador = async (req, res) => {
  try {
    const id_usuario = req.user[0].ID_usuario; // ID de usuario autenticado desde el token
    const ordenIdentificador = req.params.ordenIdentificador; // Obtén el valor del parámetro en la URL

    // Asegúrate de que el usuario esté autenticado
    if (!id_usuario) {
      return res.status(401).send({ status: 'UNAUTHORIZED', message: 'Usuario no autenticado.' });
    }

    // Consulta SQL para obtener una orden filtrada por OrdenIdentificador
    const query = `
      SELECT o.id_orden, o.fecha_creacion, o.estado, do.id_detalle, o.OrdenIdentificador, p.nombre_producto, do.cantidad, p.precio_unitario_producto
      FROM ordenes AS o
      INNER JOIN detalles_orden AS do ON o.id_orden = do.id_orden_fk
      INNER JOIN productos AS p ON do.id_producto = p.id_producto
      WHERE o.id_usuario_fk = ? AND o.OrdenIdentificador = ?
    `;

    const [order] = await pool.query(query, [id_usuario, ordenIdentificador]);

    // Verifica si se encontró una orden
    if (order.length === 0) {
      return res.status(404).send({ status: 'NOT_FOUND', message: 'Orden no encontrada.' });
    }

    // Formatea los detalles de la orden y calcula subtotales
    const formattedDetails = order.map((detail) => ({
      id_detalle_orden: detail.id_detalle_orden,
      nombre_producto: detail.nombre_producto,
      cantidad: detail.cantidad,
      precio_unitario: detail.precio_unitario_producto,
      subtotal: detail.cantidad * detail.precio_unitario_producto, // Calcula el subtotal
    }));

    // Calcula el total sumando todos los subtotales
    const totalOrden = formattedDetails.reduce((total, detail) => total + detail.subtotal, 0);

    // Formatea la orden completa
    const formattedOrder = {
      OrderIdentificador: order[0].OrdenIdentificador,
      id_orden: order[0].id_orden,
      fecha_creacion: order[0].fecha_creacion,
      estado: order[0].estado,
      detalles: formattedDetails,
      total_orden: totalOrden, // Agrega el total de la orden
    };

    return res.status(200).send({ status: 'SUCCESS', order: formattedOrder });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
  }
};

const CancelOrder = async (req, res) => {
  const { id_orden, id_ordenIdentificador } = req.body;

  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {

    const [orderStatus] = await connection.query('SELECT estado FROM ordenes WHERE OrdenIdentificador = ?', [id_ordenIdentificador]);

    if (orderStatus.length === 0) {
      return res.status(404).send({ status: 'NOT_FOUND', message: 'La orden no existe.' });
    }

    const estadoOrden = orderStatus[0].estado;

    if (estadoOrden === 'Cancelada') {
      return res.status(400).send({ status: 'BAD_REQUEST', message: 'La orden ya está cancelada.' });
    }

    if (estadoOrden !== 'Pendiente') {
      return res.status(400).send({ status: 'BAD_REQUEST', message: 'No se puede cancelar una orden que no está en estado "Pendiente".' });
    }

    const [orderProducts] = await connection.query('SELECT id_producto, cantidad FROM detalles_orden WHERE id_orden_fk = ?', [id_orden]);
    console.log(orderProducts);
    for (const product of orderProducts) {
      // console.log("productId: " + product.id_producto, "cantidad:" +  product.cantidad);
      await restoreStock(connection, product.id_producto, product.cantidad);
    }
    console.log(id_orden);
    await markOrderAsCancelled(connection, id_ordenIdentificador);

    await connection.commit();

    return res.status(200).send({ status: 'SUCCESS', message: 'Orden cancelada exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'FAILED', message: 'Error al cancelar la orden.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const restoreStock = async (connection, productId, quantity) => {
  console.log("productId: " + productId, "cantidad:" + quantity);
  await connection.query('UPDATE productos SET cantidad_stock = cantidad_stock + ? WHERE ID_producto = ?', [quantity, productId]);
};

const markOrderAsCancelled = async (connection, orderId) => {
  await connection.query('UPDATE ordenes SET estado = ? WHERE OrdenIdentificador = ?', ['Cancelada', orderId]);
};


//ADMIN FUNCIONS 

const GetAllOrders = async (req, res) => {
  try {
    // Consulta SQL para obtener todas las órdenes con detalles de productos y precios unitarios y ordenarlas de la más nueva a la más antigua
    const query = `
      SELECT o.id_orden, o.fecha_creacion, o.estado, do.id_detalle, o.OrdenIdentificador, p.nombre_producto, do.cantidad, p.precio_unitario_producto
      FROM ordenes AS o
      INNER JOIN detalles_orden AS do ON o.id_orden = do.id_orden_fk
      INNER JOIN productos AS p ON do.id_producto = p.id_producto
      ORDER BY o.fecha_creacion DESC;`;

    const [orders] = await pool.query(query);
    const formattedOrders = [];

    for (const order of orders) {
      const formattedDetail = {
        id_detalle_orden: order.id_detalle_orden,
        nombre_producto: order.nombre_producto,
        cantidad: order.cantidad,
        precio_unitario: order.precio_unitario_producto,
        subtotal: order.cantidad * order.precio_unitario_producto,
        Identificacion_Orden: order.OrdenIdentificador,
        Fecha_creacion: new Date(order.fecha_creacion).toLocaleString(), // Formatear la fecha
      };

      const existingOrder = formattedOrders.find((formattedOrder) => formattedOrder.id_orden === order.id_orden);

      if (!existingOrder) {
        formattedOrders.push({
          OrderIdentificador: order.OrdenIdentificador,
          id_orden: order.id_orden,
          fecha_creacion: new Date(order.fecha_creacion).toLocaleString(), // Formatear la fecha
          estado: order.estado,
          detalles: [formattedDetail],
          total_orden: formattedDetail.subtotal,
        });
      } else {
        existingOrder.detalles.push(formattedDetail);
        existingOrder.total_orden += formattedDetail.subtotal;
      }
    }

    return res.status(200).send({ status: 'SUCCESS', formattedOrders });

  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
  }
};

const GetAllOrdersPaginado = async (req, res) => {
  try {
    let { page = 1, ordersPerPage = 15 } = req.query;

    // Validar y convertir los parámetros a números enteros
    page = parseInt(page, 10);
    ordersPerPage = parseInt(ordersPerPage, 10);

    // Establecer valores predeterminados si los parámetros no son válidos
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    if (isNaN(ordersPerPage) || ordersPerPage < 1) {
      ordersPerPage = 15;
    }

    const startIndex = (page - 1) * ordersPerPage;

    const query = `
      SELECT o.id_orden, o.fecha_creacion, o.estado, do.id_detalle, o.OrdenIdentificador, p.nombre_producto, do.cantidad, p.precio_unitario_producto
      FROM ordenes AS o
      INNER JOIN detalles_orden AS do ON o.id_orden = do.id_orden_fk
      INNER JOIN productos AS p ON do.id_producto = p.id_producto
      ORDER BY o.fecha_creacion DESC
      LIMIT ${ordersPerPage} OFFSET ${startIndex};`;

    const [orders] = await pool.query(query);
    const formattedOrders = [];

    for (const order of orders) {
      const formattedDetail = {
        id_detalle_orden: order.id_detalle_orden,
        nombre_producto: order.nombre_producto,
        cantidad: order.cantidad,
        precio_unitario: order.precio_unitario_producto,
        subtotal: order.cantidad * order.precio_unitario_producto,
        Identificacion_Orden: order.OrdenIdentificador,
        Fecha_creacion: new Date(order.fecha_creacion).toLocaleString(),
      };

      const existingOrder = formattedOrders.find((formattedOrder) => formattedOrder.id_orden === order.id_orden);

      if (!existingOrder) {
        formattedOrders.push({
          OrderIdentificador: order.OrdenIdentificador,
          id_orden: order.id_orden,
          fecha_creacion: new Date(order.fecha_creacion).toLocaleString(),
          estado: order.estado,
          detalles: [formattedDetail],
          total_orden: formattedDetail.subtotal,
        });
      } else {
        existingOrder.detalles.push(formattedDetail);
        existingOrder.total_orden += formattedDetail.subtotal;
      }
    }

    const countQuery = "SELECT COUNT(*) as total FROM ordenes";
    const [countResult] = await pool.query(countQuery);
    const totalOrders = countResult[0].total;
    const totalPages = Math.ceil(totalOrders / ordersPerPage);

    return res.status(200).send({
      status: 'SUCCESS',
      formattedOrders,
      pagination: {
        totalOrders,
        totalPages,
        currentPage: page,
        ordersPerPage,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
  }
};





export const methods = {
  CreateOrder,
  ViewOrders,
  ViewOrderByIdentificador,
  CancelOrder,
  GetAllOrders,
  GetAllOrdersPaginado
};