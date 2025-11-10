
import { GoogleGenAI } from "@google/genai";
import type { WorkoutGroup } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const fetchWorkoutSummary = async (workout: WorkoutGroup): Promise<string> => {
    try {
        // Create a cleaner, more concise data structure for the prompt to ensure reliability.
        const workoutDataForPrompt = {
            name: workout.templateName,
            exercises: workout.exercises.map(ex => ({
                name: ex.name,
                status: ex.status,
                sets: ex.sets.map(s => ({
                    suggested: `${s.suggestedWeight} lbs x ${s.suggestedReps} reps`,
                    completed: s.status === 'completed' 
                        ? `${s.completedWeight} lbs x ${s.completedReps} reps` 
                        : s.status, // e.g., 'skipped' or 'pending'
                }))
            }))
        };
        
        const prompt = `
        Analyze the following completed workout data and provide an encouraging and insightful summary.
        The user has just finished this session. Congratulate them on their hard work.
        Highlight any exercises where they successfully completed all sets.
        Point out any patterns, like if they struggled with a particular exercise.
        Keep it concise, friendly, and motivating. Use Markdown for formatting with headers, bold text, and lists.

        Workout Data:
        ${JSON.stringify(workoutDataForPrompt, null, 2)}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text ?? 'Could not generate a summary at this time, but great job on the workout!';
    } catch (error) {
        console.error("Error fetching workout summary:", error);
        return "### Great Job! \n\n You pushed through and completed your workout. Consistency is key, and you're doing fantastic. Keep up the amazing work!";
    }
};
