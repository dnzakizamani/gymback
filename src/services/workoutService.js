import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

export const getWorkouts = async (userId, { userExerciseId, page = 1, limit = 10 }) => {
  if (!userExerciseId) {
    throw ApiError.badRequest('userExerciseId is required');
  }

  const userExercise = await prisma.userExercise.findUnique({
    where: { id: userExerciseId }
  });

  if (!userExercise) {
    throw ApiError.notFound('User exercise not found');
  }

  if (userExercise.userId !== userId) {
    throw ApiError.forbidden('Not allowed to access this exercise');
  }

  const skip = (page - 1) * limit;

  const [workouts, total] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userExerciseId },
      include: {
        sets: { orderBy: { setNumber: 'asc' } }
      },
      skip,
      take: limit,
      orderBy: { workoutDate: 'desc' }
    }),
    prisma.workoutSession.count({ where: { userExerciseId } })
  ]);

  const formattedWorkouts = workouts.map(w => ({
    id: w.id,
    userExerciseId: w.userExerciseId,
    workoutDate: w.workoutDate.toISOString().split('T')[0],
    notes: w.notes,
    createdAt: w.createdAt,
    sets: w.sets.map(s => ({
      id: s.id,
      setNumber: s.setNumber,
      weight: parseFloat(s.weight),
      reps: s.reps,
      notes: s.notes
    }))
  }));

  return {
    data: formattedWorkouts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getWorkoutById = async (userId, workoutId) => {
  const workout = await prisma.workoutSession.findUnique({
    where: { id: workoutId },
    include: { sets: { orderBy: { setNumber: 'asc' } } }
  });

  if (!workout) {
    throw ApiError.notFound('Workout not found');
  }

  if (workout.userId !== userId) {
    throw ApiError.forbidden('Not allowed to access this workout');
  }

  return {
    id: workout.id,
    userExerciseId: workout.userExerciseId,
    workoutDate: workout.workoutDate.toISOString().split('T')[0],
    notes: workout.notes,
    sets: workout.sets.map(s => ({
      id: s.id,
      setNumber: s.setNumber,
      weight: parseFloat(s.weight),
      reps: s.reps,
      notes: s.notes
    }))
  };
};

export const createWorkout = async (userId, { userExerciseId, workoutDate, notes, sets }) => {
  const userExercise = await prisma.userExercise.findUnique({
    where: { id: userExerciseId },
    include: { exercise: true }
  });

  if (!userExercise) {
    throw ApiError.notFound('User exercise not found');
  }

  if (userExercise.userId !== userId) {
    throw ApiError.forbidden('Not allowed to create workout for this exercise');
  }

  const parsedDate = new Date(workoutDate);
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  if (parsedDate > today) {
    throw ApiError.badRequest('workoutDate cannot be in the future');
  }

  if (!sets || sets.length === 0) {
    throw ApiError.badRequest('At least one set is required');
  }

  const workout = await prisma.workoutSession.create({
    data: {
      userId,
      userExerciseId,
      workoutDate: parsedDate,
      notes,
      sets: {
        create: sets.map(s => ({
          setNumber: s.setNumber,
          weight: s.weight,
          reps: s.reps,
          notes: s.notes
        }))
      }
    },
    include: { sets: { orderBy: { setNumber: 'asc' } } }
  });

  return {
    id: workout.id,
    userExerciseId: workout.userExerciseId,
    workoutDate: workout.workoutDate.toISOString().split('T')[0],
    notes: workout.notes,
    createdAt: workout.createdAt,
    sets: workout.sets.map(s => ({
      id: s.id,
      setNumber: s.setNumber,
      weight: parseFloat(s.weight),
      reps: s.reps,
      notes: s.notes
    }))
  };
};

export const updateWorkout = async (userId, workoutId, { workoutDate, notes, sets }) => {
  const existing = await prisma.workoutSession.findUnique({
    where: { id: workoutId }
  });

  if (!existing) {
    throw ApiError.notFound('Workout not found');
  }

  if (existing.userId !== userId) {
    throw ApiError.forbidden('Not allowed to update this workout');
  }

  const data = { notes };

  if (workoutDate) {
    const parsedDate = new Date(workoutDate);
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    if (parsedDate > today) {
      throw ApiError.badRequest('workoutDate cannot be in the future');
    }

    data.workoutDate = parsedDate;
  }

  if (sets) {
    await prisma.workoutSet.deleteMany({
      where: { sessionId: workoutId }
    });

    data.sets = {
      create: sets.map(s => ({
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        notes: s.notes
      }))
    };
  }

  const workout = await prisma.workoutSession.update({
    where: { id: workoutId },
    data,
    include: { sets: { orderBy: { setNumber: 'asc' } } }
  });

  return {
    id: workout.id,
    workoutDate: workout.workoutDate.toISOString().split('T')[0],
    notes: workout.notes,
    sets: workout.sets.map(s => ({
      id: s.id,
      setNumber: s.setNumber,
      weight: parseFloat(s.weight),
      reps: s.reps,
      notes: s.notes
    }))
  };
};

export const deleteWorkout = async (userId, workoutId) => {
  const existing = await prisma.workoutSession.findUnique({
    where: { id: workoutId }
  });

  if (!existing) {
    throw ApiError.notFound('Workout not found');
  }

  if (existing.userId !== userId) {
    throw ApiError.forbidden('Not allowed to delete this workout');
  }

  await prisma.workoutSession.delete({
    where: { id: workoutId }
  });

  return true;
};

export const getWorkoutDaysForMonth = async (userId, year, month) => {
  // Calculate start and end dates for the month
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const workouts = await prisma.workoutSession.findMany({
    where: {
      userId,
      workoutDate: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      workoutDate: true
    },
    orderBy: {
      workoutDate: 'asc'
    }
  });

  // Extract unique day numbers
  const days = [...new Set(workouts.map(w => w.workoutDate.getUTCDate()))];

  return days;
};

export const getWorkoutsByDate = async (userId, date) => {
  const targetDate = new Date(date);
  const startOfDay = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
  const endOfDay = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999));

  const workouts = await prisma.workoutSession.findMany({
    where: {
      userId,
      workoutDate: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      userExercise: {
        include: {
          exercise: {
            include: {
              equipment: true,
              exerciseMuscles: {
                include: {
                  muscleGroup: true
                }
              }
            }
          }
        }
      },
      sets: {
        orderBy: { setNumber: 'asc' }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedWorkouts = workouts.map(w => {
    // Get primary and secondary muscles
    const muscles = w.userExercise.exercise.exerciseMuscles;
    const primaryMuscle = muscles.find(m => m.isPrimary)?.muscleGroup?.name || null;
    const secondaryMuscle = muscles.find(m => !m.isPrimary)?.muscleGroup?.name || null;

    return {
      id: w.id,
      userExerciseId: w.userExerciseId,
      exerciseName: w.userExercise.customName || w.userExercise.exercise.name,
      equipment: w.userExercise.exercise.equipment?.name || null,
      primaryMuscle,
      secondaryMuscle,
      workoutDate: w.workoutDate.toISOString().split('T')[0],
      notes: w.notes,
      createdAt: w.createdAt,
      sets: w.sets.map(s => ({
        id: s.id,
        setNumber: s.setNumber,
        weight: parseFloat(s.weight),
        reps: s.reps,
        notes: s.notes
      }))
    };
  });

  return formattedWorkouts;
};
