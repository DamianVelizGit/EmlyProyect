import { pool } from "../database/database.js";


let cacheProvider = null;
const cacheTimeout = 1800 * 1000; // Caché válida durante 30 minutos (en milisegundos)

// Limpia la caché  después de una hora
setInterval(() => {
    cacheProvider = null;
}, cacheTimeout); // Expira la caché 


const createProvider = async (req, res) => {
    try {
        const {
            nombre_empresa,
            contacto_persona_proveedor,
            correo_electronico_proveedor,
            direccion_proveedor,
            telefono_proveedor
        } = req.body;

        // Verifica que todos los campos requeridos estén presentes en la solicitud
        if (!nombre_empresa || !contacto_persona_proveedor || !correo_electronico_proveedor) {
            return res.status(400).send({ status: "ERROR", message: "Faltan campos obligatorios." });
        }

        const [estado] = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?", "activo");


        // Realiza la inserción en la base de datos
        const insertQuery = "INSERT INTO proveedores (nombre_empresa, contacto_persona_proveedor, correo_electronico_proveedor, direccion_proveedor, telefono_proveedor, Estado_ID_fk) VALUES (?, ?, ?, ?, ?, ?)";
        const [result] = await pool.query(insertQuery, [
            nombre_empresa,
            contacto_persona_proveedor,
            correo_electronico_proveedor,
            direccion_proveedor,
            telefono_proveedor,
            estado[0].ID_estado
        ]);

        if (result.affectedRows === 1) {
            // Si la inserción fue exitosa, responde con un código 201 (Creado)
            return res.status(201).send({ status: "SUCCESS", message: "Proveedor creado exitosamente." });
        } else {
            // Si la inserción no fue exitosa, responde con un código 500 (Internal Server Error)
            return res.status(500).send({ status: "FAILED", message: "No se pudo crear el proveedor." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al crear el proveedor." });
    }
};


const viewProviders = async (req, res) => {
    try {

        // Si los proveedores están en caché y no ha expirado, devuelve la caché
        if (cacheProvider !== null && Date.now() - cacheProvider.timestamp < cacheTimeout) {
            console.log('Obteniendo proveedores desde la caché...');
            return res.status(200).send(cacheProvider.data);
        }
        // Realiza una consulta para obtener los proveedores activos
        const query = "SELECT * FROM proveedores WHERE Estado_ID_fk = ?";
        const [rows] = await pool.query(query, [1]);

        // Almacena los proveedores en la caché junto con la marca de tiempo
        cacheProvider = {
            data: rows,
            timestamp: Date.now(),
        };


        // Responde con la lista de proveedores
        res.status(200).send(cacheProvider.data);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al obtener los proveedores." });
    }
};


const getProviderPaginacion = async (req, res) => {
    try {
        const { page = 1, productsPerPage = 15 } = req.query;

        const parsedPage = parseInt(page, 10);
        const parsedProductsPerPage = parseInt(productsPerPage, 10);

        const startIndex = (parsedPage - 1) * parsedProductsPerPage;

        let query = "SELECT * FROM proveedores";

        query += ` LIMIT ${parsedProductsPerPage} OFFSET ${startIndex}`;

        const [rows] = await pool.query(query);

        const countQuery = "SELECT COUNT(*) as total FROM proveedores WHERE Estado_ID_fk = 1";
        const [countResult] = await pool.query(countQuery);
        const totalProviders = countResult[0].total;

        const totalPages = Math.ceil(totalProviders / parsedProductsPerPage);

        res.status(200).send({
            categories: rows,
            pagination: {
                totalProviders,
                totalPages,
                currentPage: parsedPage,
                productsPerPage: parsedProductsPerPage
            } 
        });

    } catch (error) {
        return res.status(500).send({ status: "FAILED", message: "Algo salió mal al ver los proveedores" });
    }
};


const DeleteProvider = async (req, res) => {
    try {
        const { id } = req.params; // Supongo que el ID del proveedor se pasa como parámetro en la URL

        // Verifica que el ID del proveedor sea un número válido
        if (!Number.isInteger(+id)) {
            return res.status(400).send({ status: 'ERROR', message: 'ID del proveedor no válido.' });
        }

        //consulta para verificar si el proveedor existe y está activo
        const checkQuery = 'SELECT * FROM proveedores WHERE ID_Proveedor = ? AND Estado_ID_fk = ?';
        const [existingProvider] = await pool.query(checkQuery, [id, 1]); // 1 representa el estado activo

        if (!existingProvider.length) {
            return res.status(404).send({ status: 'ERROR', message: 'Proveedor no encontrado o ya está eliminado.' });
        }

                // Actualiza el estado del administrador a "inactivo"
        const [estado] = await pool.query(
            "SELECT * FROM estado WHERE Nom_estado = ?",
            ["inactivo"]
        );

        // Realiza la actualización para borrar el proveedor
        const updateQuery = 'UPDATE proveedores SET Estado_ID_fk = ? WHERE ID_Proveedor = ?';
        await pool.query(updateQuery, [estado[0].ID_estado, id]); 

        return res.status(200).send({ status: 'SUCCESS', message: 'Proveedor eliminado exitosamente.' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'FAILED', message: 'Algo salió mal al eliminar el proveedor.' });
    }
};

const UpdateProvider = async (req, res) => {
  try {
    const ProviderId = req.params.id; // Obtén el ID  de los parámetros de la URL
    const updatedFields = req.body; // Obtén los campos actualizados del cuerpo de la solicitud

    // Verifica que el ID  sea un número entero válido
    if (!Number.isInteger(+ProviderId)) {
      return res.status(400).send({ status: "ERROR", message: "ID del proveedor no es válido." });
    }

    // Realiza la actualización en la base de datos
    const updateQuery = "UPDATE proveedores SET ? WHERE ID_Proveedor = ?";
    const [result] = await pool.query(updateQuery, [updatedFields, ProviderId]);

    if (result.affectedRows === 1) {
      // Si la actualización fue exitosa, responde con un código 200 (OK)
      return res.status(200).send({ status: "SUCCESS", message: "Proveedor actualizado exitosamente." });
    } else {
      // Si la actualización no fue exitosa , responde con un código 404 (Not Found)
      return res.status(404).send({ status: "ERROR", message: "Proveedor no encontrado." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: "FAILED", message: "Algo salió mal al actualizar el proveedor." });
  }
};



export const methods = {
    createProvider,
    viewProviders,
    UpdateProvider,
    DeleteProvider,
    getProviderPaginacion
};