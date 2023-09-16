import { pool } from "../database/database.js";
import { encrypt } from '../utils/handlehash.js';
import jwt from "../utils/jwtToken.js";



const TopSales = async (req, res) => {
    try {
        // Consulta SQL para obtener los productos más vendidos
        const sql = `
      SELECT p.nombre_producto, SUM(do.cantidad) as total_vendido
      FROM productos p
      JOIN detalles_orden do ON p.ID_producto = do.id_producto
      GROUP BY p.ID_producto
      ORDER BY total_vendido DESC
      LIMIT 10;`;

        // Ejecuta la consulta en la base de datos
        const [results] = await pool.query(sql);

        // Envía los resultados como respuesta
        return res.status(200).send(results);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }
};

const Stock = async (req, res) => {
  try {
    const page = req.query.page || 1; // Página solicitada (por defecto 1)
    const perPage = 15; // Cantidad de productos por página

    // Calcular el valor de OFFSET en función de la página
    const offset = (page - 1) * perPage;

    // Consulta SQL para obtener los niveles de stock actuales con paginación
    const sql = `
      SELECT nombre_producto, cantidad_stock
      FROM productos
      LIMIT ? OFFSET ?;`;

    // Ejecuta la consulta en la base de datos con los valores de paginación
    const [results] = await pool.query(sql, [perPage, offset]);

    // Envía los resultados como respuesta
    return res.status(200).send(results);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
  }
}




export const methods = {
    TopSales,
    Stock
};