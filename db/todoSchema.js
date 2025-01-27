const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    id: {
        type: Number
    },
    todo: {
        type: String,
        require: true
    }
}, { timestamp: true });

const userTodoSchema = mongoose.model('todos',todoSchema);

exports = { userTodoSchema}