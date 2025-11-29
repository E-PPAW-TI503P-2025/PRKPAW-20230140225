const { Presensi } = require("../models");
const { Op } = require("sequelize");

exports.getDailyReport = async (req, res) => {
  try {
    const { nama, startDate, endDate } = req.query;

    let options = {
      where: {},
    };

    // Filter Nama
    if (nama) {
      options.where.nama = {
        [Op.like]: `%${nama}%`,
      };
    }

    // Filter Tanggal (checkIn, bukan createdAt)
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      options.where.checkIn = {
        [Op.between]: [start, end],
      };
    }

    const records = await Presensi.findAll(options);

    res.json({
      message: "Laporan presensi berhasil diambil",
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil laporan",
      error: error.message,
    });
  }
};
