var github = (function() {

	var api = 'https://api.github.com/';

	var xhrOpen = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function (method, url) {
		this.reqUrl = url;
		return xhrOpen.apply(this, arguments);
	};

	var cache = {
		get: function(key) {
			var result = null;
			if( typeof window.localStorage !== 'undefined' )  {
				result = window.localStorage.getItem(key);
			}
			return result;
		},
		set: function(key, value) {
			if( typeof window.localStorage !== 'undefined' )  {
				window.localStorage.setItem(key, value);
			}
		},
		getETag: function(url) {
			return this.get(url + '::etag');
		},
		setEtag: function(req) {
			return this.set(req.reqUrl + '::etag', req.getResponseHeader('ETag'));
		},
		getContent: function(url) {
			return this.get(url + '::content');
		},
		setContent: function(req) {
			return this.set(req.reqUrl + '::content', req.response);
		}
	};

	var handleResponse = function(req, success) {
		if( req.status === 304 && req.response.length === 0 ) {
			success(JSON.parse(cache.getContent(req.reqUrl)));
		} else if( req.status === 200 ) {
			cache.setEtag(req);
			cache.setContent(req);
			success(JSON.parse(req.response));
		} else {
			success(JSON.parse(req.response));
		}
	};

	return {
		get: function(entity, id, success) {
			var url = api + entity + '/' + id;
			var etag = cache.getETag(url);
			var req = new XMLHttpRequest();

			req.onload = success;
			req.open("get", url, true);
			if( etag !== null ) { req.setRequestHeader('If-None-Match', etag); }
			req.send();
			return req;
		},
		getUser: function(user, success) {
			var req = this.get('users', user, function() {
				handleResponse(req, success);
			});
		},
		getRepo: function(repo, success) {
			var req = this.get('repos', repo, function() {
				handleResponse(req, success);
			});
		}
	};
}());
