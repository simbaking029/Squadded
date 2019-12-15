import { Wrapper, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import User from './index.vue';
import { flushPromises } from '~/helpers';
import { UserStore, UserMutations } from '~/store/user';
import Store from '~/store';
import { userMockBuilder } from '~/test/user.mock';

Wrapper.prototype.ref = function (id) {
	return this.find({ ref: id });
};

describe('User component', () => {
	let localVue;
	let wrapper;
	let store;
	let $ws;

	function initLocalVue () {
		document.getElementById = jest.fn(() => document.createElement('div'));
		localVue = createLocalVue();
		localVue.use(Vuex);

		store = new Vuex.Store(Store);
		$ws = {
			sendObj: jest.fn(),
		};
		store.commit('jSocket', $ws);
	}

	beforeEach(initLocalVue);

	it('should resolve other user', async () => {
		expect.assertions(3);

		const user = userMockBuilder().get();
		const params = {
			id: user.userId,
		};
		const $route = {
			params,
		};

		store.commit('SET_SOCKET_AUTH', true);

		wrapper = shallowMount(User, {
			localVue,
			store,
			mocks: {
				$route,
				$t: msg => msg,
				_i18n: {
					locale: 'en',
				},
			},
		});

		const asyncPromise = wrapper.vm.$options.asyncData({ store, params });
		await flushPromises();

		expect($ws.sendObj).toHaveBeenCalledWith({
			type: 'fetchUser',
			guid: user.userId,
		});

		store.commit(`${UserStore}/${UserMutations.setOther}`, user);

		await asyncPromise.then((data) => {
			wrapper.setData(data);
			expect(wrapper.vm.other).toEqual(user);
			expect(wrapper.vm.user).toEqual(user);
		});
	});

	it('should redirect myself to /me', () => {
		const me = userMockBuilder().get();

		store.commit(`${UserStore}/${UserMutations.setMe}`, me);

		const params = {
			id: me.userId,
		};
		const redirect = jest.fn();
		wrapper = shallowMount(User, {
			localVue,
			store,
			mocks: {
				$route: { params },
				$t: msg => msg,
				_i18n: {
					locale: 'en',
				},
			},
		});

		wrapper.vm.$options.asyncData({ store, params, redirect });

		expect(redirect).toHaveBeenCalledWith('/me');
	});
});