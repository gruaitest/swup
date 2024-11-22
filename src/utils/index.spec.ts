import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  query,
  queryAll,
  nextTick,
  isPromise,
  runAsPromise,
  forceReflow,
  getContextualAttr,
} from './index';

// Set up a jsdom environment
beforeEach(() => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  vi.useFakeTimers();
});

describe('query', () => {
  it('should return the first element matching the selector', () => {
    document.body.innerHTML = `<div class="test"></div><div class="test"></div>`;
    const result = query('.test');
    expect(result).toBeInstanceOf(window.HTMLElement);
    expect(result?.classList.contains('test')).toBe(true);
  });

  it('should return null if no elements match the selector', () => {
    document.body.innerHTML = `<div class="test"></div>`;
    const result = query('.nonexistent');
    expect(result).toBeNull();
  });
});

describe('queryAll', () => {
  it('should return all elements matching the selector', () => {
    document.body.innerHTML = `<div class="test"></div><div class="test"></div>`;
    const result = queryAll('.test');
    expect(result).toHaveLength(2);
    result.forEach(element => expect(element.classList.contains('test')).toBe(true));
  });

  it('should return an empty array if no elements match the selector', () => {
    document.body.innerHTML = `<div class="test"></div>`;
    const result = queryAll('.nonexistent');
    expect(result).toHaveLength(0);
  });
});

describe('nextTick', () => {
  it('should resolve after the next event loop', async () => {
    const mockFn = vi.fn();
    nextTick().then(mockFn);
    expect(mockFn).not.toHaveBeenCalled();
    vi.runAllTimers(); // Run all timers to simulate two requestAnimationFrame
    await Promise.resolve(); // Ensure all promises are resolved
    expect(mockFn).toHaveBeenCalled();
  });
});

describe('isPromise', () => {
  it('should return true for a Promise-like object', () => {
    const promiseLike = { then: () => {} };
    expect(isPromise(promiseLike)).toBe(true);
  });

  it('should return false for non-Promise-like objects', () => {
    expect(isPromise(null)).toBe(false);
    expect(isPromise({})).toBe(false);
    expect(isPromise(() => {})).toBe(false);
  });
});

describe('runAsPromise', () => {
  it('should resolve with the value if the function returns a non-Promise', async () => {
    const result = await runAsPromise(() => 'value');
    expect(result).toBe('value');
  });

  it('should resolve with the value if the function returns a Promise', async () => {
    const result = await runAsPromise(() => Promise.resolve('value'));
    expect(result).toBe('value');
  });

  it('should reject if the function throws an error', async () => {
    await expect(runAsPromise(() => { throw new Error('error'); })).rejects.toThrow('error');
  });

  it('should reject if the function returns a rejected Promise', async () => {
    await expect(runAsPromise(() => Promise.reject(new Error('error')))).rejects.toThrow('error');
  });
});

describe('forceReflow', () => {
  it('should force a reflow on the given element', () => {
    const element = document.createElement('div');
    const spy = vi.spyOn(element, 'getBoundingClientRect');
    forceReflow(element);
    expect(spy).toHaveBeenCalled();
  });

  it('should force a reflow on the document body if no element is provided', () => {
    const spy = vi.spyOn(document.body, 'getBoundingClientRect');
    forceReflow();
    expect(spy).toHaveBeenCalled();
  });
});

describe('getContextualAttr', () => {
  it('should return the attribute value from the closest element', () => {
    document.body.innerHTML = `<div data-test="value"><span id="child"></span></div>`;
    const child = document.getElementById('child');
    const result = getContextualAttr(child, 'data-test');
    expect(result).toBe('value');
  });

  it('should return true if the attribute is present without a value', () => {
    document.body.innerHTML = `<div data-test><span id="child"></span></div>`;
    const child = document.getElementById('child');
    const result = getContextualAttr(child, 'data-test');
    expect(result).toBe(true);
  });

  it('should return undefined if no element with the attribute is found', () => {
    document.body.innerHTML = `<div><span id="child"></span></div>`;
    const child = document.getElementById('child');
    const result = getContextualAttr(child, 'data-test');
    expect(result).toBeUndefined();
  });
});
