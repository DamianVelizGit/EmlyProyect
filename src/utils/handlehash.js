const bcrypt = require('bcrypt')

//Funcion para encriptar texto plano
const encrypt = async (textPlain) => {
    const hash = await bcrypt.hash(textPlain, 8)
    return hash
}

//Funcion para comparar 

const compare = async (passPlain, hashPass) => {

    const result = await bcrypt.compare(passPlain, hashPass)
    console.log(result);
    return result
}

module.exports = {encrypt, compare}