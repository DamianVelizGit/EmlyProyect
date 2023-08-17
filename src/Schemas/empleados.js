const Joi = require('joi');
const customError = require('../utils/customError');

module.exports = {
    empleadosSchema: Joi.object({
        name: Joi.string()
            .min(3)
            .max(30)
            .required()
            .error((error) => {
                return customError("El nombre debe de ser un string", error)
            }),

        salary: Joi.number()
            .min(3)
            .required()
            .error((error) => {
                return customError("El salario debe de ser numerico", error)
            }),
    })
}