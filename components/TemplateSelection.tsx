
import React from 'react';
import type { WorkoutTemplate, WorkoutGroup } from '../types';
import { DumbbellIcon } from './icons';

interface TemplateSelectionProps {
  templates: WorkoutTemplate[];
  history: WorkoutGroup[];
  onStartWorkout: (templateId: string) => void;
}

const WeeklyStats: React.FC<{ history: WorkoutGroup[] }> = ({ history }) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const workoutsThisWeek = history.filter(h => new Date(h.date) >= oneWeekAgo).length;

    return (
        <div className="bg-gray-800/50 p-6 rounded-xl mb-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-cyan-400 mb-3">Weekly Stats</h2>
            <div className="flex items-center space-x-4">
                <div className="bg-cyan-900/50 p-3 rounded-full">
                    <DumbbellIcon className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                    <p className="text-4xl font-bold">{workoutsThisWeek}</p>
                    <p className="text-gray-400">Workouts this week</p>
                </div>
            </div>
        </div>
    );
};


const TemplateSelection: React.FC<TemplateSelectionProps> = ({ templates, history, onStartWorkout }) => {
  return (
    <div className="p-4 md:p-6 animate-fade-in">
        <WeeklyStats history={history} />
      <h2 className="text-3xl font-bold mb-6 text-white">Choose Your Workout</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-gray-800 rounded-lg p-6 flex flex-col justify-between border border-gray-700 hover:border-cyan-500 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <h3 className="text-xl font-bold text-cyan-400">{template.name}</h3>
              <p className="text-gray-400 mt-2 mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.muscleGroups.map(group => (
                  <span key={group} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">{group}</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onStartWorkout(template.id)}
              className="w-full bg-cyan-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-colors"
            >
              Start Workout
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelection;
