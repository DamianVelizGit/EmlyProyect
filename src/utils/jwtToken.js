import {SECRET} from './../config.js'
import jsonToken from 'jsonwebtoken'


const JwtToken = (id, rol) => {
    console.log('si entre perro');
    const token = jsonToken.sign({id: id.toString(),rol}, SECRET)
    console.log("si sali perro");
    return token
}

module.exports = JwtToken