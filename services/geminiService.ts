import { GoogleGenAI, Type } from "@google/genai";
import { FileNode } from "../types";

const SYSTEM_PROMPT = `You are a world-class senior frontend engineer. Your task is to generate a complete, functional web application project based on a user's prompt.

You MUST return the entire project structure as a single, valid JSON object. This object should represent a tree of files and folders.

JSON Structure Rules:
- The root of the JSON object must be an array of file/folder nodes.
- Each node must be an object with a 'name' (string) and a 'type' ('file' or 'folder').
- 'file' nodes must have a 'content' property (string) containing the full source code.
- 'folder' nodes must have a 'children' property (an array of nodes).

Project Requirements:
- The generated project must be a single-page application.
- It MUST be runnable directly in a browser without a build step.
- The 'index.html' MUST load React, ReactDOM, and Babel from CDN URLs.
- All JavaScript code using JSX MUST be in files included with '<script type="text/babel">'.
- Use Tailwind CSS loaded from the CDN for styling.
- All necessary files (index.html, App.js, etc.) must be included.
`;

const getResponseSchema = () => {
  // The API requires an 'items' schema for arrays. To define a recursive
  // file tree structure, we must provide a schema for the 'children' array's items.
  // To avoid a client-side stack overflow from a direct circular reference in the
  // schema object, we define the schema for nested nodes without a 'children'
  // property, effectively stopping the schema's recursion at one level.
  // The strong system prompt ensures the model still generates a fully recursive file tree.
  const nodeSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'The name of the file or folder.' },
      type: { type: Type.STRING, enum: ['file', 'folder'] },
      content: { type: Type.STRING, nullable: true, description: 'File content, null for folders.' },
      children: {
        type: Type.ARRAY,
        nullable: true,
        description: 'Child nodes for folders, null for files.',
        // Define the schema for items within the children array.
        // This object is a simplified node that doesn't have its own children,
        // preventing the schema from being infinitely recursive on the client.
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['file', 'folder'] },
            content: { type: Type.STRING, nullable: true },
          },
          required: ['name', 'type'],
        }
      },
    },
    required: ['name', 'type'],
  };

  return {
    type: Type.ARRAY,
    items: nodeSchema,
  };
};


export const generateProject = async (prompt: string): Promise<FileNode[]> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate the project for this user request: "${prompt}"`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: getResponseSchema(),
      },
    });

    const jsonText = response.text;
    const generatedFiles = JSON.parse(jsonText);
    return generatedFiles as FileNode[];

  } catch (error) {
    console.error("Error generating project:", error);
    let errorMessage = "An unknown error occurred while generating the project.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
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