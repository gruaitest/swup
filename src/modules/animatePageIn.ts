import type Swup from '../Swup.js';
import { nextTick } from '../utils.js';
import type { Visit } from './Visit.js';

/**
 * Perform the in/enter animation of the next page.
 * @returns Promise<void>
 */
export const animatePageIn = async function (this: Swup, visit: Visit) {
	if (!visit.animation.animate) return;

	const animation = this.hooks.call(
		'animation:in:await',
		visit,
		{ skip: false },
		async (visit, { skip }) => {
			if (skip) return;
			await this.awaitAnimations({ selector: visit.animation.selector });
		}
	);

	await nextTick();

	await this.hooks.call('animation:in:start', visit, undefined, () => {
		this.classes.remove('is-animating');
	});

	await animation;

	await this.hooks.call('animation:in:end', visit, undefined);
};
