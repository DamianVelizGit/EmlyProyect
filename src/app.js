import express from "express"
import morgan from "morgan";

const app = express();

//Importacion del los archivos de rutas 
import empleadosRoutes from "./routes/empleados.routes";
import administradorRoutes from "./routes/admin.routes";
import logoutRoutes from "./routes/logout.routes";
import productoctRoutes from "./routes/productos.routes";
import userRoutes from "./routes/user.routes";

//Configuraciones
app.set('port', 3000)


//Middlewares
//Usamos morgan para ver las salidas http en consola
app.use(morgan('dev'));
//Se convertiran los datos en formato JSON 
app.use(express.json());


//Rutas
app.use('/v1',empleadosRoutes)
app.use('/v1/administrators', administradorRoutes); 
app.use('/v1/user', userRoutes); 
app.use('/v1/logout', logoutRoutes); 
app.use('/v1/product', productoctRoutes); 


app.use((req, res, next) =>{
    res.status(404).json({message: 'Not found endopoint'});
})

export default app;