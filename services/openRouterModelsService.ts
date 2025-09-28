import { Model } from '../types';

export const fetchOpenRouterModels = async (): Promise<Model[]> => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not set');
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('OpenRouter models fetched:', data.data.length);

      const allModels = data.data.map((model: any) => ({
        id: model.id,
        name: model.name
      }));

      console.log('Total OpenRouter models:', allModels.length);
      return allModels;
    } else {
      console.error('OpenRouter API error:', response.status, response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch OpenRouter models:', error);
    return [];
  }
};