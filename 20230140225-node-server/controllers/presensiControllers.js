// controllers/presensiControllers.js

const { Presensi } = require("../models");
const { format } = require("date-fns-tz");
const multer = require('multer'); // Import Multer
const path = require('path');     // Import Path

// Tentukan TimeZone secara konstan
const timeZone = "Asia/Jakarta";

// =======================================================
// === 1. KONFIGURASI MULTER UNTUK UPLOAD FOTO PRESENSI ===
// =======================================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Pastikan folder 'uploads/' ada di root server Anda
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Format nama file: userId-timestamp.ext
        // Pastikan req.user.id tersedia (dari middleware JWT)
        if (!req.user || !req.user.id) {
            return cb(new Error('User ID tidak ditemukan untuk penamaan file!'), null);
        }
        const ext = path.extname(file.originalname);
        cb(null, `${req.user.id}-${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Hanya perbolehkan file yang dimulai dengan 'image/'
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
    }
};

// Ekspor middleware Multer untuk digunakan di route
exports.upload = multer({ storage: storage, fileFilter: fileFilter });

// =======================================================
// === 2. FUNGSI CONTROLLER (DENGAN INTEGRASI FOTO) ===
// =======================================================

// --- FUNGSI CHECK-IN (Dengan Lokasi dan Bukti Foto) ---
exports.checkIn = async (req, res) => {
    try {
        // Ambil userId dan nama dari JWT payload (req.user)
        const { id: userId, nama: userName } = req.user;
        
        // Ambil data lokasi dari body request
        const { latitude, longitude } = req.body;
        const waktuSekarang = new Date();
        
        // Dapatkan path file dari Multer (req.file)
        // Kolom buktiFoto diasumsikan ada di model Presensi
        const buktiFoto = req.file ? req.file.path : null; 

        // Validasi Lokasi dan Foto
        if (!latitude || !longitude || !buktiFoto) {
            // Jika foto wajib, berikan pesan error
            return res
                .status(400)
                .json({ message: "Latitude, Longitude, dan Bukti Foto wajib diisi untuk Check-In." });
        }

        // Cek apakah ada catatan check-in aktif hari ini (checkOut: null)
        const existingRecord = await Presensi.findOne({
            where: { userId: userId, checkOut: null },
        });

        if (existingRecord) {
            return res
                .status(400)
                .json({ message: "Anda sudah melakukan check-in hari ini." });
        }

        // Buat data Presensi baru
        const newRecord = await Presensi.create({
            userId: userId,
            nama: userName,
            checkIn: waktuSekarang,
            latitude: latitude, 
            longitude: longitude,
            buktiFoto: buktiFoto, // Simpan path foto
        });
        
        const formattedData = {
            userId: newRecord.userId,
            nama: newRecord.nama,
            checkIn: format(newRecord.checkIn, "yyyy-MM-dd HH:mm:ssXXX", { timeZone }),
            checkOut: null,
            latitude: newRecord.latitude, 
            longitude: newRecord.longitude,
            buktiFoto: newRecord.buktiFoto 
        };

        res.status(201).json({
            message: `Halo ${userName}, check-in Anda berhasil pada pukul ${format(
                waktuSekarang,
                "HH:mm:ss",
                { timeZone }
            )} WIB. Lokasi: (${latitude}, ${longitude})`,
            data: formattedData,
        });
    } catch (error) {
        console.error("Error CheckIn:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// --- FUNGSI CHECK-OUT (Dengan Lokasi) ---
exports.checkOut = async (req, res) => {
    try {
        const { id: userId, nama: userName } = req.user;
        const { latitude, longitude } = req.body;
        const waktuSekarang = new Date();

        if (!latitude || !longitude) {
            return res
                .status(400)
                .json({ message: "Latitude dan Longitude wajib diisi untuk Check-Out." });
        }

        const recordToUpdate = await Presensi.findOne({
            where: { userId: userId, checkOut: null },
        });

        if (!recordToUpdate) {
            return res.status(404).json({
                message: "Tidak ditemukan catatan check-in yang aktif untuk Anda.",
            });
        }

        recordToUpdate.checkOut = waktuSekarang;
        recordToUpdate.latitudeOut = latitude;
        recordToUpdate.longitudeOut = longitude;

        await recordToUpdate.save();

        const formattedData = {
            userId: recordToUpdate.userId,
            nama: recordToUpdate.nama,
            checkIn: format(recordToUpdate.checkIn, "yyyy-MM-dd HH:mm:ssXXX", { timeZone }),
            checkOut: format(recordToUpdate.checkOut, "yyyy-MM-dd HH:mm:ssXXX", { timeZone }),
            latitude: recordToUpdate.latitude,
            longitude: recordToUpdate.longitude,
            latitudeOut: recordToUpdate.latitudeOut,
            longitudeOut: recordToUpdate.longitudeOut,
        };

        res.json({
            message: `Selamat jalan ${userName}, check-out Anda berhasil pada pukul ${format(
                waktuSekarang,
                "HH:mm:ss",
                { timeZone }
            )} WIB. Lokasi: (${latitude}, ${longitude})`,
            data: formattedData,
        });
    } catch (error) {
        console.error("Error CheckOut:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// --- FUNGSI DELETE PRESENSI ---
exports.deletePresensi = async (req, res) => {
    try {
        const { id: userId } = req.user; 
        const presensiId = req.params.id;
        const recordToDelete = await Presensi.findByPk(presensiId);

        if (!recordToDelete) {
            return res
                .status(404)
                .json({ message: "Catatan presensi tidak ditemukan." });
        }
        
        if (recordToDelete.userId !== userId) {
            return res
                .status(403)
                .json({ message: "Akses ditolak: Anda bukan pemilik catatan ini." });
        }
        
        await recordToDelete.destroy();
        
        res.status(204).send();
    } catch (error) {
        console.error("Error deletePresensi:", error);
        res
            .status(500)
            .json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// --- FUNGSI UPDATE PRESENSI (Dengan Otorisasi) ---
exports.updatePresensi = async (req, res) => {
    try {
        const { id: requesterId, role: requesterRole } = req.user; 
        const presensiId = req.params.id;
        const { checkIn, checkOut, nama, latitude, longitude, latitudeOut, longitudeOut } = req.body; 

        if (checkIn === undefined && checkOut === undefined && nama === undefined && latitude === undefined) {
            return res.status(400).json({
                message: "Request body tidak berisi data yang valid untuk diupdate.",
            });
        }
        
        const recordToUpdate = await Presensi.findByPk(presensiId);
        
        if (!recordToUpdate) {
            return res
                .status(404)
                .json({ message: "Catatan presensi tidak ditemukan." });
        }

        if (recordToUpdate.userId !== requesterId && requesterRole !== 'admin') {
             return res
                .status(403)
                .json({ message: "Akses ditolak: Anda tidak memiliki hak untuk mengubah catatan ini." });
        }

        if (checkIn !== undefined) recordToUpdate.checkIn = checkIn;
        if (checkOut !== undefined) recordToUpdate.checkOut = checkOut;
        if (nama !== undefined) recordToUpdate.nama = nama;
        if (latitude !== undefined) recordToUpdate.latitude = latitude;
        if (longitude !== undefined) recordToUpdate.longitude = longitude;
        if (latitudeOut !== undefined) recordToUpdate.latitudeOut = latitudeOut;
        if (longitudeOut !== undefined) recordToUpdate.longitudeOut = longitudeOut;

        await recordToUpdate.save();

        res.json({
            message: "Data presensi berhasil diperbarui.",
            data: recordToUpdate,
        });
    } catch (error) {
        console.error("Error updatePresensi:", error);
        res
            .status(500)
            .json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};