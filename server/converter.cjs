/**
 * 统一繁简转换模块
 * 所有繁体转简体的逻辑都使用这个模块
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const CONFIG_PATH = path.join(__dirname, 'char-mappings.json');

// OpenCC 转换器（由外部注入）
let converter = null;

// 缓存的配置
let cachedConfig = null;
let configLastModified = 0;

/**
 * 读取配置文件（带缓存）
 */
function loadConfig() {
  try {
    const stats = fs.statSync(CONFIG_PATH);
    // 如果文件没有修改，使用缓存
    if (cachedConfig && stats.mtimeMs === configLastModified) {
      return cachedConfig;
    }

    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    cachedConfig = JSON.parse(content);
    configLastModified = stats.mtimeMs;
    console.log('[Converter] 已加载字符映射配置');
    return cachedConfig;
  } catch (error) {
    console.error('[Converter] 读取配置文件失败:', error.message);
    // 返回默认配置
    return {
      protectedChars: {},
      customMappings: {}
    };
  }
}

/**
 * 生成保护字符的占位符映射
 */
function getProtectedPlaceholders() {
  const config = loadConfig();
  const PLACEHOLDER_PREFIX = '\uE000';
  return Object.keys(config.protectedChars || {}).map((char, index) => ({
    char,
    placeholder: PLACEHOLDER_PREFIX + String.fromCharCode(0xE001 + index),
    result: config.protectedChars[char]
  }));
}

/**
 * 应用自定义映射
 */
function applyCustomMappings(text) {
  if (!text || typeof text !== 'string') return text;
  const config = loadConfig();
  let result = text;
  for (const [from, to] of Object.entries(config.customMappings || {})) {
    result = result.split(from).join(to);
  }
  return result;
}

/**
 * 设置 OpenCC 转换器
 */
function setConverter(conv) {
  converter = conv;
  console.log('[Converter] OpenCC 转换器已设置');
}

/**
 * 获取转换器
 */
function getConverter() {
  return converter;
}

/**
 * 繁体转简体（单个字符串）
 */
function toSimplified(text) {
  if (!converter) return text;
  if (text === null || text === undefined) return text;

  // 确保是字符串类型
  if (typeof text !== 'string') {
    if (Array.isArray(text)) {
      return text.map(t => toSimplified(t));
    }
    if (typeof text === 'object') {
      return text;
    }
    text = String(text);
  }

  try {
    let result = text;
    const placeholders = getProtectedPlaceholders();

    // 1. 先将保护字符替换为占位符
    for (const { char, placeholder } of placeholders) {
      result = result.split(char).join(placeholder);
    }

    // 2. 用 OpenCC 转换
    result = converter(result);

    // 3. 将占位符替换为目标字符
    for (const { placeholder, result: targetChar } of placeholders) {
      result = result.split(placeholder).join(targetChar);
    }

    // 4. 应用自定义映射修正
    result = applyCustomMappings(result);

    return result;
  } catch (e) {
    console.error('[Converter] 转换失败:', typeof text, text);
    return text;
  }
}

/**
 * 递归转换对象中所有字符串为简体中文
 * @param {*} obj - 要转换的对象
 * @param {string} parentKey - 父级键名
 * @param {Array} pathKeys - 路径键数组
 * @param {Array} skipPaths - 要跳过的路径列表
 */
function convertToSimplified(obj, parentKey = '', pathKeys = [], skipPaths = []) {
  // 默认跳过的路径
  const defaultSkipPaths = [
    'profile.characterName',
    'profile.name',
    'legion.legionName',
    'legion.name',
  ];

  const allSkipPaths = [...defaultSkipPaths, ...skipPaths];

  // 构建当前路径
  const currentPath = [...pathKeys, parentKey].filter(k => k).join('.');

  // 如果当前路径在跳过列表中，直接返回原值
  if (allSkipPaths.some(path => currentPath.endsWith(path))) {
    return obj;
  }

  if (typeof obj === 'string') {
    return toSimplified(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertToSimplified(item, parentKey, pathKeys, skipPaths));
  }

  if (obj !== null && typeof obj === 'object') {
    const converted = {};
    const newPathKeys = parentKey ? [...pathKeys, parentKey] : pathKeys;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertToSimplified(obj[key], key, newPathKeys, skipPaths);
      }
    }
    return converted;
  }

  return obj;
}

/**
 * 重新加载配置（用于热更新）
 */
function reloadConfig() {
  cachedConfig = null;
  configLastModified = 0;
  loadConfig();
}

module.exports = {
  setConverter,
  getConverter,
  toSimplified,
  convertToSimplified,
  reloadConfig,
  loadConfig
};
