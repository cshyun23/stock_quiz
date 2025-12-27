/**
 * Cache Utility
 * Manages caching of stock/crypto data to reduce API calls
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

class CacheManager {
  constructor() {
    this.cacheDir = path.join(__dirname, '../../temp');
    this.ensureCacheDir();
  }

  /**
   * Ensure cache directory exists
   */
  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      config.log('CacheManager', 'Cache directory created');
    }
  }

  /**
   * Generate cache key from parameters
   * @param {string} type - 'stock' or 'crypto'
   * @param {string} symbol - Stock symbol or coin ID
   * @param {string} timeframe - Timeframe parameter
   * @returns {string} Cache filename
   */
  getCacheKey(type, symbol, timeframe) {
    return `${type}_${symbol}_${timeframe}.json`;
  }

  /**
   * Get cache file path
   * @param {string} cacheKey - Cache key
   * @returns {string} Full path to cache file
   */
  getCachePath(cacheKey) {
    return path.join(this.cacheDir, cacheKey);
  }

  /**
   * Check if cache exists and is valid
   * @param {string} cacheKey - Cache key
   * @param {number} maxAge - Max age in milliseconds (default: 24 hours)
   * @returns {boolean} True if cache is valid
   */
  isCacheValid(cacheKey, maxAge = 24 * 60 * 60 * 1000) {
    const cachePath = this.getCachePath(cacheKey);
    
    if (!fs.existsSync(cachePath)) {
      return false;
    }

    try {
      const stats = fs.statSync(cachePath);
      const age = Date.now() - stats.mtime.getTime();
      
      if (age > maxAge) {
        config.log('CacheManager', `Cache expired for ${cacheKey}`, { age: `${Math.floor(age / 1000 / 60)} minutes` });
        return false;
      }

      config.log('CacheManager', `Cache valid for ${cacheKey}`, { age: `${Math.floor(age / 1000 / 60)} minutes` });
      return true;
    } catch (error) {
      config.log('CacheManager', `Error checking cache: ${error.message}`);
      return false;
    }
  }

  /**
   * Load data from cache
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} Cached data or null if not found
   */
  loadCache(cacheKey) {
    if (!this.isCacheValid(cacheKey)) {
      return null;
    }

    try {
      const cachePath = this.getCachePath(cacheKey);
      const data = fs.readFileSync(cachePath, 'utf8');
      const parsed = JSON.parse(data);
      
      config.log('CacheManager', `Cache loaded for ${cacheKey}`, { 
        dataPoints: parsed.data?.length || 0 
      });
      
      return parsed;
    } catch (error) {
      config.log('CacheManager', `Error loading cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Save data to cache
   * @param {string} cacheKey - Cache key
   * @param {Object} data - Data to cache
   * @returns {boolean} True if saved successfully
   */
  saveCache(cacheKey, data) {
    try {
      const cachePath = this.getCachePath(cacheKey);
      const cacheData = {
        cachedAt: new Date().toISOString(),
        ...data
      };
      
      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
      
      config.log('CacheManager', `Cache saved for ${cacheKey}`, { 
        dataPoints: data.data?.length || 0,
        size: `${(Buffer.byteLength(JSON.stringify(cacheData)) / 1024).toFixed(2)} KB`
      });
      
      return true;
    } catch (error) {
      config.log('CacheManager', `Error saving cache: ${error.message}`);
      return false;
    }
  }

  /**
   * Clear specific cache
   * @param {string} cacheKey - Cache key to clear
   */
  clearCache(cacheKey) {
    try {
      const cachePath = this.getCachePath(cacheKey);
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
        config.log('CacheManager', `Cache cleared for ${cacheKey}`);
        return true;
      }
    } catch (error) {
      config.log('CacheManager', `Error clearing cache: ${error.message}`);
    }
    return false;
  }

  /**
   * Clear all cache files
   */
  clearAllCache() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      let cleared = 0;
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.cacheDir, file));
          cleared++;
        }
      });
      
      config.log('CacheManager', `Cleared ${cleared} cache files`);
      return cleared;
    } catch (error) {
      config.log('CacheManager', `Error clearing all cache: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    try {
      const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
      let totalSize = 0;
      
      files.forEach(file => {
        const stats = fs.statSync(path.join(this.cacheDir, file));
        totalSize += stats.size;
      });
      
      return {
        count: files.length,
        totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
        files: files
      };
    } catch (error) {
      return {
        count: 0,
        totalSize: '0 KB',
        files: []
      };
    }
  }
}

module.exports = CacheManager;
