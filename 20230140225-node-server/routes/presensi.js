const express = require('express');
const router = express.Router();
const presensiController = require('../controllers/presensiControllers');
const { addUserData } = require('../middleware/permissionMiddleware');
router.use(addUserData);
router.post('/check-in', presensiController.CheckIn);
router.post('/check-out', presensiController.CheckOut);
router.post("/check-in", presensiController.CheckIn);
router.post("/check-out", presensiController.CheckOut);

router.delete("/:id", presensiController.deletePresensi);
router.post("/check-in", presensiController.CheckIn);
router.post("/check-out", presensiController.CheckOut);

router.put("/:id", presensiController.updatePresensi);


module.exports = router;


