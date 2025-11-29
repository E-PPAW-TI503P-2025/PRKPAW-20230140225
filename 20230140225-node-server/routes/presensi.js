const express = require('express');
const router = express.Router();

// --- Import Middleware ---
// Menggunakan destructuring untuk mengambil fungsi spesifik
const { addUserData } = require('../middleware/permissionMiddleware');
const { authenticateToken } = require('../middleware/auth');

// --- Import Controller ---
// Mengimpor semua fungsi yang dibutuhkan dari presensiControllers.js
// Catatan: Pastikan 'checkIn' dan 'checkOut' di-export dengan huruf kecil 'c' di file controller.
const presensiController = require('../controllers/presensiControllers');
const { checkIn, checkOut } = require('../controllers/presensiControllers');

// --- Penerapan Middleware Global ---
// Middleware untuk menambahkan data user ke request sebelum proses routing presensi
router.use(addUserData);

// --- Definisi Routes ---

// 1. Check-In (Membutuhkan autentikasi)
router.post('/check-in', authenticateToken, checkIn); 

// 2. Check-Out (Membutuhkan autentikasi)
router.post('/check-out', authenticateToken, checkOut);

// 3. Update Presensi (Asumsi ini membutuhkan ID di URL)
router.put("/:id", presensiController.updatePresensi);

// 4. Delete Presensi (Asumsi ini membutuhkan ID di URL)
router.delete("/:id", presensiController.deletePresensi);


// --- Blok yang Dihapus/Dibersihkan ---
/* Beberapa baris berikut dihapus karena DUPLIKASI atau INKONSISTENSI:
    
    // Duplikasi, sudah ada di atas:
    // router.post('/check-in', presensiController.CheckIn); 
    // router.post('/check-out', presensiController.CheckOut); 
    
    // Duplikasi, sudah ada di atas:
    // router.post("/check-in", presensiController.CheckIn);
    // router.post("/check-out", presensiController.CheckOut);
*/

module.exports = router;