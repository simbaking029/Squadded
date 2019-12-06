const INFINITE_FUTURE_TS_FOR_ALWAYS_ON_TOP = Number.MAX_SAFE_INTEGER;

const itemInitialState = {
	varId: '',
};

const composeItem = ({ varId, ...rest }) => ({
	varId: varId || '',
	...rest,
});

export class FeedPost {
	constructor (props) {
		const {
			type,
			likes = {},
			comments = {},

			item = itemInitialState,

			item1 = itemInitialState,
			item2 = itemInitialState,
			items = [itemInitialState, itemInitialState],
			expires = null,
			voted = false,
			closed = false,
			totalPrice = 0,

			byMe = false,
			user = {
				avatar: '',
				screenName: '',
			},
			userId = null,
			error = null,
			guid = null,
			postId = null,
			text,
			ts = INFINITE_FUTURE_TS_FOR_ALWAYS_ON_TOP,
			correlationId,
			creationTs,
		} = props;

		this.type = type;
		this.likes = likes;
		this.likes.users = this.likes.users || [];
		this.comments = {
			count: comments.count || 0,
			messages: comments.messages || [],
		};

		this.byMe = byMe;
		this.user = user;
		this.userId = userId || user.guid;
		this.error = error;
		this.guid = postId || guid;
		this.postId = this.guid;
		this.private = props.private;
		this.text = text || '';
		this.ts = ts;
		this.correlationId = correlationId;
		this.creationTs = creationTs;

		if (type === 'pollPost') {
			this.item1 = composeItem(item1);
			this.item2 = composeItem(item2);
			this.voted = voted;
			this.expires = expires;
			this.closed = closed;
		} else if (type === 'outfitPost') {
			this.items = items.map(composeItem);
			this.totalPrice = totalPrice;
		} else {
			this.item = composeItem(item);
		}
	}

	getItem (id) {
		const isItemHasId = (id, item) => item && item.itemId === id;

		return isItemHasId(id, this.item) ? this.item
			: isItemHasId(id, this.item1) ? this.item1
			: isItemHasId(id, this.item2) ? this.item2
			: this.items && this.items.find(item => isItemHasId(id, item));
	}

	toMessage () {
		const { byMe, comments, error, likes, ts, user, userId, ...clean } = this;
		return clean;
	}

	toStore () {
		const { comments, error, ...store } = this;
		return store;
	}

	update (freshPost) {
		const { comments, ...other } = freshPost;
		Object.assign(this, other);
		if (comments) {
			this.comments.count = comments.count;
		}
		this.postId = this.guid;
	}

	unsetCorrelationId () {
		delete this.correlationId;
	}
}
