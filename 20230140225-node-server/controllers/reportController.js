// Di controllers/reportControllers.js

// Import Presensi dan User
const { Presensi, User } = require("../models"); 
const { Op } = require("sequelize");

exports.getDailyReport = async (req, res) => {
    try {
        const { nama, startDate, endDate } = req.query;
        // Ambil data user dari JWT payload untuk otorisasi
        const { id: userId, role } = req.user; 

        let options = {
            where: {},
            // Tambahkan include untuk mengambil data User terkait
            include: [
                {
                    model: User,
                    as: 'user', 
                    attributes: ['nim', 'programStudi', 'email'] // Pilih field yang relevan dari tabel User
                }
            ],
            // Urutkan berdasarkan waktu Check-In terbaru
            order: [
                ['checkIn', 'DESC']
            ]
        };

        // Filter Nama (Mencari di tabel Presensi atau tabel User)
        if (nama) {
            options.where[Op.or] = [
                // Mencari di kolom 'nama' Presensi (denormalized)
                { nama: { [Op.like]: `%${nama}%` } }, 
                // Mencari di kolom 'nama' User (asosiasi)
                { '$user.nama$': { [Op.like]: `%${nama}%` } } 
            ];
        }

        // Filter Tanggal
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            options.where.checkIn = {
                [Op.between]: [start, end],
            };
        }

        // Penerapan Otorisasi (User biasa hanya melihat data mereka sendiri)
        if (role !== 'admin') {
            options.where.userId = userId; 
        }

        // Cleaning up Op.or filter if necessary
        if (nama) {
            // Hapus options.where.nama karena sudah dipindah ke Op.or
            if (options.where.nama) delete options.where.nama; 
            // Jika ada filter lain selain nama yang awalnya di luar Op.or, 
            // pastikan filter tersebut tetap diaplikasikan bersama Op.or.
        }
        
        const records = await Presensi.findAll(options);

        res.json({
            message: "Laporan presensi berhasil diambil",
            data: records,
        });
    } catch (error) {
        console.error("Error GetDailyReport:", error); // Log error untuk debugging
        res.status(500).json({
            message: "Gagal mengambil laporan",
            error: error.message,
        });
    }
};