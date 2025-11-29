// Di controllers/presensiControllers.js

const { Presensi } = require("../models");
const { format } = require("date-fns-tz");
const timeZone = "Asia/Jakarta";

// 1. UBAH DARI 'exports.CheckIn' MENJADI 'exports.checkIn'
exports.checkIn = async (req, res) => { 
    try {
        const { id: userId, nama: userName } = req.user;
        const waktuSekarang = new Date();

        const existingRecord = await Presensi.findOne({
            where: { userId: userId, checkOut: null },
        });

        if (existingRecord) {
            return res
                .status(400)
                .json({ message: "Anda sudah melakukan check-in hari ini." });
        }

        const newRecord = await Presensi.create({
            userId: userId,
            nama: userName,
            checkIn: waktuSekarang,
        });
        
        const formattedData = {
            userId: newRecord.userId,
            nama: newRecord.nama,
            checkIn: format(newRecord.checkIn, "yyyy-MM-dd HH:mm:ssXXX", { timeZone }),
            checkOut: null
        };

        res.status(201).json({
            message: `Halo ${userName}, check-in Anda berhasil pada pukul ${format(
                waktuSekarang,
                "HH:mm:ss",
                { timeZone }
            )} WIB`,
            data: formattedData,
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// 2. UBAH DARI 'exports.CheckOut' MENJADI 'exports.checkOut'
exports.checkOut = async (req, res) => {
    try {
        const { id: userId, nama: userName } = req.user;
        const waktuSekarang = new Date();

        const recordToUpdate = await Presensi.findOne({
            where: { userId: userId, checkOut: null },
        });

        if (!recordToUpdate) {
            return res.status(404).json({
                message: "Tidak ditemukan catatan check-in yang aktif untuk Anda.",
            });
        }

        recordToUpdate.checkOut = waktuSekarang;
        await recordToUpdate.save();

        const formattedData = {
            userId: recordToUpdate.userId,
            nama: recordToUpdate.nama,
            checkIn: format(recordToUpdate.checkIn, "yyyy-MM-dd HH:mm:ssXXX", { timeZone }),
            checkOut: format(recordToUpdate.checkOut, "yyyy-MM-dd HH:mm:ssXXX", { timeZone }),
        };

        res.json({
            message: `Selamat jalan ${userName}, check-out Anda berhasil pada pukul ${format(
                waktuSekarang,
                "HH:mm:ss",
                { timeZone }
            )} WIB`,
            data: formattedData,
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

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
        
        // 3. KESALAHAN LOGIKA: Hanya boleh ada SATU res.send/res.json/res.status per request. 
        // Baris res.json di bawah dihapus karena sudah ada res.status(204).send() di atasnya.
        // res.json({ message: "Data presensi berhasil diperbarui.", data: recordToDelete, }); 
        
        res.status(204).send(); // Status 204 (No Content) adalah standar untuk DELETE yang berhasil.
    } catch (error) {
        res
            .status(500)
            .json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

exports.updatePresensi = async (req, res) => {
    try {
        const presensiId = req.params.id;
        const { checkIn, checkOut, nama } = req.body;
        
        // 4. Rekomendasi: Anda mungkin perlu menambahkan validasi role/hak akses di sini 
        // jika pengguna hanya boleh mengupdate presensinya sendiri.

        if (checkIn === undefined && checkOut === undefined && nama === undefined) {
            return res.status(400).json({
                message:
                    "Request body tidak berisi data yang valid untuk diupdate (checkIn, checkOut, atau nama).",
            });
        }
        const recordToUpdate = await Presensi.findByPk(presensiId);
        
        if (!recordToUpdate) {
            return res
                .status(404)
                .json({ message: "Catatan presensi tidak ditemukan." });
        }
        
        // Perbaikan: Pastikan Anda juga menggunakan req.user.id untuk verifikasi kepemilikan
        
        recordToUpdate.checkIn = checkIn || recordToUpdate.checkIn;
        recordToUpdate.checkOut = checkOut || recordToUpdate.checkOut;
        recordToUpdate.nama = nama || recordToUpdate.nama;
        await recordToUpdate.save();

        res.json({
            message: "Data presensi berhasil diperbarui.",
            data: recordToUpdate,
        });
    } catch (error) {
        res
            .status(500)
            .json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};