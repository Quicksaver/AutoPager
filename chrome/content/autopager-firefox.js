//firefox global routers
AutoPagerNS.message = AutoPagerNS.extend (AutoPagerNS.namespace("message"),
    {
        do_call_function_on_object : function(messager,msgname,msg)
        {
            //call directly
            AutoPagerNS.message.request_handler(msg,messager);
        }
    }
    );
        
autopagerBwUtil = AutoPagerNS.extend (autopagerBwUtil,
{
    supportHiddenBrowser : function ()
    {
        return !autopagerPref.loadBoolPref("disable-hidden-browser");
    }
})
    
if (typeof autopagerRules != "undefined")    
autopagerRules = AutoPagerNS.extend (autopagerRules,
{
    autopagerCOMP:null,
    ignoresites : null,
    ignoreRegex : null,    
    getAutopagerCOMP : function ()
    {
        if (this.autopagerCOMP == null)
        {
            // this is needed to generally allow usage of components in javascript
            //netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
            this.autopagerCOMP = Components.classes['@www.teesoft.com/AutopagerCOMP;1'].getService().wrappedJSObject;
        }
        return this.autopagerCOMP;
    },
    getNextMatchedSiteConfig: function(url,pos,matchCallBack)
    {
        var posNew = this["superObj"].getNextMatchedSiteConfig(url,pos);
        
        var ret = matchCallBack(posNew); 
        if ((!ret) && posNew!=null)
        {
            this.getNextMatchedSiteConfig(url,posNew,matchCallBack)
        }
    },
    discoverRule: function(url,matchCallBack)
    {
        if (autopagerPref.loadBoolPref("with-lite-discovery"))
        {
            if (autopagerPref.loadBoolPref("mode-prompted") && autopagerPref.loadBoolPref("lite-discovery-prompted"))
            {
                this.doDiscoverRule(url,matchCallBack);
            }
            else
                autopagerLite.promptLiteDiscovery();
        }
        else
            matchCallBack(null);
    }
    ,
    doDiscoverRule: function(url,matchCallBack)
    {
        if (!autopagerPref.loadBoolPref("enabled"))
            return null;
        var patterns = this.getAutopagerCOMP().getPatterns();
        if (patterns)
        {
            for(var i=0;i<patterns.length;i++)
            {
                var pattern = patterns[i];
                var p = pattern.rg || autopagerUtils.getRegExp2(pattern);
                if (p.test(url)) {
                    matchCallBack(pattern);
                    return p;
                }
            }
        }
        matchCallBack(null);
        return null;
    }
    ,
    getPublishingSite : function ()
    {
        return this.getAutopagerCOMP().getPublishingSite();
    },
    setPublishingSite : function (publishingSite)
    {
        this.getAutopagerCOMP().setPublishingSite(publishingSite);
    }
    ,
    isAllowUpdate : function()
    {
        return true;
    }
    ,
    resetAll : function()
    {
        var allSiteSetting = this.getAutopagerCOMP().loadAll();
        if (allSiteSetting != null)
        {
            for(var k in allSiteSetting)
            {
                var setting = allSiteSetting[k]
                if (setting)
                {
                    var newSetting=[];
                    newSetting.updateSite = setting.updateSite
                    allSiteSetting[k] = newSetting
                }
            }
            this.getAutopagerCOMP().setAll(allSiteSetting);
        }
    }
})

AutoPagerNS = AutoPagerNS.extend(AutoPagerNS,{
    get_browser_name : function ()
    {
        return "firefox";
    },
    do_get_windows : function () //get browser windows
    {
        var wm = Components.classes['@mozilla.org/appshell/window-mediator;1']
            .getService(Components.interfaces.nsIWindowMediator);
        var winEnum = wm.getEnumerator("navigator:browser");
        var wins=[];
        while(winEnum.hasMoreElements()) {
            var win = winEnum.getNext();
            wins.push(win)
        }                    
        //return browsers for fennec
        return wins;
    }
    ,
    do_get_tabs : function (win) //get browser tab
    {
        if (win && win.getBrowser && win.getBrowser() && win.getBrowser().tabContainer)
        {
            var tabs = []
            var tabList = win.getBrowser().tabContainer.childNodes;
            var length=tabList.length
            for (var i=0;i<length;i++)
                    tabs.push(tabList[i]);

            return tabs;            
        }
        return [Browser.getTabForBrowser(win)];
    }
    ,
    do_get_current_window : function () //get current browser window
    {
        var wm = Components.classes['@mozilla.org/appshell/window-mediator;1']
            .getService(Components.interfaces.nsIWindowMediator);
        var win = wm && wm.getMostRecentWindow('navigator:browser', true);
        return win;
    }
    ,
    do_get_current_tab : function () //get current browser tab
    {
        var win = this.do_get_current_window()
        if (win)
            return win.getBrowser().selectedTab
        return null;
    }
    ,
    get_messager : function (tab) //get messager
    {
        return tab && tab.linkedBrowser;
    }
    ,
    get_tab_content : function (tab) //get messager
    {
        if (tab && tab.linkedBrowser)
            return tab.linkedBrowser.contentDocument;
        return null;
    }
    ,
    get_url : function (relative)
    {
        if (relative.indexOf("/")==0)
            relative = relative.substr(1);
        return "chrome://autopager/" + (relative);
    }
})

AutoPagerNS.browser = AutoPagerNS.extend (AutoPagerNS.namespace("browser"),
{
    open_alert : function (title,message,link,callback,options)
    {
        window.openDialog("chrome://autopager/content/alert.xul",
                "alert:alert",
                "chrome,dialog=yes,titlebar=no,popup=yes",
                title,message,link,callback,options && options.openTimeout);
    }
});
//
//autopagerBwUtil.consoleLog("messageManager.addMessageListener APInternalMessage")
//messageManager.addMessageListener(AutoPagerNS.message.msgname,function(event) {
//    autopagerBwUtil.consoleLog("messageManager APInternalMessage")
//    if (event && event.name==AutoPagerNS.message.msgname && event.json && event.json.fn)
//    {
//        AutoPagerNS.message.request_handler(event.json,event.target.messageManager)
//    }
//});
//window.addEventListener("load", function(e) {
//    autopagerServer.onLoad(e);
//    autopagerBwUtil.consoleLog("autopagerServer init in global window")
//    AutoPagerNS.apSplitbrowse.init();
//    setTimeout(autopagerToolbar.autopagerToobarInit, 250);
//    autopagerConfig.autopagerUpdate();
//}, false);

AutoPagerNS.message_handlers = AutoPagerNS.extend (AutoPagerNS.namespace("message_handlers"),{
    autopager_get_addon_urlprefix : function(request, sender, callback)
    {
//        autopagerBwUtil.consoleLog("autopager_get_addon_urlprefix")
        if (!callback)
            return;
        var prefs = autopagerPref.userPrefValues()
//        autopagerBwUtil.consoleLog("autopager_get_prefs:" + prefs)
        callback({urlPrefix:"chrome://autopager/"});
    }
}
)

window.addEventListener("load", function(e) {
    var toolbox = document.getElementById("navigator-toolbox");
    if (toolbox)
    {
        toolbox.addEventListener("DOMNodeInserted",autopagerBwUtil.toolbarDisableMonitor,false);
        toolbox.addEventListener("DOMNodeRemoved",autopagerBwUtil.toolbarDisableMonitor,false);               
    }
}, false);

