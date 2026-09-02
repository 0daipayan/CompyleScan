import express from 'express';
import Case from '../models/Case.js';

const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    const stats = await Case.aggregate([
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          avgScore: { $avg: '$score' },
          passCount: {
            $sum: { $cond: [{ $eq: ['$overallStatus', 'PASS'] }, 1, 0] }
          },
          reviewCount: {
            $sum: { $cond: [{ $eq: ['$overallStatus', 'REVIEW'] }, 1, 0] }
          },
          failCount: {
            $sum: { $cond: [{ $eq: ['$overallStatus', 'FAIL'] }, 1, 0] }
          }
        }
      }
    ]);

    if (!stats.length) {
      return res.json({ totalCases: 0, avgScore: 0, passRate: 0, reviewCount: 0, failCount: 0 });
    }

    const data = stats[0];
    const passRate = Math.round((data.passCount / data.totalCases) * 100);

    return res.json({
      totalCases: data.totalCases,
      avgScore: Math.round(data.avgScore),
      passRate,
      reviewCount: data.reviewCount,
      failCount: data.failCount
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

export default router;