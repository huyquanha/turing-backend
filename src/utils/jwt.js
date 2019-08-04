require('dotenv').config();
const fs = require('fs');
const jwt = require('jsonwebtoken');

const privateKey = process.env.JWT_KEY.replace(/\\n/g, '\n');
const publicKey = fs.readFileSync(`${__dirname}/keys/public.key`, 'utf-8');

exports.sign = (payload, duration, callback) => {
  const signOptions = {
    algorithm: 'RS256',
    expiresIn: duration || '24h',
  };
  jwt.sign(payload, privateKey, signOptions, (err, token) => callback(err, token));
};

exports.verify = (token, callback) => {
  jwt.verify(token, publicKey, (err, decoded) => callback(err, decoded));
};
