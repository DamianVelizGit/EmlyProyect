import { Router } from "express";

//Importamos los controllers para nuestras rutas
import { methods as userController } from './../controllers/user.controller.js';

const router = Router();

//Ruta get para obtener los usuarios
router.get('/list/users' )

//Ruta get para obtener un usuario por ID
router.get('/list/user/:id')

//Ruta get para ver perfil de un usuario
router.get('/view/profile')

//Ruta post para crear un usuario
router.post('/new')

//Ruta post para inicio de sesion de usuario
router.post('/login')

//Ruta patch para actualizar un usuario
router.patch('/update/:id')

//Ruta delete para borrar un usuario
router.delete('/delete/:id')


export default router