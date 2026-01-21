import React, { useState } from 'react';
import { useEditor, EDITOR_ACTIONS } from '../../context/EditorContext';
import OpenRouterService from '../../services/ai/OpenRouterService';
import PromptTemplates from '../../services/ai/PromptTemplates';
import type { AIGameRequest } from '../../types';
import './AIPromptPanel.css';

const AIPromptPanel: React.FC = () => {
  const { dispatch } = useEditor();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const openRouterService = new OpenRouterService();

  const QUICK_PROMPTS = [
    'Create a simple platformer game with a player, platforms, and coins to collect',
    'Make a space shooter game with enemies and power-ups',
    'Build a puzzle game with moving blocks and a goal',
    'Design a side-scrolling adventure with obstacles and collectibles',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setHistory(prev => [prompt, ...prev.slice(0, 9)]); // Keep last 10 prompts

    try {
      const request: AIGameRequest = {
        prompt: prompt.trim(),
        gameType: detectGameType(prompt),
        constraints: {
          maxObjects: 20,
          gameSize: { width: 800, height: 600 }
        }
      };

      const response = await openRouterService.generateGame(request);
      
      if (response.success && response.gameConfig) {
        // Load the generated game into the editor
        dispatch({
          type: EDITOR_ACTIONS.SET_PROJECT,
          payload: response.gameConfig,
          timestamp: new Date()
        });

        setPrompt('');
        
        // Show success message
        console.log('Game generated successfully:', response.explanation);
        if (response.limitations && response.limitations.length > 0) {
          console.warn('Generation limitations:', response.limitations);
        }
      } else {
        setError(response.error || 'Failed to generate game');
      }
    } catch (error) {
      console.error('Failed to generate game:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
  };

  const handleHistoryPrompt = (historyPrompt: string) => {
    setPrompt(historyPrompt);
  };

  const handleRandomPrompt = () => {
    const randomPrompt = PromptTemplates.generateRandomPrompt();
    setPrompt(randomPrompt);
  };

  const detectGameType = (prompt: string): 'platformer' | 'shooter' | 'puzzle' | 'arcade' => {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('platform') || lowerPrompt.includes('jump')) {
      return 'platformer';
    }
    if (lowerPrompt.includes('shoot') || lowerPrompt.includes('space') || lowerPrompt.includes('enemy')) {
      return 'shooter';
    }
    if (lowerPrompt.includes('puzzle') || lowerPrompt.includes('block') || lowerPrompt.includes('solve')) {
      return 'puzzle';
    }
    return 'arcade';
  };

  return (
    <div className="ai-prompt-panel">
      <div className="prompt-header">
        <h3>🤖 AI Game Generator</h3>
        <p>Describe your game idea and let AI create it for you</p>
      </div>

      <div className="prompt-content">
        <form onSubmit={handleSubmit} className="prompt-form">
          <div className="prompt-input-container">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your game idea... (e.g., 'Create a platformer game with a jumping character, moving platforms, and coins to collect')"
              className="prompt-input"
              rows={3}
              disabled={isGenerating}
            />
            <div className="prompt-actions">
              <button
                type="button"
                className="random-button"
                onClick={handleRandomPrompt}
                disabled={isGenerating}
                title="Generate random prompt"
              >
                🎲 Random
              </button>
              <button
                type="submit"
                className={`generate-button ${isGenerating ? 'generating' : ''}`}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="icon">✨</span>
                    Generate Game
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button 
              className="error-dismiss"
              onClick={() => setError(null)}
              title="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        <div className="prompt-suggestions">
          <div className="suggestions-section">
            <h4>Quick Start Ideas</h4>
            <div className="suggestion-buttons">
              {QUICK_PROMPTS.map((quickPrompt, index) => (
                <button
                  key={index}
                  className="suggestion-button"
                  onClick={() => handleQuickPrompt(quickPrompt)}
                  disabled={isGenerating}
                >
                  {quickPrompt}
                </button>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="suggestions-section">
              <h4>Recent Prompts</h4>
              <div className="history-list">
                {history.slice(0, 3).map((historyPrompt, index) => (
                  <button
                    key={index}
                    className="history-button"
                    onClick={() => handleHistoryPrompt(historyPrompt)}
                    disabled={isGenerating}
                    title={historyPrompt}
                  >
                    <span className="history-icon">🕒</span>
                    <span className="history-text">{historyPrompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isGenerating && (
        <div className="generation-status">
          <div className="status-content">
            <div className="status-spinner"></div>
            <div className="status-text">
              <p>AI is creating your game...</p>
              <p className="status-detail">This may take a few moments</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPromptPanel;