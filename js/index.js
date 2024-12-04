import { MelonChat } from './MelonChat.js';

window.addEventListener('load', () => {

	const simBtn = document.getElementById('sim-btn');
	const orderSelect = document.getElementById('post-sort-order');
	const loadMoreButton = document.getElementById('load-more-button');

	simBtn.addEventListener('click', () => {
		alert("This is an archive, live simulation not available.");
	});

	let postStart = 0;
	let postEnd = 16;
	let postIncrement = 8;
	let postIds = [];

	const chat = new MelonChat(() => {
		let orderBy = localStorage.getItem('orderBy');
		if (!orderBy) {
			orderBy = orderSelect.value;
		} else {
			orderSelect.value = orderBy;
		}
		orderSelect.addEventListener('change', ev => {
			chat.updateOrder(orderSelect.value);
		});
		addPosts();
	});

	function addPosts() {
		const posts = chat.getPostsByIndex(postStart, postEnd);
		posts.forEach(post => {
			chat.displayPost(post[0], post[1], false);
		});
	}
	
	loadMoreButton.onclick = function() {
		if (!chat.isActive()) return;

		postStart += postIncrement;
		postEnd += postIncrement;
		addPosts();
	};
});