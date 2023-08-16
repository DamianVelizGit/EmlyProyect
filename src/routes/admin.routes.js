import { Router } from "express";

//Importamos los controllers para nuestras rutas
import { methods as adminController } from './../controllers/admin.controller.js';

const router = Router();

//Ruta get para obtener los administradores
router.get('/administrators' )

//Ruta get para obtener un administrador por ID
router.get('/administrator/:id')

//Ruta post para crear un administrador
router.post('/new')

//Ruta get para ver perfil de un administrador
router.get('/view/profile')

//Ruta post para inicio de sesion de administrador
router.post('/login')

//Ruta patch para actualizar un administrador
router.patch('/update/:id')

//Ruta delete para borrar un administrador
router.delete('/delete/:id')


export default router