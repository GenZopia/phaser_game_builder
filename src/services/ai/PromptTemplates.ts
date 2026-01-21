// Prompt templates for different game types and scenarios

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  gameType?: string;
  tags: string[];
}

export const GAME_TYPE_TEMPLATES: PromptTemplate[] = [
  {
    id: 'platformer-basic',
    name: 'Basic Platformer',
    description: 'Simple platformer with jumping and collecting',
    gameType: 'platformer',
    template: 'Create a platformer game with a player character that can jump, platforms to navigate, and {collectibles} to collect. Include {enemies} enemies and a goal to reach.',
    tags: ['platformer', 'jumping', 'collecting']
  },
  {
    id: 'shooter-space',
    name: 'Space Shooter',
    description: 'Top-down or side-scrolling space shooter',
    gameType: 'shooter',
    template: 'Create a space shooter game with a player ship that can move and shoot. Include {enemies} enemy ships, power-ups, and waves of enemies to defeat.',
    tags: ['shooter', 'space', 'combat']
  },
  {
    id: 'puzzle-blocks',
    name: 'Block Puzzle',
    description: 'Puzzle game with movable blocks',
    gameType: 'puzzle',
    template: 'Create a puzzle game with movable blocks, switches, and goals. The player must push blocks to solve puzzles and reach the exit.',
    tags: ['puzzle', 'blocks', 'logic']
  },
  {
    id: 'arcade-collect',
    name: 'Arcade Collector',
    description: 'Fast-paced collecting game',
    gameType: 'arcade',
    template: 'Create an arcade-style game where the player must collect {collectibles} items while avoiding {enemies} obstacles. Include a timer and score system.',
    tags: ['arcade', 'collecting', 'score']
  }
];

export const MECHANIC_TEMPLATES: PromptTemplate[] = [
  {
    id: 'physics-gravity',
    name: 'Gravity Physics',
    description: 'Games with realistic gravity and physics',
    template: 'Add realistic gravity physics where objects fall down and bounce when they hit surfaces.',
    tags: ['physics', 'gravity', 'realistic']
  },
  {
    id: 'movement-platformer',
    name: 'Platformer Movement',
    description: 'Classic platformer movement with jumping',
    template: 'Implement platformer movement where the player can move left/right and jump. Include double-jump ability.',
    tags: ['movement', 'platformer', 'jumping']
  },
  {
    id: 'combat-shooting',
    name: 'Shooting Combat',
    description: 'Projectile-based combat system',
    template: 'Add shooting mechanics where the player can fire projectiles to defeat enemies.',
    tags: ['combat', 'shooting', 'projectiles']
  },
  {
    id: 'collection-items',
    name: 'Item Collection',
    description: 'Collectible items with scoring',
    template: 'Include collectible items that give points when collected and disappear from the game.',
    tags: ['collection', 'items', 'scoring']
  }
];

export const DIFFICULTY_TEMPLATES: PromptTemplate[] = [
  {
    id: 'easy-beginner',
    name: 'Beginner Friendly',
    description: 'Easy difficulty for new players',
    template: 'Make the game easy with slow enemies, forgiving physics, and clear visual feedback.',
    tags: ['easy', 'beginner', 'forgiving']
  },
  {
    id: 'medium-balanced',
    name: 'Balanced Challenge',
    description: 'Medium difficulty with fair challenges',
    template: 'Create a balanced challenge with moderate enemy speed and reasonable jump distances.',
    tags: ['medium', 'balanced', 'fair']
  },
  {
    id: 'hard-challenging',
    name: 'Challenging',
    description: 'Difficult gameplay for experienced players',
    template: 'Make the game challenging with fast enemies, precise platforming, and limited lives.',
    tags: ['hard', 'challenging', 'precise']
  }
];

export const THEME_TEMPLATES: PromptTemplate[] = [
  {
    id: 'theme-space',
    name: 'Space Theme',
    description: 'Sci-fi space setting',
    template: 'Set the game in space with stars, planets, spaceships, and alien enemies.',
    tags: ['space', 'sci-fi', 'aliens']
  },
  {
    id: 'theme-forest',
    name: 'Forest Theme',
    description: 'Natural forest environment',
    template: 'Create a forest setting with trees, animals, and natural platforms made of wood and stone.',
    tags: ['forest', 'nature', 'animals']
  },
  {
    id: 'theme-dungeon',
    name: 'Dungeon Theme',
    description: 'Dark underground dungeon',
    template: 'Design a dungeon environment with stone walls, torches, treasure chests, and monster enemies.',
    tags: ['dungeon', 'underground', 'monsters']
  },
  {
    id: 'theme-city',
    name: 'City Theme',
    description: 'Urban cityscape setting',
    template: 'Create an urban city environment with buildings, cars, and modern obstacles.',
    tags: ['city', 'urban', 'modern']
  }
];

class PromptTemplates {
  static getAllTemplates(): PromptTemplate[] {
    return [
      ...GAME_TYPE_TEMPLATES,
      ...MECHANIC_TEMPLATES,
      ...DIFFICULTY_TEMPLATES,
      ...THEME_TEMPLATES
    ];
  }

  static getTemplatesByTag(tag: string): PromptTemplate[] {
    return this.getAllTemplates().filter(template => 
      template.tags.includes(tag)
    );
  }

  static getTemplateById(id: string): PromptTemplate | undefined {
    return this.getAllTemplates().find(template => template.id === id);
  }

  static getGameTypeTemplates(): PromptTemplate[] {
    return GAME_TYPE_TEMPLATES;
  }

  static buildPromptFromTemplate(templateId: string, variables: Record<string, string> = {}): string {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template with id "${templateId}" not found`);
    }

    let prompt = template.template;
    
    // Replace variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
    });

    // Set default values for common placeholders
    const defaults = {
      '{collectibles}': '5-10',
      '{enemies}': '3-5',
      '{platforms}': '8-12'
    };

    Object.entries(defaults).forEach(([placeholder, defaultValue]) => {
      prompt = prompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), defaultValue);
    });

    return prompt;
  }

  static generateRandomPrompt(): string {
    const gameTypeTemplate = GAME_TYPE_TEMPLATES[Math.floor(Math.random() * GAME_TYPE_TEMPLATES.length)];
    const themeTemplate = THEME_TEMPLATES[Math.floor(Math.random() * THEME_TEMPLATES.length)];
    const difficultyTemplate = DIFFICULTY_TEMPLATES[Math.floor(Math.random() * DIFFICULTY_TEMPLATES.length)];

    const gamePrompt = this.buildPromptFromTemplate(gameTypeTemplate.id);
    const themePrompt = this.buildPromptFromTemplate(themeTemplate.id);
    const difficultyPrompt = this.buildPromptFromTemplate(difficultyTemplate.id);

    return `${gamePrompt} ${themePrompt} ${difficultyPrompt}`;
  }

  static suggestImprovements(prompt: string): string[] {
    const suggestions: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // Check for missing elements
    if (!lowerPrompt.includes('player') && !lowerPrompt.includes('character')) {
      suggestions.push('Consider specifying what type of player character you want');
    }

    if (!lowerPrompt.includes('goal') && !lowerPrompt.includes('objective') && !lowerPrompt.includes('win')) {
      suggestions.push('Add a clear goal or win condition for the game');
    }

    if (!lowerPrompt.includes('enemy') && !lowerPrompt.includes('obstacle') && !lowerPrompt.includes('challenge')) {
      suggestions.push('Include some enemies or obstacles to make the game challenging');
    }

    if (!lowerPrompt.includes('collect') && !lowerPrompt.includes('score') && !lowerPrompt.includes('points')) {
      suggestions.push('Consider adding collectible items or a scoring system');
    }

    // Check for vague descriptions
    if (lowerPrompt.includes('some') || lowerPrompt.includes('few') || lowerPrompt.includes('many')) {
      suggestions.push('Try to be more specific about quantities (e.g., "5 enemies" instead of "some enemies")');
    }

    if (prompt.length < 50) {
      suggestions.push('Provide more details about your game idea for better results');
    }

    return suggestions;
  }
}

export default PromptTemplates;