export const sendGAction = (action) => {
	window.parent.postMessage(
		JSON.stringify({
			type: 'GA',
			action,
		}),
		'*',
	);
};