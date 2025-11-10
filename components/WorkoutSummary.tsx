
import React, { useState, useEffect } from 'react';
import type { WorkoutGroup } from '../types';
import { SetStatus } from '../types';
import { fetchWorkoutSummary } from '../services/geminiService';
import { LoaderIcon } from './icons';

interface WorkoutSummaryProps {
  workout: WorkoutGroup;
  onGoHome: () => void;
}

const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({ workout, onGoHome }) => {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getSummary = async () => {
      setIsLoading(true);
      const result = await fetchWorkoutSummary(workout);
      setSummary(result);
      setIsLoading(false);
    };
    getSummary();
  }, [workout]);

  // A simple markdown to HTML converter for display
  const renderMarkdown = (text: string) => {
    const html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-cyan-400 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\n- (.*$)/gim, '<li class="ml-6">$1</li>')
      .replace(/(\n<li.*<\/li>)/gs, '<ul class="list-disc list-inside">$1\n</ul>')
      .replace(/\n/g, '<br />');

    return { __html: html };
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-4xl font-extrabold text-center mb-8 text-white">Workout Complete!</h2>
      
      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-8">
        <h3 className="text-2xl font-bold text-cyan-400 mb-4">Gemini Summary</h3>
        {isLoading ? (
          <div className="flex items-center justify-center space-x-3 py-8">
            <LoaderIcon className="w-8 h-8 text-cyan-400" />
            <span className="text-lg text-gray-400">Analyzing your performance...</span>
          </div>
        ) : (
          <div className="prose prose-invert text-gray-300" dangerouslySetInnerHTML={renderMarkdown(summary)} />
        )}
      </div>

      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
        <h3 className="text-2xl font-bold text-cyan-400 mb-4">Workout Log</h3>
        <div className="space-y-6">
            {workout.exercises.map(ex => (
                <div key={ex.id}>
                    <h4 className="font-bold text-lg text-white">{ex.name}</h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-400">
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
                </div>
            ))}
        </div>
      </div>
      
      <div className="text-center mt-10">
        <button
          onClick={onGoHome}
          className="bg-cyan-500 text-white font-semibold py-3 px-8 rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default WorkoutSummary;
