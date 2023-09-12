const multer = require('multer');


const getProfileImageBlob = (req) => {
  try {
    const image = req.file.buffer; // El archivo de imagen en formato BLOB
    return image; // Devolver el BLOB de la imagen
  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    throw new Error('Error al procesar la imagen');
  }
};

module.exports = {
  getProfileImageBlob
};
