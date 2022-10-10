import fetch from 'node-fetch';

exports.handler = async ev => {
	const { v4: uuidv4 } = require('uuid');
	const draftId = uuidv4();
	console.log(ev.queryStringParameters)

	const {
		draftName,
		rounds,
		playerNames
	} = ev.queryStringParameters;

	const trimmedPlayerNames = playerNames.split(",").map(x => x.trim());
	console.log(2)

	const postResponse = await fetch(
		'https://api.buttercms.com/v2/pages/',
		{
			method: 'post',
			body: JSON.stringify({
				title: draftName,
				slug: draftId,
				"page-type": "draft",
				fields: {
					"draft-id": draftId,
					"draft-name": draftName,
					"draft-results": "[]",
					"drafter-names": JSON.stringify(trimmedPlayerNames),
					"drafters-present": "[]",
					"draft-status": "pending",
					"rounds": rounds
				}
			}),
			headers: {
				"Authorization": "Token " + process.env.BUTTER_WRITE_TOKEN,
				'Content-Type': 'application/json'
			}
		}
	);
	console.log(await postResponse.json());
 /*
	const patchResponse = await fetch(
		`https://api.buttercms.com/v2/pages/draft/${draftId}`,
		{
			method: 'patch',
			body: JSON.stringify({
				status: "published"
			}),
			headers: {
				"Authorization": "Token " + process.env.BUTTER_WRITE_TOKEN,
				'Content-Type': 'application/json'
			}
		}
	);
	console.log(await patchResponse.json());
*/
console.log(3)
	return {
		statusCode: 200,
		body: JSON.stringify({
			draftId,
			playerNames: JSON.stringify(trimmedPlayerNames),
			draftName,
			draftOrder: JSON.stringify(
				[...Array(parseFloat(rounds)).keys()]
					.flatMap(i =>
						(i + 1) % 2
							? trimmedPlayerNames
							: trimmedPlayerNames
								.slice()
								.reverse()
					)
			)
		}, null, '\t')
	};
};
