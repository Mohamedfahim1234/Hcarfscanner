// Express API entrypoint for HCARF
const express = require('express');
const auth = require('./auth');
const router = express.Router();

router.use('/auth', auth);

// Add more API routes here as needed

module.exports = router;
