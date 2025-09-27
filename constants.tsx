import React from 'react';
import { Provider } from './types';

export const AI_PROVIDERS: Provider[] = [
  {
    id: 'google',
    name: 'Google',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI (Coming Soon)',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Coming Soon)',
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus' },
    ],
  },
];

export const ICONS = {
  folder: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  folderOpen: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
    </svg>
  ),
  file: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  html: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  css: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  ),
  js: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 16 16">
      <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm6.294 8.952.921.434v1.503h-1.037v-.354c0-.398-.06-.735-.18-1.003a.992.992 0 0 0-.42-.559c-.21-.14-.465-.21-.765-.21-.31 0-.585.07-.825.21-.24.14-.42.345-.54.615-.12.27-.18.6-.18.99v.354H2.49v-1.503l.921-.434.02-.01c.208-.095.37-.17.48-.225s.22-.11.315-.165c.095-.055.17-.11.225-.165s.1-.11.135-.165c.035-.055.05-.11.05-.165 0-.06-.015-.115-.045-.165a.29.29 0 0 0-.12-.105c-.06-.03-.14-.045-.24-.045-.11 0-.195.015-.255.045a.28.28 0 0 0-.135.12c-.03.045-.053.09-.07.135l-1.02-.33c.09-.33.255-.585.495-.765.24-.18.555-.27.945-.27.3 0 .565.053.795.16.23.105.405.25.525.435.12.185.18.405.18.66 0 .21-.045.39-.135.54a.83.83 0 0 0-.315.355c-.08.1-.19.19-.33.27ZM11.41 11.235h-1.03V9.87c0-.495-.12-.87-.36-1.125-.24-.255-.585-.383-1.035-.383-.39 0-.72.075-1.005.225-.285.15-.503.375-.653.675-.15.3-.225.675-.225 1.125v1.845h-1.03V9.87c0-.33.045-.63.135-.89a1.86 1.86 0 0 1 .45-.735c.225-.225.48-.405.765-.54s.585-.203.9-.203c.39 0 .735.075 1.035.225s.54.345.72.585c.18.24.285.525.315.855l.015.135v.3h.03v.825Z"/>
    </svg>
  ),
  json: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M5 3v2a4 4 0 004 4h4a4 4 0 004-4V3" />
    </svg>
  ),
};
