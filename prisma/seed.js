import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Equipment
  const equipment = await Promise.all([
    prisma.equipment.upsert({
      where: { name: 'Barbell' },
      update: {},
      create: { name: 'Barbell', description: 'Standard barbell for lifting' }
    }),
    prisma.equipment.upsert({
      where: { name: 'Dumbbell' },
      update: {},
      create: { name: 'Dumbbell', description: 'Dumbbells for isolation exercises' }
    }),
    prisma.equipment.upsert({
      where: { name: 'Cable Machine' },
      update: {},
      create: { name: 'Cable Machine', description: 'Cable machine for various exercises' }
    }),
    prisma.equipment.upsert({
      where: { name: 'Machine' },
      update: {},
      create: { name: 'Machine', description: 'Gym machines' }
    }),
    prisma.equipment.upsert({
      where: { name: 'Bodyweight' },
      update: {},
      create: { name: 'Bodyweight', description: 'No equipment needed' }
    })
  ]);

  console.log('Created equipment:', equipment.map(e => e.name));

  // Create Muscle Groups
  const muscleGroups = await Promise.all([
    prisma.muscleGroup.upsert({
      where: { name: 'Chest' },
      update: {},
      create: { name: 'Chest', category: 'push' }
    }),
    prisma.muscleGroup.upsert({
      where: { name: 'Back' },
      update: {},
      create: { name: 'Back', category: 'pull' }
    }),
    prisma.muscleGroup.upsert({
      where: { name: 'Shoulders' },
      update: {},
      create: { name: 'Shoulders', category: 'push' }
    }),
    prisma.muscleGroup.upsert({
      where: { name: 'Biceps' },
      update: {},
      create: { name: 'Biceps', category: 'pull' }
    }),
    prisma.muscleGroup.upsert({
      where: { name: 'Triceps' },
      update: {},
      create: { name: 'Triceps', category: 'push' }
    }),
    prisma.muscleGroup.upsert({
      where: { name: 'Legs' },
      update: {},
      create: { name: 'Legs', category: 'legs' }
    }),
    prisma.muscleGroup.upsert({
      where: { name: 'Core' },
      update: {},
      create: { name: 'Core', category: 'core' }
    })
  ]);

  console.log('Created muscle groups:', muscleGroups.map(m => m.name));

  // Find equipment IDs
  const barbell = equipment.find(e => e.name === 'Barbell');
  const dumbbell = equipment.find(e => e.name === 'Dumbbell');
  const cableMachine = equipment.find(e => e.name === 'Cable Machine');
  const machine = equipment.find(e => e.name === 'Machine');
  const bodyweight = equipment.find(e => e.name === 'Bodyweight');

  // Find muscle group IDs
  const chest = muscleGroups.find(m => m.name === 'Chest');
  const back = muscleGroups.find(m => m.name === 'Back');
  const shoulders = muscleGroups.find(m => m.name === 'Shoulders');
  const biceps = muscleGroups.find(m => m.name === 'Biceps');
  const triceps = muscleGroups.find(m => m.name === 'Triceps');
  const legs = muscleGroups.find(m => m.name === 'Legs');
  const core = muscleGroups.find(m => m.name === 'Core');

  // Create Exercises
  const exercises = [
    // Chest exercises
    {
      name: 'Bench Press',
      description: 'Classic chest exercise with barbell',
      equipmentId: barbell.id,
      muscles: [{ muscleGroupId: chest.id, isPrimary: true }]
    },
    {
      name: 'Incline Dumbbell Press',
      description: 'Upper chest focused pressing movement',
      equipmentId: dumbbell.id,
      muscles: [
        { muscleGroupId: chest.id, isPrimary: true },
        { muscleGroupId: shoulders.id, isPrimary: false }
      ]
    },
    {
      name: 'Cable Fly',
      description: 'Isolation exercise for chest',
      equipmentId: cableMachine.id,
      muscles: [{ muscleGroupId: chest.id, isPrimary: true }]
    },
    // Back exercises
    {
      name: 'Lat Pulldown - Wide Grip',
      description: 'Targets lats and upper back',
      equipmentId: cableMachine.id,
      muscles: [
        { muscleGroupId: back.id, isPrimary: true },
        { muscleGroupId: biceps.id, isPrimary: false }
      ]
    },
    {
      name: 'Barbell Row',
      description: 'Compound back exercise',
      equipmentId: barbell.id,
      muscles: [
        { muscleGroupId: back.id, isPrimary: true },
        { muscleGroupId: biceps.id, isPrimary: false }
      ]
    },
    {
      name: 'Deadlift',
      description: 'Full body compound movement',
      equipmentId: barbell.id,
      muscles: [
        { muscleGroupId: back.id, isPrimary: true },
        { muscleGroupId: legs.id, isPrimary: false }
      ]
    },
    // Shoulder exercises
    {
      name: 'Overhead Press',
      description: 'Standing shoulder press',
      equipmentId: barbell.id,
      muscles: [
        { muscleGroupId: shoulders.id, isPrimary: true },
        { muscleGroupId: triceps.id, isPrimary: false }
      ]
    },
    {
      name: 'Lateral Raise',
      description: 'Isolation for side delts',
      equipmentId: dumbbell.id,
      muscles: [{ muscleGroupId: shoulders.id, isPrimary: true }]
    },
    // Arm exercises
    {
      name: 'Barbell Curl',
      description: 'Classic bicep exercise',
      equipmentId: barbell.id,
      muscles: [{ muscleGroupId: biceps.id, isPrimary: true }]
    },
    {
      name: 'Tricep Pushdown',
      description: 'Cable tricep extension',
      equipmentId: cableMachine.id,
      muscles: [{ muscleGroupId: triceps.id, isPrimary: true }]
    },
    // Leg exercises
    {
      name: 'Squat',
      description: 'King of leg exercises',
      equipmentId: barbell.id,
      muscles: [
        { muscleGroupId: legs.id, isPrimary: true }
      ]
    },
    {
      name: 'Leg Press',
      description: 'Machine-based leg exercise',
      equipmentId: machine.id,
      muscles: [{ muscleGroupId: legs.id, isPrimary: true }]
    },
    {
      name: 'Leg Curl',
      description: 'Hamstring isolation',
      equipmentId: machine.id,
      muscles: [{ muscleGroupId: legs.id, isPrimary: true }]
    },
    // Core exercises
    {
      name: 'Plank',
      description: 'Core stabilization exercise',
      equipmentId: bodyweight.id,
      muscles: [{ muscleGroupId: core.id, isPrimary: true }]
    },
    {
      name: 'Cable Crunch',
      description: 'Weighted ab exercise',
      equipmentId: cableMachine.id,
      muscles: [{ muscleGroupId: core.id, isPrimary: true }]
    }
  ];

  for (const ex of exercises) {
    const exercise = await prisma.exercise.upsert({
      where: { id: ex.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: ex.name.toLowerCase().replace(/\s+/g, '-'),
        name: ex.name,
        description: ex.description,
        equipmentId: ex.equipmentId
      }
    });

    // Create exercise-muscle relationships
    for (const muscle of ex.muscles) {
      await prisma.exerciseMuscle.upsert({
        where: {
          exerciseId_muscleGroupId: {
            exerciseId: exercise.id,
            muscleGroupId: muscle.muscleGroupId
          }
        },
        update: {},
        create: {
          exerciseId: exercise.id,
          muscleGroupId: muscle.muscleGroupId,
          isPrimary: muscle.isPrimary
        }
      });
    }
  }

  console.log('Created exercises:', exercises.length);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
