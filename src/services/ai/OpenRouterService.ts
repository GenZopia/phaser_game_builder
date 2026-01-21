import type { AIGameRequest, AIGameResponse } from '../../types';

class OpenRouterService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.model = import.meta.env.VITE_OPENROUTER_MODEL || 'mistralai/devstral-2512:free';
    this.baseUrl = import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    if (!this.apiKey) {
      console.warn('OpenRouter API key not found. AI features will not work.');
    }
  }

  async generateGame(request: AIGameRequest): Promise<AIGameResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenRouter API key not configured'
      };
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(request);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Phaser Game Builder'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated from AI');
      }

      const aiResponse = data.choices[0].message.content;
      return this.parseAIResponse(aiResponse, request);

    } catch (error) {
      console.error('OpenRouter API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private buildSystemPrompt(): string {
    return `You are a Phaser 3 game development assistant. Generate game configurations based on user prompts.

Available game objects:
- Player sprites (platformer character, spaceship, etc.)
- Platforms (ground, floating platforms, walls)
- Collectibles (coins, gems, power-ups)
- Enemies (basic AI, patrol patterns)
- Backgrounds (parallax scrolling, static)

Respond with a JSON configuration that includes:
1. Scene setup (dimensions, physics)
2. Game objects with positions and properties
3. Basic game mechanics and win conditions
4. Asset requirements

Keep games simple and playable. Focus on core mechanics over complex features.

Response format should be valid JSON with this structure:
{
  "gameConfig": {
    "width": 800,
    "height": 600,
    "backgroundColor": "#2c3e50",
    "physics": {
      "default": "arcade",
      "arcade": {
        "gravity": { "y": 300 },
        "debug": false
      }
    }
  },
  "scenes": [{
    "id": "main-scene",
    "name": "Main Scene",
    "objects": [
      {
        "id": "player-1",
        "type": "player",
        "position": { "x": 100, "y": 400 },
        "scale": { "x": 1, "y": 1 },
        "rotation": 0,
        "properties": {
          "hasPhysics": true,
          "isStatic": false,
          "bounce": 0.2,
          "friction": 1,
          "speed": 200,
          "jumpPower": 400
        },
        "behaviors": []
      }
    ],
    "background": {
      "type": "color",
      "value": "#87CEEB"
    },
    "physics": {
      "gravity": { "x": 0, "y": 300 },
      "bounds": { "x": 0, "y": 0, "width": 800, "height": 600 },
      "debug": false
    },
    "camera": {
      "x": 0,
      "y": 0,
      "width": 800,
      "height": 600
    }
  }],
  "assets": [],
  "explanation": "Brief explanation of the generated game",
  "limitations": ["Any limitations or assumptions made"]
}`;
  }

  private buildUserPrompt(request: AIGameRequest): string {
    let prompt = `Create a Phaser game based on this description: "${request.prompt}"`;

    if (request.gameType) {
      prompt += `\nGame type: ${request.gameType}`;
    }

    if (request.constraints) {
      prompt += `\nConstraints:`;
      if (request.constraints.maxObjects) {
        prompt += `\n- Maximum ${request.constraints.maxObjects} objects`;
      }
      if (request.constraints.gameSize) {
        prompt += `\n- Game size: ${request.constraints.gameSize.width}x${request.constraints.gameSize.height}`;
      }
      if (request.constraints.availableAssets) {
        prompt += `\n- Available assets: ${request.constraints.availableAssets.join(', ')}`;
      }
    }

    prompt += `\n\nRequirements:
- Use only the available game objects and assets
- Include clear win/lose conditions
- Ensure the game is playable and fun
- Provide object positions that make sense
- Include basic physics where appropriate

Return the response as valid JSON only, no additional text.`;

    return prompt;
  }

  private parseAIResponse(aiResponse: string, request: AIGameRequest): AIGameResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const gameData = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!gameData.gameConfig || !gameData.scenes || !Array.isArray(gameData.scenes)) {
        throw new Error('Invalid game configuration structure');
      }

      // Create a complete GameProject object
      const gameProject = {
        id: `ai-generated-${Date.now()}`,
        name: `AI Generated Game`,
        description: request.prompt,
        createdAt: new Date(),
        updatedAt: new Date(),
        gameConfig: gameData.gameConfig,
        scenes: gameData.scenes,
        assets: gameData.assets || [],
        metadata: {
          version: '1.0.0',
          tags: ['ai-generated'],
          thumbnail: undefined
        }
      };

      return {
        success: true,
        gameConfig: gameProject,
        explanation: gameData.explanation || 'Game generated successfully',
        limitations: gameData.limitations || []
      };

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        success: false,
        error: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`
      };
    }
  }

  // Test the API connection
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Phaser Game Builder'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

export default OpenRouterService;