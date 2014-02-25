var mongoose = require('mongoose');

mongoose.connect(process.env.MONGOHQ_URL);
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

module.exports = mongoose.connection;
