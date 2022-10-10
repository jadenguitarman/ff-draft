const onload = async () => {
	if (!!sessionStorage.draftId)
		location.href = `/draft?draftId=${sessionStorage.draftId}`;

	document
		.getElementById("draft-creator")
		.addEventListener("submit", createDraft);
}

const createDraft = async e => {
	e.preventDefault();

	const draftName = encodeURIComponent(
		document
			.querySelector("input[name=draftName]")
			.value
	);
	const playerNames = encodeURIComponent(
		document
			.querySelector("input[name=playerNames]")
			.value
			.split(",")
			.map(x => x.trim())
			.join(",")
	);
	const rounds = encodeURIComponent(
		parseInt(
			document
				.querySelector("input[name=rounds]")
				.value
		).toString()
	);

	const response = await fetch(`/api/create-draft?draftName=${draftName}&playerNames=${playerNames}&rounds=${rounds}`);
	const results = await response.json();

	location.href = `/draft?draftId=${results.draftId}&commish=true`;

	console.log(results);
};

window.addEventListener("load", onload);
