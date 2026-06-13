import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

export const getUserExercises = async (userId, { muscleGroup, includeStats = false }) => {
  const where = { userId };

  if (muscleGroup) {
    where.exercise = {
      exerciseMuscles: {
        some: {
          muscleGroup: { name: { contains: muscleGroup, mode: 'insensitive' } }
        }
      }
    };
  }

  const userExercises = await prisma.userExercise.findMany({
    where,
    include: {
      exercise: {
        include: {
          equipment: { select: { id: true, name: true } },
          exerciseMuscles: {
            include: { muscleGroup: { select: { name: true } } }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  let result = userExercises.map(ue => ({
    id: ue.id,
    customName: ue.customName,
    notes: ue.notes,
    createdAt: ue.createdAt,
    exercise: {
      id: ue.exercise.id,
      name: ue.exercise.name,
      imageUrl: ue.exercise.imageUrl,
      equipment: ue.exercise.equipment,
      muscles: ue.exercise.exerciseMuscles.map(em => ({
        name: em.muscleGroup.name,
        isPrimary: em.isPrimary
      }))
    }
  }));

  if (includeStats) {
    const userExerciseIds = userExercises.map(ue => ue.id);
    
    const sessions = await prisma.workoutSession.findMany({
      where: { userExerciseId: { in: userExerciseIds } },
      include: {
        sets: true
      },
      orderBy: { workoutDate: 'desc' }
    });

    const sessionsByUserExercise = {};
    sessions.forEach(s => {
      if (!sessionsByUserExercise[s.userExerciseId]) {
        sessionsByUserExercise[s.userExerciseId] = [];
      }
      sessionsByUserExercise[s.userExerciseId].push(s);
    });

    result = result.map(ue => {
      const ueSessions = sessionsByUserExercise[ue.id] || [];
      
      let personalRecord = 0;
      let lastSession = null;
      
      ueSessions.forEach(s => {
        s.sets.forEach(set => {
          const weight = parseFloat(set.weight);
          if (weight > personalRecord) {
            personalRecord = weight;
          }
        });
      });
      
      if (ueSessions.length > 0) {
        lastSession = ueSessions[0].workoutDate.toISOString().split('T')[0];
      }
      
      return {
        ...ue,
        stats: {
          personalRecord,
          lastSession,
          totalSessions: ueSessions.length
        }
      };
    });
  }

  return result;
};

export const addUserExercise = async (userId, { exerciseId, customName, notes }) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId }
  });

  if (!exercise) {
    throw ApiError.notFound('Exercise not found');
  }

  const existing = await prisma.userExercise.findUnique({
    where: {
      userId_exerciseId: { userId, exerciseId }
    }
  });

  if (existing) {
    throw ApiError.conflict('Exercise already in your list');
  }

  const userExercise = await prisma.userExercise.create({
    data: {
      userId,
      exerciseId,
      customName,
      notes
    }
  });

  return userExercise;
};

export const updateUserExercise = async (userId, userExerciseId, { customName, notes }) => {
  const existing = await prisma.userExercise.findUnique({
    where: { id: userExerciseId }
  });

  if (!existing) {
    throw ApiError.notFound('User exercise not found');
  }

  if (existing.userId !== userId) {
    throw ApiError.forbidden('Not allowed to update this exercise');
  }

  const userExercise = await prisma.userExercise.update({
    where: { id: userExerciseId },
    data: { customName, notes }
  });

  return userExercise;
};

export const deleteUserExercise = async (userId, userExerciseId) => {
  const existing = await prisma.userExercise.findUnique({
    where: { id: userExerciseId }
  });

  if (!existing) {
    throw ApiError.notFound('User exercise not found');
  }

  if (existing.userId !== userId) {
    throw ApiError.forbidden('Not allowed to delete this exercise');
  }

  await prisma.userExercise.delete({
    where: { id: userExerciseId }
  });

  return true;
};
