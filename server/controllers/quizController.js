import Score from '../models/Score.js';

export const submitScore = async (req, res) => {
  try {
    const {
      score,
      activityType = 'quiz',
      topic = 'General',
      difficulty = 'medium',
      modeName = '',
      totalQuestions = 0,
      correctAnswers = 0,
      accuracy,
    } = req.body;

    if (typeof score !== 'number' || Number.isNaN(score)) {
      return res.status(400).json({ message: 'A numeric score is required' });
    }

    const normalizedAccuracy = typeof accuracy === 'number' && !Number.isNaN(accuracy)
      ? Math.max(0, Math.min(100, Math.round(accuracy)))
      : Math.max(0, Math.min(100, Math.round(score)));

    const savedScore = await Score.create({
      user: req.user._id,
      value: Math.max(0, Math.round(score)),
      activityType,
      topic,
      difficulty,
      modeName,
      totalQuestions: Math.max(0, Number(totalQuestions) || 0),
      correctAnswers: Math.max(0, Number(correctAnswers) || 0),
      accuracy: normalizedAccuracy,
    });

    res.status(201).json(savedScore);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Score.aggregate([
      {
        $group: {
          _id: '$user',
          totalPoints: { $sum: '$value' },
          attempts: { $sum: 1 },
          quizAttempts: {
            $sum: {
              $cond: [{ $eq: ['$activityType', 'quiz'] }, 1, 0],
            },
          },
          interviewAttempts: {
            $sum: {
              $cond: [{ $eq: ['$activityType', 'interview'] }, 1, 0],
            },
          },
          averageAccuracy: { $avg: '$accuracy' },
          bestScore: { $max: '$value' },
          recentActivityAt: { $max: '$createdAt' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: { $toString: '$_id' },
          name: '$user.name',
          totalPoints: 1,
          attempts: 1,
          quizAttempts: 1,
          interviewAttempts: 1,
          averageAccuracy: { $round: ['$averageAccuracy', 0] },
          bestScore: 1,
          recentActivityAt: 1,
          rankingScore: {
            $round: [
              {
                $add: [
                  { $multiply: ['$totalPoints', 0.65] },
                  { $multiply: ['$averageAccuracy', 0.35] },
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $sort: {
          rankingScore: -1,
          totalPoints: -1,
          averageAccuracy: -1,
          bestScore: -1,
          recentActivityAt: -1,
        },
      },
    ]);

    let previousKey = null;
    let currentRank = 0;
    const rankedLeaderboard = leaderboard.map((entry, index) => {
      const rankKey = `${entry.rankingScore}|${entry.totalPoints}|${entry.averageAccuracy}|${entry.bestScore}`;
      if (rankKey !== previousKey) {
        currentRank = index + 1;
        previousKey = rankKey;
      }

      return {
        ...entry,
        rank: currentRank,
        isCurrentUser: entry.userId === String(req.user._id),
      };
    });

    const topLeaderboard = rankedLeaderboard.slice(0, 20);
    const myEntry = rankedLeaderboard.find((entry) => entry.isCurrentUser) || null;

    res.json({
      leaderboard: topLeaderboard,
      myLeaderboardEntry: myEntry,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPerformance = async (req, res) => {
  try {
    const [activities, personalSummary, leaderboard] = await Promise.all([
      Score.find({ user: req.user._id, sort: true, limit: 8 }),
      Score.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: '$user',
            totalPoints: { $sum: '$value' },
            quizAttempts: {
              $sum: {
                $cond: [{ $eq: ['$activityType', 'quiz'] }, 1, 0],
              },
            },
            interviewAttempts: {
              $sum: {
                $cond: [{ $eq: ['$activityType', 'interview'] }, 1, 0],
              },
            },
            averageAccuracy: { $avg: '$accuracy' },
          },
        },
      ]),
      Score.aggregate([
        {
          $group: {
            _id: '$user',
            attempts: { $sum: 1 },
            totalPoints: { $sum: '$value' },
            averageAccuracy: { $avg: '$accuracy' },
            recentActivityAt: { $max: '$createdAt' },
            bestScore: { $max: '$value' },
            rankingScore: {
              $sum: {
                $add: [
                  { $multiply: ['$value', 0.65] },
                  { $multiply: ['$accuracy', 0.35] },
                ],
              },
            },
          },
        },
        {
          $sort: {
            rankingScore: -1,
            totalPoints: -1,
            averageAccuracy: -1,
            bestScore: -1,
            recentActivityAt: -1,
          },
        },
      ]),
    ]);

    const totals = personalSummary[0] || {
      totalPoints: 0,
      attempts: 0,
      quizAttempts: 0,
      interviewAttempts: 0,
      averageAccuracy: 0,
    };

    let previousRankKey = null;
    let currentRank = 0;
    let myRank = null;

    leaderboard.forEach((entry, index) => {
      const rankKey = `${Math.round(entry.rankingScore || 0)}|${entry.totalPoints}|${Math.round(entry.averageAccuracy || 0)}|${entry.bestScore}`;
      if (rankKey !== previousRankKey) {
        currentRank = index + 1;
        previousRankKey = rankKey;
      }
      if (String(entry._id) === String(req.user._id)) {
        myRank = currentRank;
      }
    });

    res.json({
      summary: {
        totalPoints: totals.totalPoints,
        attempts: totals.quizAttempts + totals.interviewAttempts,
        quizAttempts: totals.quizAttempts,
        interviewAttempts: totals.interviewAttempts,
        averageAccuracy: Math.round(totals.averageAccuracy || 0),
        rank: myRank,
      },
      activities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};