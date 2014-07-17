var MIH = MIH || {},
		$ = jQuery || {},
		win = window || {};

MIH.FEDTest = {
	
	query: '',
	
	$el: $.noop(),
	
	DOS: function() {
		// Prevent DOS abuse:
		return (this.timer.count !== 1000);
	},
	
	DOM: function() {
		var $el = this.$el;
		return {
			$input: $el.find("#search"),
			$results: $el.find("#results-container ul"),
			$details: $el.find("#overlay-container"),
			$tmplResult: $('<div><li><span class="repo-name"/><span class="repo-owner"/></li></div>')
		};
	},
	
	DATA: {
		search: 'https://api.github.com/legacy/repos/search/'
	},
	
	cache: (function(ss) {
			ss = ss || {
				setItem: function(k, v) { this[k] = v; },
				getItem: function(k) { return this[k]; }
			};
			return {
				set: function(k, v) { ss.setItem(k, JSON.stringify(v)); },
				get: function(k) { return JSON.parse(ss.getItem(k)); }
			};			
	})(win.sessionStorage),
	
	timer: {
		id: 0,
		count: 1000,
		start: function(cb, context) {
			var timer = this;
			console.info('Timer started', timer.count);
			timer.id = win.setInterval(function(){
				if (timer.count <= 0) {
					return timer.reset();
				}
				timer.count -= 100;
			}, 100);
			cb.call(context);
		},
		reset: function() {
			if (this.id) {
				win.clearInterval(this.id);
				this.count = 1000;
				this.id = 0;
			}
		}
	},
	
	getGitHubResults: function(event) {
		console.info('Event called:', 'getGitHubResults');
		
		if ('keyup' === event.type && 13 !== event.which) {
			/* Exit if not Enter/Return key press */ return false;			
		}
		
		var data;
		
		this.query = this.DOM.$input.val();
		
		if (data) {
			
			console.info('Cached conditional: Repeated search term(s).');
			// get results from local cache
			
		} else if (!this.DOS()) {
			
			console.info('New search!');
			this.timer.start(function() {
				$.getJSON(
					this.DATA.search + this.query,
					this.renderResults.bind(this)
				);
			}, this);
			
		} else {
			
			console.info('else conditional');
			// Please wait message
			
		}
	},
	
	renderResults: function(data) {
		var strHTML = '',
				dom = this.DOM,
				cache = this.cache,
				query = this.query,
				$results = dom.$results,
				repos = data.repositories,
				tmpl = dom.$tmplResult.html(),
				queries = cache.get('queries');
		
		cache.set('queries', queries.push(query));
		cache.set(query, repos);
		
		repos.forEach(function(v) {
			var $docfrag = $('<div/>').html(tmpl);
			$docfrag.find('.repo-name').html(v.name);
			$docfrag.find('.repo-owner').html(v.owner);
			strHTML += $docfrag.html();
		});
		
		$results.empty().html(strHTML);
		$results.parent().show('slow');
	},
	
	getGitHubDetails: function() {		
		console.info('Event called:', 'getGitHubDetails');
	},
	
	renderDetails: function(data) {
		return data;
	},
	
	bindEvents: function() {
		var e, arr;
		for (e in this.events) {
			arr = e.split(/^(\w+)\s/);
			if (!arr.shift() && arr.length === 2) {
				this.$el.on( arr[0], arr[1], this[this.events[e]].bind(this) );
			}
		}
	},
	
	events: {
		'click #results-container li': 'getGitHubDetails',
		'click #search-submit': 'getGitHubResults',
		'keyup #search': 'getGitHubResults'
	},
	
	init: function() {
		this.defaults = { github: "say2joe" };
		this.cache.set('queries', []);
		this.$el = $("#FEDTest");
		this.DOM = this.DOM();
		this.bindEvents();
	}
	
};

$(function() { MIH.FEDTest.init(); });



/*
    # Endpoint URL #
    
    https://api.github.com/legacy/repos/search/{query}
    
    Note: Github imposes a rate limit of 60 request per minute. Documentation can be found at http://developer.github.com/v3/.
    
    # Example Response JSON #
    
    {
      "meta": {...},
      "data": {
        "repositories": [
          {
            "type": string,
            "watchers": number,
            "followers": number,
            "username": string,
            "owner": string,
            "created": string,
            "created_at": string,
            "pushed_at": string,
            "description": string,
            "forks": number,
            "pushed": string,
            "fork": boolean,
            "size": number,
            "name": string,
            "private": boolean,
            "language": number
          },
          {...},
          {...}
        ]
      }
    }
*/