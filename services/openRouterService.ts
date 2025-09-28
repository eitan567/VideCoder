import { FileNode } from "../types";

const SYSTEM_PROMPT = `You are an expert web developer AI. Your task is to generate a complete web application project based on a user's prompt.

**RESPONSE FORMAT**
- You MUST respond with a single JSON object that is a valid array of file/folder nodes.
- Do NOT wrap the JSON in markdown backticks like \`\`\`json.

**NODE STRUCTURE**
- Each node is an object with a "name" (string) and a "type" ('file' or 'folder').
- "file" nodes must have a "content" property (string).
- "folder" nodes must have a "children" property (an array of file/folder nodes).

**PROJECT REQUIREMENTS**
- The project MUST be self-contained and work without a build step.
- The project root MUST have an 'index.html' file.
- Create separate files for CSS and JavaScript (.css, .js).
- Link assets using relative paths. For example, in 'index.html', link to './styles/main.css'.
- Do not use inline <style> or <script> tags with large amounts of code.
- Use vanilla JavaScript. Do not use frameworks unless specifically requested.
- Use Tailwind CSS from the CDN for styling.

**MULTI-PAGE SITES**
- For multi-page sites, create separate HTML files (e.g., 'about.html', 'contact.html').
- Use standard anchor tags with relative paths for navigation (e.g., '<a href="./about.html">About</a>').

**EXAMPLE for a simple 2-page site:**
[
  {
    "name": "index.html",
    "type": "file",
    "content": "<!DOCTYPE html>...<a href=\\"./about.html\\">About</a>..."
  },
  {
    "name": "about.html",
    "type": "file",
    "content": "<!DOCTYPE html>...<a href=\\"./index.html\\">Home</a>..."
  },
  {
    "name": "styles.css",
    "type": "file",
    "content": "body { font-family: sans-serif; }"
  }
]

**ERROR HANDLING**
- If you cannot fulfill the request, you MUST respond with a JSON array containing a single file:
  { "name": "error.log", "type": "file", "content": "I could not generate the project because... [explain reason]." }
`;

const hasIndexHtmlAtRoot = (nodes: FileNode[]): boolean => {
    return nodes.some(node => node.name === 'index.html' && node.type === 'file');
};

export const generateProjectWithOpenRouter = async (prompt: string, model: string): Promise<FileNode[]> => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY environment variable not set");
    }

    const TIMEOUT_MS = 60000; // 60-second timeout
    const MAX_RESPONSE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB limit to prevent browser freeze

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`The AI model took too long to respond (timed out after ${TIMEOUT_MS / 1000}s). This can happen with complex requests. Please try again.`));
      }, TIMEOUT_MS);
    });

    const generationLogic = async (): Promise<FileNode[]> => {
        console.log('Initializing OpenRouter generation...');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Vibe Coder'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Generate the project for this user request: "${prompt}"` }
            ],
            max_tokens: 4000,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0]?.message?.content;

        if (!jsonText) {
            throw new Error("The AI model returned an empty response. This might be due to content moderation filters or an internal error.");
        }

        if (jsonText.length > MAX_RESPONSE_SIZE_BYTES) {
          throw new Error(`The AI model returned an excessively large response (${(jsonText.length / 1024 / 1024).toFixed(2)} MB), which could cause the application to freeze. Aborting generation.`);
        }
        
        // The model sometimes wraps the JSON in markdown, so we need to strip it.
        let cleanedJsonText = jsonText.trim();
        if (cleanedJsonText.startsWith('```json')) {
            cleanedJsonText = cleanedJsonText.substring(7);
            if (cleanedJsonText.endsWith('```')) {
                cleanedJsonText = cleanedJsonText.slice(0, -3);
            }
        }
        
        let generatedFiles;
        try {
            generatedFiles = JSON.parse(cleanedJsonText);
            console.log('OpenRouter JSON parsed successfully, files generated:', generatedFiles.length);
        } catch (e) {
            console.error("Failed to parse OpenRouter JSON response:", cleanedJsonText);
            throw new Error("The AI model returned an invalid JSON structure.");
        }

        if (!Array.isArray(generatedFiles) || generatedFiles.length === 0) {
            throw new Error("The AI model returned an empty or invalid project structure.");
        }

        const isErrorLog = generatedFiles.length === 1 && generatedFiles[0].name === 'error.log' && generatedFiles[0].type === 'file';
        if (!isErrorLog && !hasIndexHtmlAtRoot(generatedFiles)) {
            throw new Error("The generated project is missing an 'index.html' file at the root level.");
        }

        return generatedFiles as FileNode[];
    };
    
    return await Promise.race([generationLogic(), timeoutPromise]);

  } catch (error) {
    console.error("Error generating project with OpenRouter:", error);
    let errorMessage = "An unknown error occurred while generating the project.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.log('OpenRouter generation failed, returning error log file.');
    // Return a dummy error file structure
    return [
        {
            name: "error.log",
            type: "file",
            content: `Failed to generate project.\nPrompt: ${prompt}\nError: ${errorMessage}`
        }
    ];
  }
};