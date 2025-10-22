const express = require('express');
const router = express.Router();
const presensiController = require('../controllers/presensiControllers');
const { addUserData } = require('../middleware/permissionMiddleware');
router.use(addUserData);
router.post('/check-in', presensiController.CheckIn);
router.post('/check-out', presensiController.CheckOut);
module.exports = router;
