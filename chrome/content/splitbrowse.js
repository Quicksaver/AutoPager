AutoPagerNS.apSplitbrowse = {
    //this is come from noscript DOMUtils
    domUtils: {
        lookupMethod: Components.utils ? Components.utils.lookupMethod : Components.lookupMethod,

        findBrowser: function(chrome, win) {
            var gb = chrome.getBrowser();
            var browsers;
            if(! (gb && (browsers = gb.browsers))) return null;

            var browser = gb.selectedBrowser;
            if(browser.contentWindow == win) return browser;

            for(var j = browsers.length; j-- > 0;) {
                browser = browsers[j];
                if(browser.contentWindow == win) return browser;
            }

            return null;
        },
        findContentWindow: function(doc) {
            var ctx = doc;
            if(!ctx)
                return null;
            const ci = Components.interfaces;
            const lm = this.lookupMethod;
            if(!(ctx instanceof ci.nsIDOMWindow)) {
                if(ctx instanceof ci.nsIDOMDocument) {
                    ctx = ctx.defaultView;
                //ctx = lm(ctx, "defaultView")();
                } else if(ctx instanceof ci.nsIDOMNode) {
                    //ctx = lm(lm(ctx, "ownerDocument")(), "defaultView")();
                    ctx = ctx.ownerDocument.defaultView;
                }
                else return null;
                }
                if(!ctx)
                return null;
                //ctx = lm(ctx, "top")();
                ctx = ctx.top;

                return ctx;
                },
                findBrowserForNode: function(ctx) {
                if(!ctx) return null;
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
            ctx = ctx.top;

            var bi = new this.BrowserIterator();
            for(var b; b = bi.next();) {
                if(b.contentWindow == ctx) return b;
            }
            return null;
        },

        getDocShellFromWindow: function(window) {
            const ci = Components.interfaces;
            try {
                return window.QueryInterface(ci.nsIInterfaceRequestor)
                .getInterface(ci.nsIWebNavigation)
                .QueryInterface(ci.nsIDocShell);
            } catch(e) {
                autopagerBwUtil.consoleError(e);
                return null;
            }
        },

        BrowserIterator: function() {

            const wm = Components.classes['@mozilla.org/appshell/window-mediator;1']
            .getService(Components.interfaces.nsIWindowMediator);

            var mostRecentWin, mostRecentTab;
            var currentWin = mostRecentWin = wm.getMostRecentWindow("navigator:browser");
            var winEnum = null;
            var currentTB, currentTab;
            var curTabIdx;
            var browsers;

            function initPerWin() {
                currentTB = currentWin && currentWin.getBrowser();
                if(currentTB) {
                    browsers = currentTB.browsers;
                    currentTab = mostRecentTab = currentTB && currentTB.selectedBrowser;
                    if (!browsers && window.Browser && window.Browser._content)
                    {
                        browsers = [];
                        var content = window.Browser._content;
                        var tabList = content.tabList.childNodes;
                        for (var t = 0; t < tabList.length; t++)
                            browsers.push(content.getBrowserForDisplay(content.getDisplayForTab(tabList[t])));
                        currentTab = mostRecentTab = browsers[0];
                    }
                } else {
                    currentTab = null;
                }
                curTabIdx = 0;
            }

            initPerWin();

            this.next = function() {
                var ret = currentTab;
                if(!ret) return null;
                if(curTabIdx >= browsers.length) {

                    if(!winEnum) {
                        winEnum = wm.getEnumerator("navigator:browser");
                    }
                    if(winEnum.hasMoreElements()) {
                        currentWin = winEnum.getNext();
                        if(currentWin == mostRecentWin) return this.next();
                        initPerWin();
                    } else {
                        currentTab = null;
                        return ret;
                    }
                }
                currentTab = browsers[curTabIdx++];

                if(currentTab == mostRecentTab) this.next();
                return ret;
            }
        }
    },
    autopagerPrefix : "autopager",
    hidden : true,
    execute: function(node,method)
    {
        const lm = this.domUtils.lookupMethod;
        lm(node, method)(null);
    },
    init : function()
    {
        //document.splitBrowserCount = 0;
        window.removeEventListener("load",AutoPagerNS.apSplitbrowse.init,false);
        if (typeof document != "undefined")
            document.splitBrowserCount = 0;

        var splitBox =document.getElementById("autopager-split-box");
        var splitSplitter = document.getElementById("autopager-split-splitter");
        var xbrowser = document.getElementById("browser");
        var xappcontent = document.getElementById("appcontent");

        if (xappcontent)
        {
            //xbrowser.appendChild(splitBox);
            //xbrowser.appendChild(splitSplitter);
            //xbrowser.insertBefore(splitBox,xappcontent);
            //xbrowser.insertBefore(splitSplitter,xappcontent);
            xappcontent.appendChild(splitSplitter);
            xappcontent.appendChild(splitBox);
            //splitBox.setAttribute("position", "bottom");
            splitBox.setAttribute("height", "0");
            splitSplitter.setAttribute("orient", "vertical");
            splitBox.setAttribute("collapsed","true");
            splitSplitter.setAttribute("collapsed","true");
            splitBox.setAttribute("hidden","false");
            splitSplitter.setAttribute("hidden","true");
        }
        var receive_ap_request=function(event) {
            try {
                var node = event.target;
                if ('AutoPagerRequest' != node.getAttribute('requestType')) return;
                if ('isInAutoPagerHiddenbrowser' == node.getAttribute('requestName'))
                    node.setAttribute('response', typeof node.ownerDocument.defaultView.top.AutoPagerHiddenBrowser!='undefined');
                
            } catch (e) {
            // No-op.
            }
        }
        document.addEventListener('AutoPagerRequest', receive_ap_request, false,true);
                    
    },
    getSplitKey :function ()
    {
        return "is" + this.autopagerPrefix + "_subwin";
    },
    getBrowserNode : function(doc)
    {
        var ctx = this.domUtils.findContentWindow(doc);
        var browser = this.domUtils.findBrowserForNode(doc);
        if (browser!=null)
            return browser;
  	
        for(var l=1;l<=document.splitBrowserCount;++l)
        {
            var b = document.getElementById(this.autopagerPrefix + "-split-browser-" + l);
            if (b!=null && b.contentWindow == ctx)
            {
                return b;
            }
        }

        try{
            var browsers = document.getElementsByTagName("browser");
            if (browsers)
                for(var i=0;i<browsers.length;++i)
                {
                    var br = browsers[i];
                    try{
                        if (br && typeof br.contentWindow != "undefined" && br.contentWindow == ctx)
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
            autopagerBwUtil.consoleError(e);
        }
        return null;
    },
    cloneHistoryEntry: function(aEntry) {
        if (!aEntry)
            return null;
        aEntry = aEntry.QueryInterface(Components.interfaces.nsISHContainer);
        //var newEntry = aEntry.clone();
        var newEntry = Components.classes['@mozilla.org/browser/session-history-entry;1'].createInstance(Components.interfaces.nsISHEntry);
        newEntry = newEntry.QueryInterface(Components.interfaces.nsIHistoryEntry);
        newEntry = newEntry.QueryInterface(Components.interfaces.nsISHContainer);

        newEntry.setURI(aEntry.URI);
        newEntry.setTitle(aEntry.title);
        newEntry.setIsSubFrame(aEntry.isSubFrame);

        if (aEntry.postData)
            newEntry.postData = aEntry.postData.QueryInterface(Components.interfaces.nsISeekableStream)


        newEntry.loadType = Math.floor(aEntry.loadType);
        var cacheKeyNum = 0;
        if ('cacheKey' in aEntry && aEntry.cacheKey) {
            cacheKeyNum = aEntry.cacheKey.QueryInterface(Components.interfaces.nsISupportsPRUint32).data;
        }
        var cacheKey = Components.classes['@mozilla.org/supports-PRUint32;1'].createInstance(Components.interfaces.nsISupportsPRUint32);
        try{
            cacheKey.type = 12;//cacheKey.TYPE_PRUINT32;            
        }catch(e){}
        cacheKey.data = parseInt(cacheKeyNum);
        cacheKey = cacheKey.QueryInterface(Components.interfaces.nsISupports);
        newEntry.cacheKey         = cacheKey;

        if (aEntry.childCount) {
            for (var j = 0; j < aEntry.childCount; j++) {
                var childEntry = this.cloneHistoryEntry(aEntry.GetChildAt(j));
                if (childEntry)
                    newEntry.AddChild(childEntry, j);
            }
        }
        return newEntry;
    },
    cloneWithSessionStore : function(targetB, originalB)
    {
        var ss = null;
        if ("@mozilla.org/browser/sessionstore;1" in Components.classes) {
            ss = Components.classes["@mozilla.org/browser/sessionstore;1"]
            .getService(Components.interfaces.nsISessionStore);
        }
        if (!ss || !ss.getWindowState || !ss.setWindowState)
            return false;
        var state = ss.getTabState(originalB)
        ss.setTabState(targetB,state);

        return true;
    },
    cloneBrowser: function(targetB, originalB)
    {
        var d = autopagerUtils.serializeUserInput(originalB.contentWindow)
        var domLoad = function() {
            targetB.removeEventListener('DOMContentLoaded', domLoad, false);
            autopagerUtils.deSerializeUserInput(targetB.contentWindow, d);
        }
        targetB.addEventListener('DOMContentLoaded',domLoad, false);

        //        if (AutoPagerNS.apSplitbrowse.cloneWithSessionStore(targetB, originalB))
        //            return;
        if (!targetB.docShell)
            return;
        var webNav = targetB.docShell.QueryInterface(Components.interfaces.nsIWebNavigation);
        var newHistory = webNav.sessionHistory;

        newHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);

        // delete history entries if they are present
        if (newHistory.count > 0)
            newHistory.PurgeHistory(newHistory.count);
        var originalHistory  = originalB.docShell.QueryInterface(Components.interfaces.nsIWebNavigation).sessionHistory;
        originalHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);


        var entry = originalHistory.getEntryAtIndex(originalHistory.index,false);
        entry = entry.QueryInterface(Components.interfaces.nsISHEntry);
        var newEntry = this.cloneHistoryEntry(entry);
        if (newEntry)
            newHistory.addEntry(newEntry, true);
    

        gotoHistoryIndex(10);

        function gotoHistoryIndex(attempts) {
            try {
                webNav.gotoIndex(0);
            }
            catch(e) {
                // do some math to increase the timeout
                // each time we try to update the history index
                if (attempts)
                    setTimeout(gotoHistoryIndex, (11 - attempts) * (15 - attempts), --attempts);
            }
        }

    //webNav.gotoIndex(0);
    
    //    //
    //    //targetB.contentDocument.documentElement.innerHTML = originalB.contentDocument.documentElement.innerHTML
    //
    //    // Convert the HTML text into an input stream.
    //    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
    //                    createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    //    converter.charset = originalB.contentDocument.characterSet;
    //    var stream = converter.convertToInputStream(
    //    "<html>" +
    //    originalB.contentDocument.documentElement.innerHTML
    //+ "</html>"
    //);
    //
    //    // Set up a channel to load the input stream.
    //    var channel = Components.classes["@mozilla.org/network/input-stream-channel;1"].
    //                  createInstance(Components.interfaces.nsIInputStreamChannel);
    //    channel.setURI(originalB.contentDocument.documentElement.location);
    //    channel.contentStream = stream;
    //
    //    var request = channel.QueryInterface(Components.interfaces.nsIRequest);
    //    request.loadFlags |= Components.interfaces.nsIRequest.LOAD_BACKGROUND;
    //
    //    var baseChannel = channel.QueryInterface(Components.interfaces.nsIChannel);
    //    baseChannel.contentType = "text/html";
    //
    //    baseChannel.contentCharset = originalB.contentDocument.characterSet;
    //
    //    var uriLoader = Components.classes["@mozilla.org/uriloader;1"].getService(Components.interfaces.nsIURILoader);
    //    uriLoader.openURI(channel, true, targetB.docShell);
    //
    //    var html = targetB.contentDocument.documentElement.innerHTML
    },
    getSplitBrowser : function (doc,url,createNew,clone,listener)
    {
        var browser = this.getBrowserNode(doc);
        if (!browser)
            return null;
        if (browser.parentNode.id=="autopager-split-box"){
            return null;
        }
        if (!browser.getAttribute(this.autopagerPrefix + "splitbrowse-id"))
        {
            document.splitBrowserCount ++;
            browser.setAttribute(this.autopagerPrefix + "splitbrowse-id",document.splitBrowserCount);
        }
        var subfix = browser.getAttribute(this.autopagerPrefix + "splitbrowse-id");

        var id = this.autopagerPrefix + "-split-browser-" + subfix;
        var splitBrowser = document.getElementById(id);
    
        //this.hidden = !autopagerPref.loadBoolPref("debug");
        if (!splitBrowser && createNew)
        {
            var vbox = document.getElementById("autopager-split-box");
            splitBrowser = document.createElement("browser");

            splitBrowser.setAttribute("id", id);
            splitBrowser.setAttribute("name", id);
            splitBrowser.setAttribute("width",1024);


            //splitBrowser.setAttribute("type", "content");

            //autoscrollpopup="autoscroller" flex="1" type="content-primary" message="true"
            splitBrowser.setAttribute("type", "content");
            //splitBrowser.setAttribute("message", "true");
            splitBrowser.setAttribute("flex", "1");
   
            splitBrowser.setAttribute("contextmenu", "contentAreaContextMenu");
            //splitBrowser.setAttribute("class",this.autopagerPrefix + "-split-browser");
            //splitBrowser.setAttribute("home", "about:black");
            vbox.appendChild(splitBrowser);
            //var f =  document.commandDispatcher.focusedElement
            splitBrowser.setAttribute(this.getSplitKey(),true);
            var sl = new AutoPagerNS.splitpanelProgressListener(listener)
            splitBrowser.addProgressListener(sl,
                Components.interfaces.nsIWebProgress.NOTIFY_ALL);
            splitBrowser.autopagerSplitWinFirstDocSubmited = false;
            splitBrowser.autopagerSplitWinFirstDocloaded = false;
            splitBrowser.loadURI("about:blank",null,null);
                        
              var beforeUnload = function(event){
                  doc.defaultView.removeEventListener("DOMNodeRemoved", beforeUnload, false);
                  AutoPagerNS.apSplitbrowse.onclose(splitBrowser,sl)
              }
              doc.defaultView.addEventListener("beforeunload",beforeUnload,true);
              
              var domRemoved = function(event){
                  doc.defaultView.removeEventListener("DOMNodeRemoved", domRemoved, false);
                  AutoPagerNS.apSplitbrowse.onclose(splitBrowser,sl)
              }
              doc.defaultView.addEventListener("AutoPagerClean",domRemoved,true);        
        }

        if (splitBrowser != null)
        {
            var autopagerUseSafeEvent = false
            if (listener)
            {
                autopagerUseSafeEvent = listener.autopagerUseSafeEvent
                splitBrowser.docShell.allowJavascript = !!listener.site.enableJS;
            }
            splitBrowser.docShell.allowPlugins = false;
            //            splitBrowser.docShell.allowAuth = false;
            //            splitBrowser.docShell.allowMetaRedirects = false;
            splitBrowser.docShell.allowSubframes = autopagerUseSafeEvent || (doc.defaultView != doc.defaultView.top);
            splitBrowser.docShell.allowImages = autopagerUseSafeEvent;
        }
        if (splitBrowser != null && clone)
        {
            splitBrowser.loadURI("about:blank",null,null);
            splitBrowser.autopagerSplitWinFirstDocloaded = false;
            splitBrowser.autopagerSplitWinFirstDocSubmited = true;
            //alert(doc.documentElement.autopagerUseSafeEvent)
            AutoPagerNS.apSplitbrowse.switchToCollapsed(false);
            if (listener)
                splitBrowser.listener = listener
            window.setTimeout(function(){
                if (url!=null)
                {
                    splitBrowser.autopagerSplitWinFirstDocSubmited=true;
                    splitBrowser.autopagerSplitWinFirstDocloaded = true;
                    if (listener)
                    {
                        listener.autopagerSplitDocInited = true;
                        listener.autopagerEnabledSite = true;
                    }
                    splitBrowser.loadURI(url,null,null);
                }
                else
                {
                    if (listener && !listener.autopagerUseSafeEvent )
                    {
                        //autopagerBwUtil.consoleError("load in hidden browser");
                        AutoPagerNS.apSplitbrowse.cloneBrowser(splitBrowser,browser);
                    //                        var newTab = gBrowser.addTab();
                    //                        AutoPagerNS.apSplitbrowse.cloneBrowser(newTab.ownerDocument.defaultView.gBrowser.getBrowserForTab(newTab),browser);
                    }
                    else
                    {
                        splitBrowser.loadURI( doc.location.href, null, null );
                    }
                }
            },10);
        }
 
        //splitBrowser.parentNode.hidden = hidden;
        //	splitBrowser.hidden = hidden;
        //this.setVisible(splitBrowser,!this.hidden);
        return splitBrowser;
    },
    switchToCollapsed : function(collapsed)
    {

        var splitBox =document.getElementById("autopager-split-box");
        var splitSplitter = document.getElementById("autopager-split-splitter");
        if (this.hidden)
            splitBox.setAttribute("height",0);
        if (splitBox.hidden)
            splitBox.setAttribute("hidden","false");
        splitBox.setAttribute("collapsed",this.hidden && collapsed);
        splitSplitter.setAttribute("collapsed",this.hidden && collapsed);
    },
    show :function(splitBrowser)
    {
        this.setVisible(splitBrowser,true);
    },
    hide : function(splitBrowser)
    {
        this.setVisible(splitBrowser,false);
    },
    setVisible: function (splitBrowser,visible)
    {
        var hidden = !visible;
        this.hidden = hidden;
        if (visible && splitBrowser == null)
            return;
        var splitBox =document.getElementById("autopager-split-box");
        var splitSplitter = document.getElementById("autopager-split-splitter");
        AutoPagerNS.apSplitbrowse.switchToCollapsed(hidden);
        //      splitBrowser.parentNode.collapsed=hidden;
        //      splitBrowser.collapsed=hidden;
        //splitSplitter.setAttribute("hidden",hidden);
        //splitBrowser.setAttribute("hidden",hidden);
        if (!hidden)
        {
            //          splitSplitter.setAttribute("hidden",false);
            //          splitBrowser.setAttribute("hidden",false);
            splitBox.height = 256;
        }else
            splitBox.height = 0;
        
        //splitBar.collapsed = hidden;
        splitSplitter.setAttribute("hidden",hidden);
    },
    open : function(doc,hidden,listener)
    {
        var splitBrowser =null;
        this.hidden = hidden;
        try {
            splitBrowser = this.getSplitBrowser(doc,null,!hidden,false,listener);
        }catch (e) {
            autopagerBwUtil.consoleError(e);
        }
        if (!hidden)
            this.show(splitBrowser);
        else
            this.hide(splitBrowser);
        // ***** load page
        //splitBrowser.loadURI( "http://www.mozilla.org", null, null );
        return splitBrowser;
    },
    doClose : function(splitBrowser , listener)
    {
        window.setTimeout(function(){
            if (listener && listener.progressListener)
            {
                try{
                    splitBrowser.removeProgressListener(listener.progressListener);
                }catch(e)
                {
                }
                listener.progressListener.listener = null;
                listener.progressListener = null;
            }
        }, 10);
    },    
    onclose:function(splitBrowser,listener)
    {
        if (splitBrowser != null)
        {
            AutoPagerNS.apSplitbrowse.doClose(splitBrowser,listener.listener);
            var parent = splitBrowser.parentNode;
            if (parent == null)
                return;
            splitBrowser.destroy();
            parent.removeChild(splitBrowser);
        }
    },
    getBrowserFromTarget: function(target)
    {
        if (target.localName == "browser")
            return target;
        for (var i=0;i<target.childNodes.length;i++)
        {
            var b = AutoPagerNS.apSplitbrowse.getBrowserFromTarget(target.childNodes[i]);
            if (b!= null)
                return b;
        }
        return null;
    },
    loadNewUrl : function(win,url)
    {
        try{
            win.loadURI(url,null,null);
        }catch (e) {
            autopagerBwUtil.consoleError(e);
        }
    },
    // ***** set start navigation ui
    start : function(sl)
    {
    },
    // ***** set done navigation ui
    done : function(doc,sl)
    {
        var Me = this
        //alert("done");
        if (doc.location.href=='about:blank')
            return true;

        try{
            Me.disableMedia(doc,"video");
            Me.disableMedia(doc,"audio");
            
            if (sl && sl.listener)
                sl.listener.apLazySrcUsed=true            
            doc.defaultView.AutoPagerHiddenBrowser={};
            //scroll to page end to ensure some lazy load objects been loaded
            //fix http://member.teesoft.info/phpbb/viewtopic.php?f=3&t=3498
            doc.defaultView.scroll(0,Math.max(doc.body.scrollHeight,4000));
        }catch(e){}

        window.setTimeout(function(){
            if (sl && sl.listener)
                sl.listener.onSplitDocLoaded(doc,true);
            else
                autopagerMain.onSplitDocLoaded(doc,true);
        },AutoPagerNS.apSplitbrowse.getDelayMiliseconds(doc));
        return false;
    },
    disableMedia : function (doc,tag){
        var medias = doc.getElementsByTagName(tag);
        for(var i=0;i<medias.length;i++){
            var media = medias[i];
            if (!media.hasAttribute("disabled")){
                media.paused=true;
                media.autoplay=false
                media.setAttribute("ap-lazy-src",media.src)
                media.setAttribute("src","")
                media.setAttribute("disabled","disabled-by-ap")
                
            }
        }
    },
    getDelayMiliseconds : function ( doc ){
        var browser = AutoPagerNS.apSplitbrowse.getBrowserNode(doc);
        if (browser && browser.getAttribute(AutoPagerNS.apSplitbrowse.getSplitKey())) {
            if (browser.auotpagerContentDoc)
            {
                if (browser.auotpagerContentDoc.documentElement.delaymsecs && browser.auotpagerContentDoc.documentElement.delaymsecs>0)
                    return browser.auotpagerContentDoc.documentElement.delaymsecs;
            }
        }
        return autopagerMain.getDelayMiliseconds();
    }
};
AutoPagerNS.splitpanelProgressListener  = function (listener)
{
    this.listener = listener;
    if (listener)
        listener.progressListener = this
};

AutoPagerNS.splitpanelProgressListener.prototype = {
    onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus)
    {
//        autopagerBwUtil.consoleError("aStateFlags=" + aStateFlags +  ",aStatus=" + aStatus);
        const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
        const nsIChannel = Components.interfaces.nsIChannel;
//        if (aStateFlags & nsIWebProgressListener.STATE_START &&
//            aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
//            AutoPagerNS.apSplitbrowse.start(this);
//            return;
//        } else 
        if (aStateFlags & nsIWebProgressListener.STATE_STOP &&
            aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK && aStatus==0) {
            //aStateFlags & nsIWebProgressListener.STATE_IS_WINDOW
            AutoPagerNS.apSplitbrowse.done( aWebProgress.DOMWindow.document,this);

            return;
        } else if (aStateFlags & nsIWebProgressListener.STATE_IS_DOCUMENT)
        {
            if (typeof aWebProgress.DOMWindow.AutoPagerHiddenBrowser == "undefined")
            {
                //Allow the "content-policy" in AutopagerCOMP to check if the doc is load in a AutoPagerHiddenBrowser
                aWebProgress.DOMWindow.AutoPagerHiddenBrowser = {}
            }
            
        }
        //autopagerBwUtil.consoleError("onStateChange: " + aWebProgress.DOMWindow.location + ":" + aWebProgress.DOMWindow.AutoPagerHiddenBrowser);
    },
    onStatusChange : function(webProgress, request, status, message)
    {
//        autopagerBwUtil.consoleError("status=" + status +  ",message=" + message);
        return;
    },
    onLocationChange : function(webProgress, request, location)
    {
        AutoPagerNS.apSplitbrowse.start(this);
        return;
    },
    onProgressChange : function(webProgress, request,
        curSelfProgress, maxSelfProgress,
        curTotalProgress, maxTotalProgress) {
        return;
    },
    onSecurityChange : function(webProgress, request, state)
    {
        return;
    },
    QueryInterface : function(aIID)
    {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports))
            return this;
        throw Components.results.NS_NOINTERFACE;
    }
};
