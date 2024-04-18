import 'dotenv/config'; // Load dotenv config

export const environment = {
    production: false,
    hostname: process.env['HOSTNAME'],
};