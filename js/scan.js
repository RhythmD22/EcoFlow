import { MAX_RECENT_SCANS } from './constants.js';

const EcoScan = (() => {
  'use strict';

  const API_BASE = 'https://world.openfoodfacts.org/api/v3.6/product';
  const USER_AGENT = 'EcoFlow/1.0';
  const RECENT_KEY = 'ecoflow_recent_scans';

  async function lookupBarcode(barcode) {
    const clean = barcode.replace(/\D/g, '');
    if (!clean) return { error: 'Please enter a valid barcode.' };

    try {
      const response = await fetch(`${API_BASE}/${clean}.json`, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!response.ok) {
        if (response.status === 429) return { error: 'Too many requests. Please wait a moment.' };
        return { error: 'Unable to reach Open Food Facts. Check your connection.' };
      }

      const data = await response.json();
      if (data.status === 'failure' || !data.product) {
        return { error: 'Product not found in the database. Try another barcode.' };
      }

      return { product: data.product };
    } catch {
      return { error: 'Network error. Check your connection and try again.' };
    }
  }

  function extractProductInfo(product) {
    return {
      name: product.product_name || product.generic_name || 'Unknown product',
      brand: product.brands || '',
      image: product.image_url || product.image_small_url || '',
      ecoscoreGrade: product.ecoscore_grade ? product.ecoscore_grade.toUpperCase() : null,
      ecoscoreScore: product.ecoscore_score,
      packaging: formatPackaging(product),
      origins: formatOrigins(product),
      labels: formatLabels(product),
    };
  }

  function formatPackaging(product) {
    if (!product.packaging) return 'Not available';

    if (typeof product.packaging === 'string') {
      return product.packaging.replace(/en:/g, '').replace(/,/g, ', ');
    }

    const tags = product.packaging_tags || [];
    const clean = tags.map(t => t.replace(/^en:/, '').replace(/-/g, ' '));
    return clean.length ? clean.join(', ') : 'Not available';
  }

  function formatOrigins(product) {
    const origins = product.origins || product.origins_tags || [];
    const tags = Array.isArray(origins) ? origins : [origins];
    const clean = tags.map(o => {
      const str = typeof o === 'string' ? o : (o.name || '');
      return str.replace(/^en:/, '').replace(/-/g, ' ');
    });
    return clean.filter(Boolean).join(', ') || 'Not available';
  }

  function formatLabels(product) {
    const tags = product.labels_tags || [];
    const clean = tags
      .map(l => l.replace(/^en:/, '').replace(/-/g, ' '))
      .filter(l => !['', 'unknown'].includes(l));
    return clean.length ? clean.join(', ') : 'None';
  }

  function getEcoScoreColor(grade) {
    const map = { A: '#1e7e34', B: '#4caf50', C: '#9e9d24', D: '#e65100', E: '#e53935' };
    return map[grade] || 'var(--text-tertiary)';
  }

  function getEcoScoreDescription(grade) {
    const map = {
      A: 'Very low environmental impact',
      B: 'Low environmental impact',
      C: 'Moderate environmental impact',
      D: 'High environmental impact',
      E: 'Very high environmental impact',
    };
    return map[grade] || '';
  }

  function saveRecentScan(barcode, info) {
    let recent = [];
    try {
      recent = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch { /* ignore */ }

    recent = recent.filter(r => r.barcode !== barcode);
    recent.unshift({ barcode, name: info.name, grade: info.ecoscoreGrade, image: info.image, ts: Date.now() });

    if (recent.length > MAX_RECENT_SCANS) recent = recent.slice(0, MAX_RECENT_SCANS);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }

  function getRecentScans() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch {
      return [];
    }
  }

  function coachPrompt(info) {
    const parts = [`I just looked up "${info.name}"`];
    if (info.brand) parts.push(`by ${info.brand}`);
    parts.push('.');
    if (info.ecoscoreGrade) parts.push(` Its Eco-Score is ${info.ecoscoreGrade}.`);
    if (info.packaging && info.packaging !== 'Not available') parts.push(` Packaging: ${info.packaging}.`);
    parts.push(' What are some more sustainable alternatives I could switch to?');
    return parts.join('');
  }

  return {
    lookupBarcode,
    extractProductInfo,
    getEcoScoreColor,
    getEcoScoreDescription,
    saveRecentScan,
    getRecentScans,
    coachPrompt,
  };
})();

export { EcoScan };