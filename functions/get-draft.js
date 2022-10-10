import fetch from 'node-fetch';

exports.handler = async ev => {
	const draftId = ev.queryStringParameters.draftId;

	const response = await fetch(`https://api.buttercms.com/v2/pages/draft/${draftId}?preview=1&auth_token=${process.env.BUTTER_READ_TOKEN}`);
	const results = await response.json();
	console.log(results);
	const data = results.data.fields;

	const teamArray = JSON.parse(data['drafter-names']);

	return {
		statusCode: 200,
		body: JSON.stringify({
			draftId,
			playerNames: data['drafter-names'],
			draftName: data['draft-name'],
			draftersPresent: data['drafters-present'],
			rounds: parseInt(data.rounds),
			draftResults: data['draft-results'],
			draftStatus: data['draft-status'],
			draftOrder: JSON.stringify(
				[...Array(parseInt(data.rounds)).keys()]
					.flatMap(i =>
						(i + 1) % 2
							? teamArray
							: teamArray
								.slice()
								.reverse()
					)
			)
		}, null, '\t')
	};
};
