import { describe, it, expect } from 'vitest';
import { checkSafety } from './checkSafety';
import type { FoodItem } from './useLogMeal';

const makeFoodItem = (overrides: Partial<FoodItem> = {}): FoodItem => ({
  id: 'test-1',
  name: 'Test Food',
  calories: 100,
  protein: 10,
  carbs: 10,
  fat: 5,
  ingredients: ['oats'],
  ...overrides,
});

describe('checkSafety', () => {
  it('returns safe when allergens is undefined', () => {
    const food = makeFoodItem({ ingredients: ['peanuts'] });
    expect(checkSafety(food, undefined)).toEqual({ safe: true });
  });

  it('returns safe when allergens is empty array', () => {
    const food = makeFoodItem({ ingredients: ['peanuts'] });
    expect(checkSafety(food, [])).toEqual({ safe: true });
  });

  it('returns safe when food contains no allergens', () => {
    const food = makeFoodItem({ ingredients: ['oats', 'water'] });
    expect(checkSafety(food, ['peanuts', 'dairy'])).toEqual({ safe: true });
  });

  it('returns safe when food ingredients list is empty', () => {
    const food = makeFoodItem({ ingredients: [] });
    expect(checkSafety(food, ['peanuts'])).toEqual({ safe: true });
  });

  it('detects a direct allergen match', () => {
    const food = makeFoodItem({ ingredients: ['peanuts', 'bread'] });
    expect(checkSafety(food, ['peanuts'])).toEqual({
      safe: false,
      conflict: 'peanuts',
    });
  });

  it('returns the first conflicting allergen when multiple match', () => {
    const food = makeFoodItem({ ingredients: ['dairy', 'gluten', 'egg'] });
    const result = checkSafety(food, ['gluten', 'dairy']);
    expect(result).toEqual({ safe: false, conflict: 'gluten' });
  });

  it('handles case-insensitive matching (uppercase allergen)', () => {
    const food = makeFoodItem({ ingredients: ['Peanuts'] });
    expect(checkSafety(food, ['peanuts'])).toEqual({
      safe: false,
      conflict: 'peanuts',
    });
  });

  it('handles case-insensitive matching (uppercase ingredient)', () => {
    const food = makeFoodItem({ ingredients: ['peanuts'] });
    expect(checkSafety(food, ['PEANUTS'])).toEqual({
      safe: false,
      conflict: 'peanuts',
    });
  });

  it('handles mixed case in both lists', () => {
    const food = makeFoodItem({ ingredients: ['Soy Lecithin', 'DAIRY'] });
    expect(checkSafety(food, ['Dairy'])).toEqual({
      safe: false,
      conflict: 'dairy',
    });
  });
});
