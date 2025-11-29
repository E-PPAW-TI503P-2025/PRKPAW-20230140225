const express = require('express');
const router = express.Router();
const { Presensi } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');
router.get('/daily', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { nama, startDate, endDate } = req.query;

    console.log("Query masuk:", { nama, startDate, endDate });

    let whereClause = {};

    // Filter nama (di tabel Presensi)
    if (nama) {
      whereClause.nama = { [Op.like]: `%${nama}%` };
    }

    // Filter tanggal berdasarkan checkIn
    if (startDate || endDate) {
      whereClause.checkIn = {};

      if (startDate) {
        whereClause.checkIn[Op.gte] = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.checkIn[Op.lte] = end;
      }
    }

    const reports = await Presensi.findAll({
      where: whereClause,
      include: [
        {
          association: 'user',
          attributes: ['id', 'nama', 'email'],
        }
      ],
      order: [['checkIn', 'DESC']]
    });

    res.json({
      message: 'OK',
      data: reports
    });
  } catch (error) {
    console.error("Error laporan:", error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;