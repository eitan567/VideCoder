
import React, { useState, useMemo, useEffect } from 'react';
import { FileNode, Provider, Model } from '../types';
import { AI_PROVIDERS } from '../constants';
import { fetchGoogleModels } from '@/services/googleModelsService';
import { fetchOpenRouterModels } from '@/services/openRouterModelsService';
import { fetchKiloCodeModels } from '@/services/kilocodeModelsService';

interface LandingPageProps {
  onStartGeneration: (prompt: string, providerId: string, modelId: string) => void;
  initialPrompt: string;
  promptHistory: string[];
}

const GenerateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a5 5 0 0010 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const LandingPage: React.FC<LandingPageProps> = ({ onStartGeneration, initialPrompt, promptHistory }) => {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerModels, setProviderModels] = useState<Record<string, Model[]>>({});
  const [isLoadingModels, setIsLoadingModels] = useState<Record<string, boolean>>({});

  // Load saved provider and model selections on component mount
  useEffect(() => {
    const savedProviderId = localStorage.getItem('vibeCoder_selectedProviderId');
    const savedModelId = localStorage.getItem('vibeCoder_selectedModelId');

    if (savedProviderId && AI_PROVIDERS.find(p => p.id === savedProviderId)) {
      setSelectedProviderId(savedProviderId);
    } else {
      setSelectedProviderId(AI_PROVIDERS[0].id);
    }

    if (savedModelId) {
      setSelectedModelId(savedModelId);
    }
  }, []);

  // Save provider selection when it changes
  useEffect(() => {
    if (selectedProviderId) {
      localStorage.setItem('vibeCoder_selectedProviderId', selectedProviderId);
    }
  }, [selectedProviderId]);

  // Save model selection when it changes
  useEffect(() => {
    if (selectedModelId) {
      localStorage.setItem('vibeCoder_selectedModelId', selectedModelId);
    }
  }, [selectedModelId]);

  const selectedProvider = useMemo(() => {
    const baseProvider = AI_PROVIDERS.find(p => p.id === selectedProviderId);
    if (!baseProvider) return baseProvider;

    const dynamicModels = providerModels[selectedProviderId] || [];
    return {
      ...baseProvider,
      models: dynamicModels.length > 0 ? dynamicModels : baseProvider.models
    } as Provider;
  }, [selectedProviderId, providerModels]);

  useEffect(() => {
    const fetchModelsForProvider = async (providerId: string) => {
      if (providerModels[providerId] && providerModels[providerId].length > 0) {
        return; // Already fetched
      }

      setIsLoadingModels(prev => ({ ...prev, [providerId]: true }));

      try {
        let models: Model[] = [];

        switch (providerId) {
          case 'google':
            models = await fetchGoogleModels();
            break;
          case 'openrouter':
            models = await fetchOpenRouterModels();
            break;
          case 'openai':
            // For now, use placeholder - in real implementation, fetch from OpenAI API
            models = [
              { id: 'gpt-4o', name: 'GPT-4o' },
              { id: 'gpt-4', name: 'GPT-4' },
              { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
            ];
            break;
          case 'anthropic':
            // For now, use placeholder - in real implementation, fetch from Anthropic API
            models = [
              { id: 'claude-3-opus', name: 'Claude 3 Opus' },
              { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
              { id: 'claude-3-haiku', name: 'Claude 3 Haiku' }
            ];
            break;
          case 'kilocode':
            models = await fetchKiloCodeModels();
            break;
          default:
            const baseProvider = AI_PROVIDERS.find(p => p.id === providerId);
            models = baseProvider?.models || [];
        }

        setProviderModels(prev => ({ ...prev, [providerId]: models }));

        // Set default model if not set
        if (!selectedModelId && models.length > 0) {
          setSelectedModelId(models[0].id);
        }
      } catch (error) {
        console.error(`Failed to fetch models for ${providerId}:`, error);
        // Use fallback models
        let fallbackModels: Model[] = [];
        if (providerId === 'kilocode') {
          // For KiloCode, use the full list of models from the curl API response
          fallbackModels = [
            { id: 'xai/grok-code-fast-1', name: 'xAI: Grok Code Fast 1' },
            { id: 'code-supernova-1-million', name: 'Code Supernova 1 million' },
            { id: 'anthropic/claude-sonnet-4', name: 'Anthropic: Claude Sonnet 4' },
            { id: 'openai/gpt-5', name: 'OpenAI: GPT-5' },
            { id: 'openai/gpt-5-mini', name: 'OpenAI: GPT-5 Mini' },
            { id: 'google/gemini-2.5-pro', name: 'Google: Gemini 2.5 Pro' },
            { id: 'google/gemini-2.5-flash', name: 'Google: Gemini 2.5 Flash' },
            { id: 'qwen/qwen3-coder-480b-a35b', name: 'Qwen: Qwen3 Coder 480B A35B' },
            { id: 'moonshot/kimi-k2-0905', name: 'MoonshotAI: Kimi K2 0905' },
            { id: 'thedrummer/cydonia-24b-v4.1', name: 'TheDrummer: Cydonia 24B V4.1' },
            { id: 'relace/relace-apply-3', name: 'Relace: Relace Apply 3' },
            { id: 'google/gemini-2.5-flash-preview-09-2025', name: 'Google: Gemini 2.5 Flash Preview 09-2025' },
            { id: 'google/gemini-2.5-flash-lite-preview-09-2025', name: 'Google: Gemini 2.5 Flash Lite Preview 09-2025' },
            { id: 'qwen/qwen3-vl-235b-a22b-thinking', name: 'Qwen: Qwen3 VL 235B A22B Thinking' },
            { id: 'qwen/qwen3-vl-235b-a22b-instruct', name: 'Qwen: Qwen3 VL 235B A22B Instruct' },
            { id: 'qwen/qwen3-max', name: 'Qwen: Qwen3 Max' },
            { id: 'qwen/qwen3-coder-plus', name: 'Qwen: Qwen3 Coder Plus' },
            { id: 'openai/gpt-5-codex', name: 'OpenAI: GPT-5 Codex' },
            { id: 'deepseek/deepseek-v3.1-terminus', name: 'DeepSeek: DeepSeek V3.1 Terminus' },
            { id: 'xai/grok-4-fast', name: 'xAI: Grok 4 Fast' },
            { id: 'tongyi/deepresearch-30b-a3b', name: 'Tongyi DeepResearch 30B A3B' },
            { id: 'qwen/qwen3-coder-flash', name: 'Qwen: Qwen3 Coder Flash' },
            { id: 'arcee-ai/afm-4.5b', name: 'Arcee AI: AFM 4.5B' },
            { id: 'opengvlab/internvl3-78b', name: 'OpenGVLab: InternVL3 78B' },
            { id: 'qwen/qwen3-next-80b-a3b-thinking', name: 'Qwen: Qwen3 Next 80B A3B Thinking' },
            { id: 'qwen/qwen3-next-80b-a3b-instruct', name: 'Qwen: Qwen3 Next 80B A3B Instruct' },
            { id: 'meituan/longcat-flash-chat', name: 'Meituan: LongCat Flash Chat' },
            { id: 'qwen/qwen-plus-0728', name: 'Qwen: Qwen Plus 0728' },
            { id: 'qwen/qwen-plus-0728-thinking', name: 'Qwen: Qwen Plus 0728 (thinking)' },
            { id: 'nvidia/nemotron-nano-9b-v2', name: 'NVIDIA: Nemotron Nano 9B V2' },
            { id: 'bytedance/seed-oss-36b-instruct', name: 'ByteDance: Seed OSS 36B Instruct' },
            { id: 'cogito-v2-preview-llama-109b', name: 'Cogito V2 Preview Llama 109B' },
            { id: 'deep-cogito/cogito-v2-preview-deepseek-671b', name: 'Deep Cogito: Cogito V2 Preview Deepseek 671B' },
            { id: 'stepfun/step3', name: 'StepFun: Step3' },
            { id: 'qwen/qwen3-30b-a3b-thinking-2507', name: 'Qwen: Qwen3 30B A3B Thinking 2507' },
            { id: 'nous/hermes-4-70b', name: 'Nous: Hermes 4 70B' },
            { id: 'nous/hermes-4-405b', name: 'Nous: Hermes 4 405B' },
            { id: 'gemini-2.5-flash-image-nano-banana', name: 'Gemini 2.5 Flash Image (Nano Banana)' },
            { id: 'deepseek/deepseek-v3.1', name: 'DeepSeek: DeepSeek V3.1' },
            { id: 'deepseek/deepseek-v3.1-base', name: 'DeepSeek: DeepSeek V3.1 Base' },
            { id: 'openai/gpt-4o-audio', name: 'OpenAI: GPT-4o Audio' },
            { id: 'mistral/mistral-medium-3.1', name: 'Mistral: Mistral Medium 3.1' },
            { id: 'baidu/ernie-4.5-21b-a3b', name: 'Baidu: ERNIE 4.5 21B A3B' },
            { id: 'baidu/ernie-4.5-vl-28b-a3b', name: 'Baidu: ERNIE 4.5 VL 28B A3B' },
            { id: 'z.ai/glm-4.5v', name: 'Z.AI: GLM 4.5V' },
            { id: 'ai21/jamba-mini-1.7', name: 'AI21: Jamba Mini 1.7' },
            { id: 'ai21/jamba-large-1.7', name: 'AI21: Jamba Large 1.7' },
            { id: 'openai/gpt-5-chat', name: 'OpenAI: GPT-5 Chat' },
            { id: 'openai/gpt-5-nano', name: 'OpenAI: GPT-5 Nano' },
            { id: 'openai/gpt-oss-120b', name: 'OpenAI: gpt-oss-120b' },
            { id: 'openai/gpt-oss-20b', name: 'OpenAI: gpt-oss-20b' },
            { id: 'anthropic/claude-opus-4.1', name: 'Anthropic: Claude Opus 4.1' },
            { id: 'mistral/codestral-2508', name: 'Mistral: Codestral 2508' },
            { id: 'qwen/qwen3-coder-30b-a3b-instruct', name: 'Qwen: Qwen3 Coder 30B A3B Instruct' },
            { id: 'qwen/qwen3-30b-a3b-instruct-2507', name: 'Qwen: Qwen3 30B A3B Instruct 2507' },
            { id: 'z.ai/glm-4.5', name: 'Z.AI: GLM 4.5' },
            { id: 'z.ai/glm-4.5-air', name: 'Z.AI: GLM 4.5 Air' },
            { id: 'qwen/qwen3-235b-a22b-thinking-2507', name: 'Qwen: Qwen3 235B A22B Thinking 2507' },
            { id: 'z.ai/glm-4-32b', name: 'Z.AI: GLM 4 32B' },
            { id: 'bytedance/ui-tars-7b', name: 'ByteDance: UI-TARS 7B' },
            { id: 'google/gemini-2.5-flash-lite', name: 'Google: Gemini 2.5 Flash Lite' },
            { id: 'qwen/qwen3-235b-a22b-instruct-2507', name: 'Qwen: Qwen3 235B A22B Instruct 2507' },
            { id: 'switchpoint-router', name: 'Switchpoint Router' },
            { id: 'moonshot/kimi-k2-0711', name: 'MoonshotAI: Kimi K2 0711' },
            { id: 'thudm/glm-4.1v-9b-thinking', name: 'THUDM: GLM 4.1V 9B Thinking' },
            { id: 'mistral/devstral-medium', name: 'Mistral: Devstral Medium' },
            { id: 'mistral/devstral-small-1.1', name: 'Mistral: Devstral Small 1.1' },
            { id: 'xai/grok-4', name: 'xAI: Grok 4' },
            { id: 'tencent/hunyuan-a13b-instruct', name: 'Tencent: Hunyuan A13B Instruct' },
            { id: 'morph/morph-v3-large', name: 'Morph: Morph V3 Large' },
            { id: 'morph/morph-v3-fast', name: 'Morph: Morph V3 Fast' },
            { id: 'baidu/ernie-4.5-vl-424b-a47b', name: 'Baidu: ERNIE 4.5 VL 424B A47B' },
            { id: 'baidu/ernie-4.5-300b-a47b', name: 'Baidu: ERNIE 4.5 300B A47B' },
            { id: 'thedrummer/anubis-70b-v1.1', name: 'TheDrummer: Anubis 70B V1.1' },
            { id: 'inception/mercury', name: 'Inception: Mercury' },
            { id: 'mistral/mistral-small-3.2-24b', name: 'Mistral: Mistral Small 3.2 24B' },
            { id: 'minimax/minimax-m1', name: 'MiniMax: MiniMax M1' },
            { id: 'google/gemini-2.5-flash-lite-preview-06-17', name: 'Google: Gemini 2.5 Flash Lite Preview 06-17' },
            { id: 'moonshot/kimi-dev-72b', name: 'MoonshotAI: Kimi Dev 72B' },
            { id: 'openai/o3-pro', name: 'OpenAI: o3 Pro' },
            { id: 'xai/grok-3-mini', name: 'xAI: Grok 3 Mini' },
            { id: 'xai/grok-3', name: 'xAI: Grok 3' },
            { id: 'mistral/magistral-small-2506', name: 'Mistral: Magistral Small 2506' },
            { id: 'mistral/magistral-medium-2506', name: 'Mistral: Magistral Medium 2506' },
            { id: 'mistral/magistral-medium-2506-thinking', name: 'Mistral: Magistral Medium 2506 (thinking)' },
            { id: 'google/gemini-2.5-pro-preview-06-05', name: 'Google: Gemini 2.5 Pro Preview 06-05' },
            { id: 'deepseek/deepseek-r1-0528-qwen3-8b', name: 'DeepSeek: Deepseek R1 0528 Qwen3 8B' },
            { id: 'deepseek/r1-0528', name: 'DeepSeek: R1 0528' },
            { id: 'anthropic/claude-opus-4', name: 'Anthropic: Claude Opus 4' },
            { id: 'mistral/devstral-small-2505', name: 'Mistral: Devstral Small 2505' },
            { id: 'google/gemma-3n-4b', name: 'Google: Gemma 3n 4B' },
            { id: 'openai/codex-mini', name: 'OpenAI: Codex Mini' },
            { id: 'nous/deehermes-3-mistral-24b-preview', name: 'Nous: DeepHermes 3 Mistral 24B Preview' },
            { id: 'mistral/mistral-medium-3', name: 'Mistral: Mistral Medium 3' },
            { id: 'google/gemini-2.5-pro-preview-05-06', name: 'Google: Gemini 2.5 Pro Preview 05-06' },
            { id: 'arcee-ai/spotlight', name: 'Arcee AI: Spotlight' },
            { id: 'arcee-ai/maestro-reasoning', name: 'Arcee AI: Maestro Reasoning' },
            { id: 'arcee-ai/virtuoso-large', name: 'Arcee AI: Virtuoso Large' },
            { id: 'arcee-ai/coder-large', name: 'Arcee AI: Coder Large' },
            { id: 'microsoft/phi-4-reasoning-plus', name: 'Microsoft: Phi 4 Reasoning Plus' },
            { id: 'inception/mercury-coder', name: 'Inception: Mercury Coder' },
            { id: 'deepseek/deepseek-prover-v2', name: 'DeepSeek: DeepSeek Prover V2' },
            { id: 'meta/llama-guard-4-12b', name: 'Meta: Llama Guard 4 12B' },
            { id: 'qwen/qwen3-30b-a3b', name: 'Qwen: Qwen3 30B A3B' },
            { id: 'qwen/qwen3-8b', name: 'Qwen: Qwen3 8B' },
            { id: 'qwen/qwen3-14b', name: 'Qwen: Qwen3 14B' },
            { id: 'qwen/qwen3-32b', name: 'Qwen: Qwen3 32B' },
            { id: 'qwen/qwen3-235b-a22b', name: 'Qwen: Qwen3 235B A22B' },
            { id: 'tng/deepseek-r1t-chimera', name: 'TNG: DeepSeek R1T Chimera' },
            { id: 'microsoft/mai-ds-r1', name: 'Microsoft: MAI DS R1' },
            { id: 'thudm/glm-z1-32b', name: 'THUDM: GLM Z1 32B' },
            { id: 'openai/o4-mini-high', name: 'OpenAI: o4 Mini High' },
            { id: 'openai/o3', name: 'OpenAI: o3' },
            { id: 'openai/o4-mini', name: 'OpenAI: o4 Mini' },
            { id: 'shisa-ai/shisa-v2-llama-3.3-70b', name: 'Shisa AI: Shisa V2 Llama 3.3 70B' },
            { id: 'openai/gpt-4.1', name: 'OpenAI: GPT-4.1' },
            { id: 'openai/gpt-4.1-mini', name: 'OpenAI: GPT-4.1 Mini' },
            { id: 'openai/gpt-4.1-nano', name: 'OpenAI: GPT-4.1 Nano' },
            { id: 'eleutherai/llemma-7b', name: 'EleutherAI: Llemma 7b' },
            { id: 'alfredpros/codellama-7b-instruct-solidity', name: 'AlfredPros: CodeLLaMa 7B Instruct Solidity' },
            { id: 'arliai/qwq-32b-rpr-v1', name: 'ArliAI: QwQ 32B RpR v1' },
            { id: 'agentica/deepcoder-14b-preview', name: 'Agentica: Deepcoder 14B Preview' },
            { id: 'moonshot/kimi-vl-a3b-thinking', name: 'MoonshotAI: Kimi VL A3B Thinking' },
            { id: 'xai/grok-3-mini-beta', name: 'xAI: Grok 3 Mini Beta' },
            { id: 'xai/grok-3-beta', name: 'xAI: Grok 3 Beta' },
            { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', name: 'NVIDIA: Llama 3.1 Nemotron Ultra 253B v1' },
            { id: 'meta/llama-4-maverick', name: 'Meta: Llama 4 Maverick' },
            { id: 'meta/llama-4-scout', name: 'Meta: Llama 4 Scout' },
            { id: 'allenai/molmo-7b-d', name: 'AllenAI: Molmo 7B D' },
            { id: 'qwen/qwen2.5-vl-32b-instruct', name: 'Qwen: Qwen2.5 VL 32B Instruct' },
            { id: 'deepseek/deepseek-v3-0324', name: 'DeepSeek: DeepSeek V3 0324' },
            { id: 'openai/o1-pro', name: 'OpenAI: o1-pro' },
            { id: 'mistral/mistral-small-3.1-24b', name: 'Mistral: Mistral Small 3.1 24B' },
            { id: 'allenai/olmo-2-32b-instruct', name: 'AllenAI: Olmo 2 32B Instruct' },
            { id: 'google/gemma-3-4b', name: 'Google: Gemma 3 4B' },
            { id: 'google/gemma-3-12b', name: 'Google: Gemma 3 12B' },
            { id: 'cohere/command-a', name: 'Cohere: Command A' },
            { id: 'openai/gpt-4o-mini-search-preview', name: 'OpenAI: GPT-4o-mini Search Preview' },
            { id: 'openai/gpt-4o-search-preview', name: 'OpenAI: GPT-4o Search Preview' },
            { id: 'google/gemma-3-27b', name: 'Google: Gemma 3 27B' },
            { id: 'thedrummer/anubis-pro-105b-v1', name: 'TheDrummer: Anubis Pro 105B V1' },
            { id: 'thedrummer/skyfall-36b-v2', name: 'TheDrummer: Skyfall 36B V2' },
            { id: 'microsoft/phi-4-multimodal-instruct', name: 'Microsoft: Phi 4 Multimodal Instruct' },
            { id: 'perplexity/sonar-reasoning-pro', name: 'Perplexity: Sonar Reasoning Pro' },
            { id: 'perplexity/sonar-pro', name: 'Perplexity: Sonar Pro' },
            { id: 'perplexity/sonar-deep-research', name: 'Perplexity: Sonar Deep Research' },
            { id: 'qwen/qwq-32b', name: 'Qwen: QwQ 32B' },
            { id: 'nous/deehermes-3-llama-3-8b-preview', name: 'Nous: DeepHermes 3 Llama 3 8B Preview' },
            { id: 'google/gemini-2.0-flash-lite', name: 'Google: Gemini 2.0 Flash Lite' },
            { id: 'anthropic/claude-3.7-sonnet', name: 'Anthropic: Claude 3.7 Sonnet' },
            { id: 'anthropic/claude-3.7-sonnet-thinking', name: 'Anthropic: Claude 3.7 Sonnet (thinking)' },
            { id: 'perplexity/r1-1776', name: 'Perplexity: R1 1776' },
            { id: 'mistral/saba', name: 'Mistral: Saba' },
            { id: 'dolphin3.0-r1-mistral-24b', name: 'Dolphin3.0 R1 Mistral 24B' },
            { id: 'dolphin3.0-mistral-24b', name: 'Dolphin3.0 Mistral 24B' },
            { id: 'llama-guard-3-8b', name: 'Llama Guard 3 8B' },
            { id: 'openai/o3-mini-high', name: 'OpenAI: o3 Mini High' },
            { id: 'deepseek/r1-distill-llama-8b', name: 'DeepSeek: R1 Distill Llama 8B' },
            { id: 'google/gemini-2.0-flash', name: 'Google: Gemini 2.0 Flash' },
            { id: 'qwen/qwen-vl-plus', name: 'Qwen: Qwen VL Plus' },
            { id: 'aionlabs/aion-1.0', name: 'AionLabs: Aion-1.0' },
            { id: 'aionlabs/aion-1.0-mini', name: 'AionLabs: Aion-1.0-Mini' },
            { id: 'aionlabs/aion-rp-1.0-8b', name: 'AionLabs: Aion-RP 1.0 (8B)' },
            { id: 'qwen/qwen-vl-max', name: 'Qwen: Qwen VL Max' },
            { id: 'qwen/qwen-turbo', name: 'Qwen: Qwen-Turbo' },
            { id: 'qwen/qwen2.5-vl-72b-instruct', name: 'Qwen: Qwen2.5 VL 72B Instruct' },
            { id: 'qwen/qwen-plus', name: 'Qwen: Qwen-Plus' },
            { id: 'qwen/qwen-max', name: 'Qwen: Qwen-Max' },
            { id: 'openai/o3-mini', name: 'OpenAI: o3 Mini' },
            { id: 'mistral/mistral-small-3', name: 'Mistral: Mistral Small 3' },
            { id: 'deepseek/r1-distill-qwen-32b', name: 'DeepSeek: R1 Distill Qwen 32B' },
            { id: 'deepseek/r1-distill-qwen-14b', name: 'DeepSeek: R1 Distill Qwen 14B' },
            { id: 'perplexity/sonar-reasoning', name: 'Perplexity: Sonar Reasoning' },
            { id: 'perplexity/sonar', name: 'Perplexity: Sonar' },
            { id: 'liquid/lfm-7b', name: 'Liquid: LFM 7B' },
            { id: 'liquid/lfm-3b', name: 'Liquid: LFM 3B' },
            { id: 'deepseek/r1-distill-llama-70b', name: 'DeepSeek: R1 Distill Llama 70B' },
            { id: 'deepseek/r1', name: 'DeepSeek: R1' },
            { id: 'minimax/minimax-01', name: 'MiniMax: MiniMax-01' },
            { id: 'mistral/codestral-2501', name: 'Mistral: Codestral 2501' },
            { id: 'microsoft/phi-4', name: 'Microsoft: Phi 4' },
            { id: 'deepseek/deepseek-v3', name: 'DeepSeek: DeepSeek V3' },
            { id: 'sao10k/llama-3.3-euryale-70b', name: 'Sao10K: Llama 3.3 Euryale 70B' },
            { id: 'openai/o1', name: 'OpenAI: o1' },
            { id: 'cohere/command-r7b-12-2024', name: 'Cohere: Command R7B (12-2024)' },
            { id: 'meta/llama-3.3-70b-instruct', name: 'Meta: Llama 3.3 70B Instruct' },
            { id: 'amazon/nova-lite-1.0', name: 'Amazon: Nova Lite 1.0' },
            { id: 'amazon/nova-micro-1.0', name: 'Amazon: Nova Micro 1.0' },
            { id: 'amazon/nova-pro-1.0', name: 'Amazon: Nova Pro 1.0' },
            { id: 'openai/gpt-4o-2024-11-20', name: 'OpenAI: GPT-4o (2024-11-20)' },
            { id: 'mistral-large-2411', name: 'Mistral Large 2411' },
            { id: 'mistral-large-2407', name: 'Mistral Large 2407' },
            { id: 'mistral/pixtral-large-2411', name: 'Mistral: Pixtral Large 2411' },
            { id: 'qwen2.5-coder-32b-instruct', name: 'Qwen2.5 Coder 32B Instruct' },
            { id: 'sorcererlm-8x22b', name: 'SorcererLM 8x22B' },
            { id: 'thedrummer/unslopnemo-12b', name: 'TheDrummer: UnslopNemo 12B' },
            { id: 'anthropic/claude-3.5-haiku', name: 'Anthropic: Claude 3.5 Haiku' },
            { id: 'anthropic/claude-3.5-haiku-2024-10-22', name: 'Anthropic: Claude 3.5 Haiku (2024-10-22)' },
            { id: 'magnum-v4-72b', name: 'Magnum v4 72B' },
            { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet' },
            { id: 'mistral/ministral-8b', name: 'Mistral: Ministral 8B' },
            { id: 'mistral/ministral-3b', name: 'Mistral: Ministral 3B' },
            { id: 'qwen2.5-7b-instruct', name: 'Qwen2.5 7B Instruct' },
            { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'NVIDIA: Llama 3.1 Nemotron 70B Instruct' },
            { id: 'inflection/inflection-3-productivity', name: 'Inflection: Inflection 3 Productivity' },
            { id: 'inflection/inflection-3-pi', name: 'Inflection: Inflection 3 Pi' },
            { id: 'google/gemini-1.5-flash-8b', name: 'Google: Gemini 1.5 Flash 8B' },
            { id: 'thedrummer/rocinante-12b', name: 'TheDrummer: Rocinante 12B' },
            { id: 'magnum-v2-72b', name: 'Magnum v2 72B' },
            { id: 'meta/llama-3.2-3b-instruct', name: 'Meta: Llama 3.2 3B Instruct' },
            { id: 'meta/llama-3.2-1b-instruct', name: 'Meta: Llama 3.2 1B Instruct' },
            { id: 'meta/llama-3.2-90b-vision-instruct', name: 'Meta: Llama 3.2 90B Vision Instruct' },
            { id: 'meta/llama-3.2-11b-vision-instruct', name: 'Meta: Llama 3.2 11B Vision Instruct' },
            { id: 'qwen2.5-72b-instruct', name: 'Qwen2.5 72B Instruct' },
            { id: 'neversleep/lumimaid-v0.2-8b', name: 'NeverSleep: Lumimaid v0.2 8B' },
            { id: 'openai/o1-mini', name: 'OpenAI: o1-mini' },
            { id: 'openai/o1-mini-2024-09-12', name: 'OpenAI: o1-mini (2024-09-12)' },
            { id: 'mistral/pixtral-12b', name: 'Mistral: Pixtral 12B' },
            { id: 'cohere/command-r+-08-2024', name: 'Cohere: Command R+ (08-2024)' },
            { id: 'cohere/command-r-08-2024', name: 'Cohere: Command R (08-2024)' },
            { id: 'qwen/qwen2.5-vl-7b-instruct', name: 'Qwen: Qwen2.5-VL 7B Instruct' },
            { id: 'sao10k/llama-3.1-euryale-70b-v2.2', name: 'Sao10K: Llama 3.1 Euryale 70B v2.2' },
            { id: 'microsoft/phi-3.5-mini-128k-instruct', name: 'Microsoft: Phi-3.5 Mini 128K Instruct' },
            { id: 'nous/hermes-3-70b-instruct', name: 'Nous: Hermes 3 70B Instruct' },
            { id: 'nous/hermes-3-405b-instruct', name: 'Nous: Hermes 3 405B Instruct' },
            { id: 'openai/chatgpt-4o', name: 'OpenAI: ChatGPT-4o' },
            { id: 'sao10k/llama-3-8b-lunaris', name: 'Sao10K: Llama 3 8B Lunaris' },
            { id: 'openai/gpt-4o-2024-08-06', name: 'OpenAI: GPT-4o (2024-08-06)' },
            { id: 'meta/llama-3.1-405b-base', name: 'Meta: Llama 3.1 405B (base)' },
            { id: 'meta/llama-3.1-8b-instruct', name: 'Meta: Llama 3.1 8B Instruct' },
            { id: 'meta/llama-3.1-405b-instruct', name: 'Meta: Llama 3.1 405B Instruct' },
            { id: 'meta/llama-3.1-70b-instruct', name: 'Meta: Llama 3.1 70B Instruct' },
            { id: 'mistral/mistral-nemo', name: 'Mistral: Mistral Nemo' },
            { id: 'openai/gpt-4o-mini', name: 'OpenAI: GPT-4o-mini' },
            { id: 'openai/gpt-4o-mini-2024-07-18', name: 'OpenAI: GPT-4o-mini (2024-07-18)' },
            { id: 'google/gemma-2-27b', name: 'Google: Gemma 2 27B' },
            { id: 'google/gemma-2-9b', name: 'Google: Gemma 2 9B' },
            { id: 'anthropic/claude-3.5-sonnet-2024-06-20', name: 'Anthropic: Claude 3.5 Sonnet (2024-06-20)' },
            { id: 'sao10k/llama-3-euryale-70b-v2.1', name: 'Sao10k: Llama 3 Euryale 70B v2.1' },
            { id: 'nousresearch/hermes-2-pro-llama-3-8b', name: 'NousResearch: Hermes 2 Pro - Llama-3 8B' },
            { id: 'mistral/mistral-7b-instruct', name: 'Mistral: Mistral 7B Instruct' },
            { id: 'mistral/mistral-7b-instruct-v0.3', name: 'Mistral: Mistral 7B Instruct v0.3' },
            { id: 'microsoft/phi-3-mini-128k-instruct', name: 'Microsoft: Phi-3 Mini 128K Instruct' },
            { id: 'microsoft/phi-3-medium-128k-instruct', name: 'Microsoft: Phi-3 Medium 128K Instruct' },
            { id: 'neversleep/llama-3-lumimaid-70b', name: 'NeverSleep: Llama 3 Lumimaid 70B' },
            { id: 'openai/gpt-4o', name: 'OpenAI: GPT-4o' },
            { id: 'openai/gpt-4o-extended', name: 'OpenAI: GPT-4o (extended)' },
            { id: 'meta/llamaguard-2-8b', name: 'Meta: LlamaGuard 2 8B' },
            { id: 'openai/gpt-4o-2024-05-13', name: 'OpenAI: GPT-4o (2024-05-13)' },
            { id: 'meta/llama-3-8b-instruct', name: 'Meta: Llama 3 8B Instruct' },
            { id: 'meta/llama-3-70b-instruct', name: 'Meta: Llama 3 70B Instruct' },
            { id: 'mistral/mixtral-8x22b-instruct', name: 'Mistral: Mixtral 8x22B Instruct' },
            { id: 'wizardlm-2-8x22b', name: 'WizardLM-2 8x22B' },
            { id: 'openai/gpt-4-turbo', name: 'OpenAI: GPT-4 Turbo' },
            { id: 'anthropic/claude-3-haiku', name: 'Anthropic: Claude 3 Haiku' },
            { id: 'anthropic/claude-3-opus', name: 'Anthropic: Claude 3 Opus' },
            { id: 'mistral-large', name: 'Mistral Large' },
            { id: 'openai/gpt-3.5-turbo-older-v0613', name: 'OpenAI: GPT-3.5 Turbo (older v0613)' },
            { id: 'openai/gpt-4-turbo-preview', name: 'OpenAI: GPT-4 Turbo Preview' },
            { id: 'mistral-small', name: 'Mistral Small' },
            { id: 'mistral-tiny', name: 'Mistral Tiny' },
            { id: 'mistral/mixtral-8x7b-instruct', name: 'Mistral: Mixtral 8x7B Instruct' },
            { id: 'noromaid-20b', name: 'Noromaid 20B' },
            { id: 'goliath-120b', name: 'Goliath 120B' },
            { id: 'auto-router', name: 'Auto Router' },
            { id: 'openai/gpt-4-turbo-older-v1106', name: 'OpenAI: GPT-4 Turbo (older v1106)' },
            { id: 'openai/gpt-3.5-turbo-instruct', name: 'OpenAI: GPT-3.5 Turbo Instruct' },
            { id: 'mistral/mistral-7b-instruct-v0.1', name: 'Mistral: Mistral 7B Instruct v0.1' },
            { id: 'openai/gpt-3.5-turbo-16k', name: 'OpenAI: GPT-3.5 Turbo 16k' },
            { id: 'mancer/weaver-alpha', name: 'Mancer: Weaver (alpha)' },
            { id: 'remm-slerp-13b', name: 'ReMM SLERP 13B' },
            { id: 'mythomax-13b', name: 'MythoMax 13B' },
            { id: 'openai/gpt-3.5-turbo', name: 'OpenAI: GPT-3.5 Turbo' },
            { id: 'openai/gpt-4', name: 'OpenAI: GPT-4' },
            { id: 'openai/gpt-4-older-v0314', name: 'OpenAI: GPT-4 (older v0314)' }
          ];
        } else {
          fallbackModels = AI_PROVIDERS.find(p => p.id === providerId)?.models || [];
        }
        setProviderModels(prev => ({ ...prev, [providerId]: fallbackModels }));
      } finally {
        setIsLoadingModels(prev => ({ ...prev, [providerId]: false }));
      }
    };

    fetchModelsForProvider(selectedProviderId);
  }, [selectedProviderId, providerModels, selectedModelId]);

  const refreshModels = () => {
    setProviderModels(prev => ({ ...prev, [selectedProviderId]: [] }));
    setIsLoadingModels(prev => ({ ...prev, [selectedProviderId]: true }));
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    if (!selectedModelId) {
      setError("Please select a model.");
      return;
    }
    setError(null);
    setIsLoading(true);
    onStartGeneration(prompt, selectedProviderId, selectedModelId);
    // Generation will happen in EditorPage; loading state here for button disable
    setTimeout(() => setIsLoading(false), 1000); // Brief loading to show action taken
  };
  
  const handleHistoryClick = (historicPrompt: string) => {
    setPrompt(historicPrompt);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-white mb-2">
          Vibe Coder
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Describe your application, and let the AI bring it to life.
        </p>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-lg flex flex-col">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A Pomodoro timer with a clean, minimalist interface and a progress circle."
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none p-4 resize-none h-32"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between p-2 border-t border-gray-700 mt-2">
            <div className="flex items-center space-x-2">
              <select
                value={selectedProviderId}
                onChange={e => {
                  setSelectedProviderId(e.target.value);
                  const dynamicModels = providerModels[e.target.value] || [];
                  if (dynamicModels.length > 0) {
                    setSelectedModelId(dynamicModels[0].id);
                  } else {
                    const provider = AI_PROVIDERS.find(p => p.id === e.target.value);
                    const firstModel = provider?.models[0]?.id;
                    if (firstModel) setSelectedModelId(firstModel);
                  }
                }}
                className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {AI_PROVIDERS.map(provider => (
                  <option key={provider.id} value={provider.id}>{provider.name}</option>
                ))}
              </select>
              <select
                value={selectedModelId}
                onChange={e => setSelectedModelId(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || !selectedProvider}
              >
                {selectedProvider?.models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
                {isLoadingModels[selectedProviderId] && (
                  <option disabled>Loading models...</option>
                )}
              </select>
              <button
                onClick={refreshModels}
                disabled={isLoadingModels[selectedProviderId]}
                className="ml-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-xs rounded-md disabled:cursor-not-allowed"
                title="Refresh models"
              >
                {isLoadingModels[selectedProviderId] ? '⟳' : '↻'}
              </button>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim() || !selectedModelId || isLoadingModels[selectedProviderId]}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </>
              ) : <GenerateIcon />}
            </button>
          </div>
        </div>
         {promptHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm text-gray-400 mb-2">Recent Prompts</h3>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {promptHistory.map((p, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(p)}
                  className="bg-gray-800 text-white text-sm px-3 py-1 border border-gray-600 rounded-full hover:bg-gray-700 hover:border-gray-500 transition-colors"
                  title={p}
                >
                  <span className="truncate max-w-xs">{p.length > 50 ? `${p.substring(0, 50)}...` : p}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default LandingPage;
