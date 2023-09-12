import { pool } from "../database/database.js";


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



export const methods = {
    createProvider
};