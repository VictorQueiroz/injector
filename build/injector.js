!function(){"use strict";function t(t,r){this.path=[],this.cache=r||{},this.pending=t}var r=/^\s*(_?)(\S+?)\1\s*$/,n=/^[^\(]*\(\s*([^\)]*)\)/m,e=/,/,i=function(t){return t.toString()},o=function(t,r){return t.match(r)};t.extractArgs=function(t){for(var n=t.split(e),i=[],o=n.length;o--;)n[o].replace(r,function(t,r,n){i[o]=n});return i},t.deps=function(t){var r=o(i(t),n);return this.extractArgs(r[1])},t.annotate=function(t){return this.deps(t).concat(t)};var c={},s="injector";t.prototype={get:function(t){if(t==s)return this;var r=this.path,n=this.cache,e=this.pending;if(n.hasOwnProperty(t)){if(n[t]===c)throw new Error("Circular dependency found: "+t+" <- "+r.join(" <- "));return n[t]}if(!e.hasOwnProperty(t))throw new Error("service "+t+" not found");try{return r.unshift(t),n[t]=c,n[t]=this.load(t,e[t])}catch(i){throw n[t]===c&&delete n[t],i}finally{r.shift()}},load:function(r,n){var e,i;for(Array.isArray(n)?(e=n.slice(0,-1),n=n[n.length-1]):e=Array.isArray(n.$inject)?n.$inject:t.deps(n),i=e.length;i--;)e[i]=this.get(e[i]);return n.apply(null,e)}},window.injector={Injector:t}}();