import { Model } from '../types';

export const fetchGoogleModels = async (): Promise<Model[]> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not set');
    }

    // Google AI Studio doesn't have a public models API, so we'll return known models
    // In a real implementation, you might need to use the AI Studio API or hardcode known models
    const knownModels: Model[] = [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-pro', name: 'Gemini Pro' }
    ];

    console.log('Google models fetched:', knownModels.length);
    return knownModels;
  } catch (error) {
    console.error('Failed to fetch Google models:', error);
    return [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
    ];
  }
};