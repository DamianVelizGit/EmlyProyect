import { Router } from "express";
import authentification from '../Middlewares/authentication.js'
import rolValidator from '../Middlewares/rolValidation.js';


import { methods as shoppingCartController } from './../controllers/shoppingCart.controller.js';


const router = Router();

router.post('/agregar-al-carrito',authentification, shoppingCartController.addtoCart)

router.get('/view-cart',authentification, shoppingCartController.ViewToCart)

router.get('/countProduct-cart',authentification, shoppingCartController.countProductsInCart)

router.patch('/update',authentification, shoppingCartController.updateCartItem)

router.delete('/delete/:id_producto',authentification, shoppingCartController.DeleteCartItem)

router.get('/cart-total',authentification, shoppingCartController.getTotalCart);


export default router
