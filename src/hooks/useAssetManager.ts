import { useState, useCallback, useEffect } from 'react';
import type { AssetReference } from '../types';
import AssetLoader from '../game/AssetLoader';

interface AssetManagerHook {
  // Asset operations
  uploadAsset: (file: File) => Promise<AssetReference>;
  removeAsset: (assetId: string) => void;
  getAsset: (assetId: string) => AssetReference | undefined;
  getAllAssets: () => AssetReference[];
  
  // Asset validation
  validateAssetFile: (file: File) => string[];
  
  // Asset organization
  getAssetsByType: (type: 'image' | 'audio' | 'json') => AssetReference[];
  searchAssets: (query: string) => AssetReference[];
  
  // Storage management
  getStorageUsage: () => { used: number; available: number; total: number };
  clearAssetCache: () => void;
  
  // State
  assets: AssetReference[];
  isLoading: boolean;
  error: string | null;
}

const useAssetManager = (): AssetManagerHook => {
  const [assets, setAssets] = useState<AssetReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load assets from localStorage on mount
  useEffect(() => {
    loadAssetsFromStorage();
  }, []);

  const loadAssetsFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('phaser-game-builder-assets');
      if (stored) {
        const parsedAssets = JSON.parse(stored) as AssetReference[];
        setAssets(parsedAssets);
      }
    } catch (err) {
      console.error('Failed to load assets from storage:', err);
      setError('Failed to load assets from storage');
    }
  }, []);

  const saveAssetsToStorage = useCallback((updatedAssets: AssetReference[]) => {
    try {
      localStorage.setItem('phaser-game-builder-assets', JSON.stringify(updatedAssets));
    } catch (err) {
      console.error('Failed to save assets to storage:', err);
      setError('Failed to save assets to storage');
    }
  }, []);

  const uploadAsset = useCallback(async (file: File): Promise<AssetReference> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate file
      const validationErrors = AssetLoader.validateAssetFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Generate unique ID
      const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Create data URL for the file
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Create asset reference
      const assetRef = AssetLoader.createAssetReference(file, assetId, dataUrl);

      // Add dimensions for images
      if (assetRef.type === 'image') {
        const dimensions = await getImageDimensions(dataUrl);
        assetRef.metadata.dimensions = dimensions;
      }

      // Add duration for audio (placeholder - would need actual audio analysis)
      if (assetRef.type === 'audio') {
        assetRef.metadata.duration = 0; // Placeholder
      }

      // Update assets list
      const updatedAssets = [...assets, assetRef];
      setAssets(updatedAssets);
      saveAssetsToStorage(updatedAssets);

      return assetRef;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload asset';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [assets, saveAssetsToStorage]);

  const removeAsset = useCallback((assetId: string) => {
    const updatedAssets = assets.filter(asset => asset.id !== assetId);
    setAssets(updatedAssets);
    saveAssetsToStorage(updatedAssets);
  }, [assets, saveAssetsToStorage]);

  const getAsset = useCallback((assetId: string): AssetReference | undefined => {
    return assets.find(asset => asset.id === assetId);
  }, [assets]);

  const getAllAssets = useCallback((): AssetReference[] => {
    return [...assets];
  }, [assets]);

  const validateAssetFile = useCallback((file: File): string[] => {
    return AssetLoader.validateAssetFile(file);
  }, []);

  const getAssetsByType = useCallback((type: 'image' | 'audio' | 'json'): AssetReference[] => {
    return assets.filter(asset => asset.type === type);
  }, [assets]);

  const searchAssets = useCallback((query: string): AssetReference[] => {
    if (!query.trim()) return assets;
    
    const lowerQuery = query.toLowerCase();
    return assets.filter(asset => 
      asset.name.toLowerCase().includes(lowerQuery) ||
      asset.type.toLowerCase().includes(lowerQuery)
    );
  }, [assets]);

  const getStorageUsage = useCallback(() => {
    const totalSize = assets.reduce((sum, asset) => sum + asset.metadata.size, 0);
    const maxStorage = 50 * 1024 * 1024; // 50MB limit
    
    return {
      used: totalSize,
      available: maxStorage - totalSize,
      total: maxStorage
    };
  }, [assets]);

  const clearAssetCache = useCallback(() => {
    setAssets([]);
    localStorage.removeItem('phaser-game-builder-assets');
  }, []);

  return {
    // Asset operations
    uploadAsset,
    removeAsset,
    getAsset,
    getAllAssets,
    
    // Asset validation
    validateAssetFile,
    
    // Asset organization
    getAssetsByType,
    searchAssets,
    
    // Storage management
    getStorageUsage,
    clearAssetCache,
    
    // State
    assets,
    isLoading,
    error
  };
};

// Helper function to get image dimensions
const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = dataUrl;
  });
};

export default useAssetManager;