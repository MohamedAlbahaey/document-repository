const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/api/users', usersRoutes);

module.exports = app;