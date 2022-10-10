const displayResults = async () => {
	const teams = {};
	JSON.parse(sessionStorage.draftResults).forEach(pick => {
		if (!!teams[pick.draftedBy]) teams[pick.draftedBy].push(pick.player);
		else teams[pick.draftedBy] = [pick.player];
	});

	const resultsElement = document.getElementById("results");
	Object.entries(teams).forEach(([team, players]) => {
		resultsElement.insertAdjacentHTML("beforeend", `
			<div>
				<h2>${team}</h2>
				<ul>
					${players.map(player => `
						<li><i>${player.position} for ${player.team}</i>: ${player.name}</li>
					`).join("")}
				</ul>
			</div>
		`);
	});

};

displayResults();
