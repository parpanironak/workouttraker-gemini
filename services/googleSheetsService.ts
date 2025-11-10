import type { WorkoutTemplate, WorkoutGroup, ExerciseTemplate, Exercise, ExerciseSet } from '../types';
import { TEMPLATES_SHEET_NAME, HISTORY_SHEET_NAME } from './googleApiService';

const parseTemplatesFromSheet = (values: string[][]): WorkoutTemplate[] => {
    const templatesMap = new Map<string, WorkoutTemplate>();
    const exercisesMap = new Map<string, ExerciseTemplate>();

    // Skip header row by starting at 1
    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const [
            templateId, templateName, templateDescription, muscleGroupsStr,
            exerciseId, exerciseName, muscleGroup,
            _setNumber, suggestedReps, suggestedWeight
        ] = row;

        if (!templateId || !exerciseId) continue;

        if (!templatesMap.has(templateId)) {
            templatesMap.set(templateId, {
                id: templateId,
                name: templateName,
                description: templateDescription,
                muscleGroups: muscleGroupsStr.split(','),
                exercises: [],
            });
        }

        const exerciseKey = `${templateId}-${exerciseId}`;
        if (!exercisesMap.has(exerciseKey)) {
            exercisesMap.set(exerciseKey, {
                id: exerciseId,
                name: exerciseName,
                muscleGroup,
                sets: [],
            });
            templatesMap.get(templateId)!.exercises.push(exercisesMap.get(exerciseKey)!);
        }

        exercisesMap.get(exerciseKey)!.sets.push({
            suggestedReps: parseInt(suggestedReps, 10),
            suggestedWeight: parseInt(suggestedWeight, 10),
        });
    }

    return Array.from(templatesMap.values());
};

export const fetchTemplatesFromSheet = async (spreadsheetId: string): Promise<WorkoutTemplate[]> => {
    console.log("Fetching workout templates from Google Sheets...");
    // Fix: Cast window.gapi to any to bypass TypeScript error since gapi is loaded dynamically.
    const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: TEMPLATES_SHEET_NAME,
    });
    const values = response.result.values;
    if (!values || values.length <= 1) { // 1 for header
        return [];
    }
    return parseTemplatesFromSheet(values);
};

export const saveWorkoutToSheet = async (workout: WorkoutGroup, spreadsheetId: string): Promise<void> => {
    console.log("Saving completed workout to Google Sheets:", workout.id);
    
    const rows: (string|number)[][] = [];
    workout.exercises.forEach(ex => {
        ex.sets.forEach((set, i) => {
            rows.push([
                workout.id,
                workout.templateId,
                workout.templateName,
                workout.date,
                ex.id,
                ex.name,
                i + 1,
                set.completedWeight,
                set.completedReps,
                set.status,
            ]);
        });
    });

    // Fix: Cast window.gapi to any to bypass TypeScript error since gapi is loaded dynamically.
    await (window as any).gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: HISTORY_SHEET_NAME,
        valueInputOption: 'RAW',
        resource: { values: rows },
    });
    
    console.log("Workout saved successfully.", workout);
};
