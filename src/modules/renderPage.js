import { Link, updateHistoryRecord, getCurrentUrl } from '../helpers.js';
import { query } from '../utils.js';

const renderPage = function(page, { popstate } = {}) {
	document.documentElement.classList.remove('is-leaving');

	// do nothing if another page was requested in the meantime
	if (!this.isSameResolvedPath(getCurrentUrl(), page.url)) {
		return;
	}

	const skipTransition = popstate && !this.options.animateHistoryBrowsing;

	// update cache and state if the url was redirected
	const url = new Link(page.responseURL).getAddress();
	if (!this.isSameResolvedPath(getCurrentUrl(), url)) {
		this.cache.cacheUrl({ ...page, url });
		updateHistoryRecord(url);
	}

	// only add for page loads with transitions
	if (!skipTransition) {
		document.documentElement.classList.add('is-rendering');
	}

	this.triggerEvent('willReplaceContent', popstate);

	// replace blocks
	page.blocks.forEach((html, i) => {
		const block = query(`[data-swup="${i}"]`, document.body);
		block.outerHTML = html;
	});

	// set title
	document.title = page.title;

	this.triggerEvent('contentReplaced', popstate);
	this.triggerEvent('pageView', popstate);

	// empty cache if it's disabled (because pages could be preloaded and stuff)
	if (!this.options.cache) {
		this.cache.empty();
	}

	// Perform in transition
	this.enterPage({ popstate, skipTransition });

	// reset scroll-to element
	this.scrollToElement = null;
};

export default renderPage;
