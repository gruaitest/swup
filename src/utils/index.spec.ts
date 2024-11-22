import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { query, queryAll, nextTick, isPromise, runAsPromise, forceReflow, getContextualAttr } from './index';

// Setup jsdom environment
let dom: JSDOM;

beforeEach(() => {
  // Initialize a new DOM environment for each test
  dom = new JSDOM(`<!DOCTYPE html><body></body>`);
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
});

describe('query', () => {
  it('should return the first element matching the selector', () => {
    document.body.innerHTML = '<div class="test"></div><div class="test"></div>';
    const element = query('.test');
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element?.className).toBe('test');
  });

  it('should return null if no element matches the selector', () => {
    document.body.innerHTML = '';
    const element = query('.non-existent');
    expect(element).toBeNull();
  });
});

describe('queryAll', () => {
  it('should return all elements matching the selector', () => {
    document.body.innerHTML = '<div class="test"></div><div class="test"></div>';
    const elements = queryAll('.test');
    expect(elements.length).toBe(2);
    elements.forEach(element => expect(element).toBeInstanceOf(HTMLElement));
  });

  it('should return an empty array if no elements match the selector', () => {
    document.body.innerHTML = '';
    const elements = queryAll('.non-existent');
    expect(elements).toEqual([]);
  });
});

describe('nextTick', () => {
  it('should resolve the promise after the next event loop', async () => {
    const callback = vi.fn();
    await nextTick().then(callback);
    expect(callback).toHaveBeenCalled();
  });
});

describe('isPromise', () => {
  it('should return true for a Promise object', () => {
    const promise = new Promise((resolve) => resolve());
    expect(isPromise(promise)).toBe(true);
  });

  it('should return false for a non-Promise object', () => {
    const obj = {};
    expect(isPromise(obj)).toBe(false);
  });

  it('should return false for a function', () => {
    const func = () => {};
    expect(isPromise(func)).toBe(false);
  });
});

describe('runAsPromise', () => {
  it('should resolve with the function result if it is not a promise', async () => {
    const func = vi.fn(() => 42);
    const result = await runAsPromise(func);
    expect(result).toBe(42);
  });

  it('should resolve with the promise result if the function returns a promise', async () => {
    const func = vi.fn(() => Promise.resolve(42));
    const result = await runAsPromise(func);
    expect(result).toBe(42);
  });

  it('should reject if the function throws an error', async () => {
    const func = vi.fn(() => { throw new Error('Test error'); });
    await expect(runAsPromise(func)).rejects.toThrow('Test error');
  });

  it('should reject if the promise returned by the function rejects', async () => {
    const func = vi.fn(() => Promise.reject(new Error('Test error')));
    await expect(runAsPromise(func)).rejects.toThrow('Test error');
  });
});

describe('forceReflow', () => {
  it('should force a reflow on the specified element', () => {
    const element = document.createElement('div');
    const spy = vi.spyOn(element, 'getBoundingClientRect');
    forceReflow(element);
    expect(spy).toHaveBeenCalled();
  });

  it('should force a reflow on document.body if no element is specified', () => {
    const spy = vi.spyOn(document.body, 'getBoundingClientRect');
    forceReflow();
    expect(spy).toHaveBeenCalled();
  });
});

describe('getContextualAttr', () => {
  it('should return the value of the attribute from the closest element', () => {
    document.body.innerHTML = '<div data-test="value"><span id="child"></span></div>';
    const child = document.getElementById('child');
    const value = getContextualAttr(child!, 'data-test');
    expect(value).toBe('value');
  });

  it('should return true if the attribute is present without a value', () => {
    document.body.innerHTML = '<div data-test><span id="child"></span></div>';
    const child = document.getElementById('child');
    const value = getContextualAttr(child!, 'data-test');
    expect(value).toBe(true);
  });

  it('should return undefined if the attribute is not present', () => {
    document.body.innerHTML = '<div><span id="child"></span></div>';
    const child = document.getElementById('child');
    const value = getContextualAttr(child!, 'data-test');
    expect(value).toBeUndefined();
  });
});
