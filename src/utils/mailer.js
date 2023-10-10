import { EMAIL, PASS_EMAIL } from './../config.js'
const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: EMAIL,
        pass: PASS_EMAIL
    }
})

module.exports = transporter