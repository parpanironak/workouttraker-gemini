
export enum SetStatus {
  Pending = 'pending',
  Completed = 'completed',
  Skipped = 'skipped',
}

export enum ExerciseStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Completed = 'completed',
  Skipped = 'skipped',
}

// Set within an active workout
export interface ExerciseSet {
  suggestedWeight: number;
  suggestedReps: number;
  completedWeight: number;
  completedReps: number;
  status: SetStatus;
}

// Exercise within an active workout
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
  status: ExerciseStatus;
}

// The template for an exercise
export interface ExerciseTemplate {
  id: string;
  name: string;
  muscleGroup: string;
  sets: {
    suggestedReps: number;
    suggestedWeight: number;
  }[];
}

// The template for a full workout routine
export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  muscleGroups: string[];
  exercises: ExerciseTemplate[];
}

// An instance of a workout session, based on a template
export interface WorkoutGroup {
  id:string; // composite key of templateId and date
  templateId: string;
  templateName: string;
  date: string; // YYYY-MM-DD format
  exercises: Exercise[];
  status: 'in-progress' | 'completed';
}
