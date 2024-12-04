/*
	big ass melon chat object
*/

export function MelonChat(callback) {

	let db, postsList, orderBy;
	let isActive = false;

	fetch('./melon-chat-db.json')
		.then(response => response.json())
		.then(data => {
			db = data;
			setup();
			isActive = true;
			if (callback) callback();
		})
		.catch(error => {
			console.error('Error:', error);
		});

	function setup() {
		postsList = Object.entries(db.posts);
	}

	function updateOrder(value) {
		orderBy = value;
		setOrder();
		localStorage.setItem('orderBy', value);
	}

	function setOrder() {
		const posts = document.getElementsByClassName('post');
		if (orderBy === 'recent') {
			const dates = Array.from(posts).map(p => p.dataset.date).sort().reverse();
			for (let i = 0; i < posts.length; i++) {
				const post = posts[i];
				const index = dates.indexOf(post.dataset.date);
				post.style.order = index;
			}
		}

		if (orderBy === 'oldest') {
			const dates = Array.from(posts).map(p => p.dataset.date).sort();
			for (let i = 0; i < posts.length; i++) {
				const post = posts[i];
				const index = dates.indexOf(post.dataset.date);
				post.style.order = index;
			}
		}

		if (orderBy === 'likes') {
			const likes = Array.from(posts).map(p => p.dataset.likes).sort().reverse();
			for (let i = 0; i < posts.length; i++) {
				const post = posts[i];
				const index = likes.indexOf(post.dataset.likes);
				post.style.order = index;
			}
		}

		if (orderBy === 'replies') {
			const replies = Array.from(posts).map(p => p.dataset.replies).sort().reverse();
			for (let i = 0; i < posts.length; i++) {
				const post = posts[i];
				const index = replies.indexOf(post.dataset.replies);
				post.style.order = index;
			}
		}
	}

	function getUser(id) {
		return db.users[id];
	}

	function setUserContent(userId, justNameAndImage=false) {
		const userData = getUser(userId);
		getId('user-name').textContent = formatName(userData.name);


		getId('profile-image').src = localizeImageURL('profiles', userData.profile_image_url);

		if (justNameAndImage) {
			return;
		}

		getId('joined-date').textContent = formatDate(userData.date, false, true);
		
		if (userData.follows) {
			getId('follows-count').textContent = Object.keys(userData.follows).length;
		}

		const followedBy = Object.entries(db.users)
			.filter(u => u[1].follows)
			.filter(u => u[1].follows[userId]);
		getId('followers-count').textContent = followedBy.length;

		const posts = postsList.filter(p => p[1].user === userId);
		for (let i = 0; i < posts.length; i++) {
			const [key, post] = posts[i];
			const likedBy = getLikedBy(post);// maybe just need count
			const repliesTo = getRepliesTo(key);
			createPost(key, post, userData, likedBy, repliesTo);
		}
	}

	function getLikedBy(post) {
		if (!post.likes) return [];
		return Object.keys(post.likes).map(k => db.users[k]);
	}

	function getRepliesTo(postId) {
		return postsList.filter(p => p[1].replyTo == postId);
	}

	function displayPost(key, post, orderTop, params) {
		const userData = db.users[post.user];
		const likedBy = getLikedBy(post);// maybe just need count
		const repliesTo = getRepliesTo(key);
		
		createPost(key, post, userData, likedBy, repliesTo, params, orderTop);
		// postIds.push(key);
	}

	function addSinglePost(postId, showReplies) {
		const post = db.posts[postId];
		displayPost(postId, post, undefined, { showReplies });
	}

	function addLikes(postId) {
		const post = db.posts[postId];
		displayUsers(Object.keys(post.likes), 'likes');
	}

	function addFollows(userId) {
		const users = db.users[userId].follows;
		displayUsers(Object.keys(users), "follows");
	}

	function addFollowers(userId) {
		const users = Object.entries(db.users)
			.filter(u => u[1].follows)
			.filter(u => u[1].follows[userId])
			.map(u => u[0]);
		displayUsers(users, "followers");
	}

	function displayUsers(list, parentId) {
		list.forEach(userId => {
			if (userId && db.users[userId]) {
				const user = createEl('div', ['user'], getId(parentId));
				addUserLink(userId, user, undefined, db.users[userId]);
			}
		});
	}

	function getPostsByIndex(start, end) {
		return postsList
			.filter(p => !p[1].replyTo)
			.slice(start, end);
	}

	function createPost(key, postData, userData, likedBy, repliesTo, params, orderTop) {
		const { text, date, meme, likes, replies, user } = postData;

		let parent = undefined;
		let chronological = false;
		let showReplies = false;
		if (params) {
			parent = params.parent || undefined;
			chronological = params.chronological || false;
			showReplies = params.showReplies || false;
		}

		const posts = parent || getId('posts');

		const post = createEl('div', ['post']);
		post.id = key;
		
		post.dataset.date = date;
		post.dataset.likes = 0;
		post.dataset.replies = 0;
		post.style.order = 1000;
		if (orderTop) post.style.order = 0;

		posts.appendChild(post);

		// animation
		setTimeout(() => {
			post.classList.add('added');
		}, 10);
		
		const userDiv = createEl('div', ['user'], post);
		addUserLink(user, userDiv, post, userData);
		
		// const permalink = MC.createEl('a', ['permalink'], userDiv, MC.formatDate(date, true, true));
		const permalink = createEl('a', ['permalink'], userDiv, '•{•'); // §
		permalink.href = `./post.html?id=${key}`;

		if (text) {
			createEl('p', ['text'], post, text);
		}

		if (meme) {
			// meme is source image from firebase storage
			const memeImage = new Image();
			
			const imageFileName = meme.split('/').pop().replace('png', 'jpg');
			const imagePath = './images/memes/';

			memeImage.src = localizeImageURL('memes', meme);
			memeImage.classList.add('meme');
			post.appendChild(memeImage);

			memeImage.onclick = function() {
				const imagePreview = getId('image-preview-container');
				const image = getId('image-preview-image');
				image.src = memeImage.src;
				imagePreview.classList.add('show-preview');
				imagePreview.onclick = function() {
					imagePreview.classList.remove('show-preview');
				};
			};
		}

		const metrics = createEl('div', ['metrics'], post);
		createEl('span', ['date'], metrics, formatDate(date, true, true) + " • ");
		
		const likesLink = addMetric(key, 'likes', '❦', metrics, count => {
			const n = Object.keys(likedBy).length;
			metricUpdate(count, n);
			post.dataset.likes = n;
			setOrder();
		});
		likesLink.href = `./likes.html?id=${key}`;

		const repliesLink = addMetric(key, 'replies', '↩', metrics, count => {
			const n = repliesTo.length;
			metricUpdate(count, n);
			post.dataset.replies = n;
			setOrder();
		});
		repliesLink.href = `./post.html?id=${key}`;

		function metricUpdate(count, n) {
			post.style.order = 1;
			count.textContent = n;
			count.parentNode.classList.add('updated');
			setTimeout(() => {
				count.parentNode.classList.remove('updated');
			}, 1000);
		}

		if (showReplies) {
			addReplies(key, post, repliesTo);
		}

		setOrder();
		return post;
	}

	function createEl(tagName, classList, parent, text) {
		const e = document.createElement(tagName);
		e.classList.add(...classList);
		if (text !== undefined) e.textContent = text;
		if (parent) parent.appendChild(e);
		return e;
	}

	function getId(id) {
		return document.getElementById(id);
	}

	function formatDate(date, includeTime, includeYear) {
		const d = new Date(date);
		const day = `${d.toLocaleString('default', { month: includeYear ? 'long' : 'short' })} ${d.getDate()}`;
		const hourNumber = d.getHours();
		const hour = hourNumber === 12 ? 12 : hourNumber % 12;
		const time = `${hour}:${('00' + d.getMinutes()).slice(-2)} ${hourNumber >= 12 ? 'PM' : 'AM'}`
		return  day + 
			((includeYear && new Date().getFullYear() !== d.getFullYear()) ? `, ${d.getFullYear()}` : '') +
			(includeTime ? ` ${time}` : '');
			// only add year if it's not current year
	}

	function formatName(name) {
		return name.replace(/-|_/g, ' ');
	}

	function addPost(name, id) {
		console.log('add post?');
	}

	function localizeImageURL(dir, url) {
		// console.log(url);
		return url;

		/* load from firebase for now, if necessary, use archive */
		/*
		const imageFileName = url.split('/').pop().replace('png', 'jpg');
		const imagePath = `./images/${dir}/`;
		return imagePath + imageFileName;
		*/
	}

	function addUserLink(id, parent, imageParent, userData) {
		const userLink = createEl('a', ['user-link'], parent, formatName(userData.name));
		const userURL = `./user.html?id=${id}`;
		userLink.href = userURL;
		const imageLink = createEl('a', ['image-link'], imageParent);

		const userImage = new Image();
		userImage.src = localizeImageURL('profiles', userData.profile_image_url);
		userImage.classList.add('profile-image');
		imageLink.appendChild(userImage);
		imageLink.href = userURL;
	}

	function addMetric(postId, metric, icon, parent, getCount) {
		const link = createEl('a', ['metric'], parent);
		link.title = `View user ${metric}`;
		createEl('span', ['icon'], link, icon);
		const count = createEl('span', ['count'], link, '0');
		getCount(count);
		return link;
	}

	function addReplies(postId, post, repliesTo) {
		const replies = createEl('div', ['replies'], post);
		repliesTo.forEach(rep => {
			const [key, post] = rep;
			const params = { parent: replies, chronological: true, showReplies: true };
			const user = getUser(post.user);
			const likedBy = getLikedBy(post);// maybe just need count
			const repliesTo = getRepliesTo(key);
			const reply = createPost(key, post, user, likedBy, repliesTo, params);
			reply.classList.add('reply');
		});
	}

	return { setOrder, updateOrder, displayPost, getPostsByIndex, getUser, setUserContent, addSinglePost, addLikes, displayUsers, addFollows, addFollowers,
		isActive() { return isActive; }
	};

}