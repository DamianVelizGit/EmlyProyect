import { Router } from "express";

//Importamos los controllers para nuestras rutas
import { methods as empleadosController } from './../controllers/empleados.controller.js';

const router = Router();

//Ruta get para obtener los empleados
router.get('/empleados', empleadosController.getEmpleados )

//Ruta get para obtener los empleados por ID
router.get('/empleados/:id', empleadosController.getEmpleado )

//Ruta post para crear un empleado
router.post('/empleados', empleadosController.createEmpleados)

//Ruta patch para actualizar un empleado
router.patch('/empleados/:id', empleadosController.updateEmpleados)

//Ruta delete para borrar un empleado
router.delete('/empleados/:id', empleadosController.deleteEmpleados)


export default router