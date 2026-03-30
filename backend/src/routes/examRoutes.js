const express = require('express');
const router = express.Router();
const { getAllExams } = require('../controllers/examController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getAllExams);

module.exports = router;
