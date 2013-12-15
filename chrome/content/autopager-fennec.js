//fennc global routers
AutoPagerNS.message = AutoPagerNS.extend (AutoPagerNS.namespace("message"),
{
    do_call_function_on_object : function(messager,msgname,msg)
    {
        try{
            if (typeof messager != "undefined")
            {
                messager.sendAsyncMessage(msgname,msg)
            }
            else
            {
                messageManager.sendAsyncMessage(msgname,msg)
            }            
        }catch(e){
            autopagerBwUtil.consoleError("error call_function_on_object:" + msg.fn + ":" + messager + ":" + e) 
        }
    }
}
);

AutoPagerNS = AutoPagerNS.extend(AutoPagerNS,{
    get_browser_name : function ()
    {
        return "fennec";
    },
    do_get_windows : function () //get browser windows
    {
        //return browsers for fennec
        return Browser.browsers;
    }
    ,
    do_get_tabs : function (win) //get browser tab
    {
        return [Browser.getTabForBrowser(win)];
    }
    ,
    do_get_current_window : function () //get current browser window
    {
        return Browser.selectedBrowser;
    }
    ,
    do_get_current_tab : function () //get current browser tab
    {
        return Browser.selectedTab;
    }
    ,
    get_messager : function (tab) //get messager
    {
        if (tab && tab.browser)
            return tab.browser.messageManager;
        return null;
    }
    ,
    get_tab_content : function (tab) //get messager
    {
        if (tab && tab.browser)
        {
            return tab.browser.contentDocument;
        }
        return null;
    }
    ,get_tab_url : function (tab) //get messager
    {
        if (tab && tab.browser)
        {
            return tab.browser.documentURI.spec;
        }
        return null;
    }
    ,close_tab : function (tab) //get tab_url
    {
        if(tab)
        {
            BrowserUI.closeTab(tab)
        }
    }    
    ,
    get_url : function (relative)
    {
        if (relative.indexOf("/")==0)
            relative = relative.substr(1);
        return "chrome://autopager/" + relative;
    }
})

var autopagerServer = {
    onLoad: function() {
        var str=""
        for(var k in Browser.selectedBrowser)
            str += k + " "
//        autopagerBwUtil.consoleLog("browser:" + str) 

        // initialization code
//        autopagerBwUtil.consoleLog("autopagerServer onLoad")
        messageManager.loadFrameScript("chrome://autopager/content/autopager-namespace.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-bw-utils.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-shared.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-content.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-bw-content.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-strings.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-utils.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-pref-content.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-fennec-content.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/splitbrowse.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/apxmlhttp.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopagerize.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-xpath.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-lite.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-json.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-rules-content.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-updatesites.js", true);        
        messageManager.loadFrameScript("chrome://autopager/content/autopager-paging.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-troubleshoting.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-sitesetting.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-description.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-highlight.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-related.js", true);
        messageManager.loadFrameScript("chrome://autopager/content/autopager-end.js", true);
    },
    getCurrentTabMessageManager : function ()
    {
        if (Browser.selectedTab && Browser.selectedTab.browser)
            return Browser.selectedTab.browser.messageManager;
        return null;
    }
    ,
    disableOnSite : function()
    {
        var tab = this.getCurrentTabMessageManager();
        if (tab)
            AutoPagerNS.message.call_function_on_object("autopager_disbale_on_site",
            {},function (options){
                autopagerBwUtil.updateStatus(autopagerPref.loadBoolPref("enabled"),!options.site_disabled,options.discovered_rules,options)
            },tab);
    }
    ,
    openRuleSelector : function ()
    {
        if (Browser.selectedTab && Browser.selectedTab.browser && Browser.selectedTab.browser.currentURI)
            autopagerLite.openRulesSelectorForUrl(Browser.selectedTab.browser.currentURI.spec);
        
    },
    autopager_open_xpather: function ()
    {
        var xpath = prompt(autopagerUtils.autopagerGetString("setting.label.lblSettingXPath"))
        if (xpath)
        {
            AutoPagerNS.get_current_tab(function(tab) {
    //            autopagerBwUtil.consoleLog("autopager_open_xpather:" + autopagerUtils.dumpObject(tab,1)) 
                if (tab)
                    AutoPagerNS.message.call_function_on_object("autopager_test_xpath_content",{xpath:xpath},function(){},AutoPagerNS.get_messager(tab));
            })        
            
        }
    }
    , 
    optionPageUrl : ""
    , 
    autopagerDisabledOnSite : false,
}
AutoPagerNS.message_handlers = AutoPagerNS.extend (AutoPagerNS.namespace("message_handlers"),{
    autopager_set_site_status: function (request, sender, callback)
    {
        autopagerServer.autopagerDisabledOnSite = request.options.site_disabled;
        AutoPagerNS.message_handlers["superObj"].autopager_set_site_status(request, sender, callback)
    }
    ,
    autopager_update_site_status: function (request, sender, callback)
    {
        autopagerServer.autopagerDisabledOnSite = request.options.site_disabled;
        AutoPagerNS.message_handlers["superObj"].autopager_update_site_status(request, sender, callback)
    }
    ,
    autopager_open_notification : function(request, sender, callback) {
        function createButtonDelegate (b,btn)
        {
            return function(){
                callback({button:b});
            }
        }
        var options = request.options
        var buttons = options.buttons
//        //adjust callback
        for(var b in buttons)
        {
            var btn = buttons[b]
            if (btn.callback)
               btn.callback = createButtonDelegate(b,btn)
        }
        autopagerBwUtil.notification(options.id,options.message,buttons);
    }
})


//autopagerBwUtil.consoleLog("messageManager.addMessageListener APInternalMessage")
messageManager.addMessageListener(AutoPagerNS.message.msgname,function(event) {
//    autopagerBwUtil.consoleLog("messageManager APInternalMessage")
    if (event && event.name==AutoPagerNS.message.msgname && event.json && event.json.fn)
    {
        AutoPagerNS.message.request_handler(event.json,event.target.messageManager)
    }
});


AutoPagerNS.browser = AutoPagerNS.extend (AutoPagerNS.namespace("browser"),
{
    post_init : function()
    {
        window.addEventListener("load", function(e) {
            autopagerServer.onLoad(e);
//            autopagerBwUtil.consoleLog("autopagerServer init in global window")
            AutoPagerNS.apSplitbrowse.init();
            //autopagerConfig.autopagerUpdate();
        }, false);
    }
    ,
    open_alert : function (title,message,link,callback,options)
    {
        var listener = {
            observe: function(subject, topic, data) {
                if (topic == "alertclickcallback" && callback)
                    callback();
            }
        }

        var alerts =  Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
        alerts.showAlertNotification("chrome://autopager/skin/autopager48.png", title,
            message, true, "", listener);      
    }
});