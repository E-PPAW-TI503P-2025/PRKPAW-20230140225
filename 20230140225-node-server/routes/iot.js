const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iotController');

router.post('/ping', iotController.testConnection);
module.exports = router;
