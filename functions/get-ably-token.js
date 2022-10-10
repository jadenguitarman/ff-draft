exports.handler = async ev => {
	const Ably = require('ably/promises');
	const { v4: uuidv4 } = require('uuid');

	let ably = new Ably.Rest.Promise({ key: process.env.ABLY_PRIVATE_KEY });

	const output = await ably.auth.requestToken({ clientId: uuidv4() });

	return {
		statusCode: 200,
		body: JSON.stringify(output, null, '\t')
	};
};
