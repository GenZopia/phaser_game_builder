import type { GameProject } from '../../types';

interface StorageQuota {
  used: number;
  available: number;
  total: number;
}

class ProjectStore {
  private static readonly STORAGE_KEY = 'phaser-game-builder-projects';
  private static readonly MAX_PROJECTS = 50;
  private static readonly PROJECT_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB per project

  static async saveProject(project: GameProject): Promise<void> {
    try {
      // Validate project size
      const projectSize = this.calculateProjectSize(project);
      if (projectSize > this.PROJECT_SIZE_LIMIT) {
        throw new Error(`Project too large (${Math.round(projectSize / 1024 / 1024)}MB). Maximum size is 5MB.`);
      }

      // Get existing projects
      const projects = await this.getAllProjects();
      
      // Check if project already exists
      const existingIndex = projects.findIndex(p => p.id === project.id);
      
      if (existingIndex >= 0) {
        // Update existing project
        projects[existingIndex] = {
          ...project,
          updatedAt: new Date()
        };
      } else {
        // Add new project
        if (projects.length >= this.MAX_PROJECTS) {
          throw new Error(`Maximum number of projects (${this.MAX_PROJECTS}) reached. Please delete some projects first.`);
        }
        
        projects.push({
          ...project,
          createdAt: project.createdAt || new Date(),
          updatedAt: new Date()
        });
      }

      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
      
      // Also save to IndexedDB for better storage capacity
      await this.saveToIndexedDB(project);
      
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  static async loadProject(projectId: string): Promise<GameProject | null> {
    try {
      // Try IndexedDB first
      const project = await this.loadFromIndexedDB(projectId);
      if (project) {
        return project;
      }

      // Fallback to localStorage
      const projects = await this.getAllProjects();
      return projects.find(p => p.id === projectId) || null;
      
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  static async getAllProjects(): Promise<GameProject[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const projects = JSON.parse(stored) as GameProject[];
      
      // Convert date strings back to Date objects
      return projects.map(project => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      }));
      
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  static async deleteProject(projectId: string): Promise<void> {
    try {
      const projects = await this.getAllProjects();
      const filteredProjects = projects.filter(p => p.id !== projectId);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredProjects));
      
      // Also delete from IndexedDB
      await this.deleteFromIndexedDB(projectId);
      
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  static async duplicateProject(projectId: string, newName?: string): Promise<GameProject> {
    try {
      const originalProject = await this.loadProject(projectId);
      if (!originalProject) {
        throw new Error('Project not found');
      }

      const duplicatedProject: GameProject = {
        ...originalProject,
        id: `${originalProject.id}_copy_${Date.now()}`,
        name: newName || `${originalProject.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveProject(duplicatedProject);
      return duplicatedProject;
      
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      throw error;
    }
  }

  static async getStorageQuota(): Promise<StorageQuota> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0),
          total: estimate.quota || 0
        };
      }
      
      // Fallback estimation for browsers without storage API
      const projects = await this.getAllProjects();
      const used = projects.reduce((total, project) => total + this.calculateProjectSize(project), 0);
      
      return {
        used,
        available: 50 * 1024 * 1024 - used, // Assume 50MB available
        total: 50 * 1024 * 1024
      };
      
    } catch (error) {
      console.error('Failed to get storage quota:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }

  static async cleanupOldProjects(maxAge: number = 30): Promise<number> {
    try {
      const projects = await this.getAllProjects();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);
      
      const oldProjects = projects.filter(project => 
        project.updatedAt < cutoffDate
      );
      
      for (const project of oldProjects) {
        await this.deleteProject(project.id);
      }
      
      return oldProjects.length;
      
    } catch (error) {
      console.error('Failed to cleanup old projects:', error);
      return 0;
    }
  }

  static async exportProjectData(projectId: string): Promise<string> {
    try {
      const project = await this.loadProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      return JSON.stringify(project, null, 2);
      
    } catch (error) {
      console.error('Failed to export project data:', error);
      throw error;
    }
  }

  static async importProjectData(jsonData: string): Promise<GameProject> {
    try {
      const project = JSON.parse(jsonData) as GameProject;
      
      // Validate basic structure
      if (!project.id || !project.name || !project.gameConfig) {
        throw new Error('Invalid project data structure');
      }

      // Generate new ID to avoid conflicts
      project.id = `imported_${Date.now()}`;
      project.createdAt = new Date();
      project.updatedAt = new Date();

      await this.saveProject(project);
      return project;
      
    } catch (error) {
      console.error('Failed to import project data:', error);
      throw error;
    }
  }

  private static calculateProjectSize(project: GameProject): number {
    return new Blob([JSON.stringify(project)]).size;
  }

  private static async saveToIndexedDB(project: GameProject): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PhaserGameBuilder', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        
        const putRequest = store.put(project);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('projects')) {
          const store = db.createObjectStore('projects', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  private static async loadFromIndexedDB(projectId: string): Promise<GameProject | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('PhaserGameBuilder', 1);
      
      request.onerror = () => resolve(null); // Don't reject, just return null
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        
        const getRequest = store.get(projectId);
        getRequest.onsuccess = () => {
          const project = getRequest.result;
          if (project) {
            // Convert date strings back to Date objects
            project.createdAt = new Date(project.createdAt);
            project.updatedAt = new Date(project.updatedAt);
          }
          resolve(project || null);
        };
        getRequest.onerror = () => resolve(null);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('projects')) {
          const store = db.createObjectStore('projects', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  private static async deleteFromIndexedDB(projectId: string): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.open('PhaserGameBuilder', 1);
      
      request.onerror = () => resolve(); // Don't reject, just resolve
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        
        const deleteRequest = store.delete(projectId);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => resolve(); // Don't reject
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('projects')) {
          const store = db.createObjectStore('projects', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }
}

export default ProjectStore;