import { Router } from "express";
import authentification from '../Middlewares/authentication.js'
import validation from '../Middlewares/joiValidation.js';
import upload from '../Middlewares/upload.js'


//Importamos los controllers para nuestras rutas
import { methods as userController } from './../controllers/user.controller.js';

import { methods as loginController } from './../controllers/login.controller.js';

import { methods as logoutController } from './../controllers/logout.controller.js';

const router = Router();

//Ruta get para ver perfil de un usuario
router.get('/view/profile', authentification, userController.viewProfile)


router.get('/view/orders', authentification, userController.ListUserOrders)

//Ruta post para crear un usuario
router.post('/new', userController.createUser)

//Ruta post para inicio de sesion de usuario
router.post('/login', loginController.loginUser)

router.post('/forgotPass', loginController.forgotPass)

router.post('/resetPass', loginController.resetPass)

router.post('/verify-code', loginController.verifyRecoveryCode)

//Ruta patch para actualizar un usuario
router.patch('/update', authentification, userController.updateUser)

router.post('/mail', loginController.forgotPass)

router.post('/upload', upload.single("Perfil_Imagen"), (err, req, res, next) => {
    res.status(400).send({ error: err.message })
})



export default router