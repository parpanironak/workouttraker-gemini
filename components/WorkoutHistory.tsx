
import React from 'react';
import type { WorkoutGroup } from '../types';
import { SetStatus } from '../types';

interface WorkoutHistoryProps {
  history: WorkoutGroup[];
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="p-4 md:p-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Workout History</h2>
        <p className="text-gray-400">You haven't completed any workouts yet. Let's get started!</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold mb-6">Workout History</h2>
      <div className="space-y-6">
        {[...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(workout => (
          <div key={workout.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-cyan-400">{workout.templateName}</h3>
                <p className="text-sm text-gray-400">{new Date(workout.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="space-y-4">
              {workout.exercises.map(ex => (
                <details key={ex.id} className="bg-gray-800 rounded-lg p-3">
                    <summary className="font-semibold text-white cursor-pointer">{ex.name}</summary>
                    <ul className="mt-2 ml-4 space-y-1 text-sm text-gray-400">
                    {ex.sets.map((set, i) => (
                        <li key={i} className="flex justify-between items-center">
                        <span>Set {i+1}: {set.completedWeight} lbs x {set.completedReps} reps</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            set.status === SetStatus.Completed ? 'bg-green-500/20 text-green-400' :
                            set.status === SetStatus.Skipped ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-600/20 text-gray-300'
                        }`}>{set.status}</span>
                    </li>
                    ))}
                    </ul>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutHistory;
