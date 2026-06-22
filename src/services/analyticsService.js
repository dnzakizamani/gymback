import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

export const getAnalyticsOverview = async (userId) => {
  const result = await prisma.workoutSession.aggregate({
    where: { userId },
    _count: { id: true }
  });

  const allSets = await prisma.workoutSession.findMany({
    where: { userId },
    include: { sets: true }
  });

  let totalVolume = 0;
  for (const session of allSets) {
    for (const set of session.sets) {
      totalVolume += parseFloat(set.weight) * set.reps;
    }
  }

  return {
    totalWorkouts: result._count.id,
    totalVolume
  };
};

export const getPersonalRecords = async (userId, limit = 10) => {
  const userExercises = await prisma.userExercise.findMany({
    where: { userId },
    include: { 
      exercise: {
        include: { equipment: true }
      }
    }
  });

  const personalRecords = [];

  for (const ue of userExercises) {
    const sessions = await prisma.workoutSession.findMany({
      where: { userExerciseId: ue.id },
      include: { sets: true },
      orderBy: { workoutDate: 'desc' }
    });

    let maxWeight = 0;
    let maxWeightSet = null;
    let maxWeightSession = null;

    for (const session of sessions) {
      for (const set of session.sets) {
        const weight = parseFloat(set.weight);
        if (weight > maxWeight) {
          maxWeight = weight;
          maxWeightSet = set;
          maxWeightSession = session;
        }
      }
    }

    if (maxWeight > 0 && maxWeightSet) {
      personalRecords.push({
        id: `pr_${ue.id}`,
        exerciseName: ue.customName || ue.exercise.name,
        equipment: ue.exercise.equipment?.name || null,
        weight: maxWeight,
        reps: maxWeightSet.reps,
        date: maxWeightSession.createdAt
      });
    }
  }

  // Sort by weight descending
  personalRecords.sort((a, b) => b.weight - a.weight);

  return personalRecords.slice(0, limit);
};

export const getVolumeChart = async (userId, period = 'monthly', months = 6) => {
  const now = new Date();
  const labels = [];
  const volumes = [];

  if (period === 'monthly') {
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const monthName = date.toLocaleString('en-US', { month: 'short' });
      labels.push(monthName);

      const sessions = await prisma.workoutSession.findMany({
        where: {
          userId,
          workoutDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: { sets: true }
      });

      let monthVolume = 0;
      for (const session of sessions) {
        for (const set of session.sets) {
          monthVolume += parseFloat(set.weight) * set.reps;
        }
      }
      volumes.push(monthVolume);
    }
  } else {
    // Weekly for the last 6 weeks
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) - (i * 7));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      labels.push(`W${6 - i}`);

      const sessions = await prisma.workoutSession.findMany({
        where: {
          userId,
          workoutDate: {
            gte: weekStart,
            lte: weekEnd
          }
        },
        include: { sets: true }
      });

      let weekVolume = 0;
      for (const session of sessions) {
        for (const set of session.sets) {
          weekVolume += parseFloat(set.weight) * set.reps;
        }
      }
      volumes.push(weekVolume);
    }
  }

  return {
    period,
    labels,
    volumes
  };
};

export const getWorkoutFrequency = async (userId) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // This week (starting Monday)
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  // This month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // This year
  const yearStart = new Date(today.getFullYear(), 0, 1);

  const [thisWeekSessions, thisMonthSessions, thisYearSessions] = await Promise.all([
    prisma.workoutSession.groupBy({
      by: ['workoutDate'],
      where: {
        userId,
        workoutDate: { gte: weekStart, lte: today }
      }
    }),
    prisma.workoutSession.groupBy({
      by: ['workoutDate'],
      where: {
        userId,
        workoutDate: { gte: monthStart, lte: today }
      }
    }),
    prisma.workoutSession.groupBy({
      by: ['workoutDate'],
      where: {
        userId,
        workoutDate: { gte: yearStart, lte: today }
      }
    })
  ]);

  return {
    thisWeek: thisWeekSessions.length,
    thisMonth: thisMonthSessions.length,
    thisYear: thisYearSessions.length
  };
};

export const getWeeklyFrequency = async (userId) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get the Monday of current week
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get start and end of week in UTC to match database
  const weekStartUTC = new Date(Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), 0, 0, 0, 0));
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));

  const sessions = await prisma.workoutSession.groupBy({
    by: ['workoutDate'],
    where: {
      userId,
      workoutDate: {
        gte: weekStartUTC,
        lte: todayUTC
      }
    }
  });

  // Convert workoutDate to YYYY-MM-DD strings for comparison
  const sessionDates = sessions.map(s => {
    const d = new Date(s.workoutDate);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  });

  const days = dayNames.map((day, index) => {
    const checkDate = new Date(weekStartUTC);
    checkDate.setUTCDate(weekStart.getDate() + index);
    const checkDateStr = `${checkDate.getUTCFullYear()}-${String(checkDate.getUTCMonth() + 1).padStart(2, '0')}-${String(checkDate.getUTCDate()).padStart(2, '0')}`;

    const count = sessionDates.filter(sessionDate => sessionDate === checkDateStr).length;

    return { day, count };
  });

  const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

  return {
    weekStart: weekStartStr,
    days
  };
};

export const getMuscleDistribution = async (userId) => {
  const userExercises = await prisma.userExercise.findMany({
    where: { userId },
    include: {
      exercise: {
        include: {
          exerciseMuscles: {
            where: { isPrimary: true },
            include: { muscleGroup: true }
          }
        }
      }
    }
  });

  const muscleCounts = {};
  let totalWorkouts = 0;

  for (const ue of userExercises) {
    const sessionCount = await prisma.workoutSession.count({
      where: { userExerciseId: ue.id }
    });

    if (sessionCount > 0) {
      totalWorkouts += sessionCount;

      const primaryMuscle = ue.exercise.exerciseMuscles[0]?.muscleGroup?.name || 'Other';
      if (!muscleCounts[primaryMuscle]) {
        muscleCounts[primaryMuscle] = 0;
      }
      muscleCounts[primaryMuscle] += sessionCount;
    }
  }

  const distribution = Object.entries(muscleCounts).map(([muscle, count]) => ({
    muscle,
    percentage: totalWorkouts > 0 ? Math.round((count / totalWorkouts) * 100) : 0
  }));

  // Sort by percentage descending
  distribution.sort((a, b) => b.percentage - a.percentage);

  return distribution;
};
