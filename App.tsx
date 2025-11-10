import React, { useState, useEffect, useCallback } from 'react';
import { fetchTemplatesFromSheet, saveWorkoutToSheet } from './services/googleSheetsService';
import type { WorkoutTemplate, WorkoutGroup, Exercise, ExerciseTemplate } from './types';
import { SetStatus, ExerciseStatus } from './types';
import TemplateSelection from './components/TemplateSelection';
import WorkoutSession from './components/WorkoutSession';
import WorkoutSummary from './components/WorkoutSummary';
import WorkoutHistory from './components/WorkoutHistory';
import Login from './components/Login';
import { DumbbellIcon, HomeIcon, HistoryIcon, LoaderIcon } from './components/icons';

type View = 'TEMPLATE_SELECTION' | 'WORKOUT_SESSION' | 'WORKOUT_SUMMARY' | 'WORKOUT_HISTORY';

const createWorkoutGroupFromTemplate = (template: WorkoutTemplate): WorkoutGroup => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const exercises: Exercise[] = template.exercises.map((exTemplate: ExerciseTemplate) => ({
        ...exTemplate,
        status: ExerciseStatus.Pending,
        sets: exTemplate.sets.map(setTemplate => ({
            ...setTemplate,
            completedWeight: setTemplate.suggestedWeight,
            completedReps: setTemplate.suggestedReps,
            status: SetStatus.Pending,
        })),
    }));

    return {
        id: `${template.id}-${today}-${Date.now()}`, // Added timestamp for uniqueness
        templateId: template.id,
        templateName: template.name,
        date: today,
        exercises: exercises,
        status: 'in-progress',
    };
};

const Header: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-700">
        <nav className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('TEMPLATE_SELECTION')}>
                <DumbbellIcon className="w-8 h-8 text-cyan-400"/>
                <span className="text-xl font-bold text-white">Gemini Fitness</span>
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={() => onNavigate('TEMPLATE_SELECTION')} className="p-2 text-gray-300 hover:text-cyan-400 transition-colors"><HomeIcon className="w-6 h-6"/></button>
                <button onClick={() => onNavigate('WORKOUT_HISTORY')} className="p-2 text-gray-300 hover:text-cyan-400 transition-colors"><HistoryIcon className="w-6 h-6"/></button>
            </div>
        </nav>
    </header>
);

const App: React.FC = () => {
  const [view, setView] = useState<View>('TEMPLATE_SELECTION');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutGroup | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [sheetIds, setSheetIds] = useState<{ templatesSheetId: string; historySheetId: string; } | null>(null);
  
  useEffect(() => {
    try {
        const savedHistory = localStorage.getItem('workoutHistory');
        if (savedHistory) setWorkoutHistory(JSON.parse(savedHistory));

        const savedSheetIds = localStorage.getItem('googleSheetIds');
        if (savedSheetIds) {
          // This assumes the user is still logged in from a previous session.
          // A robust app would verify the token.
          setSheetIds(JSON.parse(savedSheetIds));
          setIsLoggedIn(true);
        }
    } catch(e) {
        console.error("Failed to parse data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && sheetIds) {
      const loadInitialData = async () => {
        try {
          setIsLoading(true);
          const fetchedTemplates = await fetchTemplatesFromSheet(sheetIds.templatesSheetId);
          setTemplates(fetchedTemplates);
        } catch (err) {
          setError('Failed to load workout templates from Google Sheets.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      loadInitialData();
    }
  }, [isLoggedIn, sheetIds]);

  useEffect(() => {
    if (workoutHistory.length > 0) {
      localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
    }
  }, [workoutHistory]);

  const handleLoginSuccess = useCallback((fetchedSheetIds: { templatesSheetId: string; historySheetId: string; }) => {
    setSheetIds(fetchedSheetIds);
    setIsLoggedIn(true);
  }, []);

  const handleStartWorkout = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const newWorkout = createWorkoutGroupFromTemplate(template);
      setCurrentWorkout(newWorkout);
      setView('WORKOUT_SESSION');
    }
  }, [templates]);
  
  const handleUpdateWorkout = useCallback((updatedWorkout: WorkoutGroup) => {
      setCurrentWorkout(updatedWorkout);
  }, []);
  
  const handleFinishWorkout = useCallback(() => {
    if (currentWorkout && sheetIds) {
        const finishedWorkout = { ...currentWorkout, status: 'completed' as const };
        setCurrentWorkout(finishedWorkout);
        setWorkoutHistory(prevHistory => [finishedWorkout, ...prevHistory]);
        
        saveWorkoutToSheet(finishedWorkout, sheetIds.historySheetId).catch(err => {
            console.error("Failed to save workout to Google Sheet:", err);
            setError("Could not save workout to Google Sheets. Check connection.");
        });

        setView('WORKOUT_SUMMARY');
    }
  }, [currentWorkout, sheetIds]);
  
  const handleGoHome = useCallback(() => {
      setCurrentWorkout(null);
      setView('TEMPLATE_SELECTION');
  }, []);
  
  if (!isLoggedIn) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  
  const renderContent = () => {
    if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <LoaderIcon className="w-12 h-12 text-cyan-400"/>
            <p className="mt-4 text-lg text-gray-400">Loading Workouts from your Google Sheet...</p>
        </div>
      );
    }

    if (error) {
        return <div className="text-center text-red-500 p-8">{error}</div>
    }

    switch(view) {
        case 'WORKOUT_SESSION':
            return currentWorkout && <WorkoutSession workout={currentWorkout} onUpdateWorkout={handleUpdateWorkout} onFinishWorkout={handleFinishWorkout} />;
        case 'WORKOUT_SUMMARY':
            return currentWorkout && <WorkoutSummary workout={currentWorkout} onGoHome={handleGoHome} />;
        case 'WORKOUT_HISTORY':
            return <WorkoutHistory history={workoutHistory} />;
        case 'TEMPLATE_SELECTION':
        default:
            return <TemplateSelection templates={templates} history={workoutHistory} onStartWorkout={handleStartWorkout} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
        <Header onNavigate={setView} />
        <main className="container mx-auto">
            {renderContent()}
        </main>
    </div>
  );
};

export default App;