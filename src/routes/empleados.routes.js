import { Router } from "express";

//Importamos los controllers para nuestras rutas
import { methods as empleadosController } from './../controllers/empleados.controller.js';

//Importamos el middleware para crear empleado
import validation from '../Middlewares/joiValidation.js';

//Importamos nuestro archivo de esquemas
import { empleadosSchema } from '../Schemas/empleados.js'

import  authentification from '../Middlewares/authentication.js'




const router = Router();

//Ruta get para obtener los empleados
router.get('/empleados', authentification ,empleadosController.getEmpleados )

//Ruta get para obtener los empleados por ID
router.get('/empleados/:id', empleadosController.getEmpleado )

//Ruta post para crear un empleado
router.post('/empleados', validation(empleadosSchema) ,empleadosController.createEmpleados)

//Ruta patch para actualizar un empleado
router.patch('/empleados/:id', authentification, empleadosController.updateEmpleados)

//Ruta delete para borrar un empleado
router.delete('/empleados/:id', empleadosController.deleteEmpleados)


export default router