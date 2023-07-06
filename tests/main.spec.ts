import { test, expect } from '@playwright/test';

import type Swup from '../src/Swup.js';

import {
	clickOnLink,
	expectToHaveClasses,
	expectNotToHaveClasses,
	expectRequestHeaders,
	expectToBeAt,
	expectToHaveCacheEntry,
	expectToHaveReloadedAfterAction,
	loadWithSwup
} from './support/commands.js';

test.beforeEach(async ({ page }) => {
	await page.goto('/page-1.html');
})

test.describe('request', () => {
	test('should send the correct referer', async ({ page, baseURL }) => {
		const referer = `${baseURL}/page-1.html`;
		const [request] = await Promise.all([
			page.waitForRequest('/page-2.html'),
			clickOnLink(page, '/page-2.html')
		]);
		expectRequestHeaders(request, { referer });
	});

	test('should send the correct request headers', async ({ page }) => {
		const [request] = await Promise.all([
			page.waitForRequest('/page-2.html'),
			clickOnLink(page, '/page-2.html')
		]);
		const headers = await page.evaluate(() => window._swup.options.requestHeaders);
		expectRequestHeaders(request, headers);
	});

	test('should force-load on server error', async ({ page }) => {
		await page.route('/error-500.html', route => route.fulfill({ status: 500 }));
		await expectToHaveReloadedAfterAction(page, async () => {
			await loadWithSwup(page, '/error-500.html');
		});
		await expectToBeAt(page, '/error-500.html');
	});

	test('should force-load on network error', async ({ page }) => {
		await page.route('/error-network.html', route => route.abort(), { times: 1 });
		await expectToHaveReloadedAfterAction(page, async () => {
			await loadWithSwup(page, '/error-network.html');
		});
		await expectToBeAt(page, '/error-network.html');
	});
});

test.describe('fetch', () => {
	test('should allow returning a page object to loadPage', async ({ page }) => {
		await page.evaluate(() => {
			window._swup.hooks.before('loadPage', (context, args) => {
				args.page = { url: '/page-3.html', html: '<html><head><title>Page 3</title></head><body><div id="swup"><h1>Page 3</h1></div></body></html>' };
			});
		});
		await loadWithSwup(page, '/page-2.html');
		await expectToBeAt(page, '/page-3.html', 'Page 3');
	});

	test('should allow returning a fetch Promise to loadPage', async ({ page, baseURL }) => {
		await page.evaluate(() => {
			window._swup.hooks.before('loadPage', (context, args) => {
				args.page = window._swup.fetchPage('page-3.html');
			});
		});
		await loadWithSwup(page, '/page-2.html');
		await expectToBeAt(page, '/page-3.html', 'Page 3');
	});
});

test.describe('cache', () => {
	test('should cache pages', async ({ page }) => {
		await loadWithSwup(page, '/page-2.html');
		await expectToBeAt(page, '/page-2.html', 'Page 2');
		await expectToHaveCacheEntry(page, '/page-2.html');
	});

	test('should cache pages from absolute URLs', async ({ page, baseURL }) => {
		await loadWithSwup(page, `${baseURL}/page-2.html`);
		await expectToBeAt(page, '/page-2.html', 'Page 2');
		await expectToHaveCacheEntry(page, '/page-2.html');
	});
});

test.describe('markup', () => {
	test('should add swup class to html element', async ({ page }) => {
		await expectToHaveClasses(page.locator('html'), 'swup-enabled');
	});

	test('should remove swup class from html tag', async ({ page }) => {
		await page.evaluate(() => window._swup.destroy());
		await expectNotToHaveClasses(page.locator('html'), 'swup-enabled');
	});

	test('should process transition classes', async ({ page }) => {
		const html = page.locator('html');
		const leaving = Promise.all([
			expectToHaveClasses(html, 'is-changing is-animating is-leaving'),
			expectNotToHaveClasses(html, 'is-rendering')
		]);
		loadWithSwup(page, '/page-2.html');
		await leaving;
		await Promise.all([
			expectToHaveClasses(html, 'is-changing is-animating is-rendering'),
			expectNotToHaveClasses(html, 'is-leaving')
		]);
		await expectNotToHaveClasses(html, 'is-changing is-animating is-leaving is-rendering')
	});
});
