
$.ajax({
	url: "/secretContent",
	type: 'GET',
	// Fetch the stored token from localStorage and set in the header
	headers: { "token": localStorage.getItem('token') }
})
	.done((data) => {
		$('div#content').html(data);
	})
	.error((err) => {
		alert(err.statusText);
	})


$("#logout").click(() => {
	console.log("Removing token from LS")
	localStorage.removeItem('token');
	window.location = "/logout"
})