import React, { useState } from 'react';
import { signIn, setupGoogleSheets } from '../services/googleApiService';
import { LoaderIcon } from './icons';

interface LoginProps {
    onLoginSuccess: (sheetIds: { templatesSheetId: string; historySheetId: string; }) => void;
}

const GoogleIcon = () => (
    <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,35.846,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setIsLoading(true);
        setError('');
        setStatus('Initializing...');
        try {
            setStatus('Please sign in with your Google Account...');
            await signIn();
            setStatus('Sign in successful! Setting up sheets...');
            const sheetIds = await setupGoogleSheets(setStatus);
            setStatus('Setup complete!');
            onLoginSuccess(sheetIds);
        } catch (err: any) {
            console.error("Login or setup failed:", err);
            setError(`Login failed. ${err.details || 'Please try again.'}`);
            setIsLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4">
            <h1 className="text-4xl font-bold text-white mb-2">Welcome to Gemini Fitness</h1>
            <p className="text-lg text-gray-400 mb-8">Your personal workout tracker, powered by Gemini and Google Sheets.</p>
            
            {!isLoading && (
                <button
                    onClick={handleLogin}
                    className="flex items-center justify-center bg-white text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-200 transition-colors duration-300"
                >
                    <GoogleIcon />
                    Sign in with Google to Continue
                </button>
            )}

            {isLoading && (
                <div className="flex flex-col items-center">
                    <LoaderIcon className="w-12 h-12 text-cyan-400"/>
                    <p className="mt-4 text-lg text-gray-300">{status}</p>
                </div>
            )}
            
            {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>
    );
};

export default Login;
