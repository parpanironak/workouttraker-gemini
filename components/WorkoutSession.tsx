
import React, { useState } from 'react';
import type { WorkoutGroup, Exercise, ExerciseSet } from '../types';
import { SetStatus, ExerciseStatus } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from './icons';

interface SetRowProps {
  set: ExerciseSet;
  setIndex: number;
  onUpdate: (updatedSet: ExerciseSet) => void;
}

const SetRow: React.FC<SetRowProps> = ({ set, setIndex, onUpdate }) => {
  const [weight, setWeight] = useState(set.completedWeight ?? set.suggestedWeight);
  const [reps, setReps] = useState(set.completedReps ?? set.suggestedReps);

  const handleComplete = () => {
    onUpdate({ ...set, completedWeight: weight, completedReps: reps, status: SetStatus.Completed });
  };
  
  const handleSkip = () => {
    onUpdate({ ...set, completedWeight: 0, completedReps: 0, status: SetStatus.Skipped });
  };

  const isCompleted = set.status === SetStatus.Completed;
  const isSkipped = set.status === SetStatus.Skipped;

  return (
    <div className={`grid grid-cols-5 gap-2 items-center p-3 rounded-lg ${isCompleted ? 'bg-green-900/30' : isSkipped ? 'bg-red-900/30' : 'bg-gray-800'}`}>
      <span className="font-bold text-cyan-400">Set {setIndex + 1}</span>
      <span className="text-gray-400 text-center">{set.suggestedWeight} lbs x {set.suggestedReps} reps</span>
      <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="bg-gray-700 w-full text-center p-2 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none" disabled={isCompleted || isSkipped} />
      <input type="number" value={reps} onChange={e => setReps(Number(e.target.value))} className="bg-gray-700 w-full text-center p-2 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none" disabled={isCompleted || isSkipped} />
      <div className="flex justify-end space-x-2">
        {(!isCompleted && !isSkipped) && (
            <>
                <button onClick={handleComplete} className="p-2 bg-green-500 rounded-md hover:bg-green-600 transition-colors">Done</button>
                <button onClick={handleSkip} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">Skip</button>
            </>
        )}
        {(isCompleted || isSkipped) && (
            <button onClick={() => onUpdate({...set, status: SetStatus.Pending})} className="p-2 bg-yellow-500 rounded-md hover:bg-yellow-600 transition-colors">Edit</button>
        )}
      </div>
    </div>
  );
};


interface ExerciseCardProps {
    exercise: Exercise;
    onUpdate: (updatedExercise: Exercise) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onUpdate }) => {
    const handleSetUpdate = (setIndex: number, updatedSet: ExerciseSet) => {
        const newSets = [...exercise.sets];
        newSets[setIndex] = updatedSet;
        const allSetsDone = newSets.every(s => s.status === SetStatus.Completed || s.status === SetStatus.Skipped);
        const newStatus = allSetsDone ? ExerciseStatus.Completed : ExerciseStatus.InProgress;
        onUpdate({ ...exercise, sets: newSets, status: newStatus });
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl animate-fade-in">
            <h3 className="text-3xl font-bold mb-1 text-white">{exercise.name}</h3>
            <p className="text-md text-cyan-400 mb-6">{exercise.muscleGroup}</p>
            <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2 items-center px-3 text-sm text-gray-400 font-semibold">
                    <span></span>
                    <span className="text-center">Suggested</span>
                    <span className="text-center">Weight (lbs)</span>
                    <span className="text-center">Reps</span>
                    <span></span>
                </div>
                {exercise.sets.map((set, index) => (
                    <SetRow key={index} set={set} setIndex={index} onUpdate={(updatedSet) => handleSetUpdate(index, updatedSet)} />
                ))}
            </div>
        </div>
    )
};


interface WorkoutSessionProps {
  workout: WorkoutGroup;
  onUpdateWorkout: (updatedWorkout: WorkoutGroup) => void;
  onFinishWorkout: () => void;
}

const WorkoutSession: React.FC<WorkoutSessionProps> = ({ workout, onUpdateWorkout, onFinishWorkout }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  const handleExerciseUpdate = (updatedExercise: Exercise) => {
    const newExercises = [...workout.exercises];
    newExercises[currentExerciseIndex] = updatedExercise;
    onUpdateWorkout({ ...workout, exercises: newExercises });
  };

  const goToNext = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };
  
  const currentExercise = workout.exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / workout.exercises.length) * 100;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-white">{workout.templateName}</h2>
                <span className="text-gray-400">{currentExerciseIndex + 1} / {workout.exercises.length}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
            </div>
        </div>

        <ExerciseCard key={currentExercise.id} exercise={currentExercise} onUpdate={handleExerciseUpdate} />
      
        <div className="flex justify-between items-center mt-8">
            <button onClick={goToPrev} disabled={currentExerciseIndex === 0} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-colors">
                <ChevronLeftIcon className="w-5 h-5" />
                <span>Prev</span>
            </button>
            <button
                onClick={onFinishWorkout}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
            >
                <CheckCircleIcon className="w-6 h-6" />
                <span>Finish Workout</span>
            </button>
            <button onClick={goToNext} disabled={currentExerciseIndex === workout.exercises.length - 1} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-colors">
                <span>Next</span>
                <ChevronRightIcon className="w-5 h-5" />
            </button>
      </div>
    </div>
  );
};

export default WorkoutSession;
