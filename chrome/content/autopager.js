var autopagerMain = 
{
    autopagerDebug : false,
autopagerOnLoad : function(event) {

//    autopagerBwUtil.consoleLog("autopagerMain.autopagerOnLoad:" +AutoPagerNS + ":" + AutoPagerNS.browser.addEventListener + ":" + AutoPagerNS);
    AutoPagerNS.browser.addEventListener("DOMContentLoaded", autopagerMain.onContentLoad, false);
    AutoPagerNS.browser.addEventListener("load", autopagerMain.onContentLoad, false);
    AutoPagerNS.browser.addEventListener("beforeunload", autopagerMain.onPageUnLoad, true);
    autopagerUtils.addTabSelectListener(autopagerMain.TabSelected,false)
    AutoPagerNS.browser.addEventListener('AutoPagerRefreshPage', this.AutoPagerRefreshPage, true, true);

    AutoPagerNS.browser.addEventListener(
        'dblclick',function(event){
//            autopagerBwUtil.consoleLog("dblclick");
            autopagerMain.onContentLoad(event);
            if (event.clientX + 20 < AutoPagerNS.window.innerWidth &&
                event.clientY + 20 < AutoPagerNS.window.innerHeight &&
                event.clientX > 20 &&
                event.clientY > 20) {
                if (event.ctrlKey == autopagerMain.getCtrlKey() && event.altKey == autopagerMain.getAltKey() && event.shiftKey == autopagerMain.getShiftKey())
                    autopagerUtils.setEnabledOnHost(autopagerUtils.isEnabledOnHost(),event.target.ownerDocument)
            }
        },true
        );
            
    if (event)
    {
        autopagerMain.onContentLoad(event);
    }
//    autopagerBwUtil.consoleLog("autopagerMain.autopagerOnLoad end");
},
AutoPagerRefreshPage : function(evt){
   switch (evt.type)
   {
       case 'AutoPagerRefreshPage':
           var doc = AutoPagerNS.getContentDocument();
           if (doc)
            {
                doc.autoPagerInited = false;
                autopagerMain.clearLoadedPages(doc);
            }
        return;
   }
   
},
TabSelected : function(evt){
    autopagerMain.handleCurrentDoc();
},
onPageUnLoad : function(event) {    
    try
    {
//        autopagerUtils.updateStatusIcons();

        var doc = event.originalTarget;
        if (!autopagerUtils.isHTMLDocument(doc))
            {
                return;
            }
            autopagerMain.doOnPageUnLoad(doc);
    }catch(e){
//        autopagerBwUtil.consoleError(e);
    }
},
doOnPageUnLoad : function(doc) {
    try
    {
        if (doc == null || doc.documentElement==null)
            return;
        if (typeof autopagerUtils.getAutoPagerObject(doc.documentElement) == 'undefined' || autopagerUtils.getAutoPagerObject(doc.documentElement) == null)
            return;
        //handle AutoPaged frames url changes
        if (doc.defaultView != doc.defaultView.top)
               doc = autopagerUtils.getTopDoc(doc);
        try{
            autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
            document.getElementById("autoPagerCreateXPath").setAttribute("checked", false);
        }catch(e){}


    autopagerUtils.setAutoPagerObject(doc.documentElement,null);
    }catch(e){}
},
handleCurrentDoc : function()
{
    var doc = AutoPagerNS.getContentDocument();
    if (doc)
    {
	doc.autoPagerInited = false;
        this.doContentLoad(doc);
        this.loadPages(doc,0)
    }
},
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

   //doc.documentElement.scrollHeight is 0 for some site, don't know why. We should not ignore them.
   if (autopagerUtils.isHTMLDocument(autopagerUtils.getTopDoc(doc)) && autopagerUtils.getTopDoc(doc)!=doc
       && ( (doc.documentElement.scrollWidth > 0 && doc.documentElement.scrollWidth<AutoPagerNS.window.innerWidth/3)
           || (doc.documentElement.scrollHeight>0 && doc.documentElement.scrollHeight<autopagerPref.loadPref("mini-window-height"))))
   {
       //ignore small iframe/frame
       if (autopagerUtils.getTopDoc(doc).documentElement.autopagerContentHandled)
            return false;
   }
   if (doc.location && doc.location.href.substring(0,4)!='http' && doc.location.href.substring(0,4)!='file')
        return false;
   if (doc.defaultView.innerWidth <autopagerPref.loadPref("mini-window-width") || doc.defaultView.innerHeight<autopagerPref.loadPref("mini-window-height"))
          return false;
    return true;

},
getDocForEvent : function (event){
    
    if (event && event.target && autopagerUtils.isHTMLDocument(event.target))
    {
        return event.target;
    }
    var doc = event;
//    autopagerBwUtil.consoleLog("autopagerMain doContentLoad");
    if ((doc == null || (!autopagerUtils.isHTMLDocument(doc))) && (typeof Event !="undefined" && (event instanceof Event)) )
    {
            if (autopagerMain.isValidDoc(event.explicitOriginalTarget))
                doc = event.explicitOriginalTarget;
            else if (autopagerMain.isValidDoc(event.originalTarget))
                doc = event.originalTarget;
            else if (autopagerMain.isValidDoc(event.target))
                doc = event.target;
            else if (autopagerUtils.isHTMLDocument(event.explicitOrigitnalTarget ))
            {
                doc = autopagerUtils.getTopDoc(event.explicitOriginalTarget)
            }
    }
    return doc;
}   
, 
onContentLoad : function(event,force) {
//    autopagerBwUtil.consoleLog("autopagerMain onContentLoad 1 ");
    if (!autopagerPref.loadBoolPref("enabled") && !force)
    {
        autopagerUtils.updateStatusIcons();
        return
    }
    //test only
    //AutoPagerNS.UpdateSites.updateOnline(true)  ;     

    var doc = autopagerMain.getDocForEvent(event);
    AutoPagerNS.window.setTimeout(function(){
        autopagerMain.doContentLoad(doc);
        var firstScroll=function(e){
            AutoPagerNS.browser.removeEventListener("scroll", firstScroll, false);
            //try on first scroll
            //alert(autopagerPref.loadPref("lazyload"))
            AutoPagerNS.window.setTimeout(function(){
                autopagerMain.doContentLoad( autopagerMain.getDocForEvent(e));
            },100);
        }
        AutoPagerNS.browser.addEventListener("scroll",firstScroll,false);
        var firstClick=function(e){
            AutoPagerNS.browser.removeEventListener("click", firstClick, false);
            //try on first scroll
            //alert(autopagerPref.loadPref("lazyload"))
            autopagerMain.doContentLoad(autopagerMain.getDocForEvent(e));
        }
        AutoPagerNS.browser.addEventListener("click",firstClick,false);     
    },parseInt(autopagerPref.loadPref("lazyload")));        
},
doContentLoad : function(doc) {
    
    if (!(autopagerMain.isValidDoc(doc)))
        return false;

//    autopagerBwUtil.consoleLog("autopagerMain doContentLoad 1");

    if (doc.defaultView && doc.defaultView.name=="autoPagerLoadDivifr")
        return false;
//    autopagerBwUtil.consoleLog("autopagerMain doContentLoad 2");
    autopagerMain.sendEnableEvent(doc);
//    autopagerMain.setGlobalImageByStatus(autopagerPref.loadBoolPref("enabled"));
    if (!autopagerPref.loadBoolPref("enabled") && doc.documentElement.forceLoadPage==0)
            return false;
    try{
        autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
        AutoPagerNS.document.getElementById("autoPagerCreateXPath").setAttribute("checked", false);	
    }catch(e){
        
    }
//    autopagerBwUtil.consoleLog("autopagerMain doContentLoad 3");
    if (doc.documentElement.getAttribute("autopagerversion"))
        return null;
//    autopagerBwUtil.consoleLog("autopagerMain doContentLoad 4");
        
//    autopagerBwUtil.consoleLog("autopagerMain doContentLoad 5");
          autopagerMain.handleDocLoad(doc,false);
//    autopagerBwUtil.consoleLog("autopagerMain doContentLoad 6");    
//    autopagerBwUtil.consoleLog("autopagerMain doContentLoad 7");
          
//          return true;
//      }
//    }
    return false;
  },
  Copy : function (container,doc)
  {

    //We can't use this, it doesn't work in some ajax page
    return;
    var childs = doc.documentElement.childNodes;
    for(var i=childs.length-1;i>=0;--i)
    {
        doc.documentElement.removeChild(childs[i]);
    }
    childs = container.documentElement.childNodes;
    for(var i=0;i<childs.length;++i)
    {
        doc.documentElement.appendChild(doc.importNode( childs[i].cloneNode(true),true));
    }           
  },
  searchForMatchedFrame : function (doc, reg,enableJS)
  {
      if (doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            for(var i=0;i<doc.defaultView.frames.length;++i) {
                var frame = doc.defaultView.frames[i].document;
                var url = this.getDocURL(frame,enableJS);
                if (reg.test(url))
                    return frame;
            }
      }
      return null;

  },
handleDocLoad : function(doc,safe)
{
    autopagerUtils.handleDocLoad(doc,safe)
},
testDoc : function(doc,site)
{
    var workingAllSites = AutoPagerNS.UpdateSites.loadAll();

    var tmpSites = [site];
    tmpSites.updateSite = new AutoPagerNS.AutoPagerUpdateSite("Wind Li","all",
        "","text/html; charset=utf-8",
        "test paging configurations",
        "testing.xml","//site",true,"autopager-xml",0);
    tmpSites.testing = true;
    workingAllSites[tmpSites.updateSite.filename] = tmpSites;
    AutoPagerNS.UpdateSites.getAutopagerCOMP().setAll(workingAllSites);
    var event = doc.createEvent("Events");
    event.initEvent("AutoPagerRefreshPage", true, true);
    try{
        doc.dispatchEvent(event)
    }catch(e)
    {
        autopagerBwUtil.consoleError(e);
    }
},
getNextUrlIncludeFrames : function(container,doc)
{
    var urlNodes = autopagerMain.findLinkInDoc(doc,
            container.documentElement.getAttribute('linkXPath'),container.documentElement.getAttribute('enableJS') == 'true');
    //alert(urlNodes);
    var nextUrl = null;
    if (urlNodes != null && urlNodes.length >0) {
        nextUrl = autopagerMain.getNextUrl(container,container.documentElement.getAttribute('enableJS') == 'true',urlNodes[0]);
    }else
    {
        if (doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            for(var i=0;i<doc.defaultView.frames.length;++i) {
                nextUrl = autopagerMain.getNextUrlIncludeFrames(container,doc.defaultView.frames[i].document);
                if ( nextUrl != null)
                    return nextUrl;
            }
        }
     }    
    return nextUrl;
},
loadTempConfig : function() {
    var sites = new Array();
    var smartenable = autopagerPref.loadBoolPref("smartenable");
    if (smartenable) {
        
        var smarttext = autopagerUtils.getSmarttext();
        if (smarttext.length>0) {
            var smartlinks = autopagerPref.loadPref("smartlinks");
            var site = autopagerConfig.newSite("*","temp site for smart paging"
            ,"","//body/*",[]);
            site.maxLinks = smartlinks;
            site.enableJS = false;
            site.isTemp = true;
            site.tmpPaths =  autopagerXPath.convertToXpath(smarttext);
            
            site.fixOverflow = false;
            site.margin = autopagerPref.loadPref("smartMargin");
            site.guid="autopagertemp";
            site.quickLoad = true;
            sites.push(site);
            //alert(linkXPath);
        }
    }
    return sites;
},
fixOverflow : function(doc) {
    var nodes = autopagerMain.findNodeInDoc(doc,"//*[contains(@style,'overflow')][not(@className = 'clsCleekiComponent')]",false);
    if (nodes != null) {
        for(var i = 0;i<nodes.length;++i) {
            var node = nodes[i];            
            node.style.overflow = "visible";
        }
    }
    nodes = autopagerMain.findNodeInDoc(doc,"//*[contains(@style,'position')][not(@className = 'clsCleekiComponent')]",false);
    if (nodes != null) {
        for(var i = 0;i<nodes.length;++i) {
            var node = nodes[i];
            if ( (node.style.position == "fixed" || node.style.position == "absolute" ) && node.className != "autoPagerS")
                node.style.position = "relative"; 
        }
    }
},
getCtrlKey : function()
{
    return autopagerPref.loadBoolPref("enablehotkeys.ctrlkey");
},
setCtrlKey : function(value)
{
    return autopagerPref.saveBoolPref("enablehotkeys.ctrlkey",value);
},
getAltKey : function()
{
    return autopagerPref.loadBoolPref("enablehotkeys.altkey");
},
setAltKey : function(value)
{
    return autopagerPref.saveBoolPref("enablehotkeys.altkey",value);
},
getShiftKey : function()
{
    return autopagerPref.loadBoolPref("enablehotkeys.shiftkey");
},
setShiftKey:function(value)
{
    return autopagerPref.saveBoolPref("enablehotkeys.shiftkey",value);
},
promptNewVersion : function (version)
{
        var message = autopagerUtils.autopagerFormatString("unsupport-version",[version,autopagerConfig.formatVersion]);
//        autopagerBwUtil.consoleLog(message);
        if (autopagerPref.loadBoolPref("ignore-format-version-check"))
        {
            return;
        }
        var buttons = [{
            label: autopagerUtils.autopagerGetString("IgnoreVersionCheck"),
            accessKey: "I",
            callback: function(){
                autopagerPref.saveBoolPref("ignore-format-version-check",true)
            }
        },{
            label: autopagerUtils.autopagerGetString("CheckUpdate"),
            accessKey: "U",
            //            popup: "autopager-menu-popup",
            callback: function(){
                autopagerUtils.showHelp();
            }
        }];

        autopagerUtils.notification("autopager-version-unsupport",message,buttons);
},
promptNewRule : function (doc,force)
{
        if (autopagerBwUtil.isInPrivateMode())
            return false;
    
        if (typeof autopagerBwUtil.notification == "undefined")
        {
            autopagerMain.enabledThisSite(doc,true);
            return false;
        }
        var host = doc.location.host;
        var owner = doc.documentElement.getAttribute("autopagerSettingOwner")

        if (!force && autopagerUtils.noprompt())
        {
            return false;
        }
        var message = autopagerUtils.autopagerFormatString("enableonsite",[host,owner]);
        var buttons = [
        {
            label: autopagerUtils.autopagerGetString("Yes"),
            accessKey: autopagerUtils.autopagerGetString("yesAccessKey"),
            callback: function(){
                autopagerMain.enabledThisSite(doc,true);
            }
        }
        ,{
            label: autopagerUtils.autopagerGetString("No"),
            accessKey: autopagerUtils.autopagerGetString("noAccessKey"),
            callback: function(){
                autopagerMain.enabledThisSite(doc,false);
            }
        }
        ,{
            label: autopagerUtils.autopagerGetString("Options"),
            accessKey: autopagerUtils.autopagerGetString("optionAccessKey"),
            popup: "autopager-notification-popup",
            callback: function(){
                autopagerPref.saveBoolPref("noprompt",true)
            }
        }
        ];

        autopagerUtils.notification("autopager-new-rule",message,buttons);
        return true;
},
onNoMatchedRule : function (doc,url,safe)
{
    //try smart page first
    var smartenable = autopagerPref.loadBoolPref("smartenable");
    var matched = false;
    if (smartenable) {
        var smarttext = autopagerUtils.getSmarttext();
        var html = doc.documentElement.innerHTML;
        //ignore html match then 
        if (smarttext.length>0 && html.length<autopagerPref.loadPref("smartmaxsize")*1024*1024) {
            var strs = smarttext.split("|");
            var smartlinks = autopagerPref.loadPref("smartlinks");
                            
            for(var i=0;i<strs.length;++i) {
                if (strs[i].length==0)
                    continue;
                var txt = strs[i]
                if (html.indexOf(txt)>0)
                {
                    var tmpPaths =  autopagerXPath.convertToXpath(txt,autopagerPref.loadBoolPref("smartexactlymatch"));
                    for(var t in tmpPaths)
                    {
                        var nodes = autopagerXPath.evaluate(doc,tmpPaths[t],true,1+smartlinks);
                        if (nodes && nodes.length>0 && nodes.length<=smartlinks && autopagerXPath.isValidateLink(nodes[0]))
                        {
                            var host = doc.location.protocol +"//"+ doc.location.host;
                             var site = autopagerConfig.newSite(host + "/*","temp site for " + host
                                ,"","//body/*",[]);
                            site.maxLinks = smartlinks;
                            site.enableJS = false;
                            site.linkXPath =  tmpPaths[t];

                            site.fixOverflow = false;
                            site.margin = autopagerPref.loadPref("smartMargin");
                            site.guid="tmp-" + host;
                            site.quickLoad = true;
                            site.owner = autopagerUtils.autopagerGetString("smartpaging")
                            var ret = autopagerMain.checkSiteRule(doc,{key:"smartpaging.xml",index:0,site:site},url,safe);
                            matched = !!ret;
                            if (matched)
                            {
                                autopagerRules.addRule("smartpaging.xml",site);
                                return;
                            }
                        }
                    }
                }
            }
            
        }
    }
    if (!matched)
        autopagerLite.discoveryRules(doc);
},
onInitDoc : function(doc,safe)
{
    var ret = autopagerMain.doOnInitDoc(doc,safe);
    return ret;
},
doOnInitDoc : function(doc,safe) {
//    autopagerBwUtil.consoleLog("doOnInitDoc 1");        
        if (doc.location == null)
            return -1;
    
        if (doc.defaultView.innerWidth <autopagerPref.loadPref("mini-window-width") || doc.defaultView.innerHeight<autopagerPref.loadPref("mini-window-height"))
            return -1;
    
//autopagerBwUtil.consoleLog("doOnInitDoc 2");        

        var url = doc.location.href;
        if (url == "about:blank")
            return -1;
        
        autopagerRules.getNextMatchedSiteConfig(url,null,function(sitepos){
            return autopagerMain.matchCallBack(doc,sitepos,url,safe)
        });

        return 0;
    },
    matchCallBack : function  (doc,sitepos,url,safe)
    {
        try{
//            autopagerBwUtil.consoleLog("matchCallBack:" + sitepos )
            //return 0 to try next rule, return 1 to stop
            if (sitepos!=null)
            {
//                autopagerBwUtil.consoleLog("matchCallBack 1" )

                //some rules use bad xpath, need a lot of time to evaluate , ignore them.
                //TODO: add page an to manage the ignored rules
                var disabledRules = autopagerPref.loadPref("disabled-rules")
//                autopagerBwUtil.consoleLog("matchCallBack 2" )
                //sitepos.site = autopagerConfig.completeRule(sitepos.site)
//                autopagerBwUtil.consoleLog("matchCallBack 3" )
                if (disabledRules && (',' + disabledRules + ',').indexOf(',' + sitepos.site.guid + ',')>=0)
                {
                    //TODO: show 
                    return 0;
                }
//                autopagerBwUtil.consoleLog("matchCallBack 4" )

                var start = new Date().getTime();
                var ret = autopagerMain.checkSiteRule(doc,sitepos,url,safe);                
//                autopagerBwUtil.consoleLog("matchCallBack 5" )
                if (ret!=1 && sitepos.site.delaymsecs>0)
                {
                                            
                    AutoPagerNS.window.setTimeout(function(){
                        autopagerMain.checkSiteRule(AutoPagerNS.getContentDocument(),sitepos,AutoPagerNS.getContentDocument().location.href,safe);
                    },1000);
                }
//                autopagerBwUtil.consoleLog("matchCallBack 7" )

                if (new Date().getTime()-start>1000) //disable the rule if xpath finished in more then 1 seconds
                {
//                    autopagerBwUtil.consoleLog("matchCallBack 8" )

                    autopagerMain.disableRule(sitepos.site.guid)
                }
                return ret;
            }
            else
            {
                autopagerMain.onNoMatchedRule(doc,url,safe);
                return 1;
            }
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
        return 0;
    },
    checkSiteRule : function(doc,sitepos,url,safe)
    {
//        autopagerBwUtil.consoleLog("checkSiteRule 1" )
        
        //doesn't support ajax on some browsers,ignore the rules
        if (!autopagerBwUtil.supportHiddenBrowser() && (sitepos.site.ajax || sitepos.site.enableJS==2))
        {
            return 0;
        }
        if (doc.documentElement.getAttribute("autopagerversion"))
            return 0;
        //autopagerMain.log("4 " + new Date().getTime())
        var pattern = autopagerUtils.getRegExp(sitepos.site);
        if (pattern.test(url)) {
            //should not equal
            //if (sitepos.site.quickLoad == safe)
            if (safe)
                return 0;
            
            if (typeof sitepos.site.formatVersion != 'undefined'
                && sitepos.site.formatVersion > autopagerUtils.formatVersion)
                {
                autopagerMain.promptNewVersion(sitepos.site.formatVersion);
                //not use it, try next
                return 0;
            }
//            autopagerBwUtil.consoleLog("checkSiteRule 6" )
            var msg="";
            var info = "";

//            autopagerBwUtil.consoleLog("checkSiteRule 1:" + sitepos.site.linkXPath)
            var de = doc.documentElement;
            if (typeof de.autoPagerRunning == "undefined" || !de.autoPagerRunning) {
                
                de.patternRegExp = pattern;
                de.autopagerHasMatchedURL=true;
                var insertPoint = null;
                var nextUrl = null;

                //autopagerMain.log("5 " + new Date().getTime())
                var urlNodes = null;
//                autopagerBwUtil.consoleLog("checkSiteRule 2:" + urlNodes)
                if (!sitepos.site.isTemp)
                    urlNodes = autopagerMain.findLinkInDoc(doc,sitepos.site.linkXPath,sitepos.site.enableJS || (!sitepos.site.fixOverflow &&  autopagerPref.loadBoolPref("alwaysEnableJavaScript")));
                else{
                    sitepos.site.linkXPath = null;
                    for(var t=0;t<sitepos.site.tmpPaths.length; ++t) {
                        //autopagerMain.log("6.1 " + new Date().getTime())
                        autopagerMain.log(sitepos.site.tmpPaths[t])
                        urlNodes = autopagerMain.findLinkInDoc(doc,sitepos.site.tmpPaths[t],sitepos.site.enableJS || (!sitepos.site.fixOverflow &&  autopagerPref.loadBoolPref("alwaysEnableJavaScript")));
                        //autopagerMain.log("6 " + new Date().getTime())
                        if ( urlNodes != null  && urlNodes.length >0
                            && urlNodes.length <= sitepos.site.maxLinks) {
                            sitepos.site.linkXPath = sitepos.site.tmpPaths[t];
                            //alert(sitepos.site.linkXPath);
                            break;
                        }
                    }
                }
//                autopagerBwUtil.consoleLog("checkSiteRule 3:" + urlNodes)
                //autopagerMain.log("7 " + new Date().getTime())
                if (urlNodes == null || urlNodes.length ==0)
                {
//                    autopagerBwUtil.consoleLog("checkSiteRule return:" + urlNodes)
                    
                    if (sitepos.site.isTemp )
                        de.setAttribute("autopagerEnabledSite", false) ;
                    return 0;
                }
//                autopagerBwUtil.consoleLog("checkSiteRule 4:" + urlNodes)
                //autopagerMain.log("8 " + new Date().getTime())
                var visible = false;
                for(var l in urlNodes)
                {
                    if (!urlNodes[l] || urlNodes[l].constructor == String )
                    {
                        visible = true;
                        break;
                    }
                    var style = null;
                    if (doc.defaultView)
                    {
                        style = doc.defaultView.getComputedStyle(urlNodes[l],null);
                    }
                    else
                        style = urlNodes[l].style;
                    //alert(urlNodes[l].offsetLeft)
                    if (!(style.display=="none" || style.display=="hidden"  || style.visibility=="invisible"))
                    {
                        visible = true
                        //call to offsetLeft,offsetTop or offsetParent will force the browser to render the page
//                        var pos = autopagerMain.myGetPos(urlNodes[l]);
//                        var left = pos.x;
//                        var top = pos.y;
//
//                        visible = !((left +urlNodes[l].offsetWidth)<= 0 || (top + urlNodes[l].offsetHeight) <=0);
//                        if (visible)
//                            break;
                    }                    
                }
                if (!visible)
                {
                    de.setAttribute("autopagerEnabledSite", false);
                    return 1;
                }                
                //autopagerMain.log("9 " + new Date().getTime())

                var paging = new AutoPagring(sitepos.site,doc)
                if (sitepos.site.monitorXPath)
                {
                    autopagerMain.monitorForCleanPages(doc,paging)
                }
                paging.prepareSessionTweaking(doc);
                var oldNodes = null;
                var parentNodes = [];
                if (sitepos.site.contentXPath!=null && sitepos.site.contentXPath.length>0)
                {
                    oldNodes = autopagerMain.findNodeInDoc(doc,sitepos.site.contentXPath,sitepos.site.enableJS || (!sitepos.site.fixOverflow &&  autopagerPref.loadBoolPref("alwaysEnableJavaScript")));
                    if (oldNodes==null || oldNodes.length==0)
                    {
                        return 0;
                    }
                    if (sitepos.site.ajax)
                    {
                        for(var n=0;n<oldNodes.length;n++)
                        {
                            var node = oldNodes[n];
                                if (parentNodes.indexOf(node.parentNode)==-1)
                                {
                                    parentNodes.push(node.parentNode);
                                    autopagerMain.watchForNodeChange(node.parentNode);
                                }
                        }   
                    }
                }
                                
//                autopagerBwUtil.consoleLog("paging:" + paging)
                autopagerUtils.setAutoPagerObject(de,paging)
                //if (sitepos.site.enabled)
                paging.autopagerSplitDocInited = false;
                paging.enableJS = autopagerBwUtil.supportHiddenBrowser()
                &&
                ((sitepos.site.enableJS ||sitepos.site.ajax || (autopagerPref.loadBoolPref("alwaysEnableJavaScript")))
                    && (!autopagerBwUtil.isMobileVersion() || sitepos.site.enableJS==2));

//                autopagerBwUtil.consoleLog("before findConfirm")
//                var siteConfirm = autopagerConfig.findConfirm(autopagerConfig.getConfirm(),sitepos.site.guid,doc.location.host);
//                autopagerBwUtil.consoleLog("findConfirm:" + siteConfirm)
//                
//                if (siteConfirm!=null)
//                {
//                    paging.autopagerUserConfirmed= true;
//                    paging.autopagerSessionAllowed= siteConfirm.UserAllowed;
//                    paging.autopagerAllowedPageCount=siteConfirm.AllowedPageCount;
//                    paging.autopagerSessionAllowedPageCount = siteConfirm.AllowedPageCount;
//                    paging.autopagerUserAllowed=siteConfirm.UserAllowed;
//                }
                //autopagerMain.log("10 " + new Date().getTime())

                if (oldNodes!= null && oldNodes.length >0)
                    insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
                if(insertPoint == null)
                {
                    if (oldNodes!= null && oldNodes.length >0)
                    {
                        var br = autopagerMain.createDiv(doc,"","display:none;");
                        oldNodes[oldNodes.length - 1].parentNode.appendChild(br);
                        insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
                    }else
                        insertPoint = autopagerMain.getLastDiv(doc);
                }
                
                var div = autopagerMain.createDiv(doc,"apBreakEnd","display:none;");
                //div.setAttribute("id","apBreakEnd" + this.autopagerPage);
                insertPoint = insertPoint.parentNode.insertBefore(div,insertPoint);
                
                //alert(oldNodes[oldNodes.length - 1]);
                if (autopagerMain.autopagerDebug)
                    autopagerMain.logInfo(insertPoint, "go");
                //                        de.setAttribute('linkXPath',sitepos.site.linkXPath);

                var tooManyLinks = false;
                if (sitepos.site.maxLinks  != -1 && urlNodes != null
                    && urlNodes.length > sitepos.site.maxLinks )
                    tooManyLinks = true;

                //alert(urlNodes);
                if (urlNodes != null && urlNodes.length >0)
                {
                    nextUrl = autopagerMain.getNextUrl(doc,
                        autopagerBwUtil.supportHiddenBrowser() && (sitepos.site.enableJS || !sitepos.site.contentXPath || sitepos.site.contentXPath.length==0 || (!sitepos.site.fixOverflow &&  autopagerPref.loadBoolPref("alwaysEnableJavaScript")))
                        ,urlNodes[0]);
                    paging.enableJS = autopagerBwUtil.supportHiddenBrowser() && (paging.enableJS  || nextUrl.constructor != String);
                    if (nextUrl.constructor != String)
                    {
                        autopagerMain.watchForNodeChange(nextUrl.parentNode);
                        autopagerMain.watchForNodeAttrChange(nextUrl);                        
                    }
                } else
                    nextUrl = null;

                var autopagerEnabled =	(insertPoint != null) && (nextUrl != null)
                && sitepos.site.enabled && !(tooManyLinks);

                paging.autopagerEnabledSite = autopagerEnabled

//                autopagerBwUtil.consoleLog("autopagerEnabledSite:" + paging.autopagerEnabledSite)
                paging.autopagerPage = 1;
                paging.autopagerinsertPoint = insertPoint;
//                autopagerBwUtil.consoleLog("autopagerinsertPoint:" + paging.autopagerinsertPoint )
                if  (autopagerBwUtil.supportHiddenBrowser() && paging.hasContentXPath && paging.enableJS)
                {
                    paging.autopagernextUrl= null;

                }
                else{
                    paging.autopagernextUrl = nextUrl;

                }

                paging.autopagerUseSafeEvent = (doc.defaultView.top != doc.defaultView) || (!sitepos.site.quickLoad) || doc.getElementsByTagName("video").length>0 || doc.getElementsByTagName("audio").length>0;
                de.setAttribute('fixOverflow',sitepos.site.fixOverflow);
                de.setAttribute('contentXPath',sitepos.site.contentXPath);
                de.setAttribute('linkXPath',sitepos.site.linkXPath);
                de.setAttribute('containerXPath',sitepos.site.containerXPath);
                de.setAttribute('autopagerSettingOwner',sitepos.site.owner);
                de.setAttribute('autopagerversion',autopagerUtils.version);
                de.setAttribute('autopagerguid',sitepos.site.guid);
                de.setAttribute('autopagerAjax',sitepos.site.ajax);

                
                paging.autopagerSplitCreated = false;

                if (autopagerEnabled) {
                    if(sitepos.site.fixOverflow)
                        autopagerMain.fixOverflow(doc);


                    try{
                        var needLoadSplit =autopagerBwUtil.supportHiddenBrowser()
                            &&  paging.hasContentXPath
                            && (sitepos.site.enableJS || (!sitepos.site.fixOverflow &&  autopagerPref.loadBoolPref("alwaysEnableJavaScript")))
                            && (!autopagerBwUtil.isMobileVersion() || sitepos.site.enableJS==2);
                        if (needLoadSplit)
                        {
                            doc = doc.QueryInterface(Components.interfaces.nsIDOMDocument);
                            autopagerMain.getSplitBrowserForDoc(doc,true,paging);
                        }
                    }catch(e)
                    {}
                    msg = autopagerUtils.autopagerFormatString("enableurl",[ url ]);
                    info = autopagerUtils.autopagerFormatString("enableinfo",[url,sitepos.site.linkXPath,sitepos.site.contentXPath]);
                }
                else if (!autopagerPref.loadBoolPref("enabled")) {
                    msg = autopagerUtils.autopagerFormatString("globaldisabled",[url]);
                    info = msg;
                }
                
//                autopagerBwUtil.consoleLog("msg:" + msg)
                
                if (msg.length>0)
                    autopagerMain.logInfo(msg, info);
                AutoPagerNS.window.setTimeout(function(){
                    paging.scrollWatcher(doc)
                    },1000);

                if (paging.autopagerEnabledSite && doc.defaultView.top != doc.defaultView && doc.defaultView.frameElement!=null) //we are in a frame
                {
                    var fr = doc.defaultView.frameElement
                    if (fr.getAttribute("scrolling")!=null && fr.getAttribute("scrolling").toLowerCase()=='no')
                    {
                        fr.setAttribute("scrolling",'yes')
                    }
                }
                //autopagerLite.hiddenStatus(true);

                paging.tmpScrollWatcher =function(event){
                    paging.scrollWatcher(event);
                }
                paging.tmpPageUnLoad =function(event){                
                    paging.onPageUnLoad(event);
                }
//                paging.tmpInterval =function(event){
//                    autopagerBwUtil.consoleLog("tmpInterval")
//                    paging.scrollWatcherOnDoc(doc);
//                }
//                autopagerBwUtil.consoleLog("set tmpInterval")
//                paging.intervalId = AutoPagerNS.window.setInterval(paging.tmpInterval, 2000);
                //doc.removeEventListener("scroll",function(event){paging.scrollWatcher(event)},false);
                doc.addEventListener("scroll",paging.tmpScrollWatcher,false);                
                if (paging.site.containerXPath)
                {
                    var autopagerContainer = autopagerMain.findNodeInDoc(de,paging.site.containerXPath,false);
                    if (autopagerContainer!=null)
                    {
                        for(var c =0;c<autopagerContainer.length;c++)
                        {
                            var scrollContainer = autopagerContainer[0];
                            scrollContainer.addEventListener("scroll",paging.tmpScrollWatcher,false);
                        }
                    }
                }

                if (!autopagerBwUtil.supportHiddenBrowser())
                    AutoPagerNS.browser.addEventListener("beforeunload",paging.tmpPageUnLoad,true);
                else if(doc.defaultView)
                    doc.defaultView.addEventListener("beforeunload",paging.tmpPageUnLoad,true);


                if (autopagerBwUtil.isMobileVersion())
                {
                    //paging.tmpMouseDown =function(event){paging.onMouseDown(event);}
                    //addEventListener("mousedown",paging.tmpMouseDown,false);
//                    paging.tmpRenderStateChanged =function(event){
//                        paging.onRenderStateChanged(event);
//                    }
//                    var browsers = AutoPagerNS.document.getElementById("browsers");
//                    browsers.addEventListener("RenderStateChanged",paging.tmpRenderStateChanged,false);
                }
                try{
                    autopagerUtils.postHandlingPaging(doc);
                }catch(e){
                    autopagerBwUtil.consoleError(e);
                }                
                if (sitepos.site.enabled==false)
                    return 1;
                return 1;
            }
        }
        return 0;
    }
    ,
watchForNodeChange : function (node)
{
    //node.addEventListener("DOMNodeRemoved",autopagerMain.onAjaxRemoveNode,false);
    //node.addEventListener("DOMNodeInserted",autopagerMain.onAjaxInsertNode,false);
},
watchForNodeAttrChange : function (node)
{
//    try{
//        //node.addEventListener("DOMAttrModified",autopagerMain.onAjaxAttrModified,false);
//    }catch(e){        
//    }
    
},
onAjaxRemoveNode : function (e)
{
    var node = e.target
    var str = "Loaded:" + node.ownerDocument.documentElement.autopagerPage + " " + node.tagName + ",id=" + node.getAttribute("id") + ",class=" + node.getAttribute("class") + ",href=" + node.getAttribute("href")
    //autopagerBwUtil.consoleLog("onAjaxRemoveNode:" + str + " " + node.innerHTML);
},
onAjaxInsertNode : function (e)
{
    var node = e.target
    var str = "Loaded:" + node.ownerDocument.documentElement.autopagerPage + " " + node.tagName + ",id=" + node.getAttribute("id") + ",class=" + node.getAttribute("class") + ",href=" + node.getAttribute("href")
    //autopagerBwUtil.consoleLog("onAjaxInsertNode:" + str + " " + node.innerHTML);
},
onAjaxAttrModified : function (e)
{
    var node = e.target
    var str = "Loaded:" + node.ownerDocument.documentElement.autopagerPage + " " + node.tagName + ",id=" + node.getAttribute("id") + ",class=" + node.getAttribute("class") + ",href=" + node.getAttribute("href")
    //autopagerBwUtil.consoleLog("onAjaxAttrModified:" + str + " " + node.innerHTML);
},
monitorForCleanPages : function (doc,paging)
{
    if (paging.site.monitorXPath)
    {
        var nodes = autopagerMain.findNodeInDoc(doc,paging.site.monitorXPath + " | //div[@class='autoPagerS' and contains(@id,'apBreakStart')]/span/a[2]",paging.enableJS || paging.inSplitWindow);
        var monitor = paging.getChangeMonitor();
        var removeMonitor = paging.getDOMNodeRemovedMonitor();
        for(var i=0;i<nodes.length;i++)
        {
            nodes[i].removeEventListener("change", monitor, false);
            nodes[i].removeEventListener("click", monitor, false);

            nodes[i].addEventListener("change", monitor, false);
            nodes[i].addEventListener("click", monitor, false);

            nodes[i].addEventListener("DOMNodeRemoved", removeMonitor, false);
        }
        monitor = paging.getDOMNodeMonitor();
        //var xpath = paging.site.contentXPath;
//        var xpath = "/*/*";
//        nodes = autopagerMain.findNodeInDoc(doc,xpath,paging.enableJS || paging.inSplitWindow);
//        for(var i=0;i<nodes.length;i++)
//        {
            //nodes[i].removeEventListener("DOMNodeRemoved", monitor, false);
            doc.documentElement.removeEventListener("DOMNodeInserted", monitor, false);

            //nodes[i].addEventListener("DOMNodeRemoved", monitor, false);
            doc.documentElement.addEventListener("DOMNodeInserted", monitor, false);
//        }

    }
},
cleanMonitorForCleanPages : function (doc,paging)
{
    if (paging.site.monitorXPath)
    {
        var nodes = autopagerMain.findNodeInDoc(doc,paging.site.monitorXPath + " | //div[@class='autoPagerS' and contains(@id,'apBreakStart')]/span/a[2]",paging.enableJS || paging.inSplitWindow);
        var monitor = paging.getChangeMonitor();
        var removeMonitor = paging.getDOMNodeRemovedMonitor();
        for(var i=0;i<nodes.length;i++)
        {
            nodes[i].removeEventListener("change", monitor, false);
            nodes[i].removeEventListener("click", monitor, false);
            nodes[i].removeEventListener("DOMNodeRemoved", removeMonitor, false);
        }
        monitor = paging.getDOMNodeMonitor();
        //var xpath = paging.site.contentXPath;
//        var xpath = "/*/*";
//        nodes = autopagerMain.findNodeInDoc(doc,xpath,paging.enableJS || paging.inSplitWindow);
//        for(var i=0;i<nodes.length;i++)
//        {
            //nodes[i].removeEventListener("DOMNodeRemoved", monitor, false);
            doc.documentElement.removeEventListener("DOMNodeInserted", monitor, false);
//        }

    }
},
onClearLoadMonitor : function (evt)
{
    if (evt && evt.target && evt.target.ownerDocument)
        autopagerMain.doClearLoadedPages(evt.target.ownerDocument,true)
},
clearLoadedPages : function (doc)
{
    autopagerMain.doClearLoadedPages(doc,false);
},
doClearLoadedPages : function (doc,lazyLoad,paging,notload)
{
    if ((paging == null || typeof paging == 'undefined')
        && doc && doc.documentElement && autopagerUtils.getAutoPagerObject(doc.documentElement))
    {
        paging = autopagerUtils.getAutoPagerObject(doc.documentElement);
    }
        var xpath="//div[contains(@id,'apBreakStart')]/preceding-sibling::*[1]/following-sibling::*[./following-sibling::div[contains(@id,'apBreakEnd')"
            + "]] | //div[contains(@id,'apBreakEnd')]";
        autopagerMain.removeElements(doc,[xpath],true,false);
    autopagerMain.clearLoadStatus(doc,paging);
    if (autopagerUtils.getAutoPagerObject(doc.documentElement))
        autopagerUtils.setAutoPagerObject(doc.documentElement,null)
    if (notload)
        return;
    if (!lazyLoad)
    {
        autopagerMain.doContentLoad(doc);
    }
    else
    {
        var delaymsecs = 1000;
        if (paging && !paging.cleaning)
        {
            paging.cleaning = true;
            if (paging.site.delaymsecs>0)
                delaymsecs += paging.site.delaymsecs
            AutoPagerNS.window.setTimeout(function(){
                autopagerMain.doContentLoad(doc)
                paging.cleaning = false;
            },delaymsecs);
        }else
        {
            AutoPagerNS.window.setTimeout(function(){
                autopagerMain.doContentLoad(doc)
            },delaymsecs);
        }
    }
},
clearLoadStatus : function (doc,paging)
{
    if (typeof paging=="undefined")
    {
        if (autopagerUtils.getAutoPagerObject(doc.documentElement))
            paging = autopagerUtils.getAutoPagerObject(doc.documentElement)
    }
    var obj = paging
    if (!obj)
        obj = doc.documentElement
    if (typeof obj.onDocUnLoad == "function")
    {
        obj.onDocUnLoad(doc)
        var event = doc.createEvent("Events");
        event.initEvent("AutoPagerClean", true, true);
        try{
            doc.dispatchEvent(event)
        }catch(e)
        {}
    }

    autopagerMain.doOnPageUnLoad(doc);
    doc.documentElement.removeAttribute("autopagerversion")

}
,pauseLoadPages : function(doc)
{
    var obj = doc.documentElement

    if (autopagerUtils.getAutoPagerObject(doc.documentElement))
    {
        obj = autopagerUtils.getAutoPagerObject(doc.documentElement)
    }

    if (obj.autopagerPage!=null && obj.autopagerPage!=0)
        obj.forceLoadPage = obj.autopagerPage;

}
,loadPages : function (doc,pages)
{
    var obj = doc.documentElement

    if (autopagerUtils.getAutoPagerObject(doc.documentElement))
    {
        obj = autopagerUtils.getAutoPagerObject(doc.documentElement)
    }
    
	obj.forceLoadPage = parseInt(pages);
	if (obj.autopagerPage!=null && obj.autopagerPage!=0)
		obj.forceLoadPage += obj.autopagerPage;

        autopagerMain.doContentLoad(doc,true);
	//doc.documentElement.setAttribute("autopagerEnabledSite", true);
    if (typeof obj.scrollWatcher != "undefined")
	obj.scrollWatcher(doc);
},

showAllPagingOptions : function() {
     try{
        var showedCount = 0;
        if (this.autopagerDebug)
            autopagerMain.logInfo(this.count,"Enter showAllPagingOptions");
        var doc = AutoPagerNS.getContentDocument()
            var de = doc.documentElement;
            if (typeof autopagerUtils.getAutoPagerObject(de) != "undefined" &&
                typeof autopagerUtils.getAutoPagerObject(de).scrollWatcher != "undefined")
                {
                showedCount ++;
                autopagerMain.promptNewRule (doc,true);
            }
            for(var i=0;i<doc.defaultView.frames.length;++i) {
                var d = doc.defaultView.frames[i].document;
                de = d.documentElement
                if (typeof autopagerUtils.getAutoPagerObject(de) != "undefined" &&
                    typeof autopagerUtils.getAutoPagerObject(de).scrollWatcher != "undefined")
                    {
                    showedCount ++;
                    autopagerMain.promptNewRule (d,true);
                }
            }

         if (showedCount==0)
        {
            alert(autopagerUtils.autopagerGetString("nomatchedconfig"));
        }
    }catch(e){
       autopagerMain.alertErr("Exception:" + e);
   }
    
},
isEnabledOnDoc : function(doc,paging)
{
    var match = this.isMatchedOnDoc(doc,paging);
    return match.enabled;
},
isMatchedOnDoc : function(doc,pagingObj)
{
        var de = doc.documentElement;
        var enabled = true;
        var paging = pagingObj
        if (typeof pagingObj =='undefined' || pagingObj==null)
        {
            paging = autopagerUtils.getAutoPagerObject(de)
        }
        if (doc.location && paging != null)
        {
            var obj = paging
//            var siteConfirm = autopagerConfig.findConfirm(autopagerConfig.getConfirm(),
//                obj.site.guid,doc.location.host);
//
//            if (siteConfirm)
//                enabled = siteConfirm.UserAllowed;
//            else
//                enabled =  !autopagerPref.loadBoolPref("disable-by-default");
            enabled = autopagerUtils.isEnabledOnHost()
            return {"matched":true,"enabled":enabled};
        }else if (doc.defaultView && doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            for(var i=0;i<doc.defaultView.frames.length;++i) {
                var frame = doc.defaultView.frames[i].document;
                var match = this.isMatchedOnDoc(frame);
                if (match.matched)
                    return match;
            }
      }
      return {"matched":false,"enabled":enabled};
},
onHandlingCoreOption : function (event)
{
    var menuitem = event.target
    if (menuitem.getAttribute("pref") && menuitem.getAttribute("type")=='checkbox')
    {
        autopagerPref.saveBoolPref(menuitem.getAttribute("pref"),menuitem.getAttribute("checked")=='true');
    }else if (menuitem.getAttribute("prefV") && menuitem.getAttribute("type")=='checkbox')
    {
        autopagerPref.saveBoolPref(menuitem.getAttribute("prefV"),menuitem.getAttribute("checked")!='true');
    }
    else if (menuitem.getAttribute("type")=='radio' && menuitem.parentNode.parentNode.getAttribute("pref"))
    {
        autopagerPref.savePref(menuitem.parentNode.parentNode.getAttribute("pref"),
                menuitem.value);
    }

},
onPrepareCoreOption : function (target)
{
    var menupopup = target;
    AutoPagerNS.window.setTimeout(function (){
    for(var i=0;i<menupopup.childNodes.length;i++)
    {
        var menuitem = menupopup.childNodes[i];
        if (menuitem.tagName=='menuitem')
        {
            if (menuitem.getAttribute("pref"))
            {
                menuitem.setAttribute("checked",autopagerPref.loadBoolPref(menuitem.getAttribute("pref")));
            }else if (menuitem.getAttribute("prefV"))
            {
                menuitem.setAttribute("checked",!autopagerPref.loadBoolPref(menuitem.getAttribute("prefV")));
            }
        }else if (menuitem.tagName=='menu')
        {
            var popup = menuitem.childNodes
            var options = popup[0].childNodes
            var value = autopagerPref.loadPref(menuitem.getAttribute("pref"))

            for(var o=0;o<options.length;o++)
            {
                var option = options[o]
                if (option.value == value)
                {
                    option.setAttribute("checked",true);
                    break;
                }
            }
        }
    }
    }
    ,10);
},
onImmedialateLoadClick : function() {
    autopagerMain.loadPages(AutoPagerNS.getContentDocument(),autopagerPref.loadPref("immedialate-load-count"));
},
FillImmedialateLoadPopup : function (target,prefix)
{
    var menupopup = target;
    if (menupopup.childNodes.length < 2)
    {
        var menuTemplate = document.getElementById("autopager-immedialate-load-menupopup")
        for(var i=0;i<menuTemplate.childNodes.length;i++)
        {
            var child = menuTemplate.childNodes[i].cloneNode(true);
            if (child.getAttribute("id"))
                child.setAttribute("id",prefix + "-" + child.getAttribute("id"));
            menupopup.appendChild(child);
        }
    }
},
FillPopup : function(target,prefix) {

    var menupopup = target;
    if (menupopup.childNodes.length < 2)
    {
        var menuTemplate = document.getElementById("autopager-menu-popup")
        for(var i=0;i<menuTemplate.childNodes.length;i++)
        {
            var child = menuTemplate.childNodes[i].cloneNode(true);
            if (child.getAttribute("id"))
                child.setAttribute("id",prefix + "-" + child.getAttribute("id"));
            menupopup.appendChild(child);
        }
    }
        try{
            var doc = AutoPagerNS.getContentDocument()
            document.getElementById(prefix + "-autopager-disable-on-site").setAttribute("checked", false)
            var match = autopagerMain.isMatchedOnDoc(doc)
            var allowed = match.enabled
            var matched = match.matched
            
            document.getElementById(prefix + "-autopager-disable-on-site").setAttribute("checked", !allowed);
            document.getElementById(prefix + "-autopager-disable-on-site").setAttribute("hidden",!matched);
            document.getElementById(prefix + "-autopager-issue-on-site").setAttribute("hidden",!matched);
            document.getElementById(prefix + "-autopager-request-on-site").setAttribute("hidden",matched);
            document.getElementById(prefix + "-autopager-enabled").setAttribute("checked",autopagerPref.loadBoolPref("enabled"));
            //document.getElementById(prefix + "-autopager-immedialate-load").setAttribute("hidden",!matched);
            //document.getElementById(prefix + "-autopager-showoption").setAttribute("hidden",!matched);

            var showpagehold=autopagerPref.loadBoolPref("showpagehold");
            document.getElementById(prefix +"-autopager-hidden-panel-menu").hidden = !this.autopagerDebug && !showpagehold;
            document.getElementById(prefix +"-autopager-hidden-panel-separator").hidden = !this.autopagerDebug && !showpagehold;

            document.getElementById(prefix + "-autopagerlite-switchToNormal").setAttribute("hidden",!autopagerLite.isInLiteMode());
            document.getElementById(prefix + "-autopagerlite-switchToLite").setAttribute("hidden",autopagerLite.isInLiteMode());

        }catch(e){
            autopagerMain.alertErr("Exception:" + e);
        }
        if (!autopagerRules.isAllowUpdate())
        {
            document.getElementById(prefix + "-autopager-sitewizard").setAttribute("hidden",true);
            document.getElementById(prefix + "-autopager-setting").setAttribute("hidden",true);
            document.getElementById(prefix + "-autopager-xpath").setAttribute("hidden",true);
        }
    new autopagerDescription("Menu:",target);
},
disableOnSite : function(target,doc) {
    var enabled = target.getAttribute("checked")=='true';
    autopagerUtils.setEnabledOnHost(enabled,doc)
    autopagerUtils.setConfirmedOnHost(true,doc)
    autopagerUtils.updateStatusIcons();
},
requestHelp : function(target,d) {
    autopagerMain.reportSite(target,d);
},
    reportSiteForDoc : function(doc)
    {
        var de = doc.documentElement;
        var matched = false;
        if (doc.location && autopagerUtils.getAutoPagerObject(de) != null)
        {
            AutoPagerNS.add_tab({url:"http://autopager.teesoft.info/reportissues/" + doc.location.href});
            matched = true;
        }
        if (doc.defaultView && doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            for(var i=0;i<doc.defaultView.frames.length;++i) {
                var frame = doc.defaultView.frames[i].document;
                if (autopagerTroubleShoting.reEnableOnDoc(frame,true))
                    matched = true;
            }
        }
        return matched;
    },
    reportSite : function(target,d) {

        try{
            var de = d.documentElement;
            var opened = autopagerMain.reportSiteForDoc(d);
            if (!opened)
                AutoPagerNS.add_tab({url:"http://autopager.teesoft.info/requestsites/" + d.location.href});

        }catch(e){
            autopagerMain.alertErr("Exception:" + e);
        }

    },
createDiv : function(doc,id,style) {
    var div = doc.createElement("div");
    //div.innerHTML = divHtml;
    doc.body.appendChild(div);
    div.className="autoPagerS";
    if (id.length>0)
        div.id = id;
    
    if (style.length>0)
        div.style.cssText = style;
    return div;
},
getSelectorDiv : function(doc,divName,color) {
    var div = doc.getElementById(divName);
    if (typeof color == "undefined")
        color = "orange";
    if (!div) {
        var style ="border: 2px solid " + color + "; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: 65534; left: -100px; top: -100px; height: 0px;";
        div = autopagerMain.createDiv(doc,divName,style);
    }
    return div;
},
getLabelDiv : function(doc,divName) {
    var div = doc.getElementById(divName);
    if (!div) {
        var style =""; 
        div = autopagerMain.createDiv(doc,divName,style);
        var s = div.style;
	s.display = "none";
	s.backgroundColor = "#fff0cc";
	s.borderColor = "black";
	s.borderWidth = "1px 2px 2px 1px";
	s.borderStyle = "solid";
	s.fontFamily = "arial";
	s.textAlign = "left";
	s.color = "#000";
	s.fontSize = "12px";
	s.position = "absolute";
	s.paddingTop = "2px";
	s.paddingBottom = "2px";
	s.paddingLeft = "5px";
	s.paddingRight = "5px";
        
	s.borderTopWidth = "0";
	s.MozBorderRadiusBottomleft = "6px";
	s.MozBorderRadiusBottomright = "6px";
        s.zIndex = "65535";        
              
    }
    return div;
},
removeSign : function (str){
    if(str.indexOf('#')==-1)
        return str;
    if (str.substr(1,str.indexOf('#')).indexOf('?')>0)
        return src.replace(/#/g,"&");
    return src.replace(/#/,"?").replace(/#/g,"&");
}
, 
getSelectorLoadFrame : function(doc,src) {
    var divName = "autoPagerLoadDiv";
    var frameName = divName + "ifr";
    
    var hasSrc = !(typeof src == "undefined")
    if (!hasSrc)
        src = ""
//    var frame = doc.ownerDocument.autopagerFrame;
//    if (frame == null || !frame)
        var frame = doc.getElementById(frameName);
        if (frame && hasSrc)
        {
            frame.parentNode.parentNode.removeChild(frame.parentNode)
            frame  = null
        }
    if (frame == null || !frame) {
        var div = null;
        if (this.autopagerDebug) {
            div = autopagerMain.createDiv(doc,divName,"");
        }
        else {
            var style = "border: 0px; margin: 0px; padding: 0px; position: absolute; width: "
                + AutoPagerNS.window.innerWidth + "px; display: block; z-index: -90; left: "
                + (-100 - AutoPagerNS.window.innerWidth) + "px; top: "
                + (-100 - AutoPagerNS.window.innerHeight) + "px; height: "
                + AutoPagerNS.window.innerHeight + "px;";

            div = autopagerMain.createDiv(doc,divName,  style);
            //div = autopagerMain.createDiv(doc,divName,  "");
        }
        div.innerHTML=
            "<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src='" + autopagerMain.removeSign(src) + "'></iframe>";
        
        frame = doc.getElementById(frameName);
        if (!hasSrc)
        {
        var baseURI = autopagerUtils.baseUrl(doc.baseURI);
        var baseNodes = autopagerMain.findNodeInDoc(doc,
            "/html/head/base[@href]",false);
        if (baseNodes == null || baseNodes.length == 0)
        {
            try{
                baseURI = baseNodes[0].getAttribute("href");
            }catch(e){}            
        }

        try{
            frame.contentDocument.write("<html><head><base href='" + baseURI + "'/></head><body>autopaging</body></html>");
        }catch(e){            
        }
        frame.autoPagerInited = false;
        //create a empty div in target
        autopagerMain.getLastDiv(doc);
//        frame.addEventListener("load", autopagerMain.onFrameLoad, false);
//        doc.ownerDocument.autopagerFrame = frame;
            
        }
    }
    //fix for enable to work at restored session
//    try{
//            frame.removeEventListener("DOMContentLoaded", autopagerMain.onFrameLoad, false);
//            frame.removeEventListener("load", autopagerMain.onFrameLoad, false);
        if (!hasSrc)
         frame.contentDocument.clear();
        //frame.normalize();
        //frame.contentDocument.documentElement.innerHTML = "<html><body>autopaging</body></html>";
//    }catch(e){}
////    if (doc.documentElement.autopagerUseSafeEvent)
//        frame.addEventListener("load", autopagerMain.onFrameLoad, false);
////    else
//        frame.addEventListener("DOMContentLoaded", autopagerMain.onFrameLoad, false);
    return frame;
},
getLastDiv: function(doc) {
    var divName = "autoPagerLastDiv";
    var div = doc.getElementById(divName);
    if (div == null || !div) {
        var div = autopagerMain.createDiv(doc,divName,
        "border: 0px; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: -90; left: -100px; top: -100px; height: 0px;");
        div = doc.getElementById(divName);
    }
    
    return div;
},
hiddenRegionDivs : function(doc,subfix) {
    var leftDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderLeft" + subfix);
    var rightDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderRight" + subfix);
    var topDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderTop" + subfix);
    var bottomDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderBottom" + subfix);
    autopagerMain.hiddenDiv(leftDiv,true);
    autopagerMain.hiddenDiv(rightDiv,true);
    autopagerMain.hiddenDiv(topDiv,true);
    autopagerMain.hiddenDiv(bottomDiv,true);
},
hiddenDiv :function(div,hidden) {
    if (div)
    {
        if (hidden) {
            div.style.display = "none";
        }else {
            div.style.display = "block";
        }
    }
	//div.hidden = hidden;
},
myGetPos : function(target)
{
    var node = target;
	var pos = {x: 0, y: 0};

	while (node)
	{
		pos.x += node.offsetLeft;
		pos.y += node.offsetTop;
		node = node.offsetParent;
	}
	return pos;
},
myGetWindowDimensions : function (doc)
{
	var out = {};

	out.scrollX = doc.body.scrollLeft + doc.documentElement.scrollLeft; 
	out.scrollY = doc.body.scrollTop + doc.documentElement.scrollTop;

	if (doc.compatMode == "BackCompat")
	{
		out.width = doc.body.clientWidth;
		out.height = doc.body.clientHeight;
	}
	else
	{
		out.width = doc.documentElement.clientWidth;
		out.height = doc.documentElement.clientHeight;
	}
	return out;
},
createRegionDivs : function(doc,target,subfix,color) {
    var margin = 3;
    var leftDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderLeft" + subfix,color);
    var rightDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderRight" + subfix,color);
    var topDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderTop" + subfix,color);
    var bottomDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderBottom" + subfix,color);
    var left = autopagerMain.getOffsetLeft(target);
    var top = autopagerMain.getOffsetTop(target);
    
    var height = target.offsetHeight;
    if (!height)
        height = target.parentNode.offsetHeight;
    var width = target.offsetWidth;
    if (!width)
        width = target.parentNode.offsetWidth;
    
    leftDiv.style.left = (left - margin) + "px";
    leftDiv.style.top = (top - margin) + "px";
    leftDiv.style.height = (height + margin) + "px";
    
    rightDiv.style.left = (left + width) + "px";
    rightDiv.style.top = (top - margin) + "px";
    rightDiv.style.height = (height + margin) + "px";
    
    topDiv.style.left = left + "px";
    topDiv.style.top = (top - margin) + "px";
    topDiv.style.width = width + "px";
    
    bottomDiv.style.left = left + "px";
    bottomDiv.style.top = (top + height) + "px";
    bottomDiv.style.width = width + "px";
    
    autopagerMain.hiddenDiv(leftDiv,false);
    autopagerMain.hiddenDiv(rightDiv,false);
    autopagerMain.hiddenDiv(topDiv,false);
    autopagerMain.hiddenDiv(bottomDiv,false);
    
},
getOffsetTop : function(target) {
    var node=target;
    var top=0;
    while(node&&node.tagName!="BODY") {
        top+=node.offsetTop;
        node=node.offsetParent;
    }
    return top;
},
getOffsetLeft : function(target) {
    var node=target;
    var left=0;
    while(node&&node.tagName!="BODY") {
        left+=node.offsetLeft;
        node=node.offsetParent;
    }
    return left;
},
fireFrameDOMContentLoaded : function(frame)
{
        var newCmdEvent = frame.contentDocument.createEvent('Events');
        newCmdEvent.initEvent('DOMContentLoaded',true, true);         
        var newEvent = frame.contentDocument.createEvent('XULCommandEvents');
        newEvent.initCommandEvent('DOMContentLoaded', true, true,frame.defaultView, 0, false, false, false, false,  newCmdEvent);
        //newEvent.target = frame;
        //document.getElementById("appcontent").dispatchEvent(newEvent);
        frame.contentDocument.dispatchEvent(newEvent);
    
},
onFrameLoad : function(event) {
    var target = null;
     if (event.target != null)
        target = event.target;
    else if (event.originalTarget != null)
        target = event.originalTarget;
    else
        target = event.currentTarget;
    //alert(target);
    var frame=target;
    if (!frame.autoPagerInited) {
        //alert("autopagerMain.onFrameLoad");
        
        frame.autoPagerInited = true;

        //autopagerMain.fireFrameDOMContentLoaded(frame);
        var doc = frame.contentDocument;
        autopagerMain.scrollWindow(frame.ownerDocument,doc);
        autopagerMain.onStopPaging(frame.ownerDocument);
        
  
        //frame.contentDocument.close();
        
    }
},

hasTopLocationRefer : function (html)
{
    return autopagerMain.topLocationMark.test(html);
},
topLocationMark : /top\.location(\.href)*[ ]*\=/,
headStartMark:/<[Hh][Ee][Aa][Dd]([ ]|\>)/,
headEndMark:/<[ ]*\/[ ]*[Hh][Ee][Aa][Dd]>/,
bodyStartMark:/<[Bb][Oo][Dd][Yy]([ ]|\>)/,
bodyEndMark:/<[ ]*\/[ ]*[Bb][Oo][Dd][Yy]>/,
htmlEndMark:/<[ ]*\/[ ]*[Hh][Tt][Mm][Ll]>/,
htmlStartMark:/<[ ]*[Hh][Tt][Mm][Ll]>/,
getHtmlInnerHTML : function(html,enableJS,url,type,lazyLoad) {
    var s= html.replace(/top\.location(\.href)*[ ]*\=/g,"atoplocationhref=");
    if (!enableJS) {
        //<base href="http://bbs.chinaunix.net/forumdisplay.php?fid=46">
        
//        var headEnd = s.indexOf("</head>");
//        if (headEnd == -1)

        //remove the content before the first </html> if there is another <html>xxx</html>
        var htmlEnd = s.search(autopagerMain.htmlEndMark);
        if (htmlEnd>0)
        {
            var s2 = s.substring(htmlEnd+7);
            var htmlStart = s2.search(autopagerMain.htmlEndMark);
            if (htmlStart>0)
            {
                s2 = s2.substring(htmlStart);
                var htmlEnd2 = s2.search(autopagerMain.htmlEndMark);
                if (htmlEnd2>0)
                {
                    s =s2
                }
            }
        }

        htmlEnd = s.search(autopagerMain.htmlEndMark);        
        //htmlEnd = s.length
        if (htmlEnd>0)
            s = s.substring(0,htmlEnd);
        var bodyStart = s.search(autopagerMain.bodyStartMark);
        if (bodyStart>0)
            s = s.slice(bodyStart)
        var bodyEnd = s.search(autopagerMain.bodyEndMark);
        if (bodyEnd>0)
            s = s.substring(0,bodyEnd);
        
        //s = s.replace(/<script/g,"<!-- script");
        s = s.replace(/<[ ]*[Ss][Cc][Rr][Ii][Pp][Tt]/g,"<" + "!-- script");
        //s = s.replace(/ -- script/g,"-- script");

        s = s.replace(/<[ ]*\/[ ]*[Ss][Cc][Rr][Ii][Pp][Tt]>/g,"<\/script -->");
    }
    //s = "Location:" + url + "\n\n" + s;
    //alert(s);
    if (lazyLoad)
    {
        s = s.replace(/[ ]+[Ss][Rr][Rc]=(['\"])/g," ap-lazy-src=$1");
    }
    return s;
},
getHtmlHeadHTML : function(html,enableJS,url,type,lazyLoad) {
    var s= html.replace(/top\.location(\.href)*[ ]*\=/g,"atoplocationhref=");
    if (!enableJS) {
        //<base href="http://bbs.chinaunix.net/forumdisplay.php?fid=46">

//        var headEnd = s.indexOf("</head>");
//        if (headEnd == -1)

        //remove the content before the first </html> if there are two of them
        var htmlEnd = s.search(autopagerMain.htmlEndMark);
        if (htmlEnd>0)
        {
            var s2 = s.substring(htmlEnd+7);
            var htmlEnd2 = s2.search(autopagerMain.htmlEndMark);
            if (htmlEnd2>0)
            {
                s =s2.slice(s2.search(/</))
            }
        }

        htmlEnd = s.search(autopagerMain.htmlEndMark);
        //htmlEnd = s.length
        if (htmlEnd>0)
            s = s.substring(0,htmlEnd);
        var headStart = s.search(autopagerMain.headStartMark);

        var h = "<base href='" + url +
            "'><meta http-equiv='Content-Type' content='" + type +"'/> ";

        
        if (headStart >0)
        {
            var t= s.slice(headStart)
            s = h + t.slice(t.indexOf(">")+1);
        }
        else
            s = h+s;
        var headEnd = s.search(autopagerMain.headEndMark);
        if (headEnd >0)
            s = s.substring(0,headEnd);

        //s = s.replace(/<script/g,"<!-- script");
        s = s.replace(/<[ ]*[Ss][Cc][Rr][Ii][Pp][Tt]/g,"<" + "!-- script");
        //s = s.replace(/ -- script/g,"-- script");

        s = s.replace(/<[ ]*\/[ ]*[Ss][Cc][Rr][Ii][Pp][Tt]>/g,"<\/script -->");
    }
    //s = "Location:" + url + "\n\n" + s;
    //alert(s);
    if (lazyLoad)
    {
        s = s.replace(/[ ]+[Ss][Rr][Rc]=(['\"])/g," ap-lazy-src=$1");
    }
    return s;
},
getHtmlBody  : function(html,enableJS) {
    var s= html.replace(/top\.location(\.href)*[ ]*\=/g,"atoplocationhref=");
    if (!enableJS) {
        
        var bodyStart = s.indexOf("<body");
        if (bodyStart == -1)
            bodyStart = s.toLowerCase().indexOf("<body");
        if (bodyStart >0)
            s = "<div" +  s.slice(bodyStart + "<body".length);
        var bodyEnd = s.indexOf("body>");
        if (bodyEnd == -1)
            bodyEnd = s.toLowerCase().indexOf("body>");
        if (bodyEnd >0)
            s = s.slice(0,bodyEnd) + "div>";
    }
    //alert(s);
    return s;
},
getContentType : function(doc) {
    //var nodes = doc.getElementsByTagName("meta");
    var nodes  = doc.evaluate("//head/meta[@http-equiv='Content-Type']", doc, null, 0, null);
    
    for (var node = null; (node = nodes.iterateNext()); ) {
        if (node.content != "")
        {
            return node.content;
        }
    }
    var contentType = doc.contentType
    if (typeof contentType == "undefined" ||  contentType == 'undefined')
        contentType = "text/html";
    var type= contentType + "; charset=" + doc.characterSet;
    return type;
},
getSplitBrowserForDoc : function(doc,clone,listener) {
    return autopagerMain.getSplitBrowserForDocWithUrl(doc,null,clone,listener);
},
getSplitBrowserForDocWithUrl : function(doc,url,clone,listener) {
    
	var doClone = clone;
	if (clone && (doc.documentElement.autopagerSplitCloning==true))
	{
		doClone = false;
    }else
	{
		doc.documentElement.autopagerSplitCloning = clone;
    }
    var browse = AutoPagerNS.apSplitbrowse.getSplitBrowser(doc,url,true,doClone,listener);
    doc.documentElement.autopagerSplitCloning = false;
    if (clone && browse)
        browse.auotpagerContentDoc = doc;
    return browse;
},

getURLNoArch : function (url)
{
    if (url.indexOf("\#")==-1)
        return url
    return url.substring(0,url.indexOf("\#"));
},
getStack : function ()
{
    var stack = "";
  try {
       i.dont.exist+=0; //does not exist - that's the point
   } catch(e)
   {
       stack =  e.stack;
   }
   return stack;
      
},

loadToFrame : function (frame,responseText,contentType,contentCharset,enableJS,url)
{
    // Convert the HTML text into an input stream.
    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                    createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    var stream = converter.convertToInputStream(responseText);

    // Set up a channel to load the input stream.
    var channel = Cc["@mozilla.org/network/input-stream-channel;1"].
                  createInstance(Ci.nsIInputStreamChannel);
    channel.setURI(url);
    channel.contentStream = stream;

    // Load in the background so we don't trigger web progress listeners.
    var request = channel.QueryInterface(Ci.nsIRequest);
    request.loadFlags |= Ci.nsIRequest.LOAD_BACKGROUND;

    // Specify the content type since we're not loading content from a server,
    // so it won't get specified for us, and if we don't specify it ourselves,
    // then Firefox will prompt the user to download content of "unknown type".
    var baseChannel = channel.QueryInterface(Ci.nsIChannel);
    baseChannel.contentType = contentType;


    baseChannel.contentCharset = contentCharset;


    var docShell = frame.contentWindow;
    
    var webNav = docShell.QueryInterface(Ci.nsIWebNavigation);
    webNav.stop(Ci.nsIWebNavigation.STOP_NETWORK);
    
 //   frame.contentcontent.allowJavascript = false;
    docShell.allowAuth = false;
    docShell.allowPlugins = false;
    docShell.allowMetaRedirects = false;
    docShell.allowSubframes = false;
    docShell.allowImages = true;
    

    docShell.allowJavascript = enableJS;
    var uriLoader = Cc["@mozilla.org/uriloader;1"].getService(Ci.nsIURILoader);
    uriLoader.openURI(channel, true, docShell);
    
},
loadChannelToFrame : function (frame,channel,enableJS)
{
    
//    var webNav = frame.contentcontent.QueryInterface(Ci.nsIWebNavigation);
//    webNav.stop(Ci.nsIWebNavigation.STOP_NETWORK);

   var win = frame.contentcontent.QueryInterface(Ci.nsIDOMWindow);
 //   var docShell = win.QueryInterface(Ci.nsIDocShell);

//    frame.contentcontent.allowJavascript = false;
    frame.contentcontent.allowAuth = false;
    frame.contentcontent.allowPlugins = false;
    frame.contentcontent.allowMetaRedirects = false;
    frame.contentcontent.allowSubframes = false;
    frame.contentcontent.allowImages = true;
    
    
    frame.contentcontent.allowJavascript = enableJS;

    var uriLoader = Cc["@mozilla.org/uriloader;1"].getService(Ci.nsIURILoader);
    uriLoader.openURI(channel, true, frame.contentDocument);
    
},
getDocURL : function(doc,enableJS)
{
    var href = "";
    if (enableJS && doc.location!=null) {
        href = doc.location.href;
    }
    else {
        href = doc.baseURI;
    }    
//    if (href=="about:blank")
//    {
//        var nodes =doc.evaluate("//head/base", doc, null, 0, null);
//        for (var node = null; (node = nodes.iterateNext()); ) {
//            if (node.href != "about:blank")
//            {
//                href = node.href;
//                break;
//            }
//        }
//    }        
    return href;
},
removeElements : function (node,xpath,enableJS,useInnerXpath)
{
    //autopagerBwUtil.consoleLog(xpath);
    if (xpath==null || xpath.length==0)
        return;
    var doc = (node.ownerDocument == null) ? node : node.ownerDocument;
    var xpe = null;
    try{
        xpe = new XPathEvaluator();
    }catch(e)
    {
        xpe = doc
    }
    var nsResolver = xpe.createNSResolver(node);
    
//    alert(node.innerHTML)
    var aExpr
    for(var i=0;i<xpath.length;i++)
    {
       try{
			var orgPath = autopagerXPath.preparePath(doc,xpath[i],enableJS);
			aExpr = orgPath;
                        if (useInnerXpath)
                        {
                            aExpr = aExpr.replace(/^( )*\/\//g,"*//");
                            aExpr = aExpr.replace(/\|( )*\/\//g,"| *//");
                            //autopagerMain.removeElementByXPath(xpe,aExpr,nsResolver,node);
                            var aExpr2 = orgPath;
                            aExpr2 = aExpr2.replace(/^( )*\/\//g,"");
                            aExpr2 = aExpr2.replace(/\|( )*\/\//g,"| ");
                            if (aExpr != aExpr2)
                                            aExpr = aExpr + " | " + aExpr2;
                        }
			autopagerMain.removeElementByXPath(xpe,aExpr ,nsResolver,node);
        }catch(e)
       {
             autopagerMain.alertErr(e)
       }
    }
//   alert(node.innerHTML)
//    var nodes = autopagerMain.findNodeInDoc(node,xpath,enableJS);
  
},
removeElementByXPath : function (xpe,aExpr,nsResolver,node)
{
	try{
	    var xpathExpr = xpe.createExpression(aExpr,nsResolver)
        var result = xpathExpr.evaluate( node, 0, null);
        var res;
        var nodes = [];
        while ((res = result.iterateNext()))
        {
            nodes.push(res);
        }
  for(var k=0;k<nodes.length;++k) {
        nodes[k].parentNode.removeChild(nodes[k])
    }
        }catch(e)
       {
             autopagerMain.alertErr(e)
       }

},
xpath :"//table[tbody/tr/td/@class='f']",
getNavImage : function(nav){
    return "<img align='top' style='border: 0pt;height:18px;float:none;display:inline' src='" + autopagerUtils.getContentImage(nav+ "_24.png")  + "' alt='" + autopagerUtils.autopagerGetString("nav" + nav) + "' />";
},
getNavLinks : function(pos,sh,paging)
{
  var links = "<a id='autopager_" + (pos+0) + "' name='autopager_" + (pos+0) + "'/>";
  if (autopagerPref.loadBoolPref("show-nav-top"))
    links = links + "&nbsp;&nbsp;<a href='javascript:window.scroll(0,0)' title='" + autopagerUtils.autopagerGetString("navtop") + "'>" + autopagerMain.getNavImage("top") + "</a>";
  if (autopagerPref.loadBoolPref("show-nav-up"))
  {
      if (pos>2)
          links = links + "&nbsp;&nbsp;<a href='#autopager_" + (pos-1) +"' title='" + autopagerUtils.autopagerGetString("navup") + "'>" + autopagerMain.getNavImage("up") + "</a>";
      else //same as top if this is the first page break
          links = links + "&nbsp;&nbsp;<a href='javascript:window.scroll(0,0)' title='" + autopagerUtils.autopagerGetString("navup") + "'>" + autopagerMain.getNavImage("up") + "</a>";
  }
  if (autopagerPref.loadBoolPref("show-nav-down"))
    links = links + "&nbsp;&nbsp;<a href='#autopager_" + (pos+1) +"' title='" + autopagerUtils.autopagerGetString("navdown") + "'>" + autopagerMain.getNavImage("down") + "</a>";
  if (autopagerPref.loadBoolPref("show-nav-bottom"))
    links = links + "&nbsp;&nbsp;<a href='javascript:window.scroll(0,document.documentElement.scrollHeight)' title='" + autopagerUtils.autopagerGetString("navbottom") + "'>" + autopagerMain.getNavImage("bottom") + "</a>";
  if (autopagerPref.loadBoolPref("show-nav-immedialate-load"))
  {
    //http://member.teesoft.info/phpbb/viewtopic.php?f=5&t=3596
    links = links + "&nbsp;&nbsp;<a name='xxAutoPagerimmedialate-load' href='javascript:void(0)' title='" + autopagerUtils.autopagerGetString("immediately-load") + "'>"
        + autopagerUtils.autopagerGetString("Load") + "</a><input name='xxAutoPagerimmedialate-load-count' type='inputbox' size='1' value='" + autopagerPref.loadPref("immedialate-load-count") + "'></input>"
        + autopagerUtils.autopagerGetString("Pages") + "";
  }
  if (autopagerPref.loadBoolPref("show-rate"))
  {
      //is in the online repository in http://ap.teesoft.info
      if (/a?[0-9]+/.test(paging.site.guid))
      {
          links = links + "&nbsp;&nbsp;" + this.getRateDiv(paging);
      }
  }
  if (paging && paging.site.alertsHash)
  {
      var url =autopagerPref.loadPref("repository-site") + "view?id=" + paging.site.id
      links = links + "&nbsp;&nbsp;<a name='RuleAlert' target='_blank' href='" + url +"' title=\"" + autopagerUtils.autopagerGetString("alertforrule") + "\"><img align='bottom' style='border: 0pt;height:15px;float:none;display:inline' src='" + autopagerUtils.getContentImage("question.png")  + "' alt='question'</a>";
  }
  //links = links + "&nbsp;&nbsp;<a name='xxAlertTest' href='javascript:void(0)' title='test'>test</a>";
return links;
},
getRateDiv : function(paging)
{
    var rate = paging.getRate();
    var image =  "width:" + (rate/5 * 24) + "px;height:23px;position:absolute;top:0;left:0px;overflow:hidden;background: url(" + autopagerUtils.getContentImage("stars.png") + ") no-repeat " + (rate>=3? "0px 0px":"0px -31px");
    var title = "";
    if (rate >0)
        title = autopagerUtils.autopagerFormatString("rate",[rate]);
    else
        title = autopagerUtils.autopagerGetString("notrate");
    var div = "<div style='display: inline;'><a name='xxAutoPagerRate' href='javascript:void(0)' title='" + title + "' style='position:absolute;width:24px;height:23px;background: url(" + autopagerUtils.getContentImage("stars.png") + ") no-repeat 0px -61px;'>"
    + "<span name='xxAutoPagerRate' style='" + image + "'></span></a></div>";
    return div;
},
getNextUrl : function(container,enableJS,node) {
    if(node == null)
        return null;
    if (typeof node=="string")
        return autopagerMain.fixUrl(container,node,node);
    if (!enableJS && ((node.tagName == "A" || node.tagName == "a")) && node.href && (node.href.indexOf("javasript:")!=0))
        return autopagerMain.fixUrl(container,node.href,node.getAttribute("href"));
    if (node.tagName == "INPUT")
        return node;
    return node;
    
},
getPagingWatcherDiv : function(doc,create)
{
    var divName = "autoPagerBorderPaging";
    var div = doc.getElementById(divName);
    if (create && !div) {
        var str = autopagerUtils.autopagerGetString("loading");
        var style = autopagerMain.getLoadingStyle();
        div = autopagerMain.createDiv(doc,divName,style);
        div.innerHTML = str;//"<b>Loading ...</b>";
    }
    return div;
},
HighlightNextLinks : function(doc)
{
    if (!doc)
        doc = AutoPagerNS.getContentDocument();
    var urlNodes = autopagerMain.findNodeInDoc(doc,
            doc.documentElement.getAttribute('linkXPath'),doc.documentElement.getAttribute('enableJS') == 'true');
    if (urlNodes == null || urlNodes.length == 0)
        return;
    for(var i=0;i<urlNodes.length;i++)
        autopagerMain.createRegionDivs(doc,urlNodes[i],i,"blue");
    if (doc.documentElement.autopagerHighlightedNextLinkCount==null)
        doc.documentElement.autopagerHighlightedNextLinkCount = 0;
    if (doc.documentElement.autopagerHighlightedNextLinkCount<urlNodes.length)
        doc.documentElement.autopagerHighlightedNextLinkCount = urlNodes.length;
    if(doc.documentElement.autopagerHighlightedNextLinkNumber == null)
        doc.documentElement.autopagerHighlightedNextLinkNumber = 0;
    if (doc.documentElement.autopagerHighlightedNextLinkNumber >= urlNodes.length)
        doc.documentElement.autopagerHighlightedNextLinkNumber  = 0;
    var node = urlNodes[doc.documentElement.autopagerHighlightedNextLinkNumber];
    var left = autopagerMain.getOffsetLeft(node);
    var top = autopagerMain.getOffsetTop(node);
    doc.defaultView.scrollTo(left,top);
    node.focus();

    doc.documentElement.autopagerHighlightedNextLinkNumber ++;
},
HighlightAutoPagerContents : function(doc)
{
    if (!doc)
        doc = AutoPagerNS.getContentDocument();
    var urlNodes = autopagerMain.findNodeInDoc(doc,
            doc.documentElement.getAttribute('contentXPath'),doc.documentElement.getAttribute('enableJS') == 'true');
    if (urlNodes == null || urlNodes.length == 0)
        return;
    for(var i=0;i<urlNodes.length;i++)
        autopagerMain.createRegionDivs(doc,urlNodes[i],i);
    if (doc.documentElement.autopagerHighlightedNextLinkCount==null)
        doc.documentElement.autopagerHighlightedNextLinkCount = 0;
    if (doc.documentElement.autopagerHighlightedNextLinkCount<urlNodes.length)
        doc.documentElement.autopagerHighlightedNextLinkCount = urlNodes.length;
},
enabledInNextPagesAlways : function(doc,always)
{
    if (!doc)
        doc = AutoPagerNS.getContentDocument();
    var count = doc.getElementById("autopagercount").value;
    var countNumber = parseInt(count);
    if (isNaN(countNumber))
    {
        alert("please input a integer.");
        return;
    }
    autopagerMain.enabledInNextPages(true,countNumber);
    if (always)
    {
        autopagerUtils.setEnabledOnHost(true,doc);
        autopagerUtils.updateStatusIcons();
    }
},
enabledInThisTime : function(doc,enabled)
{
    if (!doc)
        doc = AutoPagerNS.getContentDocument();
    autopagerMain.enabledInNextPages(doc,enabled,1);
},
enabledInNextPages : function(doc,enabled,count)
{
    if (!doc)
        doc = AutoPagerNS.getContentDocument();
    var de =doc.documentElement;
    de.autopagerUserConfirmed= true;
    de.autopagerSessionAllowed= true;
    de.autopagerSessionAllowedPageCount = count;
    de.autopagerAllowedPageCount=de.autopagerPage+count;
    de.autopagerUserAllowed=enabled;
    de.setAttribute("autopagerEnabledSite", enabled);
     autopagerMain.hiddenOptionDiv(doc);
     autopagerMain.scrollWatcher(doc);
},
hiddenOptionDiv : function(doc)
{
    autopagerMain.hiddenDiv(doc.getElementById("autoPagerLabel"),true);
    
    //alert(doc.documentElement.autopagerHighlightedNextLinkCount)
    for(var i=0;i<doc.documentElement.autopagerHighlightedNextLinkCount;i++)
    {
    try{
        autopagerMain.hiddenRegionDivs(doc,i);
    }catch(e)
    {}
    }
    doc.documentElement.autopagerHighlightedNextLinkCount = 0;
},
enabledThisSite : function(doc,enabled)
{
    if (!doc)
        doc = AutoPagerNS.getContentDocument();
    autopagerMain.enabledInThisSession(doc,enabled);
    autopagerUtils.setEnabledOnHost(enabled,doc);
    autopagerUtils.setConfirmedOnHost(true,doc);
    autopagerUtils.updateStatusIcons();
},
enabledInThisSession : function(doc,enabled)
{
    if (!doc)
        doc = document.content;
    var obj =doc.documentElement;
    if (typeof autopagerUtils.getAutoPagerObject(doc.documentElement) != "undefined")
        obj = autopagerUtils.getAutoPagerObject(doc.documentElement)

    obj.autopagerUserConfirmed= true;
    obj.autopagerSessionAllowed= enabled;
    obj.autopagerAllowedPageCount=-1;
    obj.autopagerUserAllowed=enabled;
    obj.autopagerEnabledSite = enabled
    //obj.setAttribute("autopagerEnabledSite", enabled);
     autopagerMain.hiddenOptionDiv(doc);
     if (typeof obj.scrollWatcher != "undefined")
        obj.scrollWatcher(doc);
},
fixUrl : function(doc,url,realUrl) {
    if(url.indexOf(doc.location.protocol) == 0)
    {
         if ("?"!=realUrl.substr(0,1))
             return url;
         else{
             var newS = doc.location.href
             if (newS.indexOf("?")>0)
                 newS = newS.substr(0,newS.indexOf("?"))
             return newS + realUrl;
         }                     
    }
        //alert(doc.location);
        var newStr=doc.location.protocol +"//"+ doc.location.host;
    if ( doc.location.port.length >0)
        newStr += ":" + doc.location.port;
    //
    if(url.substring(0,1) != "/")
        newStr += doc.location.pathname.substring(0, 
        doc.location.pathname.lastIndexOf("/")+1);
    newStr += url;
    //alert(newStr);
    return  newStr;
},
findLinkInDoc : function(doc,path,enableJS) {
        var tmpNodes = autopagerMain.findNodeInDoc(doc,path,enableJS)
        var urlNodes = []
        for(var m in tmpNodes)
        {
            if (tmpNodes[m] && autopagerUtils.isValidLink(tmpNodes[m]) )
            {
                urlNodes.push(tmpNodes[m])
                break;
            }
        }
        if (urlNodes == null || urlNodes.length ==0)
        {
            for(var m in tmpNodes)
            {
                if (tmpNodes[m] )
                {
                    var node = autopagerUtils.getValidLink(tmpNodes[m])
                    if (node!=null)
                    {
                        urlNodes.push(node)
                        break;
                    }
                }
            }
        }
        return urlNodes;
},
findNodeInDoc : function(doc,path,enableJS) {
    autopagerMain.xpath = path;
    if (path==null)
        return null;
    else if (autopagerMain.xpath.length>0 && autopagerMain.xpath[0].length == 1)
        return autopagerXPath.evaluate(doc,autopagerMain.xpath,enableJS);
    else {
        var result = autopagerXPath.evaluate(doc,autopagerMain.xpath[0],enableJS);
        for(var i=1;i<autopagerMain.xpath.length;i++) {
            var nodes = autopagerXPath.evaluate(doc,autopagerMain.xpath[i],enableJS);
            for(var k=0;k<nodes.length;++k) {
                result.push( nodes[k]);
            }
        }
        return result;
    }
    
},
showAutoPagerMenu : function(menuid) {
    if (!menuid)
        menuid="autopager-popup";
    var popup = document.getElementById(menuid);
    popup.hidden=false;
    var popuphidden = function(ev) {
        if(ev.currentTarget != ev.target) return;
        ev.target.removeEventListener("popuphidden", popuphidden, false);
        ev.target.hidden=true;
    }
    popup.addEventListener("popuphidden", popuphidden, false);    
    popup.showPopup();
    
}
,
onEnable : function() {
    var enabled = !autopagerPref.loadBoolPref("enabled");
    autopagerPref.saveBoolPref("enabled",enabled);
    autopagerBwUtil.updateStatus(enabled, autopagerLite.getMatchedRules(AutoPagerNS.getContentDocument()),0,{})
    this.handleCurrentDoc();
},
statusClicked : function(event) {
    if(event.currentTarget != event.target) return;
    if(event.button == 2) {
        event.preventDefault();
        autopagerMain.showAutoPagerMenu();
    }
    else if(event.button == 0) {
        var popup = document.getElementById("autopager-popup");
        popup.hidden=true;
        popup.hidePopup();
        autopagerMain.onEnable();
    }
},
setGlobalImageByStatus : function(enabled) {
    try{
        if (enabled)
            autopagerMain.setGlobalStatusImage("chrome://autopager/skin/autopager-small.on.gif");
        else
            autopagerMain.setGlobalStatusImage("chrome://autopager/skin/autopager-small.off.gif");
    }catch(e) {
        //autopagerBwUtil.consoleError(e);
    }
},
setGlobalStatusImage : function(url) {
    var image = document.getElementById("autopager_status");
    image.src=url;
},
saveMyName : function(myname) {
    autopagerPref.saveUTF8Pref("myname", myname); // set a pref
},
loadMyName  : function() {
    try{        
        return autopagerPref.loadUTF8Pref("myname"); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
getLoadingStyle : function()
{
 try{
        
        return autopagerPref.loadUTF8Pref("loading"); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
getOptionStyle : function()
{
 try{
        
        return autopagerPref.loadUTF8Pref("optionstyle"); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
setLoadingStyle : function(value)
{
 try{
        
        autopagerPref.saveUTF8Pref("loading",value); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
},

logInfo : function(status,tip) {
//    autopagerBwUtil.consoleLog(status);
//    autopagerBwUtil.consoleLog(tip);
    return;
},
logInfoDebug : function(status,tip) {
    //AutoPagerNS.window.status = status;
    var tooltip = document.getElementById("autopager_tip");
    
    var tips = tip.split("\n");
    var tipCount = tooltip.childNodes.length;
    for(var i=0;i<tips.length;++i)
        tooltip.appendChild(tooltip.childNodes[0].cloneNode(true));
    for(var i=0;i<tips.length;i++)
        tooltip.childNodes[i+tipCount].value = tips[i];
},
    getAllEnabledDoc : function(doc)
    {
        var de = doc.documentElement;
        var docs = [];
        if (doc.location && autopagerUtils.getAutoPagerObject(de) != null)
        {
            docs.push(doc);
        }
        if (doc.defaultView && doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            for(var i=0;i<doc.defaultView.frames.length;++i) {
                var frame = doc.defaultView.frames[i].document;
                var subdocs = this.getAllEnabledDoc(frame)
                for(var d=0;d<subdocs.length;d++)
                {
                    docs.push(subdocs[d]);
                }
            }
        }
        return docs;
    },
changeMyName : function() {
    var name = prompt(autopagerUtils.autopagerGetString("inputname"),autopagerMain.loadMyName());
    if (name!=null && name.length>0) {
        autopagerMain.saveMyName(name);
    }
    return name;
},
alertErr : function(e) {
//    autopagerMain.logInfo(e,e);
//    this.log(e);
    //if (this.autopagerDebug)
    autopagerBwUtil.consoleError(e);
}
,    log:function(message) {
        if (autopagerPref.loadBoolPref("debug"))
        {
            autopagerBwUtil.consoleLog(message)            
        }
      }
	, getMiniMargin : function()
	{
			return autopagerPref.loadPref("miniheight");
    }
	, getDefaultMargin : function()
	{
			return autopagerPref.loadPref("defaultheight");
    }
	,     
  getPreloadXPaths : function ()
  {
    var xPathlists = [];
    var extensionsXPath = {
      "{a0d7ccb3-214d-498b-b4aa-0e8fda9a7bf7}": "//style" //WOT
    }
    var list = autopagerUtils.getAddonsList();
    var len = list.length;

    for (var j = 0; j < len; j++) {
      var curExt = list[j];
      if (extensionsXPath[curExt]) {
        xPathlists.push(extensionsXPath[curExt]);
      }
    }
    return xPathlists;

  },
  getDelayMiliseconds : function()
  {
    return autopagerPref.loadPref("loadingDelayMiliseconds");
  },
  getMinipages : function()
  {
    return autopagerPref.loadPref("minipages");
  },
  onToolbarClick : function (event)
  {
    if (event.eventPhase != event.AT_TARGET)
	return;
    if (!autopagerLite.isInLiteMode())
        autopagerMain.showWorkshop();
    else
        autopagerLite.openRulesSelector(AutoPagerNS.getContentDocument());            
  },
  showWorkshop : function()
  {
    if (autopagerPref.loadBoolPref("show-workshop-in-sidebar") && typeof toggleSidebar!="undefined")
        toggleSidebar('autopagerSiteWizardSidebar');
    else
        autopagerBwUtil.openWorkshopInDialog();
  },
 showDonation : function()
    {
        AutoPagerNS.add_tab({url:"http://autopager.teesoft.info/donation.html"});
    },
 showRules : function()
    {
        AutoPagerNS.add_tab({url:"http://autopager.teesoft.info/rules.html"});
    },
 showTutorials : function()
    {
        AutoPagerNS.add_tab({url:"http://autopager.teesoft.info/tutorials.html"});
    }
    ,sendEnableEvent:function(doc)
    {
        var event = doc.createEvent("Events");
        if (autopagerPref.loadBoolPref("enabled"))
            event.initEvent("AutoPagerEnabled", true, true);
        else
            event.initEvent("AutoPagerDisabled", true, true);
        try{
            doc.dispatchEvent(event)
        }catch(e)
        {}
        
    }
    ,disableRule : function (id)
    {
        var disabledRules = autopagerPref.loadPref("disabled-rules")
        if (disabledRules && (',' + disabledRules + ',').indexOf(',' + id + ','))
            return;
        if (disabledRules)
            disabledRules = disabledRules + ',' + id
        else
            disabledRules = id
        autopagerPref.savePref("disabled-rules",disabledRules)
    }
};
