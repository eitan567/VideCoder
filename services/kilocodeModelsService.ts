import { Model } from '../types';

export const fetchKiloCodeModels = async (): Promise<Model[]> => {
  try {
    if (!process.env.KILOCODE_API_KEY) {
      throw new Error('KILOCODE_API_KEY not set');
    }

    console.log('Fetching KiloCode models from API...');
    const response = await fetch('/kilocode-api/models', {
      headers: {
        'Authorization': process.env.KILOCODE_API_KEY, // No "Bearer " prefix for KiloCode
        'Content-Type': 'application/json'
      }
    });

    console.log('KiloCode API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('KiloCode API response keys:', Object.keys(data));

      // Handle KiloCode API response structure - the data array contains model objects
      const modelsData = data.data || [];
      console.log('KiloCode models array length:', modelsData.length);

      if (modelsData.length === 0) {
        console.warn('KiloCode API returned empty models array');
        return [];
      }

      const models = modelsData.map((model: any, index: number) => {
        console.log(`Model ${index}:`, model.id, model.name);
        return {
          id: model.id,
          name: model.name
        };
      });

      console.log('KiloCode models parsed successfully:', models.length);
      console.log('First 10 KiloCode model names:', models.slice(0, 10).map(m => m.name));
      return models;
    } else {
      let errorMessage = 'Unknown error';
      try {
        const errorText = await response.text();
        console.error('KiloCode raw error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorText;
        } catch {
          errorMessage = errorText.substring(0, 200) + (errorText.length > 200 ? '...' : '');
        }
      } catch (parseError) {
        console.error('Failed to parse KiloCode error response:', parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      if (response.status === 401) {
        errorMessage = 'Invalid or missing KILOCODE_API_KEY. Please check your .env.local file.';
      }
      console.error(`KiloCode API error: ${response.status} - ${errorMessage}`);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch KiloCode models:', error);
    // Return empty array - let the UI handle the fallback
    return [];
  }
};