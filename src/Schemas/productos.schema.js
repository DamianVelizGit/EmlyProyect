import Joi from 'joi';
import { customError } from '../utils/customError';


module.exports = {
    productSchema: Joi.object({

        nombre_producto: Joi.string()
            .required()
            .trim()
            .error((error) => {
                return customError("El nombre del producto es obligatorio.", error)
            }),

        descripcion_producto: Joi.string()
            .required()
            .trim()
            .error((error) => {
                return customError("La descripción del producto es obligatoria.", error)
            }),

        precio_unitario_producto: Joi.number()
            .required()
            .integer()
            .error((error) => {
                return customError("El precio unitario debe ser un dato numerico.", error)
            }),

        cantidad_stock: Joi.number()
            .required()
            .integer()
            .error((error) => {
                return customError("La cantidad de stock debe ser un dato numerico.", error)
            }),

        marca_producto: Joi.string()
            .required()
            .trim()
            .error((error) => {
                return customError("La marca del producto es obligatoria.", error)
            }),
        categoria_producto: Joi.string()
            .required()
            .trim()
            .error((error) => {
                return customError("La categoria del producto es obligatoria.", error)
            }),

        imagen_producto: Joi.string()
            .required()
            .trim()
            .error((error) => {
                return customError("La imagen del producto es obligatoria.", error)
            })
    })
}