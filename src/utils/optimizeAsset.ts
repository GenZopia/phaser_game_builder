/**
 * Asset optimization utilities for the Phaser Game Builder
 */

export interface OptimizationOptions {
  quality?: number; // 0-1 for image quality
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
  removeMetadata?: boolean;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  blob: Blob;
  dataUrl: string;
}

/**
 * Optimize an image file
 */
const optimizeAsset = async (
  file: File, 
  options: OptimizationOptions = {}
): Promise<OptimizationResult> => {
  const {
    quality = 0.8,
    maxWidth = 1024,
    maxHeight = 1024,
    format = 'jpeg'
  } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files can be optimized');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions
        const { width, height } = calculateOptimalDimensions(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        );

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and resize image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create optimized blob'));
              return;
            }

            // Create data URL
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              
              const result: OptimizationResult = {
                originalSize: file.size,
                optimizedSize: blob.size,
                compressionRatio: blob.size / file.size,
                blob,
                dataUrl
              };

              resolve(result);
            };
            reader.onerror = () => reject(new Error('Failed to create data URL'));
            reader.readAsDataURL(blob);
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let width = originalWidth;
  let height = originalHeight;

  // Calculate scaling factor
  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const scalingFactor = Math.min(widthRatio, heightRatio, 1); // Don't upscale

  width = Math.round(originalWidth * scalingFactor);
  height = Math.round(originalHeight * scalingFactor);

  return { width, height };
};

/**
 * Optimize multiple images in batch
 */
export const optimizeAssetBatch = async (
  files: File[],
  options: OptimizationOptions = {}
): Promise<OptimizationResult[]> => {
  const results: OptimizationResult[] = [];
  
  for (const file of files) {
    try {
      const result = await optimizeAsset(file, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to optimize ${file.name}:`, error);
      // Continue with other files
    }
  }
  
  return results;
};

/**
 * Get recommended optimization settings based on file size and type
 */
export const getRecommendedOptimization = (file: File): OptimizationOptions => {
  const sizeInMB = file.size / (1024 * 1024);
  
  // Large files need more aggressive optimization
  if (sizeInMB > 5) {
    return {
      quality: 0.6,
      maxWidth: 512,
      maxHeight: 512,
      format: 'jpeg',
      removeMetadata: true
    };
  }
  
  // Medium files
  if (sizeInMB > 2) {
    return {
      quality: 0.7,
      maxWidth: 768,
      maxHeight: 768,
      format: 'jpeg',
      removeMetadata: true
    };
  }
  
  // Small files - light optimization
  return {
    quality: 0.85,
    maxWidth: 1024,
    maxHeight: 1024,
    format: file.type.includes('png') ? 'png' : 'jpeg',
    removeMetadata: true
  };
};

/**
 * Validate if optimization is needed
 */
export const shouldOptimizeAsset = (file: File): boolean => {
  // Don't optimize very small files
  if (file.size < 50 * 1024) { // 50KB
    return false;
  }
  
  // Always optimize large files
  if (file.size > 1024 * 1024) { // 1MB
    return true;
  }
  
  // Check if it's an image type that benefits from optimization
  const optimizableTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff'];
  return optimizableTypes.includes(file.type);
};

/**
 * Create a thumbnail from an image
 */
export const createThumbnail = async (
  file: File,
  size: number = 128
): Promise<string> => {
  const options: OptimizationOptions = {
    quality: 0.7,
    maxWidth: size,
    maxHeight: size,
    format: 'jpeg',
    removeMetadata: true
  };
  
  const result = await optimizeAsset(file, options);
  return result.dataUrl;
};

/**
 * Estimate the final size after optimization
 */
export const estimateOptimizedSize = (
  originalSize: number,
  options: OptimizationOptions = {}
): number => {
  const { quality = 0.8, maxWidth = 1024, maxHeight = 1024 } = options;
  
  // Rough estimation based on quality and size reduction
  let estimatedRatio = quality;
  
  // Factor in dimension reduction (assuming average case)
  const dimensionReduction = Math.min(maxWidth / 1920, maxHeight / 1080, 1);
  estimatedRatio *= dimensionReduction;
  
  return Math.round(originalSize * estimatedRatio);
};

/**
 * Convert image to different format
 */
export const convertImageFormat = async (
  file: File,
  targetFormat: 'jpeg' | 'png' | 'webp',
  quality: number = 0.8
): Promise<Blob> => {
  const result = await optimizeAsset(file, {
    format: targetFormat,
    quality,
    maxWidth: 4096, // Don't resize, just convert
    maxHeight: 4096
  });
  
  return result.blob;
};

/**
 * Remove metadata from image
 */
export const removeImageMetadata = async (file: File): Promise<Blob> => {
  const result = await optimizeAsset(file, {
    quality: 1.0, // Don't compress
    maxWidth: 4096, // Don't resize
    maxHeight: 4096,
    removeMetadata: true
  });
  
  return result.blob;
};

/**
 * Get image information
 */
export const getImageInfo = (file: File): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
  megapixels: number;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        megapixels: (img.width * img.height) / 1000000
      });
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export default optimizeAsset;