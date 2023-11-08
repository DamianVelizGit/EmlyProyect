import { Router } from "express";
import authentification from '../Middlewares/authentication.js'
import rolValidator from '../Middlewares/rolValidation.js';

//Importamos los controllers para nuestras rutas
import { methods as purchaseController } from './../controllers/purchaseOrder.controller.js';


const router = Router();


router.post('/create-order', authentification, purchaseController.CreateOrder)
router.get('/view-orders', authentification, purchaseController.ViewOrders)
router.get('/view-all-orders', authentification, purchaseController.GetAllOrders)
router.get('/view-order/:ordenIdentificador', authentification, purchaseController.ViewOrderByIdentificador)
router.patch('/cancel-orders', authentification, purchaseController.CancelOrder)




export default router