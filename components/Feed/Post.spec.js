import { Wrapper, shallowMount, createLocalVue } from '@vue/test-utils';
import { aDefaultSingleItemMsgBuilder } from '../../test/feed.item.mock';
import FeedPost from './Post.vue';

const localVue = createLocalVue();

Wrapper.prototype.getByAutoId = function (id) {
	return this.find(`[data-auto-id="${id}"]`);
};

describe('Feed Post', () => {
	const COUNTER_ID = 'likes-count';
	const ICON_ID = 'likes-icon';

	it('shoud display heart and likes counter', () => {
		const post = aDefaultSingleItemMsgBuilder().withGUID().withLikes().get();
		const wrapper = shallowMount(FeedPost, {
			localVue,
			propsData: {
				post,
			},
		});

		expect(wrapper.getByAutoId(COUNTER_ID).text()).toBe(post.likes.count.toString());
		expect(wrapper.getByAutoId(ICON_ID).text()).toBe('mdi-heart');
	});

	it('shoud display heart but no likes counter', () => {
		const post = aDefaultSingleItemMsgBuilder().withGUID().withLikes(0).get();
		const wrapper = shallowMount(FeedPost, {
			localVue,
			propsData: {
				post,
			},
		});

		expect(wrapper.getByAutoId(COUNTER_ID).exists()).toBe(false);
		expect(wrapper.getByAutoId(ICON_ID).text()).toBe('mdi-heart');
	});
});
