var mongoose = require('mongoose');

mongoose.connect(process.env.MONGOHQ_URL || 'mongodb://test_user:test_pass@localhost:27017/test_db');
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

module.exports = mongoose.connection;
