import { SECRET } from './../config.js'
import jsonToken from 'jsonwebtoken'


const JwtToken = (id, rol) => {
    const token = jsonToken.sign({ id: id.toString(), rol }, SECRET,{ expiresIn: '3h' } )
    return token
}

module.exports = JwtToken