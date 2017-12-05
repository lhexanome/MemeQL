/**********************************************************
  Copyright (c) 2006, 2007
    Lee Feigenbaum ( lee AT thefigtrees DOT net )
	Elias Torres   ( elias AT torrez DOT us )
    Wing Yung      ( wingerz AT gmail DOT com )
  All rights reserved.

	Permission is hereby granted, free of charge, to any person obtaining a copy of
	this software and associated documentation files (the "Software"), to deal in
	the Software without restriction, including without limitation the rights to
	use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
	of the Software, and to permit persons to whom the Software is furnished to do
	so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
**********************************************************/

/**
 * Example client interactions
 *

 var sparqler = new SPARQL.Service("http://sparql.org/sparql");
 sparqler.addDefaultGraph("http://thefigtrees.net/lee/ldf-card"); // inherited by all (future) queries
 sparqler.addNamedGraph("http://torrez.us/elias/foaf.rdf");
 sparqler.setPrefix("foaf", "http://xmlns.com/foaf/0.1/"); // inherited by all (future) queries
 sparqler.setPrefix("rdf", "http://xmlns.com/foaf/0.1/");

 sparqler.setRequestHeader("Authentication", "Basic: " + basicAuthString);

 //sparqler.wantOutputAs("application/json"); // for now we only do JSON

 var query = sparqler.createQuery();
 query.addDefualtGraph(...) query.addNamedGraph(...) query.setPrefix(...) query.setRequestHeader(...) // this query only

 // query forms:

 // passes standard JSON results object to success callback
 query.setPrefix("ldf", "http://thefigtrees.net/lee/ldf-card#");
 query.query("SELECT ?who ?mbox WHERE { ldf:LDF foaf:knows ?who . ?who foaf:mbox ?mbox }",
 {failure: onFailure, success: function(json) { for (var x in json.head.vars) { ... } ...}}
 );

 // passes boolean value to success callback
 query.ask("ASK ?person WHERE { ?person foaf:knows [ foaf:name "Dan Connolly" ] }",
 {failure: onFailure, success: function(bool) { if (bool) ... }}
 );

 // passes a single vector (array) of values representing a single column of results to success callback
 query.setPrefix("ldf", "http://thefigtrees.net/lee/ldf-card#");
 var addresses = query.selectValues("SELECT ?mbox WHERE { _:someone foaf:mbox ?mbox }",
 {failure: onFailure, success: function(values) { for (var i = 0; i < values.length; i++) { ... values[i] ...} } }
 );

 // passes a single value representing a single row of a single column (variable) to success callback
 query.setPrefix("ldf", "http://thefigtrees.net/lee/ldf-card#");
 var myAddress = query.selectSingleValue("SELECT ?mbox WHERE {ldf:LDF foaf:mbox ?mbox }",
 {failure: onFailure, success: function(value) { alert("value is: " + value); } }
 );

 // shortcuts for all of the above (w/o ability to set any query-specific graphs or prefixes)
 sparqler.query(...) sparqler.ask(...) sparqler.selectValues(...) sparqler.selectSingleValue(...)


 */
const SPARQL = {}; // SPARQL namespace


/**
 * Both SPARQL service objects and SPARQL query objects receive one query utility method
 * per entry in this dictionary. The key is the name of the method, and the value is a function
 * that transforms the standard JSON output into a more useful form. The return value of a
 * transformation function is passed into any 'success' callback function provided when the query
 * is issued. The following transformations are included:
 *   + query -- identity transform; returns the JSON structure unchanged
 *   + ask -- for ASK queries; returns a boolean value indicating the answer to the query
 *   + selectValues -- for SELECT queries with a single variable; returns an array containing
 *       the answers to the query
 *   + selectSingleValue -- for SELECT queries returning one column with one row; returns the
 *       value in the first (and presumably, only) cell in the resultset
 *   + selectValueArrays -- for SELECT queries returning independent columns; returns a hash
 *       keyed on variable name with values as arrays of answers for that variable. Useful
 *       for UNION queries.
 *   Note that all of the transformations that return values directly lose any type information
 *   and the ability to distinguish between URIs, blank nodes, and literals.
 */
SPARQL._query_transformations = {
	query: function (o) { return o; },
	ask: function (o) { return o["boolean"]; },
	selectValues: function (o) {
        const v = o.head.vars[0]; // assume one variable
        const values = [];
        for (let i = 0; i < o.results.bindings.length; i++)
			values.push(o.results.bindings[i][v].value);
		return values;
	},
	selectSingleValue: function(o) { return o.results.bindings[0][o.head.vars[0]].value; },
	selectValueArrays: function(o) {
		let i;
// factor by value (useful for UNION queries)
        const ret = {};
        for (i = 0; i < o.head.vars.length; i++)
			ret[o.head.vars[i]] = [];
		for (i = 0; i < o.results.bindings.length; i++)
			for (let v in o.results.bindings[i])
				if (ret[v] instanceof Array) ret[v].push(o.results.bindings[i][v].value);
		return ret;
	},
    selectValueHashes: function(o) {
        const hashes = [];
        for (let i = 0; i < o.results.bindings.length; i++) {
            const hash = {};
            for (const v in o.results.bindings[i])
                hash[v] = o.results.bindings[i][v].value;
            hashes.push(hash);
        }
        return hashes;
    }
};

SPARQL.statistics = {
	queries_sent : 0,
	successes    : 0,
	failures     : 0
};

// A SPARQL service represents a single endpoint which implements the HTTP (GET or POST) 
// bindings of the SPARQL Protocol. It provides convenience methods to set dataset and
// prefix options for all queries created for this endpoint.
/**
 * @return {null}
 */
SPARQL.Service = function(endpoint) {
	//---------------
	// private fields
    let _endpoint = endpoint;
    const _default_graphs = [];
    const _named_graphs = [];
    const _prefix_map = {};
    let _method = 'POST';
    let _output = 'json';
    let _max_simultaneous = 0;
    const _request_headers = {};

    //----------
	// accessors
	this.endpoint = function() { return _endpoint; };
	this.defaultGraphs = function() { return _default_graphs; };
	this.namedGraphs = function() { return _named_graphs; };
	this.prefixes = function() { return _prefix_map; };
    this.method = function() { return _method; };
    this.output = function() { return _output; };
	this.maxSimultaneousQueries = function() { return _max_simultaneous; };
	this.requestHeaders = function() { return _request_headers; };
	
	//---------
	// mutators
	function _add_graphs(toAdd, arr) {
		if (toAdd instanceof Array)
			for (let i = 0; i < toAdd.length; i++) arr.push(toAdd[i]);
		else
			arr.push(toAdd);
	}
	this.addDefaultGraph = function(g) { _add_graphs(g, this.defaultGraphs()); };
	this.addNamedGraph = function(g) { _add_graphs(g, this.namedGraphs()); };
	this.setPrefix = function(p, u) { this.prefixes()[p] = u; };
	this.createQuery = function(p) { return new SPARQL.Query(this, p); };
    this.setMethod = function(m) {
        if (m !== 'GET' && m !== 'POST') throw("HTTP methods other than GET and POST are not supported.");
        _method = m;
    };
	this.setOutput = function(o) { _output = o; };
	this.setMaxSimultaneousQueries = function(m) { _max_simultaneous = m; };
	this.setRequestHeader = function(h, v) { _request_headers[h] = v; };
	
	//---------------
	// protected methods (should only be called within this module
	this._active_queries = 0;
	this._queued_queries = [];
	this._next_in_queue  = 0;
	this._canRun = function() { return this.maxSimultaneousQueries() <= 0 || this._active_queries < this.maxSimultaneousQueries();};
	this._queue  = function(q,f, p) { 
		if (!p) p = 0; 
		if (p > 0) {
			for (let i = 0; i < this._queued_queries.length; i++) {
				if (this._queued_queries[i] != null && this._queued_queries[i][2] < p) {
					this._queued_queries.splice(i, 0, [q, f, p]);
					return;
				}
			}
		}
		this._queued_queries.push([q,f,p]); 
	};
	this._markRunning = function(q) { this._active_queries++; };
	this._markDone    = function(q) { 
		this._active_queries--; 
		//document.getElementById('log').innerHTML+="query done. " + this._active_queries + " queries still active.<br>";
		if (this._queued_queries[this._next_in_queue] != null && this._canRun()) {
            const a = this._queued_queries[this._next_in_queue];
            this._queued_queries[this._next_in_queue++] = null;
			// a[0] is query object, a[1] is function to run query
			//document.getElementById('log').innerHTML += "running query from Q<br>";
			a[1]();
		}
	};

	//---------------
	// public methods

	// use our varied transformations to create the various shortcut methods of actually 
	// issuing queries without explicitly creating a query object
	for (const query_form in SPARQL._query_transformations) {
		// need the extra function to properly scope query_form (qf)
		this[query_form] = (function(qf) {
			return function(queryString, callback) {
                const q = this.createQuery();
                q._doQuery(queryString, callback, SPARQL._query_transformations[qf]);
			};
		})(query_form);
	}
	
	//------------
	// constructor
    
	if (!_endpoint)
		return null;
	
	return this;
}

/**
 * A SPARQL query object should be created using the createQuery method of a SPARQL
 * service object. It allows prefixes and datasets to be defined specifically for
 * a single query, and provides introspective methods to see the query string and the
 * full (HTTP GET) URL of the query.
 */
SPARQL.Query = function(service, priority) {
	//---------------
	// private fields
    const _conn = null;
    const _service = service;
    const _default_graphs = clone_obj(service.defaultGraphs()); // prevent future updates from affecting us
    const _named_graphs = clone_obj(service.namedGraphs());
    const _prefix_map = clone_obj(service.prefixes());
    let _user_query = ''; // doesn't include auto-generated prefix declarations
    let _method = service.method();
    const _output = service.output();
    const _priority = priority || 0;
    const _request_headers = clone_obj(service.requestHeaders());

    //------------------
	// private functions
	function _create_json(text) { 
		if (!text)
			return null;
		// make sure this is safe JSON
		// see: http://www.ietf.org/internet-drafts/draft-crockford-jsonorg-json-03.txt
		
		// (1) strip out quoted strings
        const no_strings = text.replace(/"(\\.|[^"\\])*"/g, '');
        // (2) make sure that all the characters are explicitly part of the JSON grammar
		// (in particular, note as discussed in the IETF submission, there are no assignments
		//  or function invocations allowed by this reg. exp.)
        let hasBadCharacter = /[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(no_strings);
        // (3) evaluate the JSON string, returning its contents
		if (!hasBadCharacter) {
			try {
				return eval('(' + text + ')');
			} catch (e) {
				return null;
			}
		}
		return null; 
	}	
	
	function clone_obj(o) {
        const o2 = o instanceof Array ? [] : {};
        for(const x in o) {o2[x] = o[x];}
		return o2;
	}

	//----------------
	// private methods
	this._doCallback = function(cb, which, arg) {
		//document.getElementById('log').innerHTML += "_doCallback ... <br>";
        const user_data = "argument" in cb ? cb.argument : null;
        if (which in cb) {
			if (cb.scope) {
                cb[which].apply(cb.scope, [arg, user_data]);
			} else { 
				cb[which](arg, user_data); 
			}
		}
	}
	
	this._queryFailure = function(xhr, arg) {
		SPARQL.statistics.failures++;
		_service._markDone(this);
		this._doCallback(arg.callback, 'failure', xhr /* just pass through the connection response object */);
	};
	this._querySuccess = function(xhr, arg) {
        //alert(xhr.responseText);
		SPARQL.statistics.successes++;
		_service._markDone(this);
		this._doCallback(arg.callback, 'success', arg.transformer(
			_output === 'json' ? _create_json(xhr.responseText) : xhr.responseText
		));
	};
	
	function getXmlHttpRequest(url) {
		// right now, this only does Firefox (Opera? Safari?)
		return new XMLHttpRequest();
	}
	
	this._doQuery = function(queryString, callback, transformer) {
		_user_query = queryString;
		if (_service._canRun()) {
			try {
				if (_method !== 'POST' && _method !== 'GET')
					throw("HTTP methods other than GET and POST are not supported.");

                const url = _method === 'GET' ? this.queryUrl() : this.service().endpoint();
                const xhr = getXmlHttpRequest(url);
                let content = null;

                try {
                    if (!document.domain || (url.match(/^https?:\/\//) && url.slice(7, document.domain.length + 7) != document.domain && window.netscape && netscape.security && netscape.security.PrivilegeManager)) {
						netscape.security.PrivilegeManager.enablePrivilege( "UniversalBrowserRead");
						netscape.security.PrivilegeManager.enablePrivilege( "UniversalXPConnect"); 
					}
				} catch(e) {
					alert("Cross-site requests prohibited. You will only be able to SPARQL the origin site: " + e);
                    return;
				}
				
				xhr.open(_method, url, true /* async */);
				
				// set the headers, including the content-type for POSTed queries
				for (const header in this.requestHeaders())
                    if (typeof(this.requestHeaders()[header]) != "function")
	    				xhr.setRequestHeader(header, this.requestHeaders()[header]);
				if (_method === 'POST') {
					xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
					content = this.queryParameters();
				}
	
				SPARQL.statistics.queries_sent++;
				_service._markRunning(this);

                const callbackData = {
                    scope: this,
                    success: this._querySuccess,
                    failure: this._queryFailure,
                    argument: {
                        transformer: transformer,
                        callback: callback
                    }
                };

                // I've seen some strange race-condition behavior (strange since normally
				// JS is single-threaded, so synchronization conditions don't occur barring 
				// reentrancy) with onreadystatechange. Instead, we poll asynchronously to
				// determine when the request is done.
                const token = window.setInterval(
                    function () {
                        if (xhr.readyState === 4) { // ready!
                            // clear this handler
                            window.clearInterval(token);
                            // we check the status to know which callback to call
                            if (xhr.status >= 200 && xhr.status < 300)
                                callbackData.success.apply(callbackData.scope, [xhr, callbackData.argument]);
                            else
                                callbackData.failure.apply(callbackData.scope, [xhr, callbackData.argument]);
                        }
                    },
                    200 /* maybe this should be customizable */
                );

                xhr.send(content);
			} catch (e) {
				alert("Error sending SPARQL query: " + e);
			}
		} else {
            const self = this;
            _service._queue(self, function() { self._doQuery(queryString, callback, transformer); }, _priority);
		}
	};

	
	//----------
	// accessors
	this.request = function() { return _conn; };
	this.service = function() { return _service; };
	this.defaultGraphs = function() { return _default_graphs; };
	this.namedGraphs = function() { return _named_graphs; };
	this.prefixes = function() { return _prefix_map; };
    this.method = function() { return _method; };
    this.requestHeaders = function() { return _request_headers; };


    /**
     * Returns the SPARQL query represented by this object. The parameter, which can
     * be omitted, determines whether or not auto-generated PREFIX clauses are included
     * in the returned query string.
     */
	this.queryString = function(excludePrefixes) {
        let preamble = '';
        if (!excludePrefixes) {
			for (const prefix in this.prefixes()) {
				if(typeof(this.prefixes()[prefix]) != 'string') continue;
				preamble += 'PREFIX ' + prefix + ': <' + this.prefixes()[prefix] + '> ';
			}
		}
		return preamble + _user_query;
	};
	
    /**
     * Returns the HTTP query parameters to invoke this query. This includes entries for
     * all of the default graphs, the named graphs, the SPARQL query itself, and an 
     * output parameter to specify JSON (or other) output is desired.
     */
	this.queryParameters = function () {
        let urlQueryString = '';
        let i;

        // add default and named graphs to the protocol invocation
		for (i = 0; i < this.defaultGraphs().length; i++) urlQueryString += 'default-graph-uri=' + encodeURIComponent(this.defaultGraphs()[i]) + '&';
		for (i = 0; i < this.namedGraphs().length; i++) urlQueryString += 'named-graph-uri=' + encodeURIComponent(this.namedGraphs()[i]) + '&';
		
		// specify JSON output (currently output= supported by latest Joseki) (or other output)
		urlQueryString += 'output=' + _output + '&';
		return urlQueryString + 'query=' + encodeURIComponent(this.queryString());
	}
	
    /**
     * Returns the HTTP GET URL to invoke this query. (Note that this returns a full HTTP GET URL 
     * even if this query is set to actually use POST.)
     */
	this.queryUrl = function() {
        const url = this.service().endpoint() + '?';
        return url + this.queryParameters();
	};
	
	//---------
	// mutators
	function _add_graphs(toAdd, arr) {
		if (toAdd instanceof Array)
			for (let i = 0; i < toAdd.length; i++) arr.push(toAdd[i]);
		else
			arr.push(toAdd);
	}
	this.addDefaultGraph = function(g) { _add_graphs(g, this.defaultGraphs()); };
	this.addNamedGraph = function(g) { _add_graphs(g, this.namedGraphs()); };
	this.setPrefix = function(p, u) { this.prefixes()[p] = u; };
    this.setMethod = function(m) {
        if (m !== 'GET' && m !== 'POST') throw("HTTP methods other than GET and POST are not supported.");
        _method = m;
    };
	this.setRequestHeader = function(h, v) { _request_headers[h] = v; };
	
	//---------------
	// public methods

	// use our varied transformations to create the various methods of actually issuing 
	// queries
	for (const query_form in SPARQL._query_transformations) {
		// need the extra function to properly scope query_form (qf)
		this[query_form] = (function(qf) {
			return function(queryString, callback) {
				this._doQuery(queryString, callback, SPARQL._query_transformations[qf]);
			};
		})(query_form);
	}
	

	//------------
	// constructor
	
	return this;
}

// Nothing to see here, yet.
SPARQL.QueryUtilities = {
};

module.exports = {
	SPARQL
};