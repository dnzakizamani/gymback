import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

export const getAllExercises = async ({ muscleGroup, equipment, search, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const where = {};

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  if (equipment) {
    where.equipment = { name: { contains: equipment, mode: 'insensitive' } };
  }

  if (muscleGroup) {
    where.exerciseMuscles = {
      some: {
        muscleGroup: { name: { contains: muscleGroup, mode: 'insensitive' } }
      }
    };
  }

  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      include: {
        equipment: {
          select: { id: true, name: true }
        },
        exerciseMuscles: {
          include: {
            muscleGroup: {
              select: { id: true, name: true, category: true }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { name: 'asc' }
    }),
    prisma.exercise.count({ where })
  ]);

  const formattedExercises = exercises.map(ex => ({
    id: ex.id,
    name: ex.name,
    description: ex.description,
    imageUrl: ex.imageUrl,
    equipment: ex.equipment,
    muscles: ex.exerciseMuscles.map(em => ({
      id: em.muscleGroup.id,
      name: em.muscleGroup.name,
      category: em.muscleGroup.category,
      isPrimary: em.isPrimary
    }))
  }));

  return {
    data: formattedExercises,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getExerciseById = async (id) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      equipment: {
        select: { id: true, name: true }
      },
      exerciseMuscles: {
        include: {
          muscleGroup: {
            select: { id: true, name: true, category: true }
          }
        }
      }
    }
  });

  if (!exercise) {
    throw ApiError.notFound('Exercise not found');
  }

  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    imageUrl: exercise.imageUrl,
    equipment: exercise.equipment,
    muscles: exercise.exerciseMuscles.map(em => ({
      id: em.muscleGroup.id,
      name: em.muscleGroup.name,
      category: em.muscleGroup.category,
      isPrimary: em.isPrimary
    }))
  };
};

export const getAllMuscleGroups = async () => {
  const muscleGroups = await prisma.muscleGroup.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { name: 'asc' }
  });

  return muscleGroups;
};

export const getAllEquipment = async () => {
  const equipment = await prisma.equipment.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return equipment;
};
