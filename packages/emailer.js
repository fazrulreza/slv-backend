const nodemailer = require('nodemailer');

const emailer = nodemailer.createTransport({
  host: process.env.EMAIL,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = emailer;
