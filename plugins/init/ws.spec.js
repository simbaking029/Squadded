import Vue from 'vue';
import { Chance } from 'chance';
import ws, * as wsPlugin from './ws';
import { flushPromises } from '~/helpers';
import { ActivityStore, ActivityMutations } from '~/store/activity';
import { PostActions, PostGetters, PostStore, PostMutations } from '~/store/post';
import { FeedStore, FeedGetters } from '~/store/feed';
import { UserStore, UserMutations } from '~/store/user';
import { userMockBuilder } from '~/test/user.mock';

const chance = new Chance();

describe('WS Plugin', () => {
	const mockToken = 'head.payload.sign';
	const { WS_LINK } = process.env;
	const STORE = {
		getters: {
			[`${FeedStore}/${FeedGetters.items}`]: [],
		},
		state: {
			feed: {
				items: [],
			},
			merchant: {
				id: null,
			},
			user: {
				me: {},
			},
			squad: {
				route: { path: '/default' },
			},
		},
	};
	const { WSToken } = wsPlugin;

	describe('dispatch', () => {
		const { dispatch } = wsPlugin;
		let _ws;
		let store;

		beforeEach(() => {
			const deepStore = JSON.parse(JSON.stringify(STORE));
			store = Object.assign({
				commit: jest.fn(),
				dispatch: jest.fn(),
				subscribe: jest.fn(),
			}, deepStore);
			_ws = {
				sendObj: jest.fn(),
			};
			store.state.socket = {
				_ws,
				$ws: _ws,
			};
		});

		it(`should pong`, () => {
			const msg = {
				type: 'ping',
			};

			dispatch(store, msg);
			expect(_ws.sendObj).toHaveBeenCalledWith({ type: 'pong' });
		});

		it(`should dispatch singleItemPost to ${PostStore}/${PostActions.receiveItem}`, () => {
			const msg = {
				type: 'singleItemPost',
			};

			dispatch(store, msg);
			expect(store.dispatch).toHaveBeenCalledWith(`${PostStore}/${PostActions.receiveItem}`, msg);
		});

		it(`should commit like to ${PostStore}/${PostMutations.setPostLike}`, () => {
			const guid = chance.guid();
			const byMe = true;
			const count = chance.natural();
			const msg = {
				guid,
				likes: { byMe, count },
				type: 'like',
			};
			const post = { type: 'sinleItemPost' };
			store.getters[`${PostStore}/${PostGetters.getPostById}`] = jest.fn().mockReturnValue(post);

			dispatch(store, msg);
			expect(store.commit).toHaveBeenCalledWith(`${PostStore}/${PostMutations.setPostLike}`, { byMe, count, post });
		});

		it(`should increment likes counter on notifLike`, () => {
			const postId = chance.guid();
			const iLike = true;
			const msg = {
				iLike,
				postId,
				type: 'notifLike',
			};
			const post = { type: 'sinleItemPost' };
			store.getters[`${PostStore}/${PostGetters.getPostById}`] = jest.fn().mockReturnValue(post);

			dispatch(store, msg);
			expect(store.dispatch).toHaveBeenCalledWith(`${PostStore}/${PostActions.modifyLike}`, { mod: 1, post });
		});

		it(`should decrement likes counter on notifLike`, () => {
			const postId = chance.guid();
			const iLike = false;
			const msg = {
				iLike,
				postId,
				type: 'notifLike',
			};
			const post = { type: 'sinleItemPost' };
			store.getters[`${PostStore}/${PostGetters.getPostById}`] = jest.fn().mockReturnValue(post);

			dispatch(store, msg);
			expect(store.dispatch).toHaveBeenCalledWith(`${PostStore}/${PostActions.modifyLike}`, { mod: -1, post });
		});

		it(`should add comment on notifComment`, () => {
			const postId = chance.guid();
			const user = { any: 'authour' };
			const text = chance.sentence();
			const msg = {
				postId,
				text,
				type: 'notifComment',
				user,
			};
			const comment = {
				text,
				author: user,
			};
			const post = { type: 'sinleItemPost' };
			store.getters[`${PostStore}/${PostGetters.getPostById}`] = jest.fn().mockReturnValue(post);

			dispatch(store, msg);
			expect(store.commit).toHaveBeenCalledWith(`${PostStore}/${PostMutations.addComment}`, { comment, post });
		});

		it(`should commit comments to ${PostStore}/${PostMutations.receiveReaction}`, () => {
			const comments = [{ text: 'text' }];
			const msg = {
				type: 'comments',
				comments,
			};

			dispatch(store, msg);
			expect(store.commit).toHaveBeenCalledWith(`${PostStore}/${PostMutations.receiveReaction}`, comments);
		});

		it(`should commit visitor user to ${UserStore}/${UserMutations.setMe}`, () => {
			const user = userMockBuilder().get();
			const msg = {
				type: 'userProfile',
				user,
			};
			store.state.user.me.userId = user.userId;

			dispatch(store, msg);
			expect(store.commit).toHaveBeenCalledWith(`${UserStore}/${UserMutations.setMe}`, user);
		});

		it(`should commit other user to ${UserStore}/${UserMutations.setOther}`, () => {
			const user = userMockBuilder().get();
			const msg = {
				type: 'userProfile',
				user,
			};
			store.state.user.me.userId = 'myUserId';

			dispatch(store, msg);
			expect(store.commit).toHaveBeenCalledWith(`${UserStore}/${UserMutations.setOther}`, user);
		});

		it(`should commit wishlist to ${ActivityStore}/${ActivityMutations.setListOfType}`, async () => {
			const item = {
				itemId: 'some-item-id',
			};
			const wishlist = [{ item }];
			const type = 'wishlist';
			const msg = {
				type,
				wishlist,
			};
			const posts = [{ item, guid: item.itemId }];
			store.getters[`${PostStore}/${PostGetters.getPostByIdList}`] = jest.fn().mockReturnValue(posts);

			dispatch(store, msg);
			expect(store.dispatch).toHaveBeenCalledWith(`${PostStore}/${PostActions.receiveBulk}`, posts);
			await flushPromises();
			expect(store.commit).toHaveBeenCalledWith(`${ActivityStore}/${ActivityMutations.setListOfType}`, { posts, type });
		});

		it(`should commit blog to ${ActivityStore}/${ActivityMutations.setListOfType}`, async () => {
			const blog = ['somedata'];
			const type = 'blog';
			const msg = {
				type,
				blog,
			};
			store.getters[`${PostStore}/${PostGetters.getPostByIdList}`] = jest.fn().mockReturnValue(blog);

			dispatch(store, msg);
			expect(store.dispatch).toHaveBeenCalledWith(`${PostStore}/${PostActions.receiveBulk}`, blog);
			await flushPromises();
			expect(store.commit).toHaveBeenCalledWith(`${ActivityStore}/${ActivityMutations.setListOfType}`, { posts: blog, type });
		});

		it(`should commit squadders to ${ActivityStore}/${ActivityMutations.setListOfType}`, async () => {
			const squadders = ['somedata'];
			const type = 'squadders';
			const msg = {
				type,
				squadders,
			};
			store.getters[`${PostStore}/${PostGetters.getPostByIdList}`] = jest.fn().mockReturnValue(squadders);

			dispatch(store, msg);
			expect(store.dispatch).toHaveBeenCalledWith(`${PostStore}/${PostActions.receiveBulk}`, squadders);
			await flushPromises();
			expect(store.commit).toHaveBeenCalledWith(`${ActivityStore}/${ActivityMutations.setListOfType}`, { posts: squadders, type });
		});
	});

	describe('WSToken class', () => {
		beforeEach(() => {
			localStorage.clear();
		});

		it('should remove error, userId and _jwt from sending object', () => {
			const _ws = {
				sendObj: jest.fn(),
			};
			const $ws = new WSToken(_ws);
			localStorage.setItem('userToken', mockToken);

			expect($ws.sendObj).toEqual(jasmine.any(Function));
			$ws.sendObj({
				item: {},
				guid: 'someGuid',
				error: 'someError',
				userId: 'someUserId',
				ts: 1234567890123,
			});

			expect(_ws.sendObj).toHaveBeenCalledTimes(1);
			const payload = _ws.sendObj.mock.calls[0][0];
			expect(payload).not.toHaveProperty('error');
			expect(payload).not.toHaveProperty('userId');
			expect(payload).not.toHaveProperty('_jwt');
			expect(payload).toHaveProperty('item');
		});

		it('should not send WS message if no user token', () => {
			localStorage.removeItem('userToken');
			const _ws = {
				sendObj: jest.fn(),
			};
			const $ws = new WSToken(_ws);

			$ws.sendObj({
				item: {},
			});

			expect(_ws.sendObj).toHaveBeenCalledTimes(0);
		});
	});

	describe('initSocket function', () => {
		const { initSocket } = wsPlugin;
		const link = 'ws://remote.mock.com/';
		let store;

		beforeEach(() => {
			localStorage.clear();
			const deepStore = JSON.parse(JSON.stringify(STORE));
			store = Object.assign({
				commit: jest.fn(),
				dispatch: jest.fn(),
				subscribe: jest.fn(),
			}, deepStore);
			spyOn(Vue, 'use');
		});

		it('should init socket witch exact connection link', () => {
			initSocket(link, store);

			expect(Vue.use).toHaveBeenCalledTimes(1);
			expect(Vue.use.calls.argsFor(0)[1]).toBe(link);
			expect(Vue.use.calls.argsFor(0)[2].connectManually).toBe(true);
		});

		it('should not add user token from localStorage as search query param for WS connection', () => {
			localStorage.setItem('userToken', mockToken);

			initSocket(link, store);

			expect(Vue.use).toHaveBeenCalledTimes(1);
			expect(Vue.use.calls.argsFor(0)[1].includes(`userToken=${mockToken}`)).toBe(false);
			expect(Vue.use.calls.argsFor(0)[2].connectManually).toBe(true);
		});

		it('should not auto-connect WS if no user token', () => {
			initSocket(link, store);

			expect(Vue.use).toHaveBeenCalledTimes(1);
			expect(Vue.use.calls.argsFor(0)[2].connectManually).toBe(true);
		});
	});

	describe('mutation listener', () => {
		let ctx;
		let state;
		let route;
		let _ws;
		let mutationDispatcher;

		function clear () {
			localStorage.clear();
			const deepStore = JSON.parse(JSON.stringify(STORE));
			_ws = {
				sendObj: jest.fn(),
				stop: jest.fn(),
				keepAlive: jest.fn(),
			};
			state = deepStore.state;
			route = {
				name: 'index',
			};
			ctx = {
				store: Object.assign({
					commit: jest.fn(),
					dispatch: jest.fn(),
					subscribe: jest.fn(),
				}, deepStore),
				route,
				app: {
					router: {
						push: jest.fn(),
					},
				},
			};
			ctx.store.state.socket = {
				_ws,
				$ws: _ws,
			};
			mutationDispatcher = wsPlugin.mutationListener(ctx);
		};

		describe('auth sequence', () => {
			beforeEach(clear);

			it('should do web socket response on authRequest', () => {
				const mutation = {
					type: 'SOCKET_ONMESSAGE',
					payload: { type: 'authRequest' },
				};
				state.merchant.id = 'someMerchantId';
				localStorage.setItem('userToken', mockToken);

				mutationDispatcher(mutation, state);

				expect(_ws.sendObj).toHaveBeenCalledTimes(1);
				expect(_ws.sendObj).toHaveBeenCalledWith({
					type: 'authResponse',
					userToken: mockToken,
					merchantId: state.merchant.id,
				});
			});

			it('should set socket auth true on authOk', () => {
				const mutation = {
					type: 'SOCKET_ONMESSAGE',
					payload: { type: 'authOk' },
				};
				route.name = 'not-home';

				mutationDispatcher(mutation, state);

				expect(ctx.store.commit).toHaveBeenCalledWith('SET_SOCKET_AUTH', true);
				expect(ctx.store.commit).toHaveBeenCalledWith('SET_PENDING', false);
			});

			it('should set pending false if authOk occur after destination page was mounted', () => {
				const mutation = {
					type: 'SOCKET_ONMESSAGE',
					payload: { type: 'authOk' },
				};
				route.name = 'notHome';

				mutationDispatcher(mutation, state);

				expect(ctx.store.commit).toHaveBeenCalledTimes(2);
				expect(ctx.store.commit).toHaveBeenCalledWith('SET_PENDING', false);
			});

			it('should not dispatch socket messages while not auth', () => {
				const mutation = {
					type: 'SOCKET_ONMESSAGE',
					payload: { type: 'singleItemPost' },
				};

				mutationDispatcher(mutation, state);

				expect(ctx.store.dispatch).toHaveBeenCalledTimes(0);
			});

			it('should dispatch socket messages while auth Ok', () => {
				state.socket.isAuth = true;
				const mutation = {
					type: 'SOCKET_ONMESSAGE',
					payload: { type: 'singleItemPost' },
				};

				mutationDispatcher(mutation, state);

				expect(ctx.store.dispatch).toHaveBeenCalledWith(`${PostStore}/${PostActions.receiveItem}`, mutation.payload);
			});

			it('should disconnect when socket close', () => {
				const mutation = {
					type: 'SOCKET_ONCLOSE',
					payload: { reason: 'non empty' },
				};
				Vue.prototype.$disconnect = function () {};

				spyOn(Vue.prototype, '$disconnect');

				mutationDispatcher(mutation, state);

				expect(ctx.store.commit).toHaveBeenCalledTimes(3);
				expect(ctx.store.commit).toHaveBeenCalledWith('SET_SOCKET_AUTH', false);
				expect(ctx.store.commit).toHaveBeenCalledWith('SET_PENDING', false);
				expect(ctx.store.commit).toHaveBeenCalledWith('jSocket', null);

				expect(Vue.prototype.$disconnect).toHaveBeenCalledTimes(1);
			});

			it('should fetch user', () => {
				const mutation = {
					type: 'SOCKET_ONMESSAGE',
					payload: { type: 'authOk' },
				};

				mutationDispatcher(mutation, state);

				expect(_ws.sendObj).toHaveBeenCalledWith({
					type: 'fetchUser',
				});
			});
		});

		describe('redirect', () => {
			beforeEach(clear);

			it('should redirect to feed from home on auth', () => {
				const mutation = {
					type: 'SOCKET_ONMESSAGE',
					payload: { type: 'authOk' },
				};

				mutationDispatcher(mutation, state);

				expect(ctx.app.router.push).toHaveBeenCalledTimes(1);
				expect(ctx.app.router.push).toHaveBeenCalledWith(state.squad.route, jasmine.any(Function));
			});

			it('should redirect to home from any on unauth', () => {
				const mutation = {
					type: 'SOCKET_ONCLOSE',
					payload: { reason: 'non empty' },
				};
				route.name = 'notHome';

				mutationDispatcher(mutation, state);

				expect(ctx.app.router.push).toHaveBeenCalledTimes(1);
				expect(ctx.app.router.push).toHaveBeenCalledWith('/');
			});
		});
	});

	describe('default', () => {
		let ctx;
		beforeEach(() => {
			localStorage.clear();
			const deepStore = JSON.parse(JSON.stringify(STORE));
			ctx = {
				store: Object.assign({
					commit: jest.fn(),
					dispatch: jest.fn(),
					subscribe: jest.fn(),
				}, deepStore),
				route: {},
			};
		});

		it('should invoke proper init sequence', () => {
			spyOn(wsPlugin, 'initSocket');
			spyOn(wsPlugin, 'mutationListener').and.callThrough();

			ws(ctx);

			expect(wsPlugin.initSocket).toHaveBeenCalledTimes(1);
			expect(wsPlugin.initSocket).toHaveBeenCalledWith(WS_LINK, ctx.store);

			expect(wsPlugin.mutationListener).toHaveBeenCalledTimes(1);
			expect(wsPlugin.mutationListener).toHaveBeenCalledWith(ctx);

			expect(ctx.store.subscribe).toHaveBeenCalledTimes(1);
			const func = ctx.store.subscribe.mock.calls[0][0];
			expect(func.name).toBe('mutationDispatcher');
		});
	});
});
