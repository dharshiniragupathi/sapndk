const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');

const {
  getMyProfile,
  getMyClassTopByExam,
  getMyPerformance,
  getMyScores,
  getMyNormalized,
  getMyFinalScore,
  getMyRank,
  getMyClassAverage,
  getMyReport,
  getMyQueries,
  getMyQueryFaculty,
  createMyQuery,
} = require('../controllers/studentController');

// Only STUDENT can access this
router.get(
  '/performance',
  verifyToken,
  authorizeRoles('student'),
  getMyPerformance
);
router.get('/me/profile', verifyToken, authorizeRoles('student'), getMyProfile);
router.get('/me/class-top', verifyToken, authorizeRoles('student'), getMyClassTopByExam);
router.get('/me/scores', verifyToken, authorizeRoles('student'), getMyScores);
router.get('/me/normalized', verifyToken, authorizeRoles('student'), getMyNormalized);
router.get('/me/final-score', verifyToken, authorizeRoles('student'), getMyFinalScore);
router.get('/me/rank', verifyToken, authorizeRoles('student'), getMyRank);
router.get('/me/class-average', verifyToken, authorizeRoles('student'), getMyClassAverage);
router.get('/me/report', verifyToken, authorizeRoles('student'), getMyReport);
router.get('/me/queries', verifyToken, authorizeRoles('student'), getMyQueries);
router.get('/me/query-faculty', verifyToken, authorizeRoles('student'), getMyQueryFaculty);
router.post('/me/queries', verifyToken, authorizeRoles('student'), createMyQuery);

module.exports = router;
