import { pool } from "../database/database.js";

let cachedCategories = null;
const cacheTimeout = 1800 * 1000; // 1 hora en milisegundos

// Limpia la caché de categorías después de 30 minutos
setInterval(() => {
    cachedCategories = null;
}, cacheTimeout); // Expira la caché



const getProducts = async (req, res) => {
    try {
        const { page = 1, productsPerPage = 15, category } = req.query; // Página, productos por página y categoría

        // Valida que los parámetros de página y productos por página sean números positivos
        const parsedPage = parseInt(page, 10);
        const parsedProductsPerPage = parseInt(productsPerPage, 12);

        if (isNaN(parsedPage) || isNaN(parsedProductsPerPage) || parsedPage < 1 || parsedProductsPerPage < 1) {
            return res.status(400).json({ status: "FAILED", message: "Parámetros de paginación inválidos" });
        }

        const startIndex = (parsedPage - 1) * parsedProductsPerPage;

        // Construye la consulta base
        let query = "SELECT * FROM productos WHERE Estado_ID_fk = 1";

        // Realiza una consulta para obtener la cantidad total de productos (con o sin filtro de categoría)
        const countQuery = "SELECT COUNT(*) as total FROM productos";
        const [countResult] = await pool.query(countQuery);

        // Obtiene la cantidad total de productos
        const totalProducts = countResult[0].total;

        // Calcula el número total de páginas
        const totalPages = Math.ceil(totalProducts / parsedProductsPerPage);

        // Ejecuta la consulta con paginación y filtro de categoría si es necesario
        let params = [parsedProductsPerPage, startIndex];

        if (category) {
            params = [category, ...params]; // Agrega la categoría a los parámetros
            query += " LIMIT ? OFFSET ?";
        } else {
            query += " LIMIT ? OFFSET ?";
        }

        const [rows] = await pool.query(query, params);

        // Responde con los productos y metadatos de paginación
        res.status(200).send({
            products: rows,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: parsedPage,
                productsPerPage: parsedProductsPerPage,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al obtener los Productos" });
    }
};

const getDetaillProduct = async (req, res) => {
    try {
        const { IDDetalleProducto } = req.body;

        if (!IDDetalleProducto) {
            return res.status(400).send({ status: "FAILED", message: "Falta el ID del producto" });
        }

        // Realiza una consulta para obtener un solo producto por su ID
        const query = "SELECT * FROM productos WHERE id_producto = ?";
        const [rows] = await pool.query(query, [IDDetalleProducto]);

        if (rows.length === 0) {
            return res.status(404).send({ status: "FAILED", message: "Producto no encontrado" });
        }

        // Responde con el producto encontrado
        res.status(200).send({ status: "SUCCESS", product: rows[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al obtener el producto" });
    }
};

const createProduct = async (req, res) => {
    try {
        const { nombre_producto, descripcion_producto, precio_unitario_producto, cantidad_stock, marca_producto, Proveedores_Nombre, Categorias_Nombre } = req.body;

        if (!nombre_producto || !descripcion_producto || !precio_unitario_producto || !cantidad_stock || !marca_producto || !Proveedores_Nombre || !Categorias_Nombre) {
            return res.status(400).send({ status: "FAILED", message: "Todos los campos son requeridos." });
        }

        if (typeof precio_unitario_producto !== 'number' || typeof cantidad_stock !== 'number') {
            return res.status(400).send({ status: "FAILED", message: "Los campos de precio y cantidad deben ser números." });
        }

        // Obtener el ID del proveedor
        const [proveedorResult] = await pool.query("SELECT ID_proveedor FROM proveedores WHERE nombre_empresa = ?", Proveedores_Nombre);

        if (proveedorResult.length === 0) {
            return res.status(400).send({ status: "FAILED", message: "El proveedor especificado no existe." });
        }
        const Proveedores_ID_fk = proveedorResult[0].ID_proveedor;

        // Obtener el ID de la categoría
        const [categoriaResult] = await pool.query("SELECT ID_categoria FROM categorias WHERE nombre_categoria = ?", Categorias_Nombre);

        if (categoriaResult.length === 0) {
            return res.status(400).send({ status: "FAILED", message: "La categoría especificada no existe." });
        }
        const Categorias_ID_fk = categoriaResult[0].ID_categoria;

        // Consulta a la base de datos para obtener el estado
        const [estado] = await pool.query("SELECT * FROM estado WHERE Nom_estado = ?", "activo");

        const insertQuery = "INSERT INTO productos (nombre_producto, descripcion_producto, precio_unitario_producto, cantidad_stock, marca_producto, Proveedores_ID_fk, Estado_ID_fk, Categorias_ID_fk, Proveedor, Categoria) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await pool.query(insertQuery, [nombre_producto, descripcion_producto, precio_unitario_producto, cantidad_stock, marca_producto, Proveedores_ID_fk, estado[0].ID_estado, Categorias_ID_fk, Proveedores_Nombre, Categorias_Nombre ]);

        if (result.affectedRows === 1) {
            return res.status(201).send({ status: "SUCCESS", message: "Producto creado exitosamente." });
        } else {
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


const getCategoryPaginacion = async (req, res) => {
    try {
        const { page = 1, productsPerPage = 15 } = req.query;

        const parsedPage = parseInt(page, 10);
        const parsedProductsPerPage = parseInt(productsPerPage, 10);

        const startIndex = (parsedPage - 1) * parsedProductsPerPage;

        let query = "SELECT * FROM categorias";

        query += ` LIMIT ${parsedProductsPerPage} OFFSET ${startIndex}`;

        const [rows] = await pool.query(query);

        const countQuery = "SELECT COUNT(*) as total FROM categorias WHERE Estado_ID_fk = 1";
        const [countResult] = await pool.query(countQuery);
        const totalCategories = countResult[0].total;

        const totalPages = Math.ceil(totalCategories / parsedProductsPerPage);

        res.status(200).send({
            categories: rows,
            pagination: {
                totalCategories,
                totalPages,
                currentPage: parsedPage,
                productsPerPage: parsedProductsPerPage
            } 
        });

    } catch (error) {
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
        const { keywords } = req.query;

        // Lista de parámetros
        const params = [];

        // Construir la consulta SQL dinámica
        let sql = 'SELECT * FROM productos WHERE 1';

        if (keywords) {
            // Agregar búsqueda por palabras clave
            sql += ` AND nombre_producto LIKE ?`;
            params.push(`%${keywords}%`);
        }

        // Ejecutar la consulta en la base de datos
        const [results] = await pool.query(sql, params);

        // Devolver los resultados de la búsqueda como respuesta JSON
        return res.status(200).send({ status: 'SUCCESS', results });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }
};

const searchProductsbyCategory = async (req, res) => {
    try {
        // Obtener los parámetros de búsqueda y filtros de la solicitud
        const { category } = req.query;

        // Lista de parámetros
        const params = [];

        // Construir la consulta SQL dinámica
        let sql = 'SELECT * FROM productos WHERE 1';

        if (category) {
            // Agregar búsqueda por palabras clave
            sql += ` AND Categorias_ID_fk LIKE ?`;
            params.push(`%${category}%`);
        }

        // Ejecutar la consulta en la base de datos
        const [results] = await pool.query(sql, params);

        // Devolver los resultados de la búsqueda como respuesta JSON
        return res.status(200).send({ status: 'SUCCESS', results });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }
};

const searchProductsByCategories = async (req, res) => {
    try {
        // Obtener los IDs de categoría desde el cuerpo de la solicitud
        const { categoriasSeleccionadas } = req.body;

        // Validar si se proporcionaron categorías
        if (!categoriasSeleccionadas || !Array.isArray(categoriasSeleccionadas)) {
            return res.status(400).json({ status: "FAILED", message: "Debes proporcionar un arreglo de IDs de categoría." });
        }

        // Construir la consulta SQL para filtrar por categorías
        const sql = 'SELECT * FROM productos WHERE categoria IN (?)';

        // Ejecutar la consulta en la base de datos
        const [results] = await pool.query(sql, [categoriasSeleccionadas]);

        // Devolver los resultados de la búsqueda como respuesta JSON
        return res.status(200).send({ status: 'SUCCESS', results });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }
};

const RestoreStock = async (req, res) => {
    try {
        const { id_producto, cantidad, id_proveedor } = req.body;
        const id_usuario = req.user[0].ID_usuario;


        // Validar que los parámetros sean números positivos
        if (isNaN(id_producto) || isNaN(cantidad) || isNaN(id_proveedor) || cantidad <= 0) {
            return res.status(400).send({ status: 'BAD_REQUEST', message: 'Parámetros de solicitud inválidos.' });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Verificar si el producto y el proveedor existen
            const [productInfo] = await connection.query('SELECT * FROM productos WHERE ID_producto = ?', [id_producto]);
            const [providerInfo] = await connection.query('SELECT * FROM proveedores WHERE ID_proveedor = ?', [id_proveedor]);

            if (productInfo.length === 0 || providerInfo.length === 0) {
                return res.status(404).send({ status: 'NOT_FOUND', message: 'Producto o proveedor no encontrado.' });
            }

            // Agregar la cantidad especificada al stock del producto
            await connection.query('UPDATE productos SET cantidad_stock = cantidad_stock + ? WHERE ID_producto = ?', [cantidad, id_producto]);

            // Registrar la transacción en el historial de reabastecimiento
            await connection.query('INSERT INTO historial_stock (ID_producto_fk, ID_usuario_fk, ID_proveedor_fk, cantidad_anterior, cantidad_actual, fecha_creacion, fecha_modificacion) VALUES (?, ?, ?, ?, ?, NOW(), NOW())', [id_producto, id_usuario, id_proveedor, productInfo[0].cantidad_stock, productInfo[0].cantidad_stock + cantidad]);

            await connection.commit();

            return res.status(200).send({ status: 'SUCCESS', message: 'Stock reabastecido exitosamente.' });
        } catch (error) {
            await connection.rollback();
            console.error(error);
            return res.status(500).send({ status: 'FAILED', message: 'Error al reabastecer el stock.' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Error interno del servidor.' });
    }
};

const countProductsByCategory = async (req, res) => {
    try {
        // Consulta SQL para contar productos por categoría y obtener los nombres de categorías
        const query = `
      SELECT c.nombre_categoria AS nombreCategoria, COUNT(p.ID_producto) AS cantidadProductos
      FROM productos p
      INNER JOIN categorias c ON p.Categorias_ID_fk = c.ID_categoria
      GROUP BY p.Categorias_ID_fk, c.nombre_categoria
    `;

        // Ejecuta la consulta SQL
        const [results] = await pool.query(query);

        // Responde con los resultados
        return res.status(200).json({ status: 'SUCCESS', data: results });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'FAILED', message: 'Error al contar productos por categoría.' });
    }
};



export const methods = {
    getProducts,
    getDetaillProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategory,
    createCategory,
    updateCategory,
    CategoryDeleted,
    searchProducts,
    RestoreStock,
    searchProductsByCategories,
    countProductsByCategory,
    searchProductsbyCategory,
    getCategoryPaginacion
};