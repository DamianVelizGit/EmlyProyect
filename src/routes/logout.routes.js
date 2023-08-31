import { Router } from "express";
import authentification from '../Middlewares/authentication.js'

//Importamos los controllers para nuestras rutas
import { methods as logoutController } from './../controllers/logout.controller.js';

const router = Router();

//Ruta post con el middleware de autenticación para cerrar sesión del usuario
router.post('/user/logout',authentification, logoutController.logout)

//Ruta post con el middleware de autenticación para cerrar todas las sesiones del usuario
router.post('/user/logoutAll')

//Ruta post con el middleware de autenticación para cerrar sesión del administrador
router.post('/administrator/logout')

//Ruta post con el middleware de autenticación para cerrar todas las sesiones del administrador
router.post('/administrator/logoutAll')



export default router