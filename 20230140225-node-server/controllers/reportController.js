const { Presensi } = require("../models");
const { Op } = require("sequelize");

exports.getDailyReport = async (req, res) => {
  try {
    const { nama, tanggal } = req.query; 
    let options = { where: {} };

   
    if (nama) {
      options.where.nama = {
        [Op.like]: `%${nama}%`,
      };
    }

 
    if (tanggal) {
      const startOfDay = new Date(tanggal);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(tanggal);
      endOfDay.setHours(23, 59, 59, 999);

      options.where.createdAt = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    
    const records = await Presensi.findAll(options);

    res.json({
      reportDate: new Date().toLocaleDateString("id-ID"),
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil laporan",
      error: error.message,
    });
  }
};