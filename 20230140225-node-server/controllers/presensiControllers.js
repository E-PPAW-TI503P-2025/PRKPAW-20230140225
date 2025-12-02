// controllers/presensiControllers.js

const { Presensi } = require("../models");
const { format } = require("date-fns-tz");

// Tentukan TimeZone secara konstan
const timeZone = "Asia/Jakarta";

// --- FUNGSI CHECK-IN (Dengan Lokasi) ---
exports.checkIn = async (req, res) => {
    try {
        // Ambil userId dan nama dari JWT payload (req.user)
        const { id: userId, nama: userName } = req.user;
        
        // Ambil data lokasi dari body request (dari frontend)
        const { latitude, longitude } = req.body;
        const waktuSekarang = new Date();

        // Validasi Lokasi
        if (!latitude || !longitude) {
            return res
                .status(400)
                .json({ message: "Latitude dan Longitude wajib diisi untuk Check-In." });
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
            // Simpan lokasi check-in
            latitude: latitude, 
            longitude: longitude,
        });
        
        const formattedData = {
            userId: newRecord.userId,
            nama: newRecord.nama,
            checkIn: format(newRecord.checkIn, "yyyy-MM-dd HH:mm:ssXXX", { timeZone }),
            checkOut: null,
            latitude: newRecord.latitude, 
            longitude: newRecord.longitude,
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
        // Ambil userId dan userName dari JWT payload (req.user)
        const { id: userId, nama: userName } = req.user;
        
        // Ambil data lokasi check-out dari body request
        const { latitude, longitude } = req.body;
        const waktuSekarang = new Date();

        // Validasi Lokasi
        if (!latitude || !longitude) {
            return res
                .status(400)
                .json({ message: "Latitude dan Longitude wajib diisi untuk Check-Out." });
        }

        // Cari catatan check-in yang aktif (checkOut: null)
        const recordToUpdate = await Presensi.findOne({
            where: { userId: userId, checkOut: null },
        });

        if (!recordToUpdate) {
            return res.status(404).json({
                message: "Tidak ditemukan catatan check-in yang aktif untuk Anda.",
            });
        }

        // Update record
        recordToUpdate.checkOut = waktuSekarang;
        // Simpan lokasi check-out
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
        // ID User yang terautentikasi (JWT Payload)
        const { id: userId } = req.user; 
        const presensiId = req.params.id;
        const recordToDelete = await Presensi.findByPk(presensiId);

        if (!recordToDelete) {
            return res
                .status(404)
                .json({ message: "Catatan presensi tidak ditemukan." });
        }
        
        // Authorization Check: Hanya pemilik yang boleh menghapus
        if (recordToDelete.userId !== userId) {
            return res
                .status(403)
                .json({ message: "Akses ditolak: Anda bukan pemilik catatan ini." });
        }
        
        await recordToDelete.destroy();
        
        res.status(204).send(); // Status 204: Berhasil, Tidak ada konten untuk dikirim
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
        // Ambil ID dan role user yang meminta update untuk otorisasi
        const { id: requesterId, role: requesterRole } = req.user; 
        const presensiId = req.params.id;
        // Hanya izinkan update field yang relevan
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

        // Otorisasi: Hanya pemilik catatan ATAU Admin yang boleh mengupdate
        if (recordToUpdate.userId !== requesterId && requesterRole !== 'admin') {
             return res
                .status(403)
                .json({ message: "Akses ditolak: Anda tidak memiliki hak untuk mengubah catatan ini." });
        }

        // Update field yang disediakan
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