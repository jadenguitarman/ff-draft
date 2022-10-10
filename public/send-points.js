const fs = require('fs/promises');
const axios = require('axios');

fs.readFile('./points.json', 'utf8').then(async data => {
	data = JSON.parse(data)
		.map(item => ({
			eventType: "conversion",
			timestamp: Date.now(),
			queryID: "24156376ab31cfab80ee207ea7b4858b",
			...item
		}));

	[...Array(Math.ceil(data.length / 1000.0)).keys()].forEach(sliceIndex => {
		axios({
			method: 'post',
			url: 'https://insights.algolia.io/1/events',
			data: {
				events: data.slice(sliceIndex * 1000, (sliceIndex + 1) * 1000).filter(x => !!x)
			},
			headers: {
				"Content-Type": "application/json",
				"X-Algolia-Api-Key": "e26060d8ea316089a6f4a42b362adc31",
				"X-Algolia-Application-Id": "0CLF21YP57"
			}
		})
			.then(res => {
				console.log(`statusCode: ${res.status}`);
				console.log(res);
			})
			.catch(error => {
				console.error(error);
			});
	});
});
