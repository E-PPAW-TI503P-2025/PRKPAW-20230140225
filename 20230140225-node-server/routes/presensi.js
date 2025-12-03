const express = require('express');
const router = express.Router();

// --- Import Middleware ---
const { addUserData } = require('../middleware/permissionMiddleware');
const { authenticateToken } = require('../middleware/auth');

// --- Import Controller ---
const presensiController = require('../controllers/presensiControllers');

// Destructuring fungsi controller yang diekspor (termasuk Multer uploader)
const { checkIn, checkOut, updatePresensi, deletePresensi, upload } = presensiController;

// --- Penerapan Middleware Global ---
// Middleware untuk menambahkan data user ke request sebelum proses routing presensi
router.use(addUserData);

// --- Definisi Routes ---

// 1. Check-In (Membutuhkan autentikasi & file upload Multer)
// Multer harus dijalankan SEBELUM controller checkIn. 
// 'buktiFoto' adalah nama field di form data/body request.
router.post('/check-in', authenticateToken, upload.single('buktiFoto'), checkIn); 


// 2. Check-Out (Membutuhkan autentikasi)
router.post('/check-out', authenticateToken, checkOut);

// 3. Update Presensi (Membutuhkan autentikasi & ID di URL)
router.put("/:id", authenticateToken, updatePresensi);

// 4. Delete Presensi (Membutuhkan autentikasi & ID di URL)
router.delete("/:id", authenticateToken, deletePresensi);


module.exports = router;