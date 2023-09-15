import { pool } from "../database/database.js";

let cachedCategories = null;
const cacheTimeout = 1800 * 1000; // 1 hora en milisegundos

// Limpia la caché de categorías después de 30 minutos
setInterval(() => {
    cachedCategories = null;
}, cacheTimeout); // Expira la caché



const getProducts = async (req, res) => {
    try {
        const { page = 1 } = req.query; // Página opcional

        // Valida que el parámetro de página sea un número positivo
        const parsedPage = parseInt(page, 10);

        if (isNaN(parsedPage) || parsedPage < 1) {
            return res.status(400).json({ status: "FAILED", message: "Número de página inválido" });
        }

        const limit = 15; // Número de productos por página
        const startIndex = (parsedPage - 1) * limit;

        // Realiza una consulta para obtener la cantidad total de productos
        const countQuery = "SELECT COUNT(*) as total FROM productos";
        const [countResult] = await pool.query(countQuery);
        const totalProducts = countResult[0].total;

        // Calcula el número total de páginas
        const totalPages = Math.ceil(totalProducts / limit);

        // Realiza la consulta con paginación y límite
        const query = "SELECT * FROM productos LIMIT ? OFFSET ?";
        const [rows] = await pool.query(query, [limit, startIndex]);

        // Responde con los productos y metadatos de paginación
        res.status(200).send({
            products: rows,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: parsedPage,
                productsPerPage: limit,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al ver los Productos" });
    }
};


const createProduct = async (req, res) => {
    try {
        // datos del producto del cuerpo de la solicitud
        const { nombre_producto, descripcion_producto, precio_unitario_producto, cantidad_stock, marca_producto, Proveedores_ID_fk, Categorias_ID_fk } = req.body;

        // Validaciones de campos requeridos y tipos de datos
        if (!nombre_producto || !descripcion_producto || !precio_unitario_producto || !cantidad_stock || !marca_producto || !Proveedores_ID_fk || !Categorias_ID_fk) {
            return res.status(400).send({ status: "FAILED", message: "Todos los campos son requeridos." });
        }

        if (typeof precio_unitario_producto !== 'number' || typeof cantidad_stock !== 'number') {
            return res.status(400).send({ status: "FAILED", message: "Los campos de precio y cantidad deben ser números." });
        }

        //Consulta a la base de datos para obtener el estado
        const [estado] = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?", "activo");

        // Realiza la inserción en la base de datos
        const insertQuery = "INSERT INTO productos (nombre_producto, descripcion_producto, precio_unitario_producto, cantidad_stock, marca_producto, Proveedores_ID_fk,Estado_ID_fk, Categorias_ID_fk) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await pool.query(insertQuery, [nombre_producto, descripcion_producto, precio_unitario_producto, cantidad_stock, marca_producto, Proveedores_ID_fk, estado[0].ID_estado, Categorias_ID_fk]);

        if (result.affectedRows === 1) {
            // Si la inserción fue exitosa, responde con un código 201 (Creado)
            return res.status(201).send({ status: "SUCCESS", message: "Producto creado exitosamente." });
        } else {
            // Si la inserción no fue exitosa, responde con un código 500 (Internal Server Error)
            return res.status(500).send({ status: "FAILED", message: "No se pudo crear el producto." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al crear el producto." });
    }
};


const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id; // Obtén el ID del producto de los parámetros de la URL
        const updatedFields = req.body; // Obtén los campos actualizados del cuerpo de la solicitud

        console.log(req.params);
        console.log(req.body);
        // Verifica que el ID del producto sea un número entero válido
        if (!Number.isInteger(+productId)) {
            return res.status(400).send({ status: "ERROR", message: "ID del producto no válido." });
        }

        // Realiza la actualización en la base de datos
        const updateQuery = "UPDATE productos SET ? WHERE ID_producto = ?";
        const [result] = await pool.query(updateQuery, [updatedFields, productId]);

        if (result.affectedRows === 1) {
            // Si la actualización fue exitosa, responde con un código 200 (OK)
            return res.status(200).send({ status: "SUCCESS", message: "Producto actualizado exitosamente." });
        } else {
            // Si la actualización no fue exitosa (por ejemplo, si el producto no existe), responde con un código 404 (Not Found)
            return res.status(404).send({ status: "ERROR", message: "Producto no encontrado." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al actualizar el producto." });
    }
};


const deleteProduct = async (req, res) => {
    try {
        // Obtén el ID del producto a eliminar desde los parámetros de la solicitud
        const { id } = req.params;
        console.log(req.params);
        // Verifica si el ID  es un número entero válido
        if (!Number.isInteger(+id)) {
            return res.status(400).send({ status: "ERROR", message: "ID del producto no válido." });
        }

        // Verifica si el producto existe
        const [existingProduct] = await pool.query("SELECT * FROM productos WHERE ID_producto = ?", [id]);

        if (!existingProduct) {
            return res.status(404).send({ status: "NOT_FOUND", message: "Producto no encontrada." });
        }


        const [estado] = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?",
            ["inactivo"]
        );


        // Realiza una actualización en la base de datos para marcar el producto como eliminado (o inactivo)
        const updateQuery = "UPDATE productos SET Estado_ID_fk = ? WHERE ID_producto = ?";
        const [result] = await pool.query(updateQuery, [estado[0].ID_estado, id]);

        if (result.affectedRows === 1) {
            // Si la actualización fue exitosa, responde con un mensaje de éxito
            return res.status(200).send({ status: "SUCCESS", message: "Producto eliminado exitosamente." });
        } else {
            // Si no se actualizó ningún registro (posiblemente debido a que el producto no existe), responde con un mensaje de error
            return res.status(404).send({ status: "FAILED", message: "Producto no encontrado o ya está inactivo." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al eliminar el producto." });
    }
};



//Controlador para obtener las categorias
const getCategory = async (req, res) => {
    try {
        // Si las categorías están en caché y no han expirado, devuelve la caché
        if (cachedCategories !== null && Date.now() - cachedCategories.timestamp < cacheTimeout) {
            console.log('Obteniendo categorías desde la caché...');
            return res.send(cachedCategories.data);
        }

        // Realiza la consulta para traer las categorías
        const [rows] = await pool.query("SELECT * FROM categorias");

        // Si no se encontraron categorías, responde con un código 404 (No encontrado)
        if (rows.length === 0) {
            return res.status(404).send({ status: "FAILED", message: "No se encontraron categorías" });
        }

        // Almacena las categorías en caché junto con la marca de tiempo
        cachedCategories = {
            data: rows,
            timestamp: Date.now(),
        };

        // Responde con las categorías encontradas en la BD
        res.status(200).send(rows);
    } catch (error) {
        console.error(error);
        // Si ocurre un error, responde con un código de estado 500 (Error interno del servidor)
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al ver las categorías" });
    }
};

const createCategory = async (req, res) => {
    try {

        const { nombre_categoria, descripcion_categoria } = req.body;

        // validaciones de los datos recibidos
        if (!nombre_categoria || !descripcion_categoria) {
            // validaciones de los datos recibidos si hacen falta responde con un  codigo de error 400 (Bad request)
            return res.status(400).send({ status: "FAILED", message: "Faltan campos obligatorios." });
        }

        // Verifica si la categoría ya existe en la base de datos
        const [existingCategory] = await pool.query(
            "SELECT * FROM categorias WHERE nombre_categoria = ?",
            [nombre_categoria]
        );

        if (existingCategory.length > 0) {
            // Si ya existe en la base de datos se manda un estado 409 (Conflicto)
            return res.status(409).send({ status: "FAILED", message: "La categoría ya existe." });
        }


        //Consulta a la base de datos para obtener el estado
        const [estado] = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?", "activo");

        // Inserta la nueva categoría en la base de datos
        const [result] = await pool.query(
            "INSERT INTO categorias (nombre_categoria, descripcion_categoria, Estado_ID_fk) VALUES (?, ?, ?)",
            [nombre_categoria, descripcion_categoria, estado[0].ID_estado]
        );

        if (result.affectedRows === 1) {
            // Si la inserción fue exitosa, responde con un código 201 (Creado)
            return res.status(201).send({ status: "SUCCESS", message: "Categoría creada exitosamente." });
        } else {
            // Si la inserción no fue exitosa, responde con un código 500 (Internal server error)
            return res.status(500).send({ status: "FAILED", message: "No se pudo crear la categoría." });
        }
    } catch (error) {
        console.error(error);
        // Si existe otro tipo de error responde con un código 500 (Internal server error)
        return res.status(500).send({ status: "FAILED", message: "Error al crear la categoría." });
    }
};

const updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id; // Obtén el ID  de los parámetros de la URL
        const updatedFields = req.body; // Obtén los campos actualizados del cuerpo de la solicitud


        // Verifica que el ID  sea un número entero válido
        if (!Number.isInteger(+categoryId)) {
            return res.status(400).send({ status: "ERROR", message: "ID dela categoria no es válido." });
        }

        // Realiza la actualización en la base de datos
        const updateQuery = "UPDATE categorias SET ? WHERE ID_categoria = ?";
        const [result] = await pool.query(updateQuery, [updatedFields, categoryId]);

        if (result.affectedRows === 1) {
            // Si la actualización fue exitosa, responde con un código 200 (OK)
            return res.status(200).send({ status: "SUCCESS", message: "La categoria actualizada exitosamente." });
        } else {
            // Si la actualización no fue exitosa , responde con un código 404 (Not Found)
            return res.status(404).send({ status: "ERROR", message: "Categoria no encontrada." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al actualizar la categoria." });
    }
};

const CategoryDeleted = async (req, res) => {

    try {
        const categoryId = req.params.id; // Suponiendo que el ID de la categoría se obtiene de los parámetros de la solicitud


        // Verifica si el ID  es un número entero válido
        if (!Number.isInteger(+categoryId)) {
            return res.status(400).send({ status: "ERROR", message: "ID de usuario no válido" });
        }

        // Verifica si la categoría existe
        const [existingCategory] = await pool.query("SELECT * FROM categorias WHERE ID_categoria = ?", [categoryId]);

        if (!existingCategory) {
            return res.status(404).send({ status: "NOT_FOUND", message: "Categoría no encontrada." });
        }


        const [estado] = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?",
            ["inactivo"]
        );

        // Realiza una actualización para marcar la categoría como eliminada
        await pool.query("UPDATE categorias SET Estado_ID_fk = ? WHERE ID_categoria = ?", [estado[0].ID_estado, categoryId]);

        return res.status(200).send({ status: "SUCCESS", message: "Categoría eliminada." });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "FAILED", message: "No se pudo eliminar la categoria" });
    }
};


const searchProducts = async (req, res) => {
    try {
        // Obtener los parámetros de búsqueda y filtros de la solicitud
        const { keywords, category, minPrice, maxPrice } = req.query;

        // Construir la consulta SQL dinámica
        let sql = 'SELECT * FROM productos WHERE 1';

        if (keywords) {
            // Agregar búsqueda por palabras clave
            sql += ` AND nombre_producto LIKE '%${keywords}%'`;
        }

        if (category) {
            // Agregar filtro por categoría
            sql += ` AND categoria = '${category}'`;
        }

        if (minPrice) {
            // Agregar filtro por precio mínimo
            sql += ` AND precio_unitario_producto >= ${minPrice}`;
        }

        if (maxPrice) {
            // Agregar filtro por precio máximo
            sql += ` AND precio_unitario_producto <= ${maxPrice}`;
        }

        // Ejecutar la consulta en la base de datos
        const [results] = await pool.query(sql);

        // Devolver los resultados de la búsqueda como respuesta JSON
        return res.status(200).send({ status: 'SUCCESS', results });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }
};




export const methods = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategory,
    createCategory,
    updateCategory,
    CategoryDeleted,
    searchProducts
};