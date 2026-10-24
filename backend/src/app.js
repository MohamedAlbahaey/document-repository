const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');
const usersRoutes = require('./routes/users.routes');
const documentsRoutes = require('./routes/documents.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/documents', documentsRoutes);

// These two must come last
app.use(notFound);
app.use(errorHandler);

module.exports = app;