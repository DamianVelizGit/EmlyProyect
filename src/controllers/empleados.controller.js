import { pool } from "../database/database.js";

//Controlador para obtener los empleados
const getEmpleados = async (req, res) => {
    try {
        //Creamos la consulta para traer los empleados
        const [rows] = await pool.query("SELECT * FROM empleados");
        //Respondemos en formato json lo que encontramos en la BD
        res.json(rows);
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ message: "Algo salio mal al ver los empleados" });
    }
};

//Controlador para obtener un empleado
const getEmpleado = async (req, res) => {
    try {
        //Creamos la consulta para traer un empleado
        const [rows] = await pool.query("SELECT * FROM empleados WHERE id = ?", [
            req.params.id,
        ]);

        //Validamos si el empleado existe en la BD
        if (rows.length <= 0) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        }
        res.json(rows[0]);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Algo salio mal al buscar tu empleado" });
    }
};

//Controlador para crear los empleados
const createEmpleados = async (req, res) => {
    try {
        const { name, salary } = req.body;

        //Creamos la consulta para insertar el empleado en la BD
        const [rows] = await pool.query(
            "INSERT INTO empleados (name,salary) values(?,?)",
            [name, salary]
        );
        //Enviamos la respuesta en el formato JSON
        res.send({
            id: rows.insertId,
            name,
            salary,
        });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Algo salio mal al crear un empleado" });
    }
};

//Controlador para eliminar los empleados
const deleteEmpleados = async (req, res) => {
    try {
        //Creamos la consulta para eliminar un empleado en especifico
        const [result] = await pool.query("DELETE FROM empleados WHERE id = ?", [
            req.params.id,
        ]);

        //Validamos si el empleado existe en la BD
        if (result.affectedRows <= 0) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        }
        //No respondemos nada pero hacemos saber que si se realizo la operacion
        res.sendStatus(204);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Algo salio mal al eliminar el empleado" });
    }
};

//Controlador para actualizar los empleados
const updateEmpleados = async (req, res) => {
    try {
        //Obtenemos los datos del empleado
        const { id } = req.params;
        const { name, salary } = req.body;

        //Creamos la consulta para actualizar los datos de empleado
        const [result] = await pool.query(
            "UPDATE empleados SET name = IFNULL(?,name), salary = IFNULL(?,salary) WHERE id = ?",
            [name, salary, id]
        );

        //Se valida si el id existe en la bd
        if (result.affectedRows == 0) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        }
        //Respondemos con los datos actualizados del empleado
        const [rows] = await pool.query("SELECT * FROM empleados WHERE id = ?", [
            id,
        ]);

        res.json(rows[0]);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Algo salio mal al actualizar la informacion" });
    }
};


export const methods = {
    getEmpleados,
    getEmpleado,
    createEmpleados,
    deleteEmpleados,
    updateEmpleados
};