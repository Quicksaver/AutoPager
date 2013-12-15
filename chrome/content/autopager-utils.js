var autopagerUtils = {
    version:"0.8.0.8",
    formatVersion: 1,
    log: (typeof location!= "undefined" && location.protocol=="chrome:") ? function(message) {
        if (autopagerPref.loadBoolPref("debug"))
        {
            var consoleService = Components.classes['@mozilla.org/consoleservice;1']
            .getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage(message)
        }
    } : function(message) {
        if (autopagerPref.loadBoolPref("debug"))
            debug(message)
    },    
    currentDocument: function()
    {
        var b = this.currentBrowser();
        if (b && b.docShell)
            return this.currentBrowser().contentDocument;
    },
    currentBrowser: function()
    {
        var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
        var browser = windowManager.getMostRecentWindow("navigator:browser").document.getElementById("content");


        return browser;
    },
    currentWindow: function()
    {
        var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
        var browserWindow = windowManager.getMostRecentWindow("navigator:browser");
        return browserWindow;
    },
    cloneBrowser: function(targetB, originalB)
    {
        if (!targetB.docShell)
            return;
        var webNav = targetB.docShell.QueryInterface(Components.interfaces.nsIWebNavigation);
        var newHistory = webNav.sessionHistory;

        if (newHistory == null)
        {
            newHistory = Components.classes["@mozilla.org/browser/shistory-internal;1"].getService(Components.interfaces.nsISHistory);
            webNav.sessionHistory = newHistory;
        }
        newHistory = newHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);

        // delete history entries if they are present
    
        if (newHistory.count > 0)
            newHistory.PurgeHistory(newHistory.count);
        var originalHistory  = webNav.sessionHistory;
        originalHistory = originalHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);


        var entry = originalHistory.getEntryAtIndex(originalHistory.index,false).QueryInterface(Components.interfaces.nsISHEntry);
        var newEntry = this.cloneHistoryEntry(entry);
        if (newEntry)
            newHistory.addEntry(newEntry, true);
    

        webNav.gotoIndex(0);
    
    },
    trim : function (str) {
        if (!str)
            return str;
        var newstr = str.replace(/^\s\s*/, ''),
		ws = /\s/,
		i = newstr.length;
	while (ws.test(str.charAt(--i)));
	return newstr.slice(0, i + 1);
    },
    getSmarttext: function(){
        return "autopager-next|" + autopagerPref.loadUTF8Pref("smarttext");  
    },
    getStyle :function (el, cssprop){
        if (el.ownerDocument && el.ownerDocument.defaultView && el.ownerDocument.defaultView.getComputedStyle) 
            return el.ownerDocument.defaultView.getComputedStyle(el, "")[cssprop]
        else if (el.currentStyle)
            return el.currentStyle[cssprop]
        else //try and get inline style
            return el.style[cssprop]
    },
    cloneHistoryEntry: function(aEntry) {
        if (!aEntry)
            return null;
        aEntry = aEntry.QueryInterface(Components.interfaces.nsISHContainer);
        var newEntry = aEntry.clone(true);
        newEntry = newEntry.QueryInterface(Components.interfaces.nsISHContainer);
        newEntry.loadType = Math.floor(aEntry.loadType);
        if (aEntry.childCount) {
            for (var j = 0; j < aEntry.childCount; j++) {
                var childEntry = this.cloneHistoryEntry(aEntry.GetChildAt(j));
                if (childEntry)
                    newEntry.AddChild(childEntry, j);
            }
        }
        return newEntry;
    }
    ,
    findContentWindow: function(doc) {
        var ctx = doc;
        if(!ctx)
            return null;
        const ci = Components.interfaces;
        const lm = this.lookupMethod;
        if(!(ctx instanceof ci.nsIDOMWindow)) {
            if(ctx instanceof ci.nsIDOMDocument) {
                ctx = lm(ctx, "defaultView")();
            } else if(ctx instanceof ci.nsIDOMNode) {
                ctx = lm(lm(ctx, "ownerDocument")(), "defaultView")();
            } else return null;
        }
        if(!ctx) return null;
        ctx = lm(ctx, "top")();
    
        return ctx;
    },
    windowEnumerator : function(aWindowtype) {
        if (typeof(aWindowtype) == "undefined")
            aWindowtype = "navigator:browser";
        var WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
        .getService(Components.interfaces.nsIWindowMediator);
        return WindowManager.getEnumerator(aWindowtype);
    },
    numberOfWindows : function(all, aWindowtype) {
        var enumerator = autopagerUtils.windowEnumerator(aWindowtype);
        var count = 0;
        while ( enumerator.hasMoreElements() ) {
            var win = enumerator.getNext();
            if ("SessionManager" in win && win.SessionManager.windowClosed)
                continue;
            count++;
            if (!all && count == 2)
                break;
        }
        return count;
    },
    isLastWindow : function(aWindowtype) {
        var count = autopagerUtils.numberOfWindows(false,aWindowtype);
        return count <=1;
    },
    clone : function(obj,level,noconstructor,ignorefunction){
        if (typeof level== "undefined")
            level = 10;
        if(obj == null || typeof obj != 'object')
            return obj;
        var temp;
        if (!noconstructor)
            temp = new obj.constructor();
        else
            temp = {}

        if (level>0){
            for(var key in obj)
            {
                if (!ignorefunction || typeof obj[key] != "function")
                    temp[key] = this.clone(obj[key],level-1,noconstructor,ignorefunction);
            }            
        }
        return temp;
    },
    getLocale : function ()
    {
        return navigator.language;
    },
    isChineseLocale : function ()
    {
        var l = navigator.language;
        return (l == 'zh-CN' || l == 'zh-TW');
    },
    baseUrl : function (sourceUri)
    {
        var uri = sourceUri
        if (uri.lastIndexOf("/"))
        {
            uri = uri.substring(0,uri.lastIndexOf("/")+1);
        }
        
        return uri;
    },
    clearUrl : function (sourceUri)
    {
        var uri = autopagerUtils.parseUri(sourceUri)
        return autopagerUtils.doClearedUrl(uri)
    },
    getPathOfUri : function (uri)
    {
        var u = uri["protocol"] + "://" + uri["host"] + ":" + uri["port"] + uri["directoryPath"] + uri["fileName"];
        return u;
    },
    doClearedUrl : function (uri)
    {
        var u = this.getPathOfUri(uri);
        for(var k in uri["searchParts"])
        {
            u += k + "=&";
        }
        return u;
    },
    parseUri : function (sourceUri){
        var uriPartNames = ["href","protocol","host","hostname","port","pathname","directoryPath","fileName","search","hash"];
        var uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)?((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?").exec(sourceUri);
        var uri = {};

        for(var i = 0; i < 10; i++){
            uri[uriPartNames[i]] = (uriParts[i] ? uriParts[i] : "");
        }

        // Always end directoryPath with a trailing backslash if a path was present in the source URI
        // Note that a trailing backslash is NOT automatically inserted within or appended to the "path" key
        if(uri.directoryPath.length > 0){
            uri.directoryPath = uri.directoryPath.replace(/\/?$/, "/");
        }
        uri.pathes = uri.pathname.substring(1).split("/");
        var search = uri["search"];
        var searchParts = this.parseSearch(search);
        uri["searchParts"] = searchParts
        return uri;
    },
    parseSearch : function(search)
    {
        /* parse the query */
        var x = search.replace(/;/g, '&').split('&');
        var q={};
        for (var i=0; i<x.length; i++)
        {
            if (x[i].length==0)
                continue;
            var t = x[i].split('=', 2);
            var name = unescape(t[0]);
            var v;
            if (t.length > 1)
                v = unescape(t[1]);
            else
                v = true;

            if (q[name])
            {
                var vs = [];
                vs[0] = q[name];
                q[name] = vs;
                q[name][q[name].length] = v;
            }
            else
                q[name] = v;
        }
        return q;
    },
    // Dump the object in a table
    dumpResults : function(obj,container){
        var output = "";
        for (var property in obj){
            output += '<tr><td class="name">' + property +
            '</td><td class="result">"<span class="value">' +
            this.dumpObject(obj[property],10) + '</span>"</td></tr>';
        }
        container.innerHTML = "<table>" + output + "</table>";
    },
    dumpObject : function (obj,level)
    {
        if (typeof level=="undefined")
            level = 1;
        if(obj == null || typeof obj != 'object' || level<0)
            return obj;
        var temp = "[";

        for(var key in obj)
        {
            if (temp.length>1)
                temp+=",";
            try{
                temp += key + "=" + this.dumpObject(obj[key],level-1);
            }catch(e){
                temp += key + "=<unable to access>";
            }
        }
        return temp+"]";
    },
    getPattern : function (location ,depth)
    {
        var url=location.protocol + "://" + location.host ;//+ (location.port!=""?location.port : "");
        for(var lastPos=0;lastPos<depth && lastPos<location.pathes.length;lastPos++)
        {
            url += "/" + location.pathes[lastPos]
        }
        return url + (depth<=location.pathes.length-1 || depth==0 ?"/*":"*");
    },
    isNotMain : function(str,num)
    {
        return ((str.match(/[0123456789-_]/g) && str.match(/[0123456789-_]/g).length>=num)
            || str.replace(/[0123456789-_]/g,'').length==0);
    },
    getMainDirDepth : function (location ,num)
    {
        var align=0;
        if (location.pathname.match(/(\.)(html|shtml|txt|htm)(\*)?$/) || (location.pathname.match(/(\.)(asp|php|php3|php5)(\*)?$/)) && location.search=="")
            align = 1;
        var lastPos =0;
        for(lastPos=location.pathes.length-1-align;
            lastPos>=0 && this.isNotMain(location.pathes[lastPos],num) ;lastPos--)
            {
        }

        //        if (lastPos ==0 && align==0 && location.pathes.length==1 &&
        //                (location.pathes[lastPos].match(/[0123456789-_]/g) == null || location.pathes[lastPos].match(/[0123456789-_]/g).length<num))
        //                return 1;
        return lastPos+1;
    },
    correctRegExp : function( pattern ) {
        var s = new String(pattern);
        var res = new String("");
        var escaped = false;
        var c = '';
        for (var i = 0 ; i < s.length ; i++) {
            c = s[i];
            if(c == '\\')
            {
                escaped = !escaped;
                res += c;
            }else
            {
                if (c == '/' && !escaped)
                {
                    res += "\\";
                }
                res+=c;
                escaped = false;
            }
        }
        return new RegExp(res, "i");
    },
    getRegExp :function(site)
    {
        try{
            if (!site.regex)
            {
                if (site.isRegex)
                    try{
                        //site.regex = new RegExp(autopagerUtils.correctRegExp(site.urlPattern));
                        site.regex = new RegExp(site.urlPattern);
                    }catch(re)
                    {
                        try{
                            site.regex = new RegExp(autopagerUtils.correctRegExp(site.urlPattern));
                        }catch(e){
                            //error create regexp, try to use it as pattern
                            site.regex = autopagerUtils.convert2RegExp(site.urlPattern);
                        }        
                    }
                else
                    site.regex = autopagerUtils.convert2RegExp(site.urlPattern);
            }
        }catch(e)
        {
            site.regex = /no-such-regex/;
        }
        return site.regex;
    }
    ,
    getRegExp2 :function(pattern)
    {
        try{
            if (!pattern.rg)
            {
                if (pattern.r)
                    try{
                        pattern.rg = new RegExp(pattern.u);
                    }catch(re)
                    {
                        try{
                            pattern.rg = new RegExp(autopagerUtils.correctRegExp(pattern.u));
                        }catch(e){
                            //error create regexp, try to use it as pattern
                            pattern.rg = autopagerUtils.convert2RegExp(pattern.u);
                        }
                    }
                else
                    pattern.rg = autopagerUtils.convert2RegExp(pattern.u);
            }
        }catch(e)
        {
            pattern.rg = /no-such-regex/;
        }
        return pattern.rg;
    }
    ,
    printStackTrace : function() {
        var callstack = [];
        var ex = null;
        try {
            i.dont.exist+=0; //doesn't exist- that's the point
        } catch(e) {
            ex = e;
        }
        callstack = this.getStack(ex);
        this.output(callstack);
    },
    getStack : function(e) {
        if (typeof e == "undefined")
        {
            try {
                i.dont.exist+=0; //doesn't exist- that's the point
            } catch(ex) {
                e = ex;
            }
        }
        var callstack = [];
        var isCallstackPopulated = false;

        if (e.stack) { //Firefox
            var lines = e.stack.split("\n");
            for (var i=0, len=lines.length; i<len; i++) {
                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(:/)) {
                    callstack.push(lines[i]);
                }
            }
            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        }
        else if (window.opera && e.message) { //Opera
            var lines = e.message.split("\n");
            for (var i=0, len=lines.length; i<len; i++) {
                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                    var entry = lines[i];
                    //Append next line also since it has the file info
                    if (lines[i+1]) {
                        entry += " at " + lines[i+1];
                        i++;
                    }
                    callstack.push(entry);
                }
            }
            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        }

        if (!isCallstackPopulated) { //IE and Safari
            var currentFunction = arguments.callee.caller;
            while (currentFunction) {
                var fn = currentFunction.toString();
                var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf("(")) || "anonymous";
                callstack.push(fname);
                currentFunction = currentFunction.caller;
            }
        }
        return callstack;
    }
    ,
    output : function(arr) {
        //Optput however you want
        autopagerBwUtil.consoleError(arr.join("\n"));
    }
    ,
    outputStack : function(ex) {
        var callstack = this.getStack(ex);
        this.output(callstack);
    }
    ,
    getTopDoc : function (doc)
    {
        try{
            return doc.defaultView? doc.defaultView.top.document : (doc.top?doc.top:doc);            
        }catch(e){
            return doc;
        }
    }
    ,
    findUrlInElement : function (ele)
    {
        if (ele !=null && ele.href)
            return ele.href;
            
        var href = this.findUrlInBelowElement(ele);
        if (href != null && typeof href == 'string')
            return href;
        href = this.findUrlInUpperElement(ele);
        return href;

    }
    ,
    findUrlInBelowElement : function (ele)
    {
        if (!ele.childNodes)
            return null;
        var childNode=null;
        for (var i = 0; (childNode = ele.childNodes[i]); i++)
        {
            if (childNode !=null && childNode.href)
                return childNode.href;
        }
        for (var i = 0; (childNode = ele.childNodes[i]); i++)
        {
            var href = this.findUrlInBelowElement(childNode);
            if (href != null && typeof href == 'string')
                return href;
        }
        return null;
    }
    ,
    findUrlInUpperElement : function (ele)
    {
        while(ele !=null && ele.parentNode!=null && ele.parentNode!=ele)
        {
            if (ele !=null && ele.href)
                return ele.href;
            ele = ele.parentNode
        }
        return null;
    }
    ,
    getUrl : function (doc)
    {
        if (!doc)
            return "";

        if (doc.location && doc.location.href)
            return doc.location.href;
        if (doc && doc.documentElement && doc.documentElement.getAttribute("url"))
            return doc.documentElement.getAttribute("url");
        return "";
    }
    ,
    isValidDoc : function (doc)
    {
        if (doc == null)
            return false;
        if (!autopagerUtils.isHTMLDocument(doc))
        {
            return false;
        }
        if (doc.defaultView == null)
            return false;
        if (doc.location == null)
        {
            return false;
        }
        if (doc.contentType && /application\/xml/.test(doc.contentType)){
            return false;
        }
        return true;
    }
    ,
    getFormName : function(node)
    {
        while(node && node.localName.toLowerCase()!="form"
            && node.localName.toLowerCase()!="body"
            && node != node.parentNode)
        node = node.parentNode;
        if (!node || node.localName.toLowerCase()!="form" || (!node.id && !node.name))
            return "_default_";
        if (!node.id)
            return node.id;
        if (!node.name)
            return node.name;
        return "_default_";
    }
    ,
    serializeUserInput : function(aFrame)
    {
        var data = {};
        try {
            var xpe = null;
            try{
                xpe = new XPathEvaluator();
            }catch(e)
            {
                xpe = doc
            }
            var nsResolver = xpe.createNSResolver(aFrame.document.documentElement);
            var xpathResult = aFrame.document.evaluate(
                'descendant::textbox | descendant::*[local-name() = "input" or local-name() = "INPUT" or local-name() = "textarea" or local-name() = "TEXTAREA"]',
                aFrame.document,
                nsResolver,
                AutoPagerNS.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
                );
            if (xpathResult.snapshotLength) {
                var node;
                for (var i = 0, maxi = xpathResult.snapshotLength; i < maxi; i++)
                {
                    node = xpathResult.snapshotItem(i);
                    if (node.wrappedJSObject) node = node.wrappedJSObject;
                    if (!node.id && !node.name)
                        continue;

                    var formName = autopagerUtils.getFormName(node);
                    var form = data[formName];
                    if (typeof form == "undefined")
                    {
                        form = {}
                        data[formName]=form;
                    }
                    var text = {};
                    text.id = node.id;
                    text.name = node.name;
                    form[text.id +"|" + text.name] = text
                    switch (node.localName.toLowerCase())
                    {
                        case 'input':
                            if (/^(true|readonly|disabled)$/i.test(node.getAttribute('readonly') || node.getAttribute('disabled') || ''))
                                continue;
                            switch ((node.getAttribute('type') || '').toLowerCase())
                            {
                                case 'checkbox':
                                    text.value = node.checked ? true : false;
                                    break;

                                case 'radio':
                                case 'text':
                                    text.value = node.value;
                                    break;
                                case 'submit':
                                case 'reset':
                                case 'button':
                                case 'image':
                                default:
                                    break;
                            }
                            break;
                        case 'textbox':
                        case 'text':
                        case 'textarea':
                            if (node.value)
                                text.value = node.value;
                            break;

                        default:
                            break;
                    }

                }
            }
        }
        catch(e) {
            autopagerBwUtil.consoleError(e);
        }
        //data.innerHTML = aFrame.document.documentElement.innerHTML
        var frames = aFrame.frames;
        if (frames.length) {
            data.children = [];
            for (var i = 0, maxi = frames.length; i < maxi; i++)
            {
                data.children.push(autopagerUtils.serializeUserInput(frames[i]));
            }
        }

        return data;
    }
    ,
    deSerializeUserInput : function(aFrame,data)
    {
        try {
            var xpe = null;
            try{
                xpe = new XPathEvaluator();
            }catch(e)
            {
                xpe = aFrame.document
            }
            var nsResolver = xpe.createNSResolver(aFrame.document.documentElement);
            var xpathResult = aFrame.document.evaluate(
                'descendant::textbox | descendant::*[local-name() = "input" or local-name() = "INPUT" or local-name() = "textarea" or local-name() = "TEXTAREA"]',
                aFrame.document,
                nsResolver,
                AutoPagerNS.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
                );
            if (xpathResult.snapshotLength) {
                var node;
                for (var i = 0, maxi = xpathResult.snapshotLength; i < maxi; i++)
                {
                    node = xpathResult.snapshotItem(i);
                    if (node.wrappedJSObject) node = node.wrappedJSObject;
                    if (!node.id && !node.name)
                        continue;

                    var formName = autopagerUtils.getFormName(node);
                    var form = data[formName];
                    if (typeof form == "undefined")
                    {
                        continue;
                    }
                    var text = form[node.id +"|" + node.name];
                    if (typeof text == "undefined")
                    {
                        continue;
                    }
                    switch (node.localName.toLowerCase())
                    {
                        case 'input':
                            if (/^(true|readonly|disabled)$/i.test(node.getAttribute('readonly') || node.getAttribute('disabled') || ''))
                                continue;
                            switch ((node.getAttribute('type') || '').toLowerCase())
                            {
                                case 'checkbox':
                                    node.checked  = text.value;
                                    break;

                                case 'radio':
                                case 'text':
                                    node.value = text.value ;
                                    break;
                                case 'submit':
                                case 'reset':
                                case 'button':
                                case 'image':
                                default:
                                    break;
                            }
                            break;
                        case 'textbox':
                        case 'text':
                        case 'textarea':
                            if (text.value)
                                node.value = text.value;
                            break;

                        default:
                            break;
                    }

                }
            }
        }
        catch(e) {
            autopagerBwUtil.consoleError(e);
        }
        //aFrame.document.documentElement.innerHTML = data.innerHTML
        var frames = aFrame.frames;
        if (frames.length && data.children ) {
            for (var i = 0, maxi = Math.min(frames.length,data.children.length); i < maxi; i++)
            {
                autopagerUtils.deSerializeUserInput(frames[i],data.children[i]);
            }
        }

        return data;
    }
    ,
    noprompt : function()
    {
        return autopagerPref.loadBoolPref("noprompt") || autopagerBwUtil.isInPrivateMode()
        || autopagerBwUtil.isMobileVersion();
    },
    containsNode : function(parent, descendant) {
        // We use browser specific methods for this if available since it is faster
        // that way.

        // IE / Safari(some) DOM
        if (typeof parent.contains != 'undefined') {
            return parent == descendant || parent.contains(descendant);
        }

        // W3C DOM Level 3
        if (typeof parent.compareDocumentPosition != 'undefined') {
            return parent == descendant ||
            Boolean(parent.compareDocumentPosition(descendant) & 16);
        }

        // W3C DOM Level 1
        while (descendant && parent != descendant) {
            descendant = descendant.parentNode;
        }
        return descendant == parent;
    }

    ,
    Set_Cookie : function(doc, name, value, expires, domain, path, secure )
    {
        // set time, it's in milliseconds
        var today = new Date();
        today.setTime( today.getTime() );

        /*
if the expires variable is set, make the correct
expires time, the current script below will set
it for x number of days, to make it for hours,
delete * 24, for minutes, delete * 60 * 24
*/
        if ( expires )
        {
            expires = expires * 1000 * 60 * 60 * 24;
        }
        var expires_date = new Date( today.getTime() + (expires) );

        var oldCookie = doc.cookie
        var a_all_cookies = oldCookie.split( ';' );
        oldCookie = ''
        for (var i = 0; i < a_all_cookies.length; i++ )
        {
            // now we'll split apart each name=value pair
            var a_temp_cookie = a_all_cookies[i].split( '=' );
            // and trim left/right whitespace while we're at it
            var cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');

            // if the extracted name matches passed check_name
            if ( cookie_name != name )
            {
                oldCookie += ";" +  a_all_cookies[i]
            }
        }
        doc.cookie = name + "=" +escape( value ) +
        ( ( expires ) ? ";expires=" + expires_date.toGMTString() : "" ) +
        ( ( path ) ? ";path=" + path : "" ) +
        ( ( domain ) ? ";domain=" + domain : "" ) +
        ( ( secure ) ? ";secure" : "" )
        + oldCookie;
    }
    // this fixes an issue with the old method, ambiguous values
    // with this test document.cookie.indexOf( name + "=" );
    ,
    Get_Cookie : function(doc, check_name ) {
        // first we'll split this cookie up into name/value pairs
        // note: document.cookie only returns name=value, not the other components
        var a_all_cookies = doc.cookie.split( ';' );
        var a_temp_cookie = '';
        var cookie_name = '';
        var cookie_value = '';
        var b_cookie_found = false; // set boolean t/f default f

        for (var i = 0; i < a_all_cookies.length; i++ )
        {
            // now we'll split apart each name=value pair
            a_temp_cookie = a_all_cookies[i].split( '=' );


            // and trim left/right whitespace while we're at it
            cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');

            // if the extracted name matches passed check_name
            if ( cookie_name == check_name )
            {
                b_cookie_found = true;
                // we need to handle case where cookie has no value but exists (no = sign, that is):
                if ( a_temp_cookie.length > 1 )
                {
                    cookie_value = unescape( a_temp_cookie[1].replace(/^\s+|\s+$/g, '') );
                }
                // note that in cases where cookie is initialized but no value, null is returned
                return cookie_value;
                break;
            }
            a_temp_cookie = null;
            cookie_name = '';
        }
        if ( !b_cookie_found )
        {
            return null;
        }
    }
    ,
    notification : function (id,message,buttons)
    {
        if (typeof autopagerBwUtil.notification != "undefined")
        {
            autopagerBwUtil.notification(id,message,buttons)
        }
    }
    // Converts a pattern in this programs simple notation to a regular expression.
    // thanks AdBlock! http://www.mozdev.org/source/browse/adblock/adblock/
    ,
    simpleRegex : /^[^*]+\*$/,
    isSimple : function (s)
    {
        return (s && this.simpleRegex.test(s));
    },
    convert2RegExp : function( pattern ) {
        if (this.isSimple(pattern))
            return new AutoPagerNS.SimpleRegExp(pattern);        
        return new RegExp(autopagerUtils.convert2RegExpStr(pattern), "i");
    },
    convert2RegExpStr : function( pattern ) {
        var s = new String(pattern);
        var res = new String("^");

        for (var i = 0 ; i < s.length ; i++) {
            switch(s[i]) {
                case '*' :
                    res += ".*";
                    break;

                case '.' :
                case '?' :
                case '^' :
                case '$' :
                case '+' :
                case '{' :
                case '[' :
                case '|' :
                case '(' :
                case ')' :
                case ']' :
                case '/' :
                    res += "\\" + s[i];
                    break;

                case '\\' :
                    res += "\\\\";
                    break;

                case ' ' :
                    // Remove spaces from URLs.
                    break;

                default :
                    res += s[i];
                    break;
            }
        }

        return res + '$';
    },
    handleDocLoad : function(doc,safe)
    {
//autopagerBwUtil.consoleLog("handleDocLoad 1");        
        if (autopagerBwUtil.handleDocLoad)
        {
            return autopagerBwUtil.handleDocLoad(doc,safe)
        }

//autopagerBwUtil.consoleLog("handleDocLoad 2");        
//        autopagerMain.workingAllSites = AutoPagerNS.UpdateSites.loadAll();
//        //doc.documentElement.autopagerContentHandled = true;
//        var tmpSites = autopagerMain.loadTempConfig();
//autopagerBwUtil.consoleLog("handleDocLoad 3");        
//
//        tmpSites.updateSite = new AutoPagerNS.AutoPagerUpdateSite("Wind Li","all",
//            "","text/html; charset=utf-8",
//            "smart paging configurations",
//            "smartpaging.xml","//site",true,"autopager-xml",0);
//        autopagerMain.workingAllSites[tmpSites.updateSite.filename] = tmpSites;
        return autopagerMain.onInitDoc(doc,safe);
    }
    ,
    isValidLink : function (node)
    {
        if (autopagerBwUtil.isValidLink)
        {
            return autopagerBwUtil.isValidLink(node)
        }
        return typeof node!='undefined';
    }
    ,
    getValidLink : function (node)
    {
        var link = autopagerUtils.getValidLinkFromChild(node)
        if (link)
            return link;
        link = autopagerUtils.getValidLinkFromParent(node,3)
        if (link)
            return link;
        return null;
    }
    ,
    getValidLinkFromChild : function (node)
    {
        for (var i=0;i<node.childNodes.length;i++)
        {
            var c = node.childNodes[i]
            if (autopagerUtils.isValidLink(c))
                return c;
        }
        for (var i=0;i<node.childNodes.length;i++)
        {
            var link = autopagerUtils.getValidLinkFromChild(node.childNodes[i])
            if (link)
                return link;
        }
        return null;
    }
    ,
    getValidLinkFromParent : function (node,level)
    {
        while (level >0 && node !=null && (node.tagName!='BODY' && node.tagName!='HTML') && node.parentNode != node) {
            node = node.parentNode
            level --;
            if (autopagerUtils.isValidLink(node))
                return node;
        }
        return null;
    }
    ,
    toString: function(s)
    {
        if (typeof s=="undefined"|| s==null)
            return ""
        else
            return s;
    }
    ,
    equals : function(v1,v2)
    {
        return this.toString(v1) == this.toString(v2);
    }
    ,
    isBlank : function(s)
    {
        return (typeof s == "undefined") || (s== null) || (s== "") ||  (s == "undefined")||  (s == "null");
    }
    ,
    mergeString : function (split,str1,str2)
    {
	 var newS = this.toString(str1)
        if (newS!="" && !this.isBlank(str2))
         {
		if (newS.indexOf(this.toString(str2))==-1)
			newS += split + this.toString(str2)
	 }
        else if(newS=="")
            newS = this.toString(str2)
        return newS;
    }
    ,
    newRegExp : function(pattern)
    {
        if (!pattern)
            return null;
        var resRegExp = "";
        var regStr = null;
        var regTmp = null;
        var ps = pattern.split("\n");
        for(var i=0;i<ps.length;i++)
        {
            try{
                //site.regex = new RegExp(autopagerUtils.correctRegExp(site.urlPattern));
                regTmp = new RegExp(ps[i]);
                regStr = ps[i]
            }catch(re)
            {
                try{
                    regStr = autopagerUtils.correctRegExp(ps[i])
                    regTmp = new RegExp(regStr);
                }catch(e){
                    //error create regexp, try to use it as pattern
                    regStr = autopagerUtils.convert2RegExpStr(ps[i]);
                }
            }
            if (!(resRegExp===""))
            {
                resRegExp = resRegExp + "|";
            }
            resRegExp = resRegExp + regStr
        }
        return new RegExp(resRegExp);
    }
    ,
    autopagerGetString : function(name)
    {
        try{

            return AutoPagerNS.strings.getString(name);
        }catch(e)
        {
            //alert(name + " " + e);
            return name;
        }
    },
    autopagerFormatString :function(name,parms)
    {
        try{
            return AutoPagerNS.strings.getFormattedString(name, parms);
        }catch(e)
        {
            //alert(name + " " + e);
            return name;
        }
    },
    importNode : function(container,node,depth)
    {
        var newNode = null;
        try{
            newNode = container.importNode (node,true);
        }catch(e)
        {
            //manually import node, importNode may failed with "INVALID_CHARACTER_ERR: DOM Exception 5"
            //for some case
            try{
                newNode = container.importNode (node,false);
            }catch(ex){
                try{
                    newNode = container.createElement(node.tagName);
                }catch(ex2){
                    newNode = container.createElement("div");
                }
            }
            if (depth && newNode!=null)
            {
                for (var i = 0, childNode = null; (childNode = node.childNodes[i]); i++)
                {
                    var c = autopagerUtils.importNode(container,childNode,depth)
                    if (c!=null)
                    {
                        newNode.appendChild(c);
                    }
                    else
                    {
                        autopagerMain.alertErr("Unable to clone :" + childNode);
                    }
                }
            }
            
        }
        return newNode;
    }
    ,
    getAutoPagerObject : function (de)
    {
        if (de)
        {
            if (de.wrappedJSObject)
                return de.wrappedJSObject.autopagerPagingObj;
            else
                return de.autopagerPagingObj;
        }
        return null;
    }
    ,
    setAutoPagerObject : function (de,obj)
    {
        if (de)
        {
            if (de.wrappedJSObject)
                de.wrappedJSObject.autopagerPagingObj=obj;
            else
                de.autopagerPagingObj=obj;
        }
    },
    removeFromArray : function(array,item) {
        var index = -1;
        for(index=0;index<array.length
            && array[index]!=item;index++)
            {
        }
        if (index>=0 && index <array.length)
        {
            autopagerUtils.removeFromArrayByIndex(array,index);
        }
    }
    ,
    removeFromArrayByIndex : function (array,index) {
        if (index < array.length)
        {
            for(var i = index;i<array.length -1;++i)
            {
                array[i] = array[i+1];
            }
            array[array.length-1]=null;
            array.pop();
        }
    }
    ,getAddonsList: function _getAddonsList() {
        if (typeof autopagerBwUtil.getAddonsList == "function")
            return autopagerBwUtil.getAddonsList();
        return [];
    }
    ,updateStatusIcons : function(doc)
    {
        if (!doc)
            doc = AutoPagerNS.getContentDocument();
        AutoPagerNS.message.call_function("autopager_update_site_status",{
            site_disabled:!autopagerUtils.isEnabledOnHost(doc),
            discovered_rules :  autopagerLite.getMatchedRules(doc)
        })
//        autopagerBwUtil.consoleLog("update status icons:" + autopagerLite.getMatchedRules(doc))
    }
    ,addTabSelectListener : function (callback,useCapture)
    {
        if (typeof autopagerBwUtil.addTabSelectListener == "function")
            autopagerBwUtil.addTabSelectListener(callback,useCapture);
    }
    ,isHTMLDocument : function(doc)
    {
        if (typeof doc=="undefined" || !doc)
            return false;    
        if (typeof autopagerBwUtil.isHTMLDocument == "function")
            return autopagerBwUtil.isHTMLDocument(doc);
        return doc instanceof HTMLDocument;
    }
    , 
    newXMLHttpRequest: function()
    {
        var xmlhttp = null
        try{
            xmlhttp = new AutoPagerNS.window.XMLHttpRequest();
        }catch(e){
            try{
                xmlhttp = new XMLHttpRequest();
            }catch(ex){
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");                          
            }
        }
        return xmlhttp
    }
    ,postHandlingPaging : function(doc)
    {
//        autopagerBwUtil.consoleLog("postHandlingPaging")
        if (typeof autopagerBwUtil.postHandlingPaging == "function")
            autopagerBwUtil.postHandlingPaging(doc);
        
        if (typeof autopagerLite!="undefined")
            autopagerLite.clearMatchedRules(doc)
        this.updateStatusIcons(doc)
    }
    ,getContentImage : function(name)
    {
        if (typeof autopagerBwUtil.getContentImage == "function")
            return autopagerBwUtil.getContentImage(name);
        return AutoPagerNS.get_url( name);
    }
    ,frameSafe : function(paging,doc)
    {
        if (typeof autopagerBwUtil.frameSafe == "function" && !autopagerBwUtil.frameSafe())
            return false;
        return paging.site.enableJS==3 && !autopagerMain.hasTopLocationRefer(doc.documentElement.innerHTML)
                    && !doc.documentElement.getAttribute("xmlns")
    }
    ,safe_get : function(obj,key){
      try{
          return obj[key]
      }catch(e){}
    }
    ,get_host : function (hostobj)
    {
        var host = "x";
        if (typeof hostobj == "string")
        {
            host = hostobj;
        }
        else if (hostobj && hostobj.location && typeof autopagerUtils.safe_get(hostobj.location,"host") != "undefined")
        {
            try{
                host = hostobj.location.host;
            }catch(e){
                autopagerBwUtil.consoleError(e)
            }            
        }
        else if (hostobj && hostobj.location && hostobj.location.href)
        {
            var uri = autopagerUtils.parseUri(hostobj.location.href);
            host = uri["host"];
        }
        else if (AutoPagerNS.getContentDocument() && AutoPagerNS.getContentDocument().location && typeof AutoPagerNS.getContentDocument().location.host!="undefined")
            host = AutoPagerNS.getContentDocument().location.host;
        else if(AutoPagerNS.window && AutoPagerNS.window.location && AutoPagerNS.window.location.host)
        {
            host = AutoPagerNS.window.location.host;
        }else if(typeof location!="undefined" && location.host)
        {
            host = location.host;
        }
        return host;
    }
    ,isConfirmedOnHost : function (hostobj)
    {
        var host = this.get_host(hostobj);
        return autopagerPref.loadBoolPref("host." + host + ".confirmed");
    }
    ,setConfirmedOnHost : function (confirmed,hostobj)
    {
        var host = this.get_host(hostobj);
        if (confirmed)
            autopagerPref.saveBoolPref("host." + host + ".confirmed",confirmed);
        else
            autopagerPref.resetPref("host." + host + ".confirmed");
    }
    ,isEnabledOnHost : function (hostobj)
    {
        var host = this.get_host(hostobj);
        var disabled = autopagerPref.loadBoolPref("host." + host + ".disabled");
        if (!autopagerUtils.noprompt() || this.isConfirmedOnHost(host))
            return !disabled;
        return !(autopagerPref.loadBoolPref("disable-by-default") || disabled);
    }
    ,setEnabledOnHost : function (enabled,hostobj)
    {
        var host = this.get_host(hostobj);
        if (!enabled)
            autopagerPref.saveBoolPref("host." + host + ".disabled",!enabled);
        else
            autopagerPref.resetPref("host." + host + ".disabled");
    }
    ,getStatus : function(enabled,siteenabeld,discoveredRules)
    {
        var status="ap-enabled";
        if (!siteenabeld)
            status = "ap-site-disabled";
        else if (!enabled)
            status = "ap-disabled";
        else if(discoveredRules && discoveredRules>0)
            status = "ap-lite";
        return status
    }
    , compareVersion : function(ver1,ver2)
    {
        var ver1s = ver1.split('.');
        var ver2s = ver2.split('.');
        var ver1l = ver1s.length
        var ver2l = ver2s.length
        var minl = ver1l>ver2l?ver2l:ver1l;
        for(var i=0;i<minl;i++)
        {
            if (ver1s[i]!=ver2s[i])
                return ver1s[i]-ver2s[i];
        }
        return ver1l - ver2l;
    }
    , migrateAfterUpgrade : function (ver)
    {
        if (this.compareVersion("0.6.2.15",ver)<0)
        {
            //TODO: migrate confirm.xml, all sites.xml
        }
    }
    ,
    getCallStack : function() {
      var callstack = [];
      var isCallstackPopulated = false;
      try {
        i.dont.exist+=0; //doesn't exist- that's the point
      } catch(e) {          
        if (e.stack) { //Firefox
          var lines = e.stack.split('\n');
          for (var i=0, len=lines.length; i<len; i++) {
            callstack.push(lines[i]);           
          }
          //Remove call to printStackTrace()
          callstack.shift();
          isCallstackPopulated = true;
        }
      }
      if (!isCallstackPopulated) { //IE and Safari
        var currentFunction = arguments.callee.caller;
        while (currentFunction) {
          var fn = currentFunction.toString();
          var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('')) || 'anonymous';
          callstack.push(fname);
          currentFunction = currentFunction.caller;
        }
      }
      return (callstack);
    }
    ,
    html_textarea_data_url : function (title,str)
    {
        return autopagerUtils.html_data_url(title,"<textarea rows='30' cols='100'>" + str + "</textarea>")
    }
    ,
    html_data_url : function (title,str)
    {
        //autopagerUtils.base64_encode
        var html = "<head><title>" + title + "</title><meta content='text/html; charset=utf-8' http-equiv='content-type'/></head>"
                        + "<body>"+ str + "</body>";
        return    "data:text/html;charset=utf-8,"+html
    }        
    ,
    base64_encode : function (input){
        return this.Base64.encode(input);
    }
    ,
    base64_decode : function (input){
        return this.Base64.decode(input);
    }
    ,
    Base64 : {     
        /**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
        // private property
        _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
        // public method for encoding
        encode : function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
 
            input = autopagerUtils.Base64._utf8_encode(input);
 
            while (i < input.length) {
 
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
 
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
 
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
 
                output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
            }
 
            return output;
        },
 
        // public method for decoding
        decode : function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
 
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
            while (i < input.length) {
 
                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));
 
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
 
                output = output + String.fromCharCode(chr1);
 
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
 
            }
 
            output = autopagerUtils.Base64._utf8_decode(output);
 
            return output;
 
        },
 
        // private method for UTF-8 encoding
        _utf8_encode : function (string) {
            string = string.replace(/\r\n/g,"\n");
            var utftext = "";
 
            for (var n = 0; n < string.length; n++) {
 
                var c = string.charCodeAt(n);
 
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
 
            }
 
            return utftext;
        },
 
        // private method for UTF-8 decoding
        _utf8_decode : function (utftext) {
            var string = "";
            var i = 0;
            var c = 0;
            var c1 = 0;
            var c2 = 0;
            var c3;
            
            while ( i < utftext.length ) {
 
                c = utftext.charCodeAt(i);
 
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i+1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i+1);
                    c3 = utftext.charCodeAt(i+2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
 
            }
 
            return string;
        }
 
    }
    ,
  showHelp : function()
    {
        AutoPagerNS.add_tab({url:"http://autopager.teesoft.info/help.html"});
    },
    isSameDomain : function(doc,url) {
        var uri = autopagerUtils.parseUri(url)
        if (uri) {
            return (uri.protocol == doc.location.protocol || uri.protocol +":" == doc.location.protocol) && uri.host ==doc.location.host;
        }
        else {
            return true
        }
    }
}

AutoPagerNS.SimpleRegExp = function (s)
{
    this.p = s.substr(0,s.indexOf("*")).toLowerCase();
}
AutoPagerNS.SimpleRegExp.prototype.test = function(str)
{
    return str && str.toLowerCase().indexOf(this.p)==0;
}