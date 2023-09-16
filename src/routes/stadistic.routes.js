import { Router } from "express";
import authentification from '../Middlewares/authentication.js'
import rolValidator from '../Middlewares/rolValidation.js';

//Importamos los controllers para nuestras rutas
import { methods as stadisticController } from './../controllers/stadistic.controller.js';


const router = Router();


router.get('/top-sales', authentification,rolValidator("administrator"), stadisticController.TopSales)
router.get('/stock', authentification,rolValidator("administrator"), stadisticController.Stock)




export default router