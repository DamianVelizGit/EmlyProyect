import { pool } from "../database/database.js";


//Controlador para obtener los empleados
const getProducts = async (req, res) => {
    try {
        //Creamos la consulta para traer los productos
        const [rows] = await pool.query("SELECT * FROM productos");
        //Respondemos en formato json lo que encontramos en la BD
        res.json(rows);
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .send({ status: "FAILED", message: "Algo salio mal al ver los Productos" });
    }
};
//Controlador para obtener las categorias
const getCategory = async (req, res) => {
    try {
        //Creamos la consulta para traer los productos
        const [rows] = await pool.query("SELECT * FROM categorias");
        //Respondemos en formato json lo que encontramos en la BD
        
        res.json(rows);
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .send({ status: "FAILED", message: "Algo salio mal al ver las categorias" });
    }
};




export const methods = {
    getProducts,
    getCategory
};