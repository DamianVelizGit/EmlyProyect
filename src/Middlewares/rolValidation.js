const rolValidator = (nombreRol) => (req,res,next) => {
    try {
        if (nombreRol !== req.rol){
            return res.status(403).send("No tienes los permisos necesarios para realizar esta accion")
        }
        next()
    } catch (error) {
        
    }
}

module.exports = rolValidator