const bcrypt = require('bcrypt')

//Funcion para encriptar texto plano
const encrypt = async (textPlain) => {
    const hash = await bcrypt.hash(textPlain, 8)
    return hash
}

//Funcion para comparar 

const compare = async (passPlain, hashPass) => {
    return await bcrypt.compare(passPlain, hashPass)
}

module.exports = {encrypt, compare}