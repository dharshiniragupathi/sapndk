const express = require('express');
const router = express.Router();

const { getStudentPerformance } = require('../controllers/performanceController');
const { verifyToken } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');

// Student can view ONLY their performance
router.get(
  '/student/me',
  verifyToken,
  authorizeRoles('student'),
  getStudentPerformance
);

// Backward-compatible path; controller ignores param and uses req.user.id.
router.get(
  '/student/:studentId',
  verifyToken,
  authorizeRoles('student'),
  getStudentPerformance
);

module.exports = router;
