import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

export const getExerciseProgress = async (userId, userExerciseId) => {
  const userExercise = await prisma.userExercise.findUnique({
    where: { id: userExerciseId },
    include: { exercise: true }
  });

  if (!userExercise) {
    throw ApiError.notFound('User exercise not found');
  }

  if (userExercise.userId !== userId) {
    throw ApiError.forbidden('Not allowed to access this exercise');
  }

  const sessions = await prisma.workoutSession.findMany({
    where: { userExerciseId },
    include: { sets: true },
    orderBy: { workoutDate: 'asc' }
  });

  const chartData = sessions.map(s => {
    const bestWeight = Math.max(...s.sets.map(set => parseFloat(set.weight)));
    const totalVolume = s.sets.reduce((sum, set) => sum + (parseFloat(set.weight) * set.reps), 0);
    const totalSets = s.sets.length;
    const totalReps = s.sets.reduce((sum, set) => sum + set.reps, 0);

    return {
      date: s.workoutDate.toISOString().split('T')[0],
      bestWeight,
      totalVolume,
      totalSets,
      totalReps
    };
  });

  let totalVolume = 0;
  sessions.forEach(s => {
    s.sets.forEach(set => {
      totalVolume += parseFloat(set.weight) * set.reps;
    });
  });

  const firstSession = sessions.length > 0 ? sessions[0].workoutDate.toISOString().split('T')[0] : null;
  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1].workoutDate.toISOString().split('T')[0] : null;

  let improvement = '0%';
  if (sessions.length >= 2) {
    const firstBest = Math.max(...sessions[0].sets.map(s => parseFloat(s.weight)));
    const lastBest = Math.max(...sessions[sessions.length - 1].sets.map(s => parseFloat(s.weight)));
    const pct = ((lastBest - firstBest) / firstBest * 100).toFixed(0);
    improvement = `+${pct}%`;
  }

  return {
    exerciseId: userExercise.exerciseId,
    exerciseName: userExercise.customName || userExercise.exercise.name,
    unit: 'kg',
    chartData,
    summary: {
      totalSessions: sessions.length,
      firstSession,
      lastSession,
      totalVolume,
      improvement
    }
  };
};

export const getDashboardStats = async (userId) => {
  const userExercises = await prisma.userExercise.findMany({
    where: { userId },
    include: {
      exercise: true,
      workoutSessions: {
        include: { sets: true }
      }
    }
  });

  let totalWorkouts = 0;
  let totalVolume = 0;
  const personalRecords = [];
  const recentActivity = [];

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  let thisWeekSessions = 0;
  let thisWeekExercises = new Set();
  let thisWeekVolume = 0;

  for (const ue of userExercises) {
    if (ue.workoutSessions.length > 0) {
      totalWorkouts += ue.workoutSessions.length;

      recentActivity.push({
        userExerciseId: ue.id,
        exerciseName: ue.customName || ue.exercise.name,
        lastSession: ue.workoutSessions[ue.workoutSessions.length - 1].workoutDate.toISOString().split('T')[0]
      });
    }

    let maxWeight = 0;
    let maxWeightSession = null;

    for (const session of ue.workoutSessions) {
      const sessionDate = new Date(session.workoutDate);
      sessionDate.setHours(0, 0, 0, 0);

      for (const set of session.sets) {
        const weight = parseFloat(set.weight);
        const volume = weight * set.reps;
        totalVolume += volume;

        if (sessionDate >= weekAgo) {
          thisWeekVolume += volume;
          thisWeekSessions++;
          thisWeekExercises.add(ue.id);
        }

        if (weight > maxWeight) {
          maxWeight = weight;
          maxWeightSession = session;
        }
      }
    }

    if (maxWeight > 0) {
      personalRecords.push({
        exerciseId: ue.exerciseId,
        exerciseName: ue.customName || ue.exercise.name,
        weight: maxWeight,
        date: maxWeightSession.workoutDate.toISOString().split('T')[0]
      });
    }
  }

  recentActivity.sort((a, b) => new Date(b.lastSession) - new Date(a.lastSession));
  recentActivity.splice(5);

  return {
    totalExercises: userExercises.length,
    totalWorkouts,
    totalVolume,
    thisWeek: {
      sessions: thisWeekSessions,
      exercises: thisWeekExercises.size,
      volume: thisWeekVolume
    },
    personalRecords: personalRecords.splice(0, 5),
    recentActivity
  };
};

export const getPersonalRecord = async (userId, userExerciseId) => {
  const userExercise = await prisma.userExercise.findUnique({
    where: { id: userExerciseId },
    include: { exercise: true }
  });

  if (!userExercise) {
    throw ApiError.notFound('User exercise not found');
  }

  if (userExercise.userId !== userId) {
    throw ApiError.forbidden('Not allowed to access this exercise');
  }

  const sessions = await prisma.workoutSession.findMany({
    where: { userExerciseId },
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

  return {
    userExerciseId,
    exerciseName: userExercise.customName || userExercise.exercise.name,
    personalRecord: maxWeightSet ? {
      weight: maxWeight,
      reps: maxWeightSet.reps,
      date: maxWeightSession.workoutDate.toISOString().split('T')[0],
      sessionId: maxWeightSession.id
    } : null,
    totalPRs: maxWeight > 0 ? 1 : 0
  };
};
