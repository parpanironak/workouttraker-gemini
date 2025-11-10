// Fix: Add types for gapi and google on the window object, which are loaded from external scripts.
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

import type { WorkoutTemplate } from '../types';

// In a real app, these would be in a .env file.
// For this environment, we assume they are injected.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const API_KEY = process.env.API_KEY as string;

const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest"
];
const SCOPES = "https://www.googleapis.com/auth/drive.file";

const APP_DIRECTORY_NAME = "Gemini Workout Tracker";
export const TEMPLATES_SHEET_NAME = "Workout Templates";
export const HISTORY_SHEET_NAME = "Workout History";

export const TEMPLATES_SHEET_HEADERS = [
    'templateId', 'templateName', 'templateDescription', 'muscleGroups', 
    'exerciseId', 'exerciseName', 'muscleGroup', 
    'setNumber', 'suggestedReps', 'suggestedWeight'
];

export const HISTORY_SHEET_HEADERS = [
    'workoutId', 'templateId', 'templateName', 'date', 
    'exerciseId', 'exerciseName', 
    'setNumber', 'completedWeight', 'completedReps', 'status'
];

let gapi: any;
let google: any;
let tokenClient: any;

export const initGoogleClient = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        document.body.appendChild(script);
        script.onload = () => {
            gapi = window.gapi;
            gapi.load('client', async () => {
                await gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: DISCOVERY_DOCS,
                });
                const gisScript = document.createElement('script');
                gisScript.src = 'https://accounts.google.com/gsi/client';
                document.body.appendChild(gisScript);
                gisScript.onload = () => {
                    google = window.google;
                    tokenClient = google.accounts.oauth2.initTokenClient({
                        client_id: GOOGLE_CLIENT_ID,
                        scope: SCOPES,
                        callback: '', // handled by promise
                    });
                    resolve();
                };
            });
        };
        script.onerror = reject;
    });
};

export const signIn = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        tokenClient.callback = (resp: any) => {
            if (resp.error) reject(resp);
            resolve();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

const findFile = async (query: string) => {
    const response = await gapi.client.drive.files.list({ q: query, fields: 'files(id, name)' });
    return response.result.files;
};

const createFolder = async (name: string) => {
    const fileMetadata = { name, mimeType: 'application/vnd.google-apps.folder' };
    const response = await gapi.client.drive.files.create({ resource: fileMetadata, fields: 'id' });
    return response.result.id;
};

const createSheet = async (name: string, parentId: string) => {
    const resource = { name, parents: [parentId], mimeType: 'application/vnd.google-apps.spreadsheet' };
    const response = await gapi.client.drive.files.create({ resource, fields: 'id' });
    return response.result.id;
};

const setSheetHeaders = async (spreadsheetId: string, sheetName: string, headers: string[]) => {
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: [headers] },
    });
};

const populateInitialTemplates = async (spreadsheetId: string) => {
    const templates: WorkoutTemplate[] = [
        {
            id: "push-day",
            name: "Push Day",
            description: "Focuses on upper body pushing muscles: chest, shoulders, and triceps.",
            muscleGroups: ["Chest", "Shoulders", "Triceps"],
            exercises: [
                { id: "bench-press", name: "Barbell Bench Press", muscleGroup: "Chest", sets: [{ suggestedReps: 8, suggestedWeight: 135 }, { suggestedReps: 8, suggestedWeight: 135 }, { suggestedReps: 8, suggestedWeight: 135 }] },
                { id: "overhead-press", name: "Overhead Press", muscleGroup: "Shoulders", sets: [{ suggestedReps: 10, suggestedWeight: 65 }, { suggestedReps: 10, suggestedWeight: 65 }, { suggestedReps: 10, suggestedWeight: 65 }] },
                { id: "lateral-raises", name: "Dumbbell Lateral Raises", muscleGroup: "Shoulders", sets: [{ suggestedReps: 12, suggestedWeight: 15 }, { suggestedReps: 12, suggestedWeight: 15 }, { suggestedReps: 12, suggestedWeight: 15 }] },
                { id: "tricep-pushdown", name: "Tricep Pushdown", muscleGroup: "Triceps", sets: [{ suggestedReps: 12, suggestedWeight: 40 }, { suggestedReps: 12, suggestedWeight: 40 }, { suggestedReps: 12, suggestedWeight: 40 }] }
            ]
        },
        {
            id: "pull-day",
            name: "Pull Day",
            description: "Targets upper body pulling muscles: back and biceps.",
            muscleGroups: ["Back", "Biceps"],
            exercises: [
                { id: "pull-ups", name: "Pull Ups", muscleGroup: "Back", sets: [{ suggestedReps: 8, suggestedWeight: 0 }, { suggestedReps: 8, suggestedWeight: 0 }, { suggestedReps: 6, suggestedWeight: 0 }] },
                { id: "barbell-row", name: "Barbell Row", muscleGroup: "Back", sets: [{ suggestedReps: 8, suggestedWeight: 115 }, { suggestedReps: 8, suggestedWeight: 115 }, { suggestedReps: 8, suggestedWeight: 115 }] },
                { id: "lat-pulldown", name: "Lat Pulldown", muscleGroup: "Back", sets: [{ suggestedReps: 10, suggestedWeight: 100 }, { suggestedReps: 10, suggestedWeight: 100 }, { suggestedReps: 10, suggestedWeight: 100 }] },
                { id: "bicep-curls", name: "Dumbbell Bicep Curls", muscleGroup: "Biceps", sets: [{ suggestedReps: 12, suggestedWeight: 25 }, { suggestedReps: 12, suggestedWeight: 25 }, { suggestedReps: 12, suggestedWeight: 25 }] }
            ]
        },
        {
            id: "leg-day",
            name: "Leg Day",
            description: "A comprehensive leg workout for quads, hamstrings, glutes, and calves.",
            muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],
            exercises: [
                { id: "squats", name: "Barbell Squats", muscleGroup: "Quads", sets: [{ suggestedReps: 8, suggestedWeight: 185 }, { suggestedReps: 8, suggestedWeight: 185 }, { suggestedReps: 8, suggestedWeight: 185 }] },
                { id: "romanian-deadlift", name: "Romanian Deadlift", muscleGroup: "Hamstrings", sets: [{ suggestedReps: 10, suggestedWeight: 155 }, { suggestedReps: 10, suggestedWeight: 155 }, { suggestedReps: 10, suggestedWeight: 155 }] },
                { id: "leg-press", name: "Leg Press", muscleGroup: "Quads", sets: [{ suggestedReps: 12, suggestedWeight: 250 }, { suggestedReps: 12, suggestedWeight: 250 }, { suggestedReps: 12, suggestedWeight: 250 }] },
                { id: "calf-raises", name: "Calf Raises", muscleGroup: "Calves", sets: [{ suggestedReps: 15, suggestedWeight: 100 }, { suggestedReps: 15, suggestedWeight: 100 }, { suggestedReps: 15, suggestedWeight: 100 }] }
            ]
        }
    ];

    const rows: (string|number)[][] = [];
    templates.forEach(t => {
        t.exercises.forEach(e => {
            e.sets.forEach((s, i) => {
                rows.push([
                    t.id, t.name, t.description, t.muscleGroups.join(','),
                    e.id, e.name, e.muscleGroup,
                    i + 1, s.suggestedReps, s.suggestedWeight
                ]);
            });
        });
    });

    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${TEMPLATES_SHEET_NAME}!A2`,
        valueInputOption: 'RAW',
        resource: { values: rows },
    });
};

export const setupGoogleSheets = async (setStatus: (status: string) => void) => {
    setStatus("Searching for app folder...");
    let files = await findFile(`mimeType='application/vnd.google-apps.folder' and name='${APP_DIRECTORY_NAME}' and trashed=false`);
    let folderId: string;
    if (files.length > 0) {
        folderId = files[0].id;
    } else {
        setStatus("Creating app folder...");
        folderId = await createFolder(APP_DIRECTORY_NAME);
    }

    setStatus("Searching for 'Workout Templates' sheet...");
    files = await findFile(`mimeType='application/vnd.google-apps.spreadsheet' and name='${TEMPLATES_SHEET_NAME}' and '${folderId}' in parents and trashed=false`);
    let templatesSheetId: string;
    if (files.length > 0) {
        templatesSheetId = files[0].id;
    } else {
        setStatus("Creating 'Workout Templates' sheet...");
        templatesSheetId = await createSheet(TEMPLATES_SHEET_NAME, folderId);
        await setSheetHeaders(templatesSheetId, 'Sheet1', TEMPLATES_SHEET_HEADERS);
        setStatus("Populating initial workout templates...");
        await populateInitialTemplates(templatesSheetId);
        // Rename default 'Sheet1'
        await gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: templatesSheetId,
          resource: { requests: [{ updateSheetProperties: { properties: { sheetId: 0, title: TEMPLATES_SHEET_NAME } } }] },
        });
    }

    setStatus("Searching for 'Workout History' sheet...");
    files = await findFile(`mimeType='application/vnd.google-apps.spreadsheet' and name='${HISTORY_SHEET_NAME}' and '${folderId}' in parents and trashed=false`);
    let historySheetId: string;
    if (files.length > 0) {
        historySheetId = files[0].id;
    } else {
        setStatus("Creating 'Workout History' sheet...");
        historySheetId = await createSheet(HISTORY_SHEET_NAME, folderId);
        await setSheetHeaders(historySheetId, 'Sheet1', HISTORY_SHEET_HEADERS);
         // Rename default 'Sheet1'
         await gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: historySheetId,
          resource: { requests: [{ updateSheetProperties: { properties: { sheetId: 0, title: HISTORY_SHEET_NAME } } }] },
        });
    }
    
    const sheetIds = { templatesSheetId, historySheetId };
    localStorage.setItem('googleSheetIds', JSON.stringify(sheetIds));
    return sheetIds;
};
