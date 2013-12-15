Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

/***********************************************************
class definition
 ***********************************************************/

//class constructor
function AutopagerCOMP() {
    // If you only need to access your component from Javascript, uncomment the following line:
    this.wrappedJSObject = this;
}

var autopagerHTTPListener = {
    headerName  : "X-AutoPager",
    autopagerVersionValue : "0.8.0.8",
    observe: function(obj,subject, topic, data)
    {
        let os = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        switch (topic)
        {
            case "http-on-examine-response": 
            case "http-on-examine-cached-response":
            case "http-on-examine-merged-response":{
                var Me = this;
                    var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
                    var contentType = httpChannel.contentType;
                    //Me.LOG("topic:Content-Type:" + topic +":" + contentType + " @ " + httpChannel.URI.spec);
                    var wnd = Me.getRequestWindow(httpChannel);
                    if (wnd)
                    {
                        let browser = Me.getBrowserForWindow(wnd);
                        autopagerSubWin =  (browser && browser.getAttribute("isautopager_subwin") =="true" );
                        if (autopagerSubWin){
                            if (contentType.indexOf("video")>=0 || contentType.indexOf("audio")>=0)
                            {
                                Me.LOG("Block media " + httpChannel.URI.spec + " at " + browser )
                                httpChannel.cancel(Components.results.NS_BINDING_ABORTED);                            
                            }
                            return;
                        }                        
                    }
                    break;
            }
            case "http-on-modify-request": {
                    var Me = this;
                    var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
                    //Me.LOG("http-on-modify-request " + httpChannel.URI.spec)
                    
                    if (httpChannel.URI.host.match(/ap\.teesoft\.info/))
                    {
                        httpChannel.setRequestHeader("X-AutoPager-Rules", this.pref.getCharPref(".ids"), false);
                        httpChannel.setRequestHeader("X-AutoPager", autopagerHTTPListener.autopagerVersionValue, false);
                    }
                    ////Me.LOG("topic:" + topic + " @ " + httpChannel.URI.spec);
                    var wnd = Me.getRequestWindow(httpChannel);
                    if(wnd){
                        let browser = Me.getBrowserForWindow(wnd);
                        autopagerSubWin =  (browser && browser.getAttribute("isautopager_subwin") =="true" );
                        if (autopagerSubWin){
                            Me.LOG("http-on-modify-request on autopagerSubWin:" + httpChannel.URI.spec );
//                            var contentType = httpChannel.contentType;
//                            if (contentType.indexOf("video")>=0 || contentType.indexOf("audio")>=0)
//                            {
//                                //Me.LOG("Block media " + httpChannel.URI.spec + " at " + browser )
//                                httpChannel.cancel(Components.results.NS_BINDING_ABORTED);                            
//                            }
//                            return;
                            
                            httpChannel.QueryInterface(Components.interfaces.nsIRequest);
                                if (httpChannel.loadGroup && httpChannel.loadGroup.groupObserver) {
                                    //Me.LOG("even more listeners");
                                
                                // even more listeners
                                var go = httpChannel.loadGroup.groupObserver;
                                go.QueryInterface(Components.interfaces.nsIWebProgress);
                                try {
                                        go.addProgressListener(Me.getPolicyPrivate(Me), Components.interfaces.nsIWebProgress.NOTIFY_ALL); // 0x2 or 0xff
                                        //Me.LOG("success add even more listeners");
                                }
                                catch(ex) {
                                    //Me.LOG("error add even more listeners:" + ex);
                                        // guess this means the request is aborted and/or cached.
                                }
                            }

                        }
                    }
                    if (this.pref.prefHasUserValue(".httphead." + httpChannel.URI.host))
                    {
                        if (!this.pref.getBoolPref(".httphead." + httpChannel.URI.host))
                        {
                            return;
                        }

                    }else
                    {
                        try{
                            if (!this.pref.getBoolPref(".set-x-autopager-httphead"))
                            {
                                return;
                            }                            
                        }catch(e){
                            return;
                        }
                    }
                    this.LOG("----------------------------> (" + subject + ") mod request");

                    httpChannel.setRequestHeader(autopagerHTTPListener.headerName, autopagerHTTPListener.autopagerVersionValue, false);
                    var agent = httpChannel.getRequestHeader("User-Agent") + " AutoPager/" + autopagerHTTPListener.autopagerVersionValue;
                    httpChannel.setRequestHeader("User-Agent", agent, false);
                    break;
                }
            case "app-startup": {
                    //os.addObserver(obj, "http-on-modify-request", true);
                    os.addObserver(obj, "final-ui-startup", true);
                    break;
                }
            case "final-ui-startup": {
                    os.addObserver(obj, "quit-application", true);
//                    os.addObserver(obj, "http-on-modify-request", false);
//                    os.addObserver(obj, "http-on-examine-response", false);
//                    os.addObserver(obj, "http-on-examine-cached-response ", false);
//                    os.addObserver(obj, "http-on-examine-merged-response", false);

                    if (typeof Components.interfaces.nsIContentPolicy.TYPE_MEDIA != "undefined")
                    {
                        let registrar = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
                        let PolicyPrivate = this.getPolicyPrivate(this);
                        try
                        {
                            registrar.registerFactory(PolicyPrivate.classID, PolicyPrivate.classDescription, PolicyPrivate.contractID, PolicyPrivate);
                        }
                        catch (e)
                        {
                            // Don't stop on errors - the factory might already be registered
                            this.LOG(e);
                        }

                        let catMan = Components.classes["@mozilla.org/categorymanager;1"]
                        .getService(Components.interfaces.nsICategoryManager);

//                        var enumerator = catMan.enumerateCategory("content-policy");
//                        var categories = [];  
//                        while (enumerator.hasMoreElements()) {  
//                            var item = enumerator.getNext();  
//                            var category = item.QueryInterface(Components.interfaces.nsISupportsCString)  
//                            categories.push(category.toString());  
//                            catMan.deleteCategoryEntry("content-policy",category.toString(),false);
//                        }  
//                        categories.sort();  
//                        var categoriesString = categories.join("\n");  
                        ////Me.LOG(categoriesString)
                        
                        for each (let category in PolicyPrivate.xpcom_categories)
                            catMan.addCategoryEntry(category, PolicyPrivate.classDescription, PolicyPrivate.contractID, false, true);                        
                    }
                break;
                }
            case "quit-application":{
                    os.removeObserver(obj, "quit-application");
                    try{
                        os.removeObserver(obj, "profile-after-change");
                    }catch(e) {}
                    break;
                }
        }
    },
    getRequestWindow: function(/**nsIChannel*/ channel) /**nsIDOMWindow*/
	{
                try{
                    channel.QueryInterface(Components.interfaces.nsIChannel);		
                    if (channel.loadGroup == null || channel.loadGroup.groupObserver == null) 
                    {
                        var go = channel.loadGroup.groupObserver;
                        go.QueryInterface(Components.interfaces.nsIWebProgress);
                        var win = go.DOMWindow;
                        return win;
                    }                    
                } catch(e) {}
		try
		{
			if (channel.notificationCallbacks)
				return channel.notificationCallbacks.getInterface(Components.interfaces.nsILoadContext).associatedWindow;
		} catch(e) {}
	
		try
		{
			if (channel.loadGroup && channel.loadGroup.notificationCallbacks)
				return channel.loadGroup.notificationCallbacks.getInterface(Components.interfaces.nsILoadContext).associatedWindow;
		} catch(e) {}

		return null;
	},
     getBrowserForWindow : function(wnd){
                    var mainWindow = wnd.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                        .getInterface(Components.interfaces.nsIWebNavigation)
                        .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                        .rootTreeItem
                        .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                        .getInterface(Components.interfaces.nsIDOMWindow); 

                        var document = mainWindow.document;
                    wnd = wnd.top.QueryInterface(Components.interfaces.nsIDOMWindow);
                    try{
                        for(var l=1;l<=document.splitBrowserCount;++l)
                        {
                            var b = document.getElementById("autopager-split-browser-" + l);
                            //                                //Me.LOG("Is AutoPager :" +  b.getAttribute("isautopager_subwin"))
                            //                                //Me.LOG("b:" + b);
                            //                                //Me.LOG("b.contentWindow:" + b.contentWindow.QueryInterface(Components.interfaces.nsIDOMWindow));
                            //                                //Me.LOG("wnd:" + wnd);
                            //                                
                            //                                //Me.LOG("compareDocumentPosition:" + b.contentDocument.compareDocumentPosition( wnd.document))
                            
                            if (b!=null && b.docShell && b.contentDocument == wnd.document)
                            {
                                return b;
                            }
                        }
                        var browsers = document.getElementsByTagName("browser");
                        //                        //Me.LOG(browsers.length);
                        if (browsers)
                            for(var i=0;i<browsers.length;++i)
                        {
                            var br = browsers[i];
                            //                                //Me.LOG("Is AutoPager :" +  br.getAttribute("isautopager_subwin"))
                            try{
                                if (br && typeof br.contentWindow != "undefined" && br.contentWindow == wnd)
                                {
                                    return br;
                                }
                            }catch(e)
                            {
                                //autopagerBwUtil.consoleError(e);
                            }
                        }
                    }catch(e)
                    {
                        //Me.LOG(e);
                    } 
                    return null;
                },
    get pref(){
        let pf = Components.classes["@mozilla.org/preferences-service;1"].
            getService(Components.interfaces.nsIPrefService).getBranch("extensions.autopager");
        this.__defineGetter__("pref", function() {return pf;});
        return this.pref;
    } ,
    getPolicyPrivate : function (Me)
    {
        /**
         * Private nsIContentPolicy implementation to disable video and audio elements in AutoPagerHiddenBrowser
         * @class
         */
        var PolicyPrivate =
            {
            classDescription: "AutoPager content policy",
            classID: Components.ID("{af3f547f-d79b-b14a-a300-3a48de76a3d0}"),
            contractID: "@teesoft.info/autopager/policy;1",
            xpcom_categories: ["content-policy"],

            //
            // nsISupports interface implementation
            //

            QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIContentPolicy,
                    Components.interfaces.nsIFactory, Components.interfaces.nsIWebProgressListener, Components.interfaces.nsISupportsWeakReference]),

            //
            // nsIContentPolicy interface implementation
            //

            shouldLoad: function(contentType, contentLocation, requestOrigin, node, mimeTypeGuess, extra)
            {
                return this.shouldAccept(contentType, contentLocation,node);
            },
            shouldAccept: function(contentType, contentLocation,node)
            {
                if (!node)
                    return Components.interfaces.nsIContentPolicy.ACCEPT;
                if (contentType != Components.interfaces.nsIContentPolicy.TYPE_MEDIA
                    && contentType != Components.interfaces.nsIContentPolicy.TYPE_OBJECT_SUBREQUEST)
                {
                    return Components.interfaces.nsIContentPolicy.ACCEPT;
                }
//                let catMan = Components.classes["@mozilla.org/categorymanager;1"]
//                        .getService(Components.interfaces.nsICategoryManager);
//
//                        var enumerator = catMan.enumerateCategory("content-policy");
//                        var categories = [];  
//                        while (enumerator.hasMoreElements()) {  
//                            var item = enumerator.getNext();  
//                            var category = item.QueryInterface(Components.interfaces.nsISupportsCString)  
//                            categories.push(category.toString());  
//                            //catMan.deleteCategoryEntry("content-policy",category.toString(),false);
//                        }  
//                        categories.sort();  
//                        var categoriesString = categories.join("\n");  
//                        //Me.LOG(categoriesString)
                
                var autopagerSubWin = false;
                let wnd = PolicyPrivate.getWindow(node);
                if (!wnd)
                    return Components.interfaces.nsIContentPolicy.ACCEPT;
                
                
                
                let browser = Me.getBrowserForWindow(wnd);
                autopagerSubWin =  (browser && browser.getAttribute("isautopager_subwin") =="true" );
                if (autopagerSubWin){
                    //Me.LOG("Blocked " + contentType + " on " + node + " at " + browser + " " + contentLocation.spec)
                    return Components.interfaces.nsIContentPolicy.REJECT_TYPE;
                }
//                //Me.LOG("enabled " + contentType + " on " + node + " " + contentLocation.spec)
                return Components.interfaces.nsIContentPolicy.ACCEPT;                
            },
            shouldProcess: function(contentType, contentLocation, requestOrigin, insecNode, mimeType, extra)
            {
                return this.shouldAccept(contentType,contentLocation, insecNode);
            },

            //
            // nsIFactory interface implementation
            //
            createInstance: function(outer, iid)
            {
                if (outer)
                    throw Components.results.NS_ERROR_NO_AGGREGATION;
                return this.QueryInterface(iid);
            }
            ,
            /**
             * Retrieves the window for a document node.
             * @return {Window} will be null if the node isn't associated with a window
             */
            getWindow: function(/**Node*/ node)
            {
                if ("ownerDocument" in node && node.ownerDocument)
                {
                    node = node.ownerDocument;
                    if ("defaultView" in node)
                        return node.defaultView;
                }
                return null;
            },
        // INTERFACE IMPLEMENTATIONS
            /**
            /* nsIWebProgressListener
            /**/
            onStateChange: function(progress, request, flags, status)
            {
                //Me.LOG("onStateChange")
                const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
                const nsIChannel = Components.interfaces.nsIChannel;
                //if (flags & nsIWebProgressListener.STATE_IS_NETWORK) 
                try{
                    var topic="onStateChange" + flags;
                    //var Me = this;
                    var httpChannel = request.QueryInterface(Components.interfaces.nsIHttpChannel);
                    var contentType = httpChannel.contentType;
                    //Me.LOG("topic:Content-Type:" + topic +":" + contentType + " @ " + httpChannel.URI.spec);
                    var wnd = Me.getRequestWindow(httpChannel);
                    if (wnd)
                    {
                        let browser = Me.getBrowserForWindow(wnd);
                        autopagerSubWin =  (browser && browser.getAttribute("isautopager_subwin") =="true" );
                        if (autopagerSubWin){
                            if (contentType.indexOf("video")>=0 || contentType.indexOf("audio")>=0)
                            {
                                Me.LOG("Block media " + httpChannel.URI.spec + " at " + browser )
                                httpChannel.cancel(Components.results.NS_BINDING_ABORTED);                            
                            }
                            return;
                        }                        
                    }
                }catch(ex){}
            },

            onProgressChange: function(progress, request, curSelfProgress, maxSelfProgress, curTotalProgress, maxTotalProgress) 
            {
                //Me.LOG("onProgressChange")
                const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
                const nsIChannel = Components.interfaces.nsIChannel;
                //if (flags & nsIWebProgressListener.STATE_IS_NETWORK) 
                {
                    var topic="onProgressChange" + curSelfProgress;
                    //var Me = this;
                    try{
                    var httpChannel = request.QueryInterface(Components.interfaces.nsIHttpChannel);
                    var contentType = httpChannel.contentType;
                    //Me.LOG("topic:Content-Type:" + topic +":" + contentType + " @ " + httpChannel.URI.spec);
                    var wnd = Me.getRequestWindow(httpChannel);
                    if (wnd)
                    {
                        let browser = Me.getBrowserForWindow(wnd);
                        autopagerSubWin =  (browser && browser.getAttribute("isautopager_subwin") =="true" );
                        if (autopagerSubWin){
                            if (contentType.indexOf("video")>=0 || contentType.indexOf("audio")>=0)
                            {
                                Me.LOG("Block media " + httpChannel.URI.spec + " at " + browser )
                                httpChannel.cancel(Components.results.NS_BINDING_ABORTED);                            
                            }
                            return;
                        }                        
                    }
                    }catch(ex){}
                }
                return
            },

            onLocationChange: function(progress, request, uri) 
            {
                const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
                const nsIChannel = Components.interfaces.nsIChannel;
                //if (flags & nsIWebProgressListener.STATE_IS_NETWORK) 
                {
                    var topic="onLocationChange";
                    //var Me = this;
                    try{                        
                        var httpChannel = request.QueryInterface(Components.interfaces.nsIHttpChannel);
                        var contentType = httpChannel.contentType;
                        //Me.LOG("topic:Content-Type:" + topic +":" + contentType + " @ " + httpChannel.URI.spec);
                        var wnd = Me.getRequestWindow(httpChannel);
                        if (wnd)
                        {
                            let browser = Me.getBrowserForWindow(wnd);
                            autopagerSubWin =  (browser && browser.getAttribute("isautopager_subwin") =="true" );
                            if (autopagerSubWin){
                                if (contentType.indexOf("video")>=0 || contentType.indexOf("audio")>=0)
                                {
                                    Me.LOG("Block media " + httpChannel.URI.spec + " at " + browser )
                                    httpChannel.cancel(Components.results.NS_BINDING_ABORTED);                            
                                }
                                return;
                            }                        
                        }
                    }catch(ex){}
                }
                return
                return
            },

            onStatusChange: function(progress, request, status, message) 
            {
                const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
                const nsIChannel = Components.interfaces.nsIChannel;
                //if (flags & nsIWebProgressListener.STATE_IS_NETWORK) 
                {
                    var topic="onStatusChange" + status;
                    //var Me = this;
                    try{                        
                        var httpChannel = request.QueryInterface(Components.interfaces.nsIHttpChannel);
                        var contentType = httpChannel.contentType;
                        //Me.LOG("topic:Content-Type:" + topic +":" + contentType + " @ " + httpChannel.URI.spec);
                        var wnd = Me.getRequestWindow(httpChannel);
                        if (wnd)
                        {
                            let browser = Me.getBrowserForWindow(wnd);
                            autopagerSubWin =  (browser && browser.getAttribute("isautopager_subwin") =="true" );
                            if (autopagerSubWin){
                                if (contentType.indexOf("video")>=0 || contentType.indexOf("audio")>=0)
                                {
                                    Me.LOG("Block media " + httpChannel.URI.spec + " at " + browser )
                                    httpChannel.cancel(Components.results.NS_BINDING_ABORTED);                            
                                }
                                return;
                            }                        
                        }
                    }catch(ex){}
                }
                return
            },

            onSecurityChange: function(progress, request, state) 
            {
                return
            }
        };
        return PolicyPrivate;
    },
    LOG : function (text)
    {
        if (this.pref.getBoolPref(".debug"))
        {
            Components.utils.reportError(text)
            //var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
            //consoleService.logStringMessage(text);
        }
    }
    ,
    dumpObject : function (obj,level)
    {
        if(obj == null || typeof obj != 'object' || level>10)
            return obj;
        var temp = "[";

        for(var key in obj)
        {
            if (temp.length>1)
                temp+=",";
            try{
                temp += key + "=" + this.dumpObject(obj[key],level+1);
            }catch(e){
                temp += key + "=<unable to access>";
            }
        }
        return temp+"]";
    }
}

// class definition
AutopagerCOMP.prototype = {
    
    allSiteSetting: [],
    updateSites: [],
    siteConfirms : [],
    discoverdUrls : [],
    publishingSite : [],
    // define the function we want to expose in our interface
    loadAll: function() {
        return this.allSiteSetting;
    },
    setAll: function(settings) {
        this.allSiteSetting = settings;
    },

    getUpdateSites : function() {
        return this.updateSites;
    },
    setUpdateSites : function(sites) {
        this.updateSites = sites;
    },
    getSiteConfirms : function() {
        return this.siteConfirms;
    },
    setSiteConfirms : function(sites) {
        this.siteConfirms = sites;
    },
    getDiscoveredUrls : function()
    {
        return this.discoverdUrls;
    },
    getPublishingSite : function ()
    {
        return this.publishingSite;
    },
    setPublishingSite : function (publishingSite)
    {
        this.publishingSite = publishingSite;
    }
    ,existingPatterns : null
    ,getPatterns : function() {
        return this.existingPatterns;
    }
    ,setPatterns : function(patterns) {
        this.existingPatterns = patterns;
    },
    // this must match whatever is in chrome.manifest!
    classDescription:   "AutopagerCOMP Javascript XPCOM Component",
    contractID: "@www.teesoft.com/AutopagerCOMP;1",
    classID: Components.ID("{93AFF2EE-79AA-11DD-8660-026156D89593}"),
    _xpcom_categories: [{ category: "app-startup", service: true }],

    QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIObserver, Components.interfaces.nsISupportsWeakReference]),
    observe: function(subject, topic, data)
    {
        autopagerHTTPListener.observe(this,subject, topic, data);
    }
};

if (XPCOMUtils.generateNSGetFactory)
    const NSGetFactory = XPCOMUtils.generateNSGetFactory([AutopagerCOMP]);
else
    const NSGetModule = XPCOMUtils.generateNSGetModule([AutopagerCOMP]);
