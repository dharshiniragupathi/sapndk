const express = require('express');
const router = express.Router();
const { getAllSubjects, createSubjects } = require('../controllers/subjectController');
const { verifyToken } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');

router.get('/', verifyToken, getAllSubjects);
router.post('/', verifyToken, authorizeRoles('admin'), createSubjects);

module.exports = router;
