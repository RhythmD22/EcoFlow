import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const store = {};

function freshLocalStorage() {
  for (const key of Object.keys(store)) delete store[key];
  return store;
}

globalThis.localStorage = {
  getItem(key) { return store[key] ?? null; },
  setItem(key, val) { store[key] = val; },
  removeItem(key) { delete store[key]; },
};

export { store, freshLocalStorage };