const getAblyToken = async () => {
	const response = await fetch('/api/get-ably-token');
	const result = await response.json();

	sessionStorage.clientId = result.clientId;

	ably = new Ably.Realtime({
		token: result.token,
		authUrl: '/api/get-ably-token'
	});
};

const logIn = async draftData => {
	await subscribeToAblyChannels();

	document.getElementById("loading-message").innerText = "Updating session data from other players if possible, and from the CMS if nobody responds...";
	document.getElementById("loading").classList.add("show");

	sessionRefreshed = false;
	channel.publish('sync-data', {
		request: true,
		from: sessionStorage.clientId
	});
	setTimeout(async () => {
		// if we haven't received something from others in 5 seconds, ask for the data from butter
		if (!sessionRefreshed) {
			// get data from buttercms
			await updateSession(
				await getDraftButterData()
			)
		}
	}, 2000);

	sessionStorage.draftersPresent = JSON.stringify([
		...(
			!!sessionStorage.draftersPresent
				? JSON.parse(sessionStorage.draftersPresent)
				: []
		),
		sessionStorage.teamName
	]);

	document.getElementById("name-chooser").classList.add("hidden-step");
	document.getElementById("inside-draft").classList.remove("hidden-step");

	document.getElementById("send-chat").addEventListener("click", sendChat);
};

const subscribeToAblyChannels = async () => {
	await getAblyToken();
	channel = ably.channels.get(sessionStorage.draftId);

	channel.subscribe('new-user', newUserHasJoined);
	channel.subscribe('new-chat', displayChatMessage);
	channel.subscribe('player-drafted', playerWasDrafted);
	channel.subscribe('sync-data', syncSessionWithNewData);

	channel.publish('new-user', sessionStorage.teamName);
};

const newUserHasJoined = async message => {
	displayChatMessage(`${message.data} has joined the draft!`);
	if (message.data != sessionStorage.teamName)
		sessionStorage.draftersPresent = JSON.stringify([...JSON.parse(sessionStorage.draftersPresent), message.data]);
};

const syncSessionWithNewData = async message => {
	if (!!message.data.request) {
		// we're requesting a draft data update, send one
		if (sessionStorage.clientId != message.data.from) {
			channel.publish('sync-data', {
				draftOrder: sessionStorage.draftOrder,
				draftId: sessionStorage.draftId,
				playerNames: sessionStorage.playerNames,
				draftName: sessionStorage.draftName,
				draftersPresent: sessionStorage.draftersPresent,
				draftStarted: sessionStorage.draftStarted,
				rounds: sessionStorage.rounds,
				draftResults: sessionStorage.draftResults
			});
		}
	} else {
		// we got a data update from someone else, so update
		updateSession(message.data);
	}
};

const updateSession = async sessionData => {
	Object.entries(sessionData).forEach(([key, value]) => {
		sessionStorage[key] = value;
	});
	sessionStorage.inGame = "true";
	if (!searchSetUp) await setUpSearch();

	if (sessionStorage.draftStarted == "true") await updateDraftPosition();
	sessionRefreshed = true;
	document.getElementById("loading").classList.remove("show");
};

const startDraft = async () => {
	// get rid of button
	document.getElementById("start-draft").style.display = "none";

	const rounds = 3;
	const teams = JSON.parse(sessionStorage.playerNames);

	channel.publish('sync-data', {
		draftStarted: "true"
	});
};

const updateDraftPosition = async () => {
	const order = JSON.parse(sessionStorage.draftOrder);
	const ovrPick = JSON.parse(sessionStorage.draftResults).length;
	const roundCount = parseFloat(sessionStorage.rounds);
	const picksPerRound = order.length / roundCount;
	const currentRound = Math.floor(ovrPick / picksPerRound) + 1;
	const roundPick = (ovrPick % picksPerRound) + 1;

	if (ovrPick == order.length) location.href = "/draft-complete";
	document.getElementById("pick-message").innerText = `It is now ${order[ovrPick]}'s turn! It's round ${currentRound}, pick ${roundPick} (overall pick ${ovrPick + 1})`;

	document.body.dataset.myTurn = order[ovrPick] == sessionStorage.teamName
		? 'true'
		: 'false';
};

const wipeSession = async () => {
	delete sessionStorage.draftId;
	delete sessionStorage.playerNames;
	delete sessionStorage.draftName;
	delete sessionStorage.draftersPresent;
	delete sessionStorage.teamName;
};

const displayChatMessage = async msg => {
	if (typeof msg == "object" && !!msg.data) msg = msg.data;
	const msgBox = document.createElement("p");
	msgBox.innerText = msg;
	document.getElementById("chat-message-container").insertAdjacentElement("afterbegin", msgBox);
};

const sendChat = async () => {
	const chatInput = document.getElementById("chat-input");
	channel.publish('new-chat', chatInput.value);
	chatInput.value = "";
};

const getTeamDetails = abbr => (
	{
		ARI: {
			"city": "Arizona",
			"name": "Cardinals",
			"cPrim": "#97233F",
			"cSecn": "#FFB612",
		},
		ATL: {
			"city": "Atlanta",
			"name": "Falcons",
			"cPrim": "#A71930",
			"cSecn": "#000000",
		},
		BAL: {
			"city": "Baltimore",
			"name": "Ravens",
			"cPrim": "#241773",
			"cSecn": "#9E7C0C",
		},
		BUF: {
			"city": "Buffalo",
			"name": "Bills",
			"cPrim": "#00338D",
			"cSecn": "#C60C30",
		},
		CAR: {
			"city": "Carolina",
			"name": "Panthers",
	   		"cPrim": "#0085CA",
	   		"cSecn": "#101820",

		},
		CHI: {
			"city": "Chicago",
			"name": "Bears",
			"cPrim": "#0B162A",
			"cSecn": "#C83803",
		},
		CIN: {
			"city": "Cincinnati",
			"name": "Bengals",
			"cPrim": "#FB4F14",
			"cSecn": "#000000",
		},
		CLE: {
			"city": "Cleveland",
			"name": "Browns",
			"cPrim": "#FF3C00",
			"cSecn": "#311D00",
		},
		DAL: {
			"city": "Dallas",
			"name": "Cowboys",
			"cPrim": "#041E42",
			"cSecn": "#869397",
		},
		DEN: {
			"city": "Denver",
			"name": "Broncos",
			"cPrim": "#002244",
			"cSecn": "#FB4F14",
		},
		DET: {
			"city": "Detroit",
			"name": "Lions",
			"cPrim": "#0076B6",
			"cSecn": "#B0B7BC",
		},
		GNB: {
			"city": "Green Bay",
			"name": "Packers",
			"cPrim": "#203731",
			"cSecn": "#FFB612",
		},
		HOU: {
			"city": "Houston",
			"name": "Texans",
			"cPrim": "#03202F",
			"cSecn": "#A71930",
		},
		IND: {
			"city": "Indianapolis",
			"name": "Colts",
			"cPrim": "#002C5F",
			"cSecn": "#A2AAAD",
		},
		JAX: {
			"city": "Jacksonville",
			"name": "Jaguars",
			"cPrim": "#006778",
			"cSecn": "#9F792C",
		},
		KAN: {
			"city": "Kansas City",
			"name": "Chiefs",
			"cPrim": "#E31837",
			"cSecn": "#FFB81C",
		},
		LVR: {
			"city": "Las Vegas",
			"name": "Raiders",
			"cPrim": "#000000",
			"cSecn": "#A5ACAF",
		},
		LAC: {
			"city": "Los Angeles",
			"name": "Chargers",
			"cPrim": "#002A5E",
			"cSecn": "#FFC20E",
		},
		LAR: {
			"city": "Los Angeles",
			"name": "Rams",
			"cPrim": "#003594",
			"cSecn": "#FFA300",
		},
		MIA: {
			"city": "Miami",
			"name": "Dolphins",
			"cPrim": "#008E97",
			"cSecn": "#FC4C02",
		},
		MIN: {
			"city": "Minnesota",
			"name": "Vikings",
			"cPrim": "#4F2683",
			"cSecn": "#FFC62F",
		},
		NWE: {
			"city": "New England",
			"name": "Patriots",
			"cPrim": "#002244",
			"cSecn": "#C60C30",
		},
		NOR: {
			"city": "New Orleans",
			"name": "Saints",
			"cPrim": "#D3BC8D",
			"cSecn": "#101820",
		},
		NYG: {
			"city": "New York",
			"name": "Giants",
			"cPrim": "#0B2265",
			"cSecn": "#A71930",
		},
		NYJ: {
			"city": "New York",
			"name": "Jets",
			"cPrim": "#125740",
			"cSecn": "#000000",
		},
		PHI: {
			"city": "Philadelphia",
			"name": "Eagles",
			"cPrim": "#004C54",
			"cSecn": "#A5ACAF",
		},
		PIT: {
			"city": "Pittsburgh",
			"name": "Steelers",
			"cPrim": "#101820",
			"cSecn": "#FFB612",
		},
		SFO: {
			"city": "San Francisco",
			"name": "49ers",
			"cPrim": "#AA0000",
			"cSecn": "#B3995D",
		},
		SEA: {
			"city": "Seattle",
			"name": "Seahawks",
			"cPrim": "#002244",
			"cSecn": "#69BE28",
		},
		TAM: {
			"city": "Tampa Bay",
			"name": "Buccaneers",
			"cPrim": "#D50A0A",
			"cSecn": "#B1BABF",
		},
		TEN: {
			"city": "Tennessee",
			"name": "Titans",
			"cPrim": "#4B92DB",
			"cSecn": "#C8102E",
		},
		WAS: {
			"city": "Washington",
			"name": "Commanders",
			"cPrim": "#5A1414",
			"cSecn": "#FFB612",
		}
	}[abbr]
);

const playerWasDrafted = async message => {
	const row = document.querySelector(`#player-table tr[data-object-i-d="${message.data.player.objectID}"]`);
	row.parentNode.removeChild(row);

	sessionStorage.draftResults = JSON.stringify([
		...JSON.parse(sessionStorage.draftResults),
		message.data
	]);

	updateDraftPosition();
};

// sparkles system created by https://codepen.io/explosion/pen/zKEovE
const animateSparklesRender = (particles, ctx, width, height) => {
	requestAnimationFrame(() => animateSparklesRender(particles, ctx, width, height));
	ctx.clearRect(0, 0, width, height);

	particles.forEach((p, i) => {
		p.x += p.speed * Math.cos(p.rotation * Math.PI / 180);
		p.y += p.speed * Math.sin(p.rotation * Math.PI / 180);

		p.opacity -= 0.01;
		p.speed *= p.friction;
		p.radius *= p.friction;
		p.yVel += p.gravity;
		p.y += p.yVel;

		if(p.opacity < 0 || p.radius < 0) return;

		ctx.beginPath();
		ctx.globalAlpha = p.opacity;
		ctx.fillStyle = p.color;
		ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, false);
		ctx.fill();
	});

	return ctx;
};

const animateSparkles = async (x, y) => {
	const colors = [ '#ffc000', '#ff3b3b', '#ff8400' ];
    const bubbles = 25;

	const r = (a, b, c) => parseFloat((Math.random() * ((a ? a : 1) - (b ? b : 0)) + (b ? b : 0)).toFixed(c ? c : 0));

    let particles = [];
    let ratio = window.devicePixelRatio;
    let c = document.createElement('canvas');
    let ctx = c.getContext('2d');

    c.style.position = 'absolute';
    c.style.left = (x - 100) + 'px';
    c.style.top = (y - 100) + 'px';
    c.style.pointerEvents = 'none';
    c.style.width = 200 + 'px';
    c.style.height = 200 + 'px';
    c.style.zIndex = 100;
    c.width = 200 * ratio;
    c.height = 200 * ratio;
    document.body.appendChild(c);

    for(var i = 0; i < bubbles; i++) {
        particles.push({
            x: c.width / 2,
            y: c.height / 2,
            radius: r(20, 30),
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: r(0, 360, true),
            speed: r(8, 12),
            friction: 0.9,
            opacity: r(0, 0.5, true),
            yVel: 0,
            gravity: 0.1
        });
    }

    animateSparklesRender(particles, ctx, c.width, c.height);
    setTimeout(() => document.body.removeChild(c), 1000);
};

const draftPlayer = async e => {
	if (sessionStorage.draftStarted != "true") return; // haven't started the draft yet

	channel.publish('player-drafted', {
		player: {
			position: e.target.dataset.position,
			name: e.target.dataset.name,
			team: e.target.dataset.team,
			objectID: e.target.dataset.objectID,
		},
		draftedBy: sessionStorage.teamName
	});

	animateSparkles(e.pageX, e.pageY);

	// send drafted player to butter
};

const sendAllGameEvents = async sendEvent => {
	const gamesResp = await fetch(`/games.json`);
	const games = await gamesResp.json();

	playerGames = {};
	games.map(game => ({
	    playerObjectID: game.playerObjectID,
	    points: Object.values({
	        pass_yds: parseFloat(game.pass_yds) * (1/25),
	        pass_td: parseFloat(game.pass_td) * 4,
	        pass_int: parseFloat(game.pass_int) * -1,
	        rush_yds: parseFloat(game.rush_yds) * (1/20),
	        rush_td: parseFloat(game.rush_td) * 6,
	        funbles_lost: parseFloat(game.fumbles_lost) * -2,
	        rec_yds: parseFloat(game.rec_yds) * (1/10),
	        rec: parseFloat(game.rec) * (1/2),
	        rec_td: parseFloat(game.rec_td) * 6
	    }).reduce((a,b) => a + b, 0)
	})).forEach(game => {
	    if (!!playerGames[game.playerObjectID])
			playerGames[game.playerObjectID].push(game.points);
	    else playerGames[game.playerObjectID] = [game.points];
	});

	events = [];
	Object.keys(playerGames).forEach(player => {
		const avgPointsPerGame = Math.ceil(
			playerGames[player].reduce((a,b) => a + b, 0)
			/ playerGames[player].length
		);

		for (let i = 0; i < avgPointsPerGame; i++) {
			events.push({
				userToken: 'user-123456',
			    index: 'players',
			    eventName: 'Player Point',
			    objectIDs: [player]
			});
		}
	});

	return events
};

const setUpSearch = async () => {
	const search = instantsearch({
		indexName: 'players',
		searchClient: algoliasearch(
			'0CLF21YP57', // identifies this specific application
			'da877f5858326ba3a1f9b1e1c60001b6' // this is my public api key
		)
	});

	// instantiate custom widget
	search.addWidgets([
		instantsearch.connectors.connectSearchBox(
			(renderOptions, isFirstRender) => {
				const { query, refine, clear, isSearchStalled, widgetParams } = renderOptions;

				if (isFirstRender) {
					const input = document.createElement('input');
					input.type = "search";
					input.id = "search-input";
					input.addEventListener('input', event => {
						if (event.target.value) refine(event.target.value);
						else clear();
					});
					document.querySelector(widgetParams.container).appendChild(input);
				}

				document.querySelector(`${widgetParams.container} input`).value = query;
			}
		)({
			container: '#search-input-container'
		}),

		instantsearch.widgets.configure({
			hitsPerPage: 10000,
			//paginationLimitedTo: 10000,
			clickAnalytics: true
		}),

		instantsearch.widgets.refinementList({
			container: '#refinement-list',
			attribute: 'position'
		}),

		instantsearch.connectors.connectHits(
			(renderOptions, isFirstRender) => {
				const {
					hits,
					results,
					sendEvent,
					widgetParams
				} = renderOptions;

				const playerTable = document.querySelector('#player-table > tbody');
				playerTable.innerHTML = '';
				hits.forEach(hit => {
					if (
						JSON.parse(sessionStorage.draftResults)
							.map(result => result.player.objectID)
							.includes(hit.objectID)
					) return; // don't display in search if they've been drafted

					const team = getTeamDetails(hit.team);
					const tr = document.createElement("tr");
					tr.addEventListener("click", draftPlayer);
					tr.innerHTML = `
						<td class="player-position">${hit.position}</td>
						<td class="player-name">${hit.name}</td>
						<td
							class="player-team"
							style="--primary:${team.cPrim};--secondary:${team.cSecn};"
						>${team.city} ${team.name}</td>
					`;
					tr.dataset.position = hit.position;
					tr.dataset.name = hit.name;
					tr.dataset.objectID = hit.objectID;
					tr.dataset.team = hit.team;

					playerTable.appendChild(tr, "beforeend");
				});

				console.log(hits)

				sendEvent(
					"conversion",
					{
						objectID: "ffdf6400-ac35-45d7-b316-c3962eb27df3"
					},
					"Player Point"
				)

				if (isFirstRender) {

					//sendEvent()
				}
			}
		)()
	]);

	search.start();
	searchSetUp = true;
};

const sendDraftDataToButter = async () => {
	let postUrl = 'https://api.buttercms.com/v2/pages/'
   	 request.post({ //perform the page creation
   		 url: postUrl,
   		 headers: {
   			 "Authorization": "Token " + WRITE_TOKEN
   		 },
   		 json: true,
   		 body: tPage,
   	 }, (err, resp) => { //We're done!
   		 if(err) {
   			 console.log("There was an error: ", err)
   			 return res.json(err)
   		 }
   		 console.log("Done, news page created!")
   		 console.log(resp.body)
   		 res.json(resp)
   	 })

	 const response = await fetch(
		 `https://api.buttercms.com/v2/pages/`,
		 {
			 method: "POST",
			 headers: {
	   			 "Authorization": "Token " + WRITE_TOKEN
	   		 },
			 body: JSON.stringify({

			 })
		 }
	 );
	 const results = await response.json();
};

const getDraftButterData = async () => {
	const response = await fetch(`/api/get-draft?draftId=${sessionStorage.draftId}`);
	return await response.json();
};

const main = async () => {
	const urlparams = (new URLSearchParams(location.search));

	const draftId = urlparams.get("draftId");
	if (!draftId) {
		location.href = '/';
		return; // just so we don't move on accidentally while the page loads
	}

	const commish = !!urlparams.get("commish");
	sessionStorage.commish = commish;
	if (commish) document.body.dataset.commish = "true";

	const draftURLElement = document.getElementById("draft-url");
	draftURLElement.href = `${location.protocol}//${location.host}/draft?draftId=${draftId}`;
	draftURLElement.innerText = draftURLElement.href;

	history.pushState({}, null, '/draft');

	// if we were only reloaded the page, just log back in
	if (sessionStorage.inGame == "true") await logIn();
	else {
		sessionStorage.draftId = draftId;
		const results = await getDraftButterData();

		const draftersPresent = JSON.parse(results.draftersPresent);
		const teamsDropdown = document.getElementById("possible-teams");
		JSON.parse(results.playerNames).forEach(team => {
			let option = document.createElement("option");
			option.innerText = team;
			option.disabled = draftersPresent.includes(team);
			teamsDropdown.appendChild(option, "beforeend");
		});

		document.getElementById("choose-team").addEventListener("click", async () => {
			sessionStorage.teamName = document.getElementById("possible-teams").value;
			await logIn(results);
		});
	}
};

let ably, channel, sessionRefreshed;
let searchSetUp = false;
main();
