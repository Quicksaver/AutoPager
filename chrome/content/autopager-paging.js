//In GPL license
var AutoPagring = function (site,doc)
{
    this.site = site;    
    this.count=0;
    this.scrollWatching= false;
    this.lastScrollWatchExecuteTime = 0;
    this.forceLoadPage=0;
//autopagerBwUtil.consoleLog("AutoPagring 1" )    
    this.tweakingSession = autopagerPref.loadBoolPref("tweaking-session");
//autopagerBwUtil.consoleLog("AutoPagring 2" )    

    var minipages = this.getMinipages();
    if (minipages>1 && autopagerPref.loadBoolPref("enabled") && autopagerMain.isEnabledOnDoc(doc,this))
        this.forceLoadPage=minipages;
    this.autopagerPage=1;
    this.autopagerPageHeight = [];
    this.hasContentXPath = (site.contentXPath!=null && site.contentXPath.length>0);
    this.autopagerRunning = true;
    this.autopagerPagingCount=0;
    this.autopagerPageUrl=[];
    this.autopagerProcessed = true;
    this.autopagernextUrl=null
    this.inSplitWindow = false;
    this.changeMonitor = null;
    this.shouldMonitorAutoScroll = false;
//    autopagerBwUtil.consoleLog("AutoPagring 3" )    

    var Me = this
    //http://member.teesoft.info/phpbb/viewtopic.php?p=10930#10930
    this.autoScrollingMonitor = function (aEvent){
        if (Me.shouldMonitorAutoScroll)
        {
            if (aEvent) {
                Me.autoScrolling = true                
            }
        }
    }
    this.wheelClickMonitor = function (e){
        //remember the latest wheel event
        if (e.button==1)
            Me.wheelEvent = e;
    }

    AutoPagerNS.browser.addEventListener("mousedown", this.wheelClickMonitor, true)
    AutoPagerNS.browser.addEventListener("popuphidden", this.autoScrollingMonitor, true)

    function isNumberKeyCode(keyCode)
    {
        return (keyCode>=48 &&keyCode<=57) || (keyCode>=96 &&keyCode<=105);
    }
    
    this.keyupMonitor = function(e){
        if (e.ctrlKey && e.altKey && e.keyCode>=48 &&e.keyCode<=57){
            var pages = e.keyCode>57 ? e.keyCode - 96 : e.keyCode - 48;
            if (pages==0)
                pages = 10;
            Me.loadPages(e.target.ownerDocument,pages)
        }
    } 
    doc.addEventListener("keyup", this.keyupMonitor, false)
    
    if (this.site.alertsHash)
    {
        var host = doc.location.host
        var visited = autopagerPref.loadPref("host." + host + ".alertsHash");
        if (typeof visited == 'undefined' ||   visited !=this.site.alertsHash)
        {
            //never alert again in 24 hours
            var time = autopagerPref.getDatePrefs("host." + host + ".alertsHashTime");
            var now = new Date();
            if (!(time && now.getTime()-time.getTime()<(1000 * 60 * 60*24) ))
            {
                var alertsHash = this.site.alertsHash
                var url =autopagerPref.loadPref("repository-site") + "view?id=" + this.site.id
                var callback = function()
                {
                    autopagerPref.savePref("host." + host + ".alertsHash",alertsHash);
                    autopagerPref.resetPref("host." + host + ".alertsHashTime");
                    AutoPagerNS.add_tab({
                        url:url
                    });
                }
                AutoPagerNS.browser.open_alert(autopagerUtils.autopagerGetString("alertforrule"),autopagerUtils.autopagerGetString("needyourattention"),url,callback,{
                    doc:doc
                })
                autopagerPref.setDatePrefs("host." + host + ".alertsHashTime",now);
            }
        }
    }
}

AutoPagring.prototype.getAllowCheckpagingAutopagingPage = function() {
    //    if (!this.autopagerProcessed)
    //      autopagerMain.onInitDoc(doc,false);
    var enabled =this.autopagerEnabledSite && ((autopagerPref.loadBoolPref("enabled") && autopagerUtils.isEnabledOnHost()) || (this.forceLoadPage>this.autopagerPage));
    //enabled = enabled && ( !this.enableJS  || this.autopagerSplitDocInited );
    
//    autopagerBwUtil.consoleLog("enabled:" + enabled 
//        + ",autopagerEnabledSite:" + this.autopagerEnabledSite
//        + ",globalEnable:" + autopagerPref.loadBoolPref("enabled")
//        + ",forceLoadPage:" + (this.forceLoadPage>this.autopagerPage)
//        )
    return  enabled;
}
AutoPagring.prototype.getEnabledAutopagingPage = function() {
    if (!autopagerBwUtil.supportHiddenBrowser())
        return true;
    var enabled =this.autopagerEnabledSite && (autopagerPref.loadBoolPref("enabled") ||  this.forceLoadPage>this.autopagerPage);
    enabled = enabled && ( !(this.enableJS)  || this.autopagerSplitDocInited || !this.hasContentXPath);
    return  enabled ;
},

AutoPagring.prototype.scrollWatcher = function(event) {
    if (this.scrollWatching || (new Date().getTime() - this.lastScrollWatchExecuteTime) < 200)
    {
        //autopagerBwUtil.consoleLog("scrollWatcher cancelled because of " + (this.scrollWatching?"performing":"too quick"))
        if (!this.pendingScrollWatcher)
        {
            this.pendingScrollWatcher = true
            var paging = this
            AutoPagerNS.window.setTimeout(function (){
                paging.scrollWatcher(event);
            },200);
        }
        return;
    }
    this.pendingScrollWatcher = false
    
    var doc = null;
    if (event == null)
        doc = AutoPagerNS.getContentDocument();
    else if (autopagerUtils.isHTMLDocument(event))
        doc = event;
    else
        doc = event.target;

//    autopagerBwUtil.consoleLog("scrollWatcher:" + doc)
    if (doc != null)
    {
        this.scrollWatcherOnDoc(doc);
    }
}

AutoPagring.prototype.onRenderStateChanged = function(event) {
    if (!autopagerBwUtil.isMobileVersion())
        return;
    if (this.scrollWatching || (new Date().getTime() - this.lastScrollWatchExecuteTime) < 500)
        return;
    
    var rect = Browser._browserView.getVisibleRect();

    var doc = getBrowser().contentDocument;
    
    if (doc != null)
    {
        if (!autopagerUtils.isHTMLDocumen(doc))
            doc = doc.ownerDocument;
        this.scrollWatcherOnDoc(doc,rect.top);
    }
}

AutoPagring.prototype.onMouseDown = function(event) {
    if (this.scrollWatching || (new Date().getTime() - this.lastScrollWatchExecuteTime) < 500)
        return;
    var doc = null;
    if (event == null)
        doc = AutoPagerNS.getContentDocument();
    else if (autopagerUtils.isHTMLDocument(event))
        doc = event;
    else if (autopagerUtils.isHTMLDocument(event.target))
        doc = event.target;
    else if (autopagerUtils.isHTMLDocument(event.originalTarget))
        doc = event.originalTarget;
    else if (event.target && autopagerUtils.isHTMLDocument(event.target.ownerDocument))
        doc = event.target.ownerDocument;
    else if (event.originalTarget && autopagerUtils.isHTMLDocument(event.originalTarget.ownerDocument))
        doc = event.originalTarget.ownerDocument;
    else
        doc = AutoPagerNS.getContentDocument();

    if (doc != null)
    {
        if (!(autopagerUtils.isHTMLDocument(doc)))
            doc = doc.ownerDocument;
        this.scrollWatcherOnDoc(doc,event.pageY);
    }
}
AutoPagring.prototype.scrollWatcherOnDoc = function(doc,pageY) {
    if (doc != null)
        var paging = this
        this.scrollWatching = true;
        this.lastScrollWatchExecuteTime = new Date().getTime();
        AutoPagerNS.window.setTimeout(function(){
//            autopagerBwUtil.consoleLog("scrollWatcherOnDoc" ) 
            paging.doScrollWatcher(doc,pageY);
        },20);
}

AutoPagring.prototype.doScrollWatcher = function(scrollTarget,pageY)
{
    try{
        if (autopagerMain.autopagerDebug)
            autopagerMain.logInfo(this.count,"Enter scrollWatcher");
        var scollDoc = scrollTarget;
        if (!(autopagerUtils.isHTMLDocument(scollDoc)) && scollDoc.ownerDocument)
            scollDoc = scollDoc.ownerDocument;

        var doc = scollDoc;
//        autopagerBwUtil.consoleLog("doScrollWatcher:" + doc)
        if (doc.location != null)
        {
            var Enable = this.getAllowCheckpagingAutopagingPage();
            if (Enable) {
                var readyToPaging = this.getEnabledAutopagingPage();
//                autopagerBwUtil.consoleLog("readyToPaging:" + readyToPaging)
                if (autopagerMain.autopagerDebug)
                    autopagerMain.logInfo(this.count+ "Enabled " + autopagerUtils.getUrl(doc),this.count+ "Enabled " + autopagerUtils.getUrl(doc));
                try{
                    var needLoad = false;
                    if (this.forceLoadPage> this.autopagerPage)
                        needLoad = true;
                    else
                    {
//                        if (this.forceLoadPage>0)
//                            this.forceLoadPage = 0;
                        var scrollDoc =doc;

                        var winHeight = AutoPagerNS.window.innerHeight;//scrollDoc.defaultView.innerHeight ? scrollDoc.defaultView.innerHeight : scrollDoc.documentElement.clientHeight;
                        var scrollContainer = null;
                        if (this.site.containerXPath)
                        {
                            var containerXPath = this.site.containerXPath;
                            var autopagerContainer = null;
                            if (containerXPath != "")
                            {
                                autopagerContainer = autopagerMain.findNodeInDoc(doc,containerXPath,false);
                                if (autopagerContainer!=null)
                                {
                                    scrollContainer = autopagerContainer[0];
                                    winHeight = autopagerContainer[0].clientHeight;

                                    if (!(scrollContainer.style.getPropertyValue("overflow-y") == 'scroll'))
                                    {
                                        scrollContainer.style.setProperty("overflow-y",'scroll',null);
                                        var pNode=scrollContainer.parentNode;
                                        var s1 = scrollDoc.defaultView.getComputedStyle(pNode, null);
                                        var s2 = scrollDoc.defaultView.getComputedStyle(scrollDoc.body, null);
                                        if ((s1 !=null &&( s1.getPropertyValue("overflow")=='hidden'
                                            ||s1.getPropertyValue("overflow-y")=='hidden'))
                                        || ((s2 != null && s2.getPropertyValue("overflow")=='hidden'
                                            ||s2.getPropertyValue("overflow-y")=='hidden')))
                                            {
                                            var wHeight = scrollDoc.body != null ?
                                            scrollDoc.body.scrollHeight : scrollContainer.scrollHeight ;
                                            //                                                                if (scrollContainer != null && scrollContainer.scrollHeight < sh)
                                            //                                                                    wHeight = scrollContainer.scrollHeight;
                                            scrollContainer.style.setProperty("height",(wHeight - autopagerMain.getOffsetTop(scrollContainer)) + 'px',null);
                                        }
                                    }
                                }
                            }

                        }
                        if (scrollContainer==null)
                            scrollContainer = scrollDoc.documentElement;
                        var scrollTop = pageY? pageY:(scrollContainer && scrollContainer.scrollTop)
                                        ? scrollContainer.scrollTop : scrollDoc.body?scrollDoc.body.scrollTop:0;

                        var scrollOffset = ((scrollContainer && scrollContainer.scrollHeight)
                                                ? scrollContainer.scrollHeight : scrollDoc.body.scrollHeight);
                        if (!pageY && scrollDoc.body != null && scrollDoc.body.scrollHeight > scrollOffset)
                            scrollOffset = scrollDoc.body.scrollHeight;

                        
                        var m = this.getContentBottomMargin(doc)
                        var offsetTop = scrollContainer.offsetTop ? scrollContainer.offsetTop : 0;
                        var remain = scrollOffset - scrollTop - offsetTop - winHeight
                        - (m?m:0);
                    
//                        autopagerBwUtil.consoleLog(scrollOffset + ":" + pageY + ":" + scrollTop + ":" + offsetTop + ":" +winHeight + " remain:" + remain)

                        this.count++;
                        if (autopagerMain.autopagerDebug)
                            autopagerMain.logInfo(this.count + ": Auto pager wh:" + winHeight+ " sc:" + scrollTop + " remain: " + remain,
                                "sh=" + scrollOffset + " sc = " + scrollTop + " wh= " + winHeight + " Auto pager remain: " + remain + ".\nremain < " + winHeight+" will auto page.");

                        if (autopagerMain.autopagerDebug)
                            winHeight = winHeight * (this.site.margin*1 + 1);
                        else
                            winHeight = winHeight * (this.site.margin);
                        //alert(wh);
                        //needLoad = remain < wh;
                        var currHeight = scrollTop + offsetTop;// + wh
                        var targetHeight = 0;
                        var minipages = this.getMinipages();
                        if (minipages>0)
                        {
                            //notice doc.documentElement is different to de here!!!!!
                            var a = this.autopagerPageHeight;
                            if (a!=null && a.length >= minipages)
                            {
                                var pos = a.length - minipages;//this.site.margin
                                targetHeight = a[pos];
                            }
                        }else
                            targetHeight = currHeight;

                        needLoad = ( (targetHeight < currHeight)) || remain < winHeight;
                    }
//                    autopagerBwUtil.consoleLog("needLoad:" + needLoad)
                    if( needLoad){
                           if (this.autopagerPage==null || this.autopagerPage<2)
                        {
                            //test the contetXPATH first
                            if (this.hasContentXPath)
                            {
                                var xpath = this.site.contentXPath;

                                var nodes = autopagerMain.findNodeInDoc(doc,xpath,this.enableJS || this.inSplitWindow);
//                                alert(nodes.length + " " + xpath + ":" + doc.location)
                                if (nodes.length==0)
                                {
                                    this.scrollWatching = false;
                                    return;
                                }

                            }
                        }
                        this.autopagerUserConfirmed = autopagerUtils.isConfirmedOnHost(doc.location.host);
                        this.autopagerUserAllowed= autopagerUtils.isEnabledOnHost(doc.location.host);
                        this.autopagerSessionAllowed = this.autopagerUserAllowed
                        this.autopagerAllowedPageCount = -1;
                        this.autopagerSessionAllowedPageCount  = -1;
                        if (!this.autopagerUserConfirmed && autopagerUtils.noprompt())
                        {
                            this.autopagerUserConfirmed = true;
                            this.autopagerUserAllowed = !autopagerPref.loadBoolPref("disable-by-default");
                            this.autopagerSessionAllowed = this.autopagerUserAllowed
                        }
                        var needConfirm =  (!autopagerUtils.noprompt())
                        && (!this.autopagerUserConfirmed || (this.autopagerSessionAllowed
                            && this.autopagerAllowedPageCount== this.autopagerPage));
                        
                        if (needConfirm)
                        {
                            if (autopagerMain.promptNewRule (doc,true))
                                this.autopagerEnabledSite=false
                        }
                        else
                        if ((this.autopagerUserConfirmed
                            && this.autopagerUserAllowed
                            && ( this.autopagerAllowedPageCount < 0
                                ||  this.autopagerAllowedPageCount> this.autopagerPage)
                            ) || this.forceLoadPage>this.autopagerPage)
                            {
//                            alert(3)
                            //test the url if there is not content
                            if (!this.hasContentXPath)
                            {
                                var nextUrl = this.autopagernextUrl;
                                if (nextUrl==null || nextUrl.ownerDocument!=doc)
                                {
                                    this.scrollWatching = false;
                                    return;
                                }
                                var p = autopagerMain.myGetPos(nextUrl);
                                if (p.x<=0 || nextUrl.scrollWidth<=0 || p.y<=0 || nextUrl.scrollHeight<=0)
                                {
                                    this.scrollWatching = false;
                                    return;
                                }
                            }
                            if (readyToPaging){
                                if (!autopagerBwUtil.supportHiddenBrowser() || doc.defaultView){
                                    this.autopagerEnabledSite = false;
                                    this.loadNextPage(doc);
                                }
                            }
                            else
                            {
                                if (!this.autopagerSplitCreated)
                                {
                                    try{
                                        this.autopagerSplitCreated = true;
                                        autopagerMain.getSplitBrowserForDoc(doc,true,this);
                                    }catch(e)
                                    {
                                        this.autopagerSplitCreated = true;
                                        autopagerMain.getSplitBrowserForDoc(doc,true,this);
                                        autopagerBwUtil.consoleError(e)
                                    }

                                }
                            }
                        }

                    }
                }catch(e){
                    autopagerBwUtil.consoleError(e);
                }
            }
        }
    }catch(e){
        autopagerBwUtil.consoleError(e);
    }
    this.scrollWatching = false;
}
AutoPagring.prototype.loadNextPage = function(doc){
    var nextUrl = this.autopagernextUrl;
    //var linkXPath = this.site.linkXPath;
    
    //TODO
    if (nextUrl != null && ( typeof(nextUrl) =='string' || 
        !nextUrl.getAttribute || !nextUrl.getAttribute("disabled")))
    {
         //validate insertPoint
            try{
                var parentNode = this.getAutopagerinsertPoint(doc).parentNode.parentNode;
            }catch(e)
            {
                autopagerBwUtil.consoleError(e)
                var de = doc.documentElement
                this.autopagerSplitCreated = false;
                this.autopagerSplitCreated = false;
                this.autopagerSplitDocInited = false;
                var topDoc = AutoPagerNS.getContentDocument();

                this.autopagerPagingCount = 0
                var pagring = this
                AutoPagerNS.window.setTimeout(function(){
                    topDoc =AutoPagerNS.getContentDocument();
                    de = topDoc.documentElement;
                    doc = topDoc
                    //doc.documentElement.autopagerRunning = false;
                    pagring.autopagerRunning = false;
                    autopagerMain.onInitDoc(doc,false);
                    pagring.autopagerSplitCreated = false;
                    pagring.autopagerSplitDocInited = false;

                    var splitbrowser = autopagerMain.getSplitBrowserForDoc(doc,true);
                },100);

                return false;

            }
            this.onStartPaging(doc);
            this.processNextDoc(doc,nextUrl);
    }
}
AutoPagring.prototype.onStartPaging  = function(doc) {
    this.autopagerPagingCount ++;
    this.pagingWatcher(doc);
}
AutoPagring.prototype.onStopPaging = function(doc) {
    //if (this.autopagerPagingCount>0)
    this.autopagerPagingCount--;
    autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
    var loadgingImg = doc.getElementById("autopagerLoadingImg");
    while (loadgingImg)
    {
        loadgingImg.parentNode.removeChild(loadgingImg);
        loadgingImg = doc.getElementById("autopagerLoadingImg");
    }

    this.autopagerEnabledSite = true

    if (this.autopagernextUrl != null && this.forceLoadPage>this.autopagerPage)
    {
        this.scrollWatcherOnDoc(doc);
    }
    if (this.site.monitorXPath)
    {
        autopagerMain.monitorForCleanPages(doc,this)
    }
}
AutoPagring.prototype.isFullLink = function(url) {
    var reg = /^https?\:\/\//;
    return url.constructor == String && reg.test(url.toLowerCase());
}
AutoPagring.prototype.isRelativeLink = function(url) {
    var fullPath = /^https?\:\/\//;
    var jsOrAjaxPath = /^[ ]*javascript|^\#[0-9a-zA-Z]*/;
    return url.constructor == String && !fullPath.test(url.toLowerCase())&& !jsOrAjaxPath.test(url.toLowerCase());
}
AutoPagring.prototype.isJavascriptLink = function(url) {
    var reg = /^[ ]*javascript/;
    return url.constructor == String && reg.test(url.toLowerCase());
}
AutoPagring.prototype.completeUrl = function(url,doc) {
    //private functions
    function escapeHTML(s) {
        return s.split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;');
    }
    function qualifyURL(url) {
        var el= doc.createElement('div');
        el.innerHTML= '<a href="'+escapeHTML(url)+'">x</a>';
        return el.firstChild.href;
    }
    return qualifyURL(url);
}
AutoPagring.prototype.processNextDoc = function(doc,url) {
    if (!this.hasContentXPath)
    {
        this.processByClickOnly(doc,url);
    }
    else if (autopagerBwUtil.supportHiddenBrowser() &&  (this.enableJS || this.inSplitWindow || url==null || !this.isFullLink(url))) {
        this.inSplitWindow = true;
        //this.site.enableJS = true;
        this.enableJS = !!this.site.enableJS;
        this.processInSplitWin(doc);
    }else if (autopagerBwUtil.supportHiddenBrowser() && url!=null && this.isFullLink(url))
    {
        this.inSplitWindow = true;
        this.processInSplitWinByUrl(doc,url);
    }
    else if (url!=null && this.isFullLink(url)){
        this.processNextDocUsingXMLHttpRequest(doc,url);
    }
    else if (url!=null && this.isRelativeLink(url)){
        this.processNextDocUsingXMLHttpRequest(doc,this.completeUrl(url,doc));
    }
    else
        this.autopagerRunning = false;
        //autopagerMain.enabledInThisSession(doc,false);
},
AutoPagring.prototype.processByClickOnly = function(doc,url)
{
        var de = doc.documentElement;
        var loaded = false;
        if (this.autopagerNodeListener)
        {
            doc.removeEventListener("DOMNodeInserted",this.autopagerNodeListener,false);
            this.autopagerNodeListener = null;
        }
        var paging = this;
        var domInsert = function(e)
            {
                paging.autopagerNodeListener = domInsert;
                var urlNodes = autopagerMain.findLinkInDoc(doc,paging.site.linkXPath,paging.enableJS || paging.inSplitWindow);
                if (urlNodes != null && urlNodes.length >0)
                {
                    paging.autopagernextUrl = urlNodes[0];
                }
                if (!loaded)
                {
                    var oldHeight = paging.getPageOldHeight(doc);
                    if (paging.autopagerPageHeight.length>0)
                        oldHeight = paging.autopagerPageHeight[paging.autopagerPageHeight.length-1];
                    var newHeight = paging.getContainerHeight(doc);
                    
                    //ignore this event if page height changes not to much
                    if (newHeight-oldHeight<200)
                        return;
                    loaded = true;
                    AutoPagerNS.window.setTimeout(function (){
                        paging.onStopPaging(doc);
                        var scrollContainer = null;
                        if (paging.site.containerXPath)
                        {
                            var autopagerContainer = autopagerMain.findNodeInDoc(
                                de,paging.site.containerXPath,false);
                            if (autopagerContainer!=null)
                            {
                                scrollContainer = autopagerContainer[0];
                                if (paging.tmpScrollWatcher)
                                    scrollContainer.removeEventListener("scroll",paging.tmpScrollWatcher,true);
                                paging.tmpScrollWatcher =function(event){
                                    paging.scrollWatcher(event);
                                }
                                scrollContainer.addEventListener("scroll",paging.tmpScrollWatcher,true);
                            }
                        }
                        var scrollDoc =doc;
                        if (scrollContainer==null)
                            scrollContainer = de;
                        var sh = (scrollContainer && scrollContainer.scrollHeight)
                        ? scrollContainer.scrollHeight : scrollDoc.body.scrollHeight;
                        if (scrollDoc.body != null && scrollDoc.body.scrollHeight > sh)
                        {
                            sh = scrollDoc.body.scrollHeight;
                        }
                        paging.autopagerPageHeight.push(sh);
                        var urlNodes = autopagerMain.findLinkInDoc(doc,paging.site.linkXPath,paging.enableJS || paging.inSplitWindow);
                        if (urlNodes != null && urlNodes.length >0)
                        {
                            paging.autopagernextUrl = urlNodes[0];
                        }
                    }, paging.site.delaymsecs);
                }

            }
            doc.addEventListener("DOMNodeInserted",domInsert,false);
        this.autopagerPage++;
        this.autopagerSimulateClick(doc.defaultView, doc,url);

}
AutoPagring.prototype.getContainerHeight = function(doc) {
    var scrollContainer = null
    if (this.site.containerXPath)
    {
        var de = doc.documentElement;
        var autopagerContainer = autopagerMain.findNodeInDoc(
            de,this.site.containerXPath,false);
        if (autopagerContainer!=null)
        {
            scrollContainer = autopagerContainer[0];
        }
    }
    var scrollDoc =doc;
    if (scrollContainer==null)
        scrollContainer = de;
    var sh = (scrollContainer && scrollContainer.scrollHeight)
    ? scrollContainer.scrollHeight : scrollDoc.body.scrollHeight;
    if (scrollDoc.body != null && scrollDoc.body.scrollHeight > sh)
    {
        sh = scrollDoc.body.scrollHeight;
    }
    return sh
}
AutoPagring.prototype.pagingWatcher = function(doc) {
    if (!(autopagerUtils.isHTMLDocument(doc)) && doc.ownerDocument)
        doc = doc.ownerDocument;
    try{
        if((autopagerPref.loadBoolPref("enabled") ||  this.forceLoadPage>this.autopagerPage)) {
            var loading = true;
            if (loading)
            {
                autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,true),false);
                this.insertLoadingBreak(doc);
            }
        }
        else {
            autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
        }
    }catch(e) {
        autopagerBwUtil.consoleError(e)
        autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
    }

}
AutoPagring.prototype.processInSplitWin = function(doc)
{
    try{
        var b = autopagerMain.getSplitBrowserForDoc(doc,false,this);
        var newDoc = b.contentDocument;
        this.processInSplitDoc(doc,newDoc,b);
    }catch (e){
        autopagerBwUtil.consoleError(e);
    }

}
AutoPagring.prototype.processInSplitDoc = function(doc,splitDoc,b){
    try{
        var nextUrl=null;
        //alert(nodes.length);
        var urlNodes = autopagerMain.findLinkInDoc(splitDoc,this.site.linkXPath,this.enableJS||this.inSplitWindow);
        //alert(urlNodes);
        if (urlNodes != null && urlNodes.length >0) {
              nextUrl = autopagerMain.getNextUrl(doc,this.enableJS||this.inSplitWindow,urlNodes[0]);
        }else if (splitDoc.defaultView)//try frames
        {
            if (splitDoc.defaultView.frames != null) {
                for(var i=0;i<splitDoc.defaultView.frames.length;++i) {
                    if (this.processInSplitDoc(doc,splitDoc.defaultView.frames[i].document,b))
                        return true;
                }
            }
            return false;
        }
           //alert(nextUrl);
        this.autopagernextUrl = nextUrl;
//        de.setAttribute("autopagernextUrlObj",nextUrl)


        var node = this.autopagernextUrl;
        if (node.constructor == String)
            b.loadURI(this.autopagernextUrl,null,null);
        else {
            //alert("this.autopagerSimulateClick");
            if ((node.tagName == "A" || node.tagName == "a"))
                node.target = "_self";
            this.autopagerSimulateClick(b.contentWindow, doc,node);
        }
    }catch (e){
        autopagerBwUtil.consoleError(e);
        return false;
    }
    return true;
}
AutoPagring.prototype.processInSplitWinByUrl  = function(doc,url){
    try{
        var urlStr = this.getSameDomainUrl(doc,url)
        if (!urlStr || ! (typeof urlStr == 'string'))
        {
            this.onNotSameDomainError(doc,url);
            return;
        }
        var b = autopagerMain.getSplitBrowserForDoc(doc,false,this);
        b.auotpagerContentDoc = doc;
        b.autopagerSplitWinFirstDocSubmited=true;
        b.autopagerSplitWinFirstDocloaded = true;
        this.autopagerSplitDocInited = true;
        this.autopagerEnabledSite = false;
        b.loadURI(url,null,null);
    }catch (e){
        autopagerBwUtil.consoleError(e);
    }

}
AutoPagring.prototype.lazyLoad = function(doc)
{
    var paging = this
    var lazyLoadFunc =  function (event){
        try{
            var target = null;
            if (event.target != null)
                target = event.target;
            else if (event.originalTarget != null)
                target = event.originalTarget;
            else if (event.currentTarget != null)
                target = event.currentTarget;
            else
                target = event
            //alert(target);
            var frame=target;
            if (!frame.autoPagerInited) {
                //autopagerMain.fireFrameDOMContentLoaded(frame);
                try{
                    if (!frame.contentDocument || !frame.contentDocument.documentElement)
                    {
                        return;
                    }
                }catch(e){
                    paging.onNotSameDomainError(doc,frame.src);
                    return;
                }
                var newDoc = frame.contentDocument;
                
                paging.scrollWindow(doc,newDoc);
                paging.onStopPaging(doc);
                try{
                    frame.removeEventListener("DOMContentLoaded", lazyLoadFunc, false);
                    frame.removeEventListener("load", lazyLoadFunc, false);
                }catch(e){
                    autopagerBwUtil.consoleError(e)
                }
            }
        }catch(e){
            autopagerBwUtil.consoleError(e)
        }
    }
    return lazyLoadFunc;
}
AutoPagring.prototype.loadInFrame = function(doc,url){
    var frame = autopagerMain.getSelectorLoadFrame(doc,url);
    var lazyLoad = this.lazyLoad(doc);
    var called = false
    var callback = function(e)
    {
       if (!called){
            called = true;
            //alert(e.target.contentDocument.documentElement.innerHTML)
            lazyLoad(e);
       }        
    }
    frame.sandbox = 'allow-same-origin';
    frame.addEventListener("load", callback, false);
    frame.addEventListener("DOMContentLoaded", callback, false);
    //frame.setAttribute('src', url);
    AutoPagerNS.window.setTimeout(
        function(){
            if (!called){
                called = true;
                frame.normalize();
                lazyLoad(frame);
            }
        }
    ,4000);
}
AutoPagring.prototype.processNextDocUsingXMLHttpRequest = function(doc,url){
    var xmlhttp=null;
    //alert(autopagerUtils.getUrl(doc));
    try{
        var paging = this
        var urlStr = this.getSameDomainUrl(doc,url)
        if (!urlStr || ! (typeof urlStr == 'string'))
        {
            this.onNotSameDomainError(doc,url);
            return;
        }        
        //loade the next page in a iframe if the page doesn't redirect to top
        if (paging.isFrameSafe(doc))
        {
            paging.loadInFrame(doc,urlStr);
            return;
        }
        //now use XMLHttpRequest to retrive the site content
        //tested on unbase64 aHR0cDovL3ZpZG9oZS5jb20vc2l0ZXMucGhwCg==
        xmlhttp=autopagerUtils.newXMLHttpRequest()
        var type = autopagerMain.getContentType(doc);
        xmlhttp.overrideMimeType(type);

//        autopagerBwUtil.consoleLog("start")
        xmlhttp.onreadystatechange = function (aEvt) {
            if(xmlhttp.readyState == 4) {
                if(xmlhttp.status == 200) {
                    var newDoc = autopagerBwUtil.createHTMLDocumentFromStr(xmlhttp.responseText,urlStr);
                    if (newDoc)
                    {
                        paging.scrollWindow(doc,newDoc);
                        paging.onStopPaging(doc);
                    }else
                    {
                        paging.frameSafe = paging.site.enableJS==3 && !autopagerMain.hasTopLocationRefer(xmlhttp.responseText);
                        if (paging.frameSafe)
                        {
                            paging.loadInFrame(doc,urlStr);
                            return;
                        }
                        else
                        {
                            var frame = autopagerMain.getSelectorLoadFrame(doc);
                            var lazyLoad = paging.lazyLoad(doc);
                            frame.addEventListener("load", lazyLoad, false);
                            frame.addEventListener("DOMContentLoaded", lazyLoad, false);

                            frame.autoPagerInited = false;
                            //frame.contentDocument.clear();
                            frame.contentDocument.documentElement.setAttribute("autopageCurrentPageLoaded","false")
                            //alert(xmlhttp.responseText);
                            var html = xmlhttp.responseText
                            var body = autopagerMain.getHtmlInnerHTML(html,paging.enableJS||paging.inSplitWindow,url,type,paging.isLazyLoadImage());
                            //frame.contentDocument.write(autopagerMain.getHtmlInnerHTML(xmlhttp.responseText,this.enableJS||this.inSplitWindow,url));
                            try
                            {
                                var bodies = autopagerMain.findNodeInDoc(frame.contentDocument,"//body[1]",false);
                                //var bodies = frame.contentDocument.getElementsByName("body")
                                if (bodies && bodies.length>0)
                                {
//                                    var head = autopagerMain.getHtmlHeadHTML(html,paging.enableJS||paging.inSplitWindow,url,type,paging.isLazyLoadImage());
//                                    body = "<head>" + head +"</head>" + body
                                    bodies[0].innerHTML = body
//                                    var heads = autopagerMain.findNodeInDoc(frame.contentDocument,"//head[1]",false);
//                                    if (heads && heads.length>0)
//                                    {
//                                      heads[0].innerHTML=head
//                                    }
                                }
                                else
                                {
                                    frame.contentDocument.documentElement.innerHTML = body
                                }
                                //frame.setAttribute('src', 'data:text/html,' + encodeURIComponent(html));
                                //frame.setAttribute('src', url);
                                //frame.contentDocument.open("about:blank");
                                //frame.contentDocument.write(html);
                            }catch(e)
                            {
                                autopagerBwUtil.consoleError(e)
                            }
                            //autopagerMain.loadChannelToFrame(frame,xmlhttp.channel,true);
                            frame.contentDocument.documentElement.setAttribute("autopager-real-url",urlStr)
                            AutoPagerNS.window.setTimeout(
                                function(){frame.normalize();lazyLoad(frame);}
                            ,1000);
                            //xmlhttp.abort();
                        }
                    }
                }
                else {
                    autopagerMain.alertErr("Error loading page:" + url);
                    paging.autopagerEnabledSite = true
                    paging.onStopPaging(doc);
                }

            }
        };

        xmlhttp.open("GET", urlStr, true);
        //content.content.status = "loading ... " + url;
        xmlhttp.send(null);

    }catch (e){
        autopagerBwUtil.consoleError(e)
        this.autopagerEnabledSite = true
    }
//    autopagerBwUtil.consoleLog("done")

}
AutoPagring.prototype.insertLoadingBreak = function(doc) {
    if (this.autopagerinsertPoint)
    {
        var divStyle = autopagerPref.loadUTF8Pref("pagebreak");// "clear:both; line-height:20px; background:#E6E6E6; text-align:center;";
        var div= autopagerMain.createDiv(doc,"",divStyle);
        div.innerHTML = "<span id='autopagerLoadingImg'><a target='_blank' href='http://autopager.teesoft.info/help.html'><img src='" + autopagerUtils.getContentImage("loading.gif") + "'/></a></span>";
        var insertPoint =	this.autopagerinsertPoint;
        div.setAttribute("id","apBreakStart" + this.autopagerPage);
        insertPoint.parentNode.insertBefore(div,insertPoint);
        var index = this.autopagerPage;
        if (this.hasContentXPath || this.autopagerPage==1)
        {
                if (!doc.getElementById("ap_related_" + index))
                {
                    if (typeof this.relatedSearchOptions!="undefined" && this.relatedSearchOptions!=null)
                    {
                        this.performRelatedSearch(this.relatedSearchOptions,doc,index,div);
                    }
                    else
                    {
                        this.asyncRelatedSearch(doc,index,div);
                    }
                }                
        }
        this.lastBreakStart = div;
    }
}
AutoPagring.prototype.asyncRelatedSearch = function(doc,index,div) {
    var Me = this
    var oldDiv = doc.getElementById("ap_related_" + index);
    if (oldDiv)
        oldDiv.parentNode.removeChild(oldDiv)
    autopagerRelated.getRelelatedSearchOptions(doc.location.host,function(options){
        Me.performRelatedSearch(options,doc,index,div);
    })
}
AutoPagring.prototype.performRelatedSearch = function(options,doc,index,div) {
    this.relatedSearchOptions = options;
    var ut = this.getUrlTemplate(options)

    if (ut == null)
        return;
    var Me = this;
    if (!options.prompted)
    {
        //TODO: show prompted
        options.searchEngine=null;
        var prompt = Me.createRelatedSearchPrompt(doc,options,index,div);
        div.parentNode.insertBefore(prompt,div);
    }else if(options.enabled)
    {
        var searchQuery = this.getQueryText(options,doc);
        if (typeof searchQuery != "undefined" && searchQuery!= "" && searchQuery!= null
         && (typeof options.relatedTexts == "undefined" || searchQuery != options.searchQuery))
        {
            options.searchQuery = searchQuery;
            autopagerRelated.getRelelatedSearchText(options,ut,function(relatedTexts){
                options.relatedTexts = relatedTexts
                var table = Me.createRelatedTable(doc,options,div,searchQuery,relatedTexts,index,ut.u);
                if (table)
                    div.parentNode.insertBefore(table,div);
            })
        }else if(typeof options.relatedTexts != "undefined")
        {
                var table = Me.createRelatedTable(doc,options,div,options.searchQuery,options.relatedTexts,index,ut.u);
                if (table)
                    div.parentNode.insertBefore(table,div);
        }
    }    
}
AutoPagring.prototype.getUrlTemplate = function(options) {
    if (typeof this.urlTemplate != "undefined" && this.urlTemplate!="" && this.urlTemplate!=null)
    {
        return this.urlTemplate;
    }
    var sts = options.searchs;
    if (sts!=null)
    {
        var engine = options.searchEngine
        if (typeof engine != "undefined" && engine!=""&& engine!=null)
        {
            this.urlTemplate = sts[engine];
            if (typeof this.urlTemplate != "undefined" && this.urlTemplate!=""&& this.urlTemplate!=null)
            {
                return this.urlTemplate;
            }
        }
        for(var k in sts)
        {
            this.urlTemplate = sts[k];
            return this.urlTemplate ;
        }
    }
    return null;
}
AutoPagring.prototype.getQueryText = function(options,doc) {
    var xpaths = []
    this.addXPath(xpaths,this.site.keywordXPath);
    this.addXPath(xpaths,options.keywordXPath);
    var searchQuery="";
    for(var i=0;i<xpaths.length;i++)
    {
        var xpath = xpaths[i]
        var nodes = autopagerXPath.evaluate(doc,xpath,true);
        if (nodes.length>0)
        {
            searchQuery = nodes[0]
            if ((typeof searchQuery != "undefined") && (typeof searchQuery.textContent != "undefined"))
            {
                searchQuery = searchQuery.textContent
            }
            if (typeof searchQuery != "undefined" && searchQuery!= "")
                return searchQuery;
            break;
        }
    }
    return null;
}
AutoPagring.prototype.addXPath = function(xpaths,xpath) {
    if (typeof xpath=="undefined")
        return;
    var xs = xpath.split("|||")
    for(var i=0;i<xs.length;i++)
    {
        if (xpaths.indexOf(xs[i])==-1)
        {
            xpaths.push(xs[i])
        }
    }
}
AutoPagring.prototype.createRelatedSearchOptions= function (doc,options,index,div,display)
{
    var Me = this    
    var d = doc.createElement("div");
    d.setAttribute("id","ap_search_option_" + index)
    
    var s = doc.createElement("select");
    function createOption(value,label,image,s,selected)
    {
        var o = doc.createElement("option");
        o.setAttribute("value",value);
        o.textContent = label;
        if (typeof image != "undefined")
        {
            o.setAttribute("style", "background-image:url(" + image +");padding: 2px 0 2px 20px;background-repeat: no-repeat;background-position: 1px 2px;vertical-align: middle;");
        }
        if (selected)
        {
            o.setAttribute("selected",true);
            s.setAttribute("style", "background-image:url(" + image +");padding: 2px 0 2px 20px;background-repeat: no-repeat;background-position: 1px 2px;vertical-align: middle;");
        }
        return o;
    }
    function getByValue(s,v)
    {
        var myNodeList = s.childNodes
        for (var i = 0; i < myNodeList.length; ++i) {
          var item = myNodeList[i];
          if (v == item.value)
          {
              return item;
          }
        }
        return null;
    }

    s.appendChild(createOption("_ignore1",autopagerUtils.autopagerGetString("selectsearchengine")));
    var hasMore = false;
    for(var k in options.searchs)
    {
        var se = options.searchs[k]
        if (!se.r && k!=options.searchEngine)
        {
            hasMore = true;
            continue;
        }
        var o = createOption(k,se.l,se.i,s,k==options.searchEngine)
        s.appendChild(o);
    }
    if (hasMore)
    {
        s.appendChild(createOption("more",autopagerUtils.autopagerGetString("more")));
    }
    s.appendChild(createOption("_ignore2","------"));
    var host = doc.location.host;
    s.appendChild(createOption("disable-site",autopagerUtils.autopagerFormatString("disableon",[host])));
    s.appendChild(createOption("disable",autopagerUtils.autopagerGetString("disableeverywhere")));
    
    var a = doc.createElement("a");
    a.setAttribute("href","javascript:void(0)");
    a.setAttribute("id","ap_search_option_e_" + index)
    a.textContent =  autopagerUtils.autopagerGetString("Edit")
    a.addEventListener("click",function(){
        s.setAttribute("style","display:block")
        a.setAttribute("style","display:none")
    },false);

    s.addEventListener("change",function(){
        var v= s.value;
        if (v.indexOf("_ignore")==0)
        {
            //ignore
            return;
        }
        if (v == "more")
        {
            var more = getByValue(s,"more");
            if (more)
            {
                for(var k in options.searchs)
                {
                    var se = options.searchs[k]
                    if (!se.r && k!=options.searchEngine)
                    {
                        var o = createOption(k,se.l,se.i,s,k==options.searchEngine)
                        more.parentNode.insertBefore(o,more);
                    }
                }
                more.parentNode.removeChild(more)
            }
            return;
        }
        autopagerPref.saveBoolPref("related-search-prompted",true)
        if(v == "disable")
        {
            autopagerPref.saveBoolPref("related-search-enabled",false)
            Me.removeRelatedTable(doc);
        }else if(v == "disable-site")
        {
            autopagerPref.saveBoolPref("host." + host + ".related-search-enabled",false)
            Me.removeRelatedTable(doc);
        }else{
            autopagerPref.saveBoolPref("related-search-enabled",true);
            autopagerPref.resetPref("host." + host + ".related-search-enabled")
            autopagerPref.savePref("related-search-engine",v);
            Me.urlTemplate=null
            Me.asyncRelatedSearch(doc,index,div);
        }
        a.setAttribute("style","display:block")
    },false);
    s.setAttribute("id","ap_search_option_s_" + index)
    
    d.appendChild(s);
    d.appendChild(a);
     
    if (typeof display != "undefined")
    {
        d.setAttribute("style","display:" + display)
    }
    if (typeof options.searchEngine != "undefined" && options.searchEngine!="" && options.searchEngine!=null)
    {
        s.setAttribute("style","display:none")
    }
    else
    {
        a.setAttribute("style","display:none")
    }
    return d;
}
AutoPagring.prototype.createRelatedSearchTable= function (doc,options,index,div,display)
{
    var old = doc.getElementById("ap_search_option_" + index)
    if (old)
    {
        old.parentNode.removeChild(old)
    }
    var h2 = doc.createElement("h2");
    h2.textContent =  autopagerUtils.autopagerGetString("RelatedSearches");//"related searches:";

    var tr = doc.createElement("tr");
    var td = doc.createElement("td");
    tr.appendChild(td);
    td.appendChild(h2);
    td = doc.createElement("td");
    tr.appendChild(td);
    var s= this.createRelatedSearchOptions(doc,options,index,div,display)
    td.appendChild(s);
    var table = doc.createElement("table");
    table.appendChild(tr);
    if (typeof display != "undefined")
    {
        table.setAttribute("style","display:" + display)
    }
    return table;
}
AutoPagring.prototype.createRelatedSearchPrompt= function (doc,options,index,div)
{
    var container = doc.createElement("div");
    container.setAttribute("class","AutoPager_Related");
    container.setAttribute("id","ap_related_" + index);
    var sops = this.createRelatedSearchTable (doc,options,index,div)

    container.appendChild(sops);
    return container;
}
AutoPagring.prototype.removeRelatedTable = function (doc)
{
     this.relatedSearchOptions = null
     var nodes = autopagerXPath.evaluate(doc,"//div[@class='AutoPager_Related']",true);
     for(var i=0;i<nodes.length;i++)
     {
         var n = nodes[i];
         n.parentNode.removeChild(n)
     }
}
AutoPagring.prototype.createRelatedTable = function (doc,options,div,search,related,index,urlTemplate)
{
    if (!related || related.length==0)
        return;
    var container = doc.createElement("div");
    
    container.setAttribute("class","AutoPager_Related");
    container.setAttribute("id","ap_related_" + index);
    if (!related || related.length==0)
        return container;

    var Me = this
    var h2 = doc.createElement("h2");
    h2.textContent = search + " related searches:";
    
    var tr1 = doc.createElement("tr");
    var td1 = doc.createElement("td");
    tr1.appendChild(td1);
    td1.appendChild(h2);
    td1 = doc.createElement("td");
    tr1.appendChild(td1);
    container.appendChild(tr1);
    container.addEventListener("mouseover",function(e){
        var op = doc.getElementById("ap_search_option_" + index)
        if (op)
            op.style.setProperty("display", "block", null);
        else{
            var s = Me.createRelatedSearchOptions(doc,options,index,div)
            td1.appendChild(s)
        }

    },false)
    container.addEventListener("mouseout",function(e){
        if (e.target.tagName == "SELECT")
            return;
        var op = doc.getElementById("ap_search_option_" + index)
        if (op)
            op.style.setProperty("display", "none", null)
    },false);

    var cols = 4;//this.getCols (related);
    var rows = Math.ceil(related.length/cols)
    
    var t = doc.createElement("table");
    for(var r=0;r<rows;r++)
    {
        var tr = doc.createElement("tr");
        for(var c=0;c<cols;c++)
        {
            var td =doc.createElement("td");
            td.style.setProperty("padding-right","18px",null);
            var pos = r*cols + c
            if (pos<related.length)
            {
                var v = related[r*cols + c];
                var a = doc.createElement("a");
                a.innerHTML = v.replace(search, "<b>" + search + "</b>");
                a.setAttribute("href",urlTemplate.replace("{num}",pos).replace("{query}",encodeURIComponent(v)));
                a.setAttribute("target","_blank");
                td.appendChild(a);
            }
            tr.appendChild(td);
        }
        t.appendChild(tr)
    }
    container.appendChild(t);
    return container;
}

AutoPagring.prototype.scrollWindow = function(container,doc) {
    try{
//        autopagerBwUtil.consoleLog("start scrollWindow:") 
        this.doScrollWindow(container,doc)
//        autopagerBwUtil.consoleLog("end scrollWindow:") 
    }catch(e)
    {
//        autopagerBwUtil.consoleLog("Error scrollWindow:" +e ) 
    }
}
AutoPagring.prototype.doScrollWindow = function(container,doc) {
    if (typeof doc == "undefined" || doc == null ||
        typeof doc.documentElement == "undefined" ||
            (doc.documentElement.getAttribute("autopageCurrentPageLoaded") != null
        && doc.documentElement.getAttribute("autopageCurrentPageLoaded") == "true"))
        return false;
    doc.documentElement.setAttribute("autopageCurrentPageLoaded","true");
    
    var de = container.documentElement;

    try{
//        autopagerBwUtil.consoleLog("scrollWindow 1")
        if (autopagerMain.autopagerDebug)
            autopagerMain.logInfo("autopagerMain.scrollWindow","autopagerMain.scrollWindow");
        //validate the url first
        var site = this.site;
        var reg = autopagerUtils.getRegExp (site)
        var url = autopagerMain.getDocURL(doc,this.inSplitWindow);
        if (!autopagerUtils.isSameDomain(container,url))
        {
            this.onNotSameDomainError(container,url);
            return;
        }
        if (!this.inSplitWindow || reg.test(url))
        {
//        autopagerBwUtil.consoleLog("scrollWindow 2")

        var nextUrl=this.autopagernextUrl;
        var xpath = this.site.contentXPath;

        var nodes = autopagerMain.findNodeInDoc(doc,xpath,this.enableJS||this.inSplitWindow);
//        autopagerBwUtil.consoleLog("scrollWindow 3")

//        autopagerMain.logInfo(nodes.length + " at "+  autopagerUtils.getUrl(doc)
//                ,nodes.length + " at "+  autopagerUtils.getUrl(doc));

        if (nodes.length >0)
        {
//        autopagerBwUtil.consoleLog("scrollWindow 4")

            if (autopagerMain.autopagerDebug)
                autopagerMain.logInfo(nodes.toString(),nodes.toString());


			var scrollContainer = null;
			if (this.site.containerXPath)
			{
					var autopagerContainer = autopagerMain.findNodeInDoc(
							de,this.site.containerXPath,false);
					if (autopagerContainer!=null)
					{
							scrollContainer = autopagerContainer[0];
//                            scrollContainer.removeEventListener("scroll",autopagerMain.scrollWatcher,true);
//							scrollContainer.addEventListener("scroll",autopagerMain.scrollWatcher,true);
//					//scrollContainer.onscroll = autopagerMain.scrollWatcher;
					}
			}
			var scrollDoc =container;
			if (scrollContainer==null)
					scrollContainer = de;
			var sh = (scrollContainer && scrollContainer.scrollHeight)
					? scrollContainer.scrollHeight : scrollDoc.body.scrollHeight;
			if (scrollDoc.body != null && scrollDoc.body.scrollHeight > sh)
			{
					sh = scrollDoc.body.scrollHeight;
			}

            try{
                var href = nextUrl && nextUrl.href
            }catch(ex){
                nextUrl = null;
            }
            if (typeof nextUrl=='undefined' || nextUrl==null)
            {
                var urlNodes = autopagerMain.findLinkInDoc(doc,this.site.linkXPath,this.enableJS||this.inSplitWindow);
                //alert(urlNodes);
                if (urlNodes != null && urlNodes.length >0) {
                      nextUrl = autopagerMain.getNextUrl(container,this.enableJS||this.inSplitWindow,urlNodes[0]);
                }
            }
//        autopagerBwUtil.consoleLog("scrollWindow 5")
            
            var nextPageHref = nextUrl
            if (nextUrl && nextUrl.href
                && ((nextUrl.href.substr(0, 7)=='http://' ) || (nextUrl.href.substr(0, 8)=='https://' )))
            {
                nextPageHref = nextUrl.href
            }else
            if (!(typeof (nextPageHref) == 'string'))
            {
                nextPageHref = autopagerUtils.getUrl(doc);
            }
			this.autopagerPageHeight.push(sh);
            this.autopagerPageUrl.push(nextPageHref);
//        autopagerBwUtil.consoleLog("scrollWindow 6")

            var insertPoint =	this.getAutopagerinsertPoint(container);
//            autopagerBwUtil.consoleLog("scrollWindow 7:" + insertPoint)

            if (insertPoint==null)
            {
                autopagerMain.clearLoadStatus(doc,this)
                return true;
            }
//            autopagerBwUtil.consoleLog("scrollWindow 8")

            var div = this.lastBreakStart;
            if (!div && insertPoint)
            {
                //alert(nodes);
                var divStyle = autopagerPref.loadUTF8Pref("pagebreak");// "clear:both; line-height:20px; background:#E6E6E6; text-align:center;";
                div= autopagerMain.createDiv(container,"",divStyle);
                div.setAttribute("id","apBreakStart" + this.autopagerPage);
                insertPoint.parentNode.insertBefore(div,insertPoint);                
            }
            var innerHTML = "<a target='_blank' href='http://autopager.teesoft.info/help.html'>" + autopagerUtils.autopagerGetString("pagebreak2") + "</a>&nbsp;&nbsp;" +
                            autopagerUtils.autopagerFormatString("pagelink",[nextPageHref,"&nbsp;&nbsp;&nbsp;" + (++this.autopagerPage) + "&nbsp;&nbsp;&nbsp;"])
                            + autopagerMain.getNavLinks(this.autopagerPage,sh,this);
            try{
                div.innerHTML = "<span>" +  innerHTML+ "</span>";
            }catch(e){
                div.innerHTML="<a href='http://autopager.teesoft.info/help.html'>Page break by AutoPager.</a>"
                    + autopagerUtils.autopagerFormatString("pagelink",[nextPageHref.replace(/\&/g,"&amp;"),"   " + (this.autopagerPage) + "   "])
                    ;
            }
            
            var Me = this
            div.addEventListener("click",function(e) {
                Me.onBreakClick(e);
            },true);
            //load preload xpaths, like //style for make WOT works
            
            var preXPath=autopagerMain.getPreloadXPaths();
            
            if (preXPath.length>0)
             {
                var preloadNodes = autopagerMain.findNodeInDoc(doc,preXPath,this.enableJS||this.inSplitWindow);
                for(var i=0;i<preloadNodes.length;++i) {
                    try{
                        var newNode = preloadNodes[i];
                        newNode = container.importNode (newNode,true);
                        newNode = insertPoint.parentNode.insertBefore(newNode,insertPoint);

                    }catch(e) {
                        autopagerMain.alertErr(e);
                    }
                }
             }

//             autopagerBwUtil.consoleLog("scrollWindow 9")
            for(var i=0;i<nodes.length;++i) {
                try{
                    var newNode = nodes[i];

                    //this will be fire on the hidden loaded doc
                    var event = container.createEvent("Events");
                    event.initEvent("AutoPagerBeforeInsert", true, true);
                    try{
                        newNode.dispatchEvent(event)
                    }catch(e)
                    {}
//                    autopagerBwUtil.consoleLog("scrollWindow 10")
                    try{
                        newNode = container.importNode (newNode,true);
                    }catch(e)
                    {
                        //manually import node, importNode may failed with "INVALID_CHARACTER_ERR: DOM Exception 5"
                        //for some case
                        newNode = autopagerUtils.importNode(container,newNode,true);
                    }
//                    autopagerBwUtil.consoleLog("scrollWindow 11")
                    autopagerMain.removeElements(newNode,this.site.removeXPath,this.enableJS||this.inSplitWindow,true)
//                    autopagerBwUtil.consoleLog("scrollWindow 12")

                    newNode = insertPoint.parentNode.insertBefore(newNode,insertPoint);
//                    autopagerBwUtil.consoleLog("scrollWindow 13")
                    this.postAfterInsert(newNode);
                    //this will be fire on the displayed doc
                    event = container.createEvent("Events");
                    event.initEvent("AutoPagerAfterInsert", true, true);
                    try{
                        newNode.dispatchEvent(event)
                    }catch(e)
                    {}
//                    autopagerBwUtil.consoleLog("scrollWindow 14")
                }catch(e) {
                    autopagerBwUtil.consoleError(e)
                }
            }
            div = autopagerMain.createDiv(container,"apBreakEnd" + this.autopagerPage,"display:none;");
            //div.setAttribute("id","apBreakEnd" + this.autopagerPage);
            insertPoint.parentNode.insertBefore(div,insertPoint);
            //alert(nodes.length);
            var urlNodes = autopagerMain.findLinkInDoc(doc,this.site.linkXPath,this.enableJS||this.inSplitWindow);
            //alert(urlNodes);
            if (urlNodes != null && urlNodes.length >0) {
                nextUrl = autopagerMain.getNextUrl(container,this.enableJS||this.inSplitWindow,urlNodes[0]);
            }else
            {
                nextUrl = null;
                //TODO
                if (this.tmpScrollWatcher)
                    container.removeEventListener("scroll",this.tmpScrollWatcher,false);
                if (scrollContainer != de)
                {
                    scrollContainer.removeEventListener("scroll",this.tmpScrollWatcher,false);
//                     if (container.defaultView && container.defaultView.top &&
//                       container.defaultView.top != container.defaultView)
//                       container.defaultView.top.document.removeEventListener("scroll",autopagerMain.scrollWatcher,false);
               }

            }
//            autopagerBwUtil.consoleLog("scrollWindow 17")
            this.autopagernextUrl = nextUrl;
//            de.setAttribute("autopagernextUrlObj",nextUrl)
 
               if (this.tweakingSession && container.defaultView && container.defaultView.top == container.defaultView)
               {
    //               if (this.autopagerPreviousURL && this.autopagerPreviousURL != autopagerUtils.getUrl(doc))
    //                {
    //                    autopagerMain.changeSessionUrl(container, this.autopagerPreviousURL,this.autopagerPage);
    //                }
                    this.autopagerPreviousURL = autopagerUtils.getUrl(doc)
               }
//               autopagerBwUtil.consoleLog("scrollWindow 18")
               return true;
           }
        }

    }catch(e) {
        autopagerMain.alertErr(e);
    }

   if (doc.defaultView!=null && doc.defaultView.frames != null) {
        for(var i=0;i<doc.defaultView.frames.length;++i) {
            this.scrollWindow(container,doc.defaultView.frames[i].document);
        }
    }
    return true;
}
  AutoPagring.prototype.onSplitDocLoaded = function(doc,safe) {
    var furtherscrollWatcher = true;
    var paging = this
        var browser = AutoPagerNS.apSplitbrowse.getBrowserNode(doc);
        if (browser && browser.getAttribute(AutoPagerNS.apSplitbrowse.getSplitKey())) {
            //if (browser.auotpagerContentDoc)
            {
                var container = browser.auotpagerContentDoc;
                var de = container.documentElement.QueryInterface(Components.interfaces.nsIDOMElement);
                var reg = autopagerUtils.getRegExp (this.site)
                var url = autopagerMain.getDocURL(doc,this.inSplitWindow);
                if (container.defaultView == container.defaultView.top && !reg.test(url) )
                    return;
                else if (!reg.test(url))
                    doc = autopagerMain.searchForMatchedFrame(doc,reg,this.inSplitWindow);
                if (doc==null)
                    return;
                if (browser.autopagerSplitWinFirstDocSubmited) {
                    if(!browser.autopagerSplitWinFirstDocloaded) {
                        //                        if (doc.defaultView != doc.defaultView.top)
                        //                               return;
                        var nextUrl = null;

                        if (paging.site.ajax || (container.documentElement.getAttribute('autopagerAjax') == "true"))
                            autopagerMain.Copy(container,doc);
                        //var doc = browser.webNavigation.document;
                        if (paging.site.fixOverflow || (container.documentElement.getAttribute('fixOverflow') == 'true'))
                            autopagerMain.fixOverflow(doc);

                        nextUrl = this.getNextUrlIncludeFrames(container,doc);
                        if (nextUrl==null && (!this.site.ajax))
                        {
                            //ajax site, not load yet,wait a while
                            AutoPagerNS.window.setTimeout(function(){
                                nextUrl = paging.getNextUrlIncludeFrames(container,doc);
                                paging.autopagernextUrl = nextUrl;
//                                container.documentElement.setAttribute("autopagernextUrlObj",nextUrl)
                                browser.autopagerSplitWinFirstDocloaded = true;
                                paging.autopagerSplitDocInited = true;
                                paging.autopagerEnabledSite = true;
                            },AutoPagerNS.apSplitbrowse.getDelayMiliseconds(doc));
                        }else
                        {
                            this.autopagernextUrl = nextUrl;
//                            container.documentElement.setAttribute("autopagernextUrlObj",nextUrl)
                            browser.autopagerSplitWinFirstDocloaded = true;
                            this.autopagerSplitDocInited = true;
                            this.autopagerEnabledSite = true;
                        }
                    }
                    else {
                        if (!this.site.ajax)
                        {
                            //TODO
                            if (paging.site.delaymsecs && paging.site.delaymsecs>0)
                                AutoPagerNS.window.setTimeout(function(event){
                                    paging.scrollFunc(browser,doc);
                                    },
                                    paging.site.delaymsecs);
                            else
                                furtherscrollWatcher = paging.scrollFunc(browser,doc);

                        }
                    }
                }


                if (furtherscrollWatcher)
                {
                    this.scrollWatcherOnDoc(browser.auotpagerContentDoc);
                }
            }
            return;
        }

}
AutoPagring.prototype.scrollFunc = function(browser,doc){
    var furtherscrollWatcher =this.scrollWindow(browser.auotpagerContentDoc,doc);
    this.onStopPaging(browser.auotpagerContentDoc);
    AutoPagerNS.apSplitbrowse.switchToCollapsed(true);
    return furtherscrollWatcher;
}
AutoPagring.prototype.getNextUrlIncludeFrames = function(container,doc)
{
    var urlNodes = autopagerMain.findLinkInDoc(doc,
            this.site.linkXPath,this.enableJS || this.inSplitWindow);
    //alert(urlNodes);
    var nextUrl = null;
    if (urlNodes != null && urlNodes.length >0) {
        nextUrl = autopagerMain.getNextUrl(container,this.enableJS || this.inSplitWindow,urlNodes[0]);
    }else
    {
        if (doc.defaultView && doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            for(var i=0;i<doc.defaultView.frames.length;++i) {
                nextUrl = this.getNextUrlIncludeFrames(container,doc.defaultView.frames[i].document);
                if ( nextUrl != null)
                    return nextUrl;
            }
        }
     }
    return nextUrl;
}
AutoPagring.prototype.autopagerSimulateClick = function(win,doc,node) {
    var delaymsecs = 0;
    if (this.site.delaymsecs && this.site.delaymsecs>0)
        delaymsecs = this.site.delaymsecs*1;
    if (delaymsecs>0)
    {
        var Me = this;
        AutoPagerNS.window.setTimeout(function(){
            Me.doAutopagerSimulateClick(win,doc,node);
        }, delaymsecs);
    }
    else
    {
        this.doAutopagerSimulateClick(win,doc,node);
    }
}
AutoPagring.prototype.doAutopagerSimulateClick = function(win,doc,node) {
    var urlStr = ""
    if (! (typeof node == 'string'))
    {
        urlStr = autopagerUtils.findUrlInElement(node);
    }
    else
        urlStr = node
    if (urlStr){
        var newUrlStr = this.getSameDomainUrl(doc,urlStr)
        if (!newUrlStr || ! (typeof newUrlStr == 'string'))
        {
            this.onNotSameDomainError(doc,urlStr);
            return;
        }        
    }
        
    this.shouldMonitorAutoScroll = true;
    this.autoScrolling = false;
    
    //autopagerBwUtil.consoleLog("autopagerSimulateClick")
    var xPower= 0.5;
    var yPower= 0.5;

    if (autopagerPref.loadBoolPref("anti-anti-autopager"))
    {
        xPower = Math.random() * 0.8 + 0.1;
        yPower = Math.random() * 0.8 + 0.1;
    }

    var x = autopagerMain.getOffsetLeft(node) + node.clientWidth * xPower;
    var y = autopagerMain.getOffsetTop(node)+ node.clientHeight * yPower;
    var dim = autopagerMain.myGetWindowDimensions(node.ownerDocument)
    var clientX = x - dim.scrollX
    var clientY = y - dim.scrollY

    var click = node.ownerDocument.createEvent("MouseEvents");
    click.initMouseEvent("click", true, true, win,
                1, x, y, clientX, clientY, false, false, false, false, 0, null);

    var mousedown = node.ownerDocument.createEvent("MouseEvents");
    mousedown.initMouseEvent("mousedown", true, true, win,
                1, x, y, clientX, clientY, false, false, false, false, 0, null);
    var mouseup = node.ownerDocument.createEvent("MouseEvents");
    mouseup.initMouseEvent("mouseup", true, true, win,
                1, x, y, clientX, clientY, false, false, false, false, 0, null);

    //handle ajax site
    var listener=null;
    if (this.site.ajax)
    {
        //observe http conections
        listener = this.observeConnection(node.ownerDocument);
    }
    AutoPagerNS.apSplitbrowse.switchToCollapsed(false);
    var focused = (document && document.commandDispatcher && document.commandDispatcher.focusedElement)?  document.commandDispatcher.focusedElement : null;
    

    AutoPagerNS.apSplitbrowse.switchToCollapsed(true);

    var canceled = false;
    var needMouseDownEvents =  autopagerPref.loadBoolPref("simulateMouseDown") || this.site.ajax || this.site.needMouseDown;
    if (needMouseDownEvents)
    {
        AutoPagerNS.apSplitbrowse.switchToCollapsed(false);
        canceled = !node.dispatchEvent(mousedown);
        AutoPagerNS.apSplitbrowse.switchToCollapsed(true);
    }
    canceled = !node.dispatchEvent(click);
    //if the mouse is currently down then the click event may be canceled,
    //let's try it again with simulating mouse down ,click and up
    if (canceled && !needMouseDownEvents)
    {
        node.dispatchEvent(mousedown);
        //renew the click event
        click = node.ownerDocument.createEvent("MouseEvents");
        click.initMouseEvent("click", true, true, win,
                1, x, y, clientX, clientY, false, false, false, false, 0, null);
        node.dispatchEvent(click);
        node.dispatchEvent(mouseup);
    }
    if (needMouseDownEvents)
        canceled = !node.dispatchEvent(mouseup);
    
    if (focused && focused.focus && focused != document.commandDispatcher.focusedElement
        && focused.ownerDocument && focused.ownerDocument.getBoxObjectFor)
    {
        var box = focused.ownerDocument.getBoxObjectFor(focused);
        var de=focused.ownerDocument.documentElement;
        if ((box.screenX + box.width>0 && box.screenY + box.height>0)
            && ((de instanceof HTMLHtmlElement && (box.x - de.scrollLeft < de.scrollWidth && box.y - de.scrollTop < de.scrollHeight)
                )
                || (!(de instanceof HTMLHtmlElement) && (box.x < de.width && box.y < de.height)))
            )
            focused.focus();
    }else if (needMouseDownEvents && doc.documentElement && typeof doc.documentElement.focus=="function")
            doc.documentElement.focus(); //reset the default focus to the document itself to avoid steal focus when simulate mouse down

//    var canceled =false;
//    node.doCommand();
    if (this.site.ajax)
    {
        //observe http conections
        if (listener!=null)
        {
            var delaymsecs = 0;
            if (this.site.delaymsecs && this.site.delaymsecs>0)
                delaymsecs = this.site.delaymsecs*1; //convert to integer
            AutoPagerNS.window.setTimeout(function(){listener.stopObserveConnection()},1000 + delaymsecs);
            //clear after teen seconds whethere success or not
            AutoPagerNS.window.setTimeout(function(){listener.removeObserveConnection()},10000 + delaymsecs);
        }
    }

    AutoPagerNS.apSplitbrowse.switchToCollapsed(false);

//    if(canceled) {
//        // A handler called preventDefault
//        //alert("canceled");
//    } else {
//        // None of the handlers called preventDefault
//        //alert("not canceled");
//    }
    this.shouldMonitorAutoScroll = false;
    if (this.autoScrolling)
    {
        if (this.wheelEvent && this.wheelEvent.originalTarget)
            this.wheelEvent.originalTarget.dispatchEvent(this.wheelEvent);
    }
}

AutoPagring.prototype.onDocUnLoad = function(doc) {
    if(!doc || !doc.location || !doc.location.href || doc.location.href.match(/about:.*/))
        return
//        autopagerBwUtil.consoleLog("onDocUnLoad:" + doc.location.href) 
        if (this.tmpScrollWatcher)
        {
            doc.removeEventListener("scroll",this.tmpScrollWatcher,false);
            this.tmpScrollWatcher = null;
        }
        if (this.tmpTweakingSessionMonitor)
        {
            doc.removeEventListener("scroll",this.tmpTweakingSessionMonitor,false);
            doc.removeEventListener("click",this.tmpTweakingSessionMonitor,false);
            this.tmpTweakingSessionMonitor = null;
        }
        if (this.tmpPageUnLoad)
        {
            if (!autopagerBwUtil.supportHiddenBrowser())
                AutoPagerNS.browser.removeEventListener("beforeunload",this.tmpPageUnLoad,true);
            else if(doc.defaultView)
                doc.defaultView.removeEventListener("beforeunload",this.tmpPageUnLoad,true);
            this.tmpPageUnLoad = null;
        }
        if (this.autoScrollingMonitor)
        {
            AutoPagerNS.browser.removeEventListener("popuphidden", this.autoScrollingMonitor, true);
        }
        if (this.wheelClickMonitor)
        {
            AutoPagerNS.browser.removeEventListener("mousedown", this.wheelClickMonitor, true);
            this.wheelEvent = null;
        }
        if (this.keyupMonitor)
        {
            doc.removeEventListener("keyup", this.keyupMonitor, false);
            this.keyupMonitor = null;
        }

        if (this.intervalId)
            AutoPagerNS.window.clearInterval(this.intervalId)
        autopagerMain.cleanMonitorForCleanPages(doc,this);
        this.changeMonitor = null;
        this.domMonitor = null;
        this.domRemovedMonitor = null;
        this.autopagernextUrl = null
        this.autopagerinsertPoint = null
    this.autopagerPage = 0;
    this.autopagerContentHandled = false;
    this.autoPagerRunning=false;
    this.autopagernextUrl=null
//    doc.documentElement.setAttribute("autopagernextUrlObj",null)
    this.autopagerinsertPoint=null
    this.autopagerSplitCreated=false
    this.autopagerSplitDocInited=false
    this.autopagerPagingCount=0
    this.forceLoadPage=0
}
AutoPagring.prototype.onPageUnLoad = function(event) {
    if (event && event.originalTarget && autopagerUtils.isHTMLDocument(event.originalTarget))
    {
        this.onDocUnLoad(event.originalTarget)
    }else if (event && event.target && autopagerUtils.isHTMLDocument(event.target))
    {
        this.onDocUnLoad(event.target)
    }

}

AutoPagring.prototype.observeConnection = function (doc)
{
    var listener = this.getListener(doc,this);
    // get the observer service and register for the two coookie topics.
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                    .getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(listener, "http-on-modify-request", false);
    //observerService.addObserver(listener, "http-on-examine-response", false);
    return listener;
}

AutoPagring.prototype.getListener = function (doc,paging)
{

 function listener(doc,paging) {
    this.connectionCount = 0;
    this.maxCount = 0;
    this.stopped = false;
    this.doc = doc;
    this.removed=false;
    this.requests = new Array();
    this.paging = paging;
    this.observe = function(aSubject, aTopic, aData) {


         var httpChannel = aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
         if (httpChannel.notificationCallbacks instanceof XMLHttpRequest &&  httpChannel.referrer && ( httpChannel.referrer.spec  == autopagerMain.getURLNoArch(this.autopagerUtils.getUrl(doc))))
        {
            if (aTopic == "http-on-modify-request") {
                var stack = autopagerMain.getStack();
                var lines = stack.split("\n");
                //make sure it's triggered by the simulate click'
                if (lines[lines.length-3].indexOf("MouseEvent")>0 && lines[lines.length-3].indexOf("onclick")>=0)
                {
                    this.connectionCount ++;
                    this.maxCount ++;

                    try{
                    var xmlhttp = httpChannel.notificationCallbacks
                    var oldonreadystatechange = xmlhttp.onreadystatechange;
                    var listener = this

                    xmlhttp.onreadystatechange = function (aEvt) {
//                        try{
                            oldonreadystatechange.handleEvent(aEvt);
//                        }catch(e)
//                        {
//                            autopagerBwUtil.consoleError(e)
//                        }
//
                        if(xmlhttp.readyState == 4) {
                            //if(xmlhttp.status == 200)
                            {
                                //if (this.requests.indexOf(httpChannel)!=-1)
                                {
                                    //autopagerUtils.removeFromArray( this.requests,httpChannel)
                                    listener.connectionCount --;
                                    if (listener.connectionCount<=0)
                                    {
                                        if (listener.stopped)
                                        {
                                            AutoPagerNS.window.setTimeout(function(){listener.stopObserveConnection()},100)
                                            //listener.stopObserveConnection();
                                            //listener.removeObserveConnection();
                                        }
                                        autopagerMain.alertErr("All Connection finished, max count:" + listener.maxCount);
                                    }
                                }
                            }
                        }
                    }
                }catch(e)
                {
                    var ms = e.message
                    var s = e.stack
                }
                }
            }
    }
  };

  this.QueryInterface = function(aIID) {
    if (aIID.equals(Components.interfaces.nsISupports) ||
        aIID.equals(Components.interfaces.nsIObserver))
      return this;
    throw Components.results.NS_NOINTERFACE;
  }
  this.stopObserveConnection = function()
{
    this.stopped = true;

    if (this.connectionCount<=0)
    {
        if (this.maxCount<=1)
            {
                var listener = this
                this.maxCount++;
                AutoPagerNS.window.setTimeout(function(){listener.stopObserveConnection()},500)
            }
        else
            this.removeObserveConnection();
    }

    //autopagerMain.alertErr("Observer stopped, max count:" + this.maxCount + " current connection " + this.connectionCount);
}
,this.removeObserveConnection = function ()
{
    if (!this.removed)
    {
        this.removed = true;
    // get the observer service and register for the two coookie topics.
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                    .getService(Components.interfaces.nsIObserverService);
    this.stopped = true;
    if (this.connectionCount==0)
    {
        observerService.removeObserver(this, "http-on-modify-request", false);
        //observerService.removeObserver(this, "http-on-examine-response", false);
        if (this.paging)
            this.paging.onSplitDocLoadedWithDelay(this.doc,100);
    }
    }

}
}
return new listener(doc,paging);
}

AutoPagring.prototype.onSplitDocLoadedWithDelay = function(doc,timeout)
{
    var paging = this
    AutoPagerNS.window.setTimeout(function () {
    var browser = AutoPagerNS.apSplitbrowse.getBrowserNode(doc);
    //browser.autopagerSplitWinFirstDocloaded=true;
    doc.documentElement.setAttribute("autopageCurrentPageLoaded",false);
    try{
        paging.scrollWindow(browser.auotpagerContentDoc,doc);
        paging.onStopPaging(browser.auotpagerContentDoc);
        AutoPagerNS.apSplitbrowse.switchToCollapsed(true);
    }catch(e)
    {
        //var de = doc.documentElement
                paging.autopagerSplitCreated = false;
                paging.autopagerSplitCreated = false;
                paging.autopagerSplitDocInited = false;
                var topDoc = AutoPagerNS.getContentDocument();

                    this.autopagerPagingCount = 0
                AutoPagerNS.window.setTimeout(function(){
                    topDoc =AutoPagerNS.getContentDocument();
                    var de = topDoc.documentElement;
                    doc = topDoc
                    paging.autopagerRunning = false;
                    autopagerMain.onInitDoc(doc,false);
                    paging.autopagerSplitCreated = false;
                    paging.autopagerSplitDocInited = false;

                },100);

    return;
       }
    //autopagerMain.onSplitDocLoaded (doc,true);
    },timeout);
}
AutoPagring.prototype.getAutopagerinsertPoint = function(doc)
{
//    if (this.autopagerinsertPoint==null)
//    {
//        var oldNodes = autopagerMain.findNodeInDoc(doc,this.site.contentXPath,this.enableJS);
//        var insertPoint
//        if (oldNodes!= null && oldNodes.length >0)
//            insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
//        if(insertPoint == null)
//        {
//            if (oldNodes!= null && oldNodes.length >0)
//            {
//                var br = autopagerMain.createDiv(doc,"","display:none;");
//                oldNodes[oldNodes.length - 1].parentNode.appendChild(br);
//                insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
//            }else
//                insertPoint = autopagerMain.getLastDiv(doc);
//        }
//        var div = autopagerMain.createDiv(doc,"apBreakEnd","display:none;");
//        //div.setAttribute("id","apBreakEnd" + this.autopagerPage);
//        insertPoint = insertPoint.parentNode.insertBefore(div,insertPoint);
//        this.autopagerinsertPoint = insertPoint
//    }
    return this.autopagerinsertPoint;
}
AutoPagring.prototype.getChangeMonitor = function()
{
    var paging = this;
    if (!paging.changeMonitor)
    {
        paging.changeMonitor =  function _changeMonitor(evt){
            if (evt && evt.target && evt.target.ownerDocument)
                autopagerMain.doClearLoadedPages(evt.target.ownerDocument,true,paging,false)
        }
    }
    return paging.changeMonitor;
}
AutoPagring.prototype.getDOMNodeMonitor = function()
{
    var paging = this;
    if (!paging.domMonitor)
    {
        paging.domMonitor =  function _domMonitor(evt){
            if (evt && evt.target && evt.target.ownerDocument)
            {
//                if (paging.clearnedTime && new Date().getTime() - paging.clearnedTime< 1000)
//                    return;
//                paging.clearnedTime = null;
                var n = evt.target;
                
                if (!n || !n.getAttribute || n.getAttribute("class")=='autoPagerS')
                    return;
                var nodes = autopagerMain.findLinkInDoc(evt.target,paging.site.linkXPath,paging.enableJS);
                var contained = true;
                for(var i=0;i<nodes.length;i++)
                {
                    if (!autopagerUtils.containsNode(n,nodes[i]))
                    {
                        contained = false;
                        break;
                    }
                }
//                var cleared = false;
                if (contained && nodes.length>0)
                {
                    nodes = autopagerMain.findNodeInDoc(evt.target,paging.site.contentXPath,paging.enableJS);
                    if (nodes.length>0)
                    {
                        autopagerMain.doClearLoadedPages(evt.target.ownerDocument,true,paging,false);
//                        cleared = true;
//                        paging.clearnedTime = new Date().getTime()
                    }
                }
                //autopagerUtils.containsNode(n,a)
//                autopagerBwUtil.consoleLog(evt.type + ":" +  p.tagName + ":" + p.id  + ":" + p.getAttribute('class')
//                    + " -- " + n.tagName + ":" + n.id + ":" + n.getAttribute('class') + "::" + nodes.length + ": " + cleared)
            }
//            if (evt && evt.target && evt.target.ownerDocument)
//                autopagerMain.doClearLoadedPages(evt.target.ownerDocument,true)
        }
    }
    return paging.domMonitor;
}
AutoPagring.prototype.getDOMNodeRemovedMonitor = function()
{
    var paging = this;
    if (!paging.domRemovedMonitor)
    {
        paging.domRemovedMonitor =  function _domRemovedMonitor(evt){
            if (evt && evt.target && evt.target.ownerDocument)
            {
                AutoPagerNS.window.setTimeout(function(){
                        autopagerMain.doClearLoadedPages(evt.target.ownerDocument,true,paging);
                        },1000);
            }
        }
    }
    return paging.domRemovedMonitor;
}

AutoPagring.prototype.isLazyLoadImage = function()
{
    return this.apLazySrcUsed || (this.site.quickLoad & 2) ==2;
}

AutoPagring.prototype.getSiteLazyLoadAttr = function()
{
    return this.site.lazyImgSrc;
}

AutoPagring.prototype.postAfterInsert = function(node)
{
    if (this.isLazyLoadImage())
    {
        var nodes = autopagerXPath.evaluate(node,".//*[@ap-lazy-src]",false);
            for(var k=0;k<nodes.length;++k) {
                nodes[k].setAttribute("src", nodes[k].getAttribute("ap-lazy-src"));
                if (nodes[k].getAttribute("disabled")=="disabled-by-ap"){
                    nodes[k].removeAttribute("disabled");
                }
            }
    }
    this.handleLazyImages(node);    
}
AutoPagring.prototype.handleLazyImages = function(node)
{
    var lazyImgSrc = this.getSiteLazyLoadAttr();
    
    if (!autopagerUtils.isBlank(lazyImgSrc))
    {
        if (lazyImgSrc.indexOf("|")==-1)
            this.loadLazyImages(node,lazyImgSrc);
        else
        {
            var srcs = lazyImgSrc.split("|")
            for(var s=0;s<srcs.length;s++)
            {
                this.loadLazyImages(node,srcs[s]);
            }
        }
    }
}
AutoPagring.prototype.loadLazyImages = function(node,lazyImgSrc)
{

    if (autopagerUtils.isBlank(lazyImgSrc))
        return;

    var images = autopagerXPath.evaluate(node,".//*[@" + lazyImgSrc + "]",false);
    for(var i=0;i<images.length;++i) {
        var imgSrc = images[i].getAttribute(lazyImgSrc);
        if (!imgSrc || imgSrc==images[i].getAttribute("src"))
        {
            continue;
        }
        images[i].setAttribute("src", imgSrc);       
        images[i].removeAttribute(lazyImgSrc);
        //http://member.teesoft.info/phpbb/viewtopic.php?p=10797#10797
        images[i].style.visibility = 'visible';
        //http://member.teesoft.info/phpbb/viewtopic.php?p=14249
        if(!this.isImageNode(images[i])){
            var alreadyLoaded = autopagerXPath.evaluate(images[i],".//img[@src='" + imgSrc + "']",false);
            if (!alreadyLoaded || alreadyLoaded.length==0)
            {
                var img = images[i].ownerDocument.createElement("img");
                img.setAttribute("src", imgSrc);
                images[i].appendChild(img);                
            }
        }
    }
}
AutoPagring.prototype.isImageNode = function(node)
{
    return node && node.tagName && node.tagName.toLowerCase()=='img';
}
AutoPagring.prototype.onBreakClick = function(e)
{
    var Me = this
    var returnValue = true;
    function handler(node)
    {
        if (node && node.name == "xxAutoPagerimmedialate-load")
        {
            //http://member.teesoft.info/phpbb/viewtopic.php?f=5&t=3596
            var pages = 3
            var nodes = autopagerXPath.evaluate(node,"./following-sibling::input[@type='inputbox' and @name='xxAutoPagerimmedialate-load-count']",false);
            if (nodes && nodes.length>0)
            {
                pages = nodes[0].value
            }
            if (autopagerPref.loadPref("immedialate-load-count")!=pages)
                autopagerPref.savePref("immedialate-load-count",pages)
            Me.loadPages(node.ownerDocument,pages)
        }else if (node && node.name == "xxAlertTest")
        {
            AutoPagerNS.browser.open_alert("Test title","test message","http://www.teesoft.info",function(){
                var callback= function(button){
                    AutoPagerNS.window.alert(button.label)
                }
                    autopagerUtils.notification("autopager-new-rule","notification message",
                        [
                        {
                            label: "Button1",
                            accessKey: "accessKey1",
                            callback: callback
                        },
                        {
                            label: "Button2",
                            accessKey: "accessKey2",
                            callback: callback
                        },
                        {
                            label: "Button3",
                            accessKey: "accessKey3",
                            callback: callback
                        }
                        ]
                        );
                //alert("alert test done")
            })
        }else if (node && node.name == "xxAutoPagerRate")
        {
            AutoPagerNS.add_tab({url:autopagerPref.loadPref("repository-site") + "view?id=" + (typeof Me.site.id!="undefined"?Me.site.id:Me.site.guid) + "&s=review"})
        }
        else if (node && node.tagName == "A" && node.textContent.match(/\xA0\xA0\xA0[0-9]+\xA0\xA0\xA0/))
        {
            //prevent the next page link in page break being handling by web site.
            if (e.preventDefault)
                e.preventDefault();
            if (e.preventBubble)
                e.preventBubble();
            if (e.stopPropagation)
                e.stopPropagation();
            returnValue = false;
            node.ownerDocument.location.href = node.href;
            return true;
        }
        else
            return false;
        return true;
    }
    var node = e.target
    while(node && !handler(node))
    {
        node = node.parentNode;
    }
    return returnValue;
}
AutoPagring.prototype.loadPages = function (doc,pages)
{
    this.forceLoadPage = parseInt(pages);
	if (this.autopagerPage!=null && this.autopagerPage!=0)
		this.forceLoadPage += this.autopagerPage;

        autopagerMain.doContentLoad(doc);
	//doc.documentElement.setAttribute("autopagerEnabledSite", true);
    if (typeof this.scrollWatcher != "undefined")
	this.scrollWatcher(doc);
}

AutoPagring.prototype.getMinipages = function ()
{
    var minipages = this.site.minipages;
    if (minipages==-1)
        minipages = autopagerPref.loadPref("minipages");
    return minipages;
}

AutoPagring.prototype.prepareSessionTweaking = function (doc)
{
    var Me = this
    if (this.tweakingSession && doc.defaultView.top == doc.defaultView)
    {
        if (typeof this.tmpTweakingSessionMonitor == "undefined")
        {
            this.tmpTweakingSessionMonitor = function(e)
            {
                return Me.tweakingSessionMonitor(e)
            }
            doc.addEventListener("click", this.tmpTweakingSessionMonitor, false);
            doc.addEventListener("scroll", this.tmpTweakingSessionMonitor, false);
        }
    }
}
AutoPagring.prototype.tweakingSessionMonitor = function (e)
{
    var doc = e.target
    if (!(autopagerUtils.isHTMLDocument(doc)))
    {
        doc =  e.target.ownerDocument;
    }
    doc = doc.defaultView.top.document
    var pos = 0;
    if (e.clientY)
    {
        pos = e.clientY;
        this.changeSessionUrlByScrollHeight(doc,pos);
    }
}
AutoPagring.prototype.changeSessionUrlByScrollHeight = function (container,pos)
{
    if (this.tweakingSession && container.defaultView.top == container.defaultView)
    {
        var a = this.autopagerPageHeight
        if (!a)
            return;
        var st = (container && container.documentElement &&  container.documentElement.scrollTop)
            ? container.documentElement.scrollTop : container.body.scrollTop;
        for(var i=a.length-1;i>=0;i--)
        {
            if ((st + pos)> (a[i] - this.getContentBottomMargin(container)))
            {
                var url = this.autopagerPageUrl[i];
                this.changeSessionUrl(container, url,i);
                return;
            }
        }
        this.changeSessionUrl(container, container.location.href,1);
    }
}
AutoPagring.prototype.changeSessionUrl = function (container, url,pagenum)
{
    if (autopagerBwUtil.changeSessionUrl)
        autopagerBwUtil.changeSessionUrl(container, url,pagenum)
}
AutoPagring.prototype.getPageOldHeight = function (doc)
{
    if (typeof this.pageOldHeight=="undefined")
        this.pageOldHeight = this.getContainerHeight(doc);
    return this.pageOldHeight;
}
    
AutoPagring.prototype.getContentBottomMargin = function (doc)
{
    if (typeof this.contentBottomMargin=="undefined")
    {
        var oldNodes = autopagerMain.findNodeInDoc(doc,this.site.contentXPath,this.enableJS);
        var maxH = 0;
        if (oldNodes && oldNodes.length>0)
        {
            for(var n=0;n<oldNodes.length;n++)
            {
                var node = oldNodes[n];
                var h = autopagerMain.getOffsetTop(node) + node.scrollHeight
                if (h>maxH)
                {
                    maxH = h;
                }
            }
        }
        var sh = (doc && doc.scrollHeight)
                ? doc.scrollHeight : doc.body.scrollHeight;
        var he = sh - maxH;
        this.contentBottomMargin = he>0?he:0;        
    }
    return this.contentBottomMargin;
}

AutoPagring.prototype.getRate = function ()
{
    //return Math.random()*5;
    if (typeof this.site.rate != 'undefined')
        return this.site.rate;
    return 0;
}
AutoPagring.prototype.onErrorStopPaging = function(doc) {
    autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
    var loadgingImg = doc.getElementById("autopagerLoadingImg");
    while (loadgingImg)
    {
        loadgingImg.parentNode.removeChild(loadgingImg);
        loadgingImg = doc.getElementById("autopagerLoadingImg");
    }

    this.autopagerEnabledSite = false

    if (this.site.monitorXPath)
    {
        autopagerMain.monitorForCleanPages(doc,this)
    }
}
AutoPagring.prototype.onNotSameDomainError = function (doc,url)
{
    this.onErrorStopPaging(doc);
    var infoUrl ="http://autopager.teesoft.info/notsamedomain?c=" + escape(doc.location.href) + "&n=" + escape(url);
    var callback = function()
    {
        AutoPagerNS.add_tab({
            url:infoUrl
        });
    }
    AutoPagerNS.browser.open_alert(autopagerUtils.autopagerGetString("errorload"),autopagerUtils.autopagerGetString("needyourattention"),infoUrl
        ,callback)
}
AutoPagring.prototype.getSameDomainUrl = function (doc,url)
{    
    var urlStr = ""
    if (! (typeof url == 'string'))
    {
        urlStr = autopagerUtils.findUrlInElement(url);
    }
    else
        urlStr = url
    if (!autopagerUtils.isSameDomain(doc,urlStr))
    {
        var currentHost = doc.location.host
        if (urlStr.indexOf(currentHost)!=-1)
        {
            var protocol = doc.location.protocol
            urlStr = protocol + "//" + unescape(urlStr.substring(urlStr.indexOf(currentHost)))            
        }else
            urlStr = null;
    }    
    return urlStr;
}

AutoPagring.prototype.isFrameSafe = function (doc)
{ 
    if (typeof this.frameSafe == "undefined")
        this.frameSafe = autopagerUtils.frameSafe(this,doc);
    return this.frameSafe;
}