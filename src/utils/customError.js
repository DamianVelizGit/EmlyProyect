//Definimos una función para errores personalizados
const customError = (mensaje, detalle) => {
    //Definimos una instancia de error
    const error = new Error(mensaje)

    //Asignamos el detalle del error obtenido
    error.detalle = detalle

    //Retornamos el error
    return error
}

//Exportamos la función
module.exports = customError
