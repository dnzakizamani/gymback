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

  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      workoutDate: { gte: yearStart, lte: today } // cukup ambil max range
    },
    select: {
      workoutDate: true
    }
  });

  // helper: normalize ke YYYY-MM-DD
  const toDateKey = (d) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const uniqueDays = new Set(
    sessions.map(s => toDateKey(s.workoutDate))
  );

  let week = 0;
  let month = 0;
  let year = 0;

  for (const dateStr of uniqueDays) {
    const date = new Date(dateStr);

    if (date >= weekStart) week++;
    if (date >= monthStart) month++;
    if (date >= yearStart) year++;
  }

  return {
    thisWeek: week,
    thisMonth: month,
    thisYear: year
  };
};

export const getWeeklyFrequency = async (userId) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    select: {
      workoutDate: true
    }
  });

  // simpan tanggal unik + hari
  const uniqueDays = new Set();

  for (const s of sessions) {
    const date = new Date(s.workoutDate);

    // ambil tanggal saja (YYYY-MM-DD)
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // gabungkan dengan hari biar unik per hari
    uniqueDays.add(dateKey);
  }

  // reset counter
  const dayCount = {
    Sun: 0,
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0
  };

  for (const dateStr of uniqueDays) {
    const date = new Date(dateStr);
    const day = dayNames[date.getDay()];
    dayCount[day]++;
  }

  return dayNames.map(day => ({
    day,
    count: dayCount[day]
  }));
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
