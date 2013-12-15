//common routers for global pages
AutoPagerNS.message_handlers = AutoPagerNS.extend (AutoPagerNS.namespace("message_handlers"),{
    autopager_get_content_status: function (request, sender, callback)
    {
        if (callback)
            callback({
                site_disabled:!autopagerUtils.isEnabledOnHost(),
                discovered_rules :  autopagerLite.getMatchedRules(AutoPagerNS.getContentDocument())
                });
    //opera.tabs.sendRequest(request.options.tabid,request,callback);
    }
    ,
    autopager_set_content_status: function (request, sender, callback)
    {
        if (request && request.options && (typeof request.options.site_disabled != 'undefined'))
        {
            autopagerUtils.setEnabledOnHost(!request.options.site_disabled)
            autopagerUtils.setConfirmedOnHost(true)
        }
        if (!request.options.site_disabled)
            autopagerMain.handleCurrentDoc();
        if(callback)
            callback(request.options)
    }
    ,
    autopager_retry: function (request, sender, callback)
    {
        autopagerMain.clearLoadedPages(AutoPagerNS.getContentDocument());
        if(callback)
            callback(request.options)
    }
    ,
    autopager_disbale_on_site: function (request, sender, callback)
    {
        try{
            //revert enabled status
            var enabled = !autopagerUtils.isEnabledOnHost();
            autopagerUtils.setEnabledOnHost(enabled)
            if (enabled)
                autopagerMain.handleCurrentDoc();            
        }catch(e){
            autopagerBwUtil.consoleError(e)
        }
        if (callback)
            callback({
                site_disabled:!enabled,
                discovered_rules :  autopagerLite.getMatchedRules(AutoPagerNS.getContentDocument())
                });
    }    
    ,
    autopager_test_xpath_content: function (request, sender, callback)
    {
        if (request && request.options && (typeof request.options.xpath != 'undefined'))
        {
            var xpath = request.options.xpath
            var doc = AutoPagerNS.getContentDocument();
            var results =autopagerXPath.evaluate(doc,"(" + xpath + ")[not (@class='autoPagerS')]",true,20);
            try{
                autopagerHightlight.HighlightNodes(doc,results,-1,"blue",true);                
            }catch(e){
                autopagerBwUtil.consoleError(e)
            }                       
        }
    }
    ,
    autopager_open_xpather: function (request, sender, callback)
    {
        var xpath = prompt(autopagerUtils.autopagerGetString("setting.label.lblSettingXPath"))
        if (xpath)
        {
            var doc = AutoPagerNS.getContentDocument();
            var results =autopagerXPath.evaluate(doc,"(" + xpath + ")[not (@class='autoPagerS')]",true,20);
            autopagerHightlight.HighlightNodes(doc,results,-1,"blue",true);
        }
    }
    ,
    autopager_clean_highlight: function (request, sender, callback)
    {
        autopagerHightlight.HideAll(AutoPagerNS.getContentDocument());
    }
    ,
    autopager_pickup_xpath: function (request, sender, callback)
    {
        if (!callback)
            return;
        AutoPagerNS.window.blur();
        setTimeout(AutoPagerNS.window.focus, 0);   
        var as = AutoPagerNS.getContentDocument().getElementsByName("a")
        if (as && as.length>0)
            as[0].focus();
        
        //            alert("This function is not implemented yet.Please wait for next versions.");
        autopagerSelector.clearFunctions();
        autopagerSelector.registorSelectFunction(function (elem){
            AutoPagerNS.window.blur();
            var doc = elem.ownerDocument;
            var nodes = [];
            nodes.push(elem);

            var xpathes = [];
            xpathes = autopagerXPath.discoveryMoreLinks(doc,xpathes,nodes);
            callback({
                xpathes:xpathes
            })
            if (xpathes && xpathes.length>0)
            {
                var xpath = xpathes[0].xpath
                var results =autopagerXPath.evaluate(doc,"(" + xpath + ")[not (@class='autoPagerS')]",true,10);
                autopagerHightlight.HighlightNodes(doc,results,-1,"blue",true);
            }
        //                  autopagerSidebar.showXPathList(AutoPagerNS.getContentDocument().getElementById("autoContentPathTreeBody"),links)
        //
        //                  AutoPagerNS.window.focus();
        //                  if (links.length>0)
        //                  {
        //                    AutoPagerNS.getContentDocument().getElementById("contentXPath").value = links[0].xpath;
        //                    autopagerSidebar.searchXPath(links[0].xpath,AutoPagerNS.getContentDocument().getElementById("resultsFrame2"),"status2",autopagerSidebar.contentColor,false);
        //                  }
        //
        //                  AutoPagerNS.getContentDocument().getElementById("xpathDeck").selectedIndex = 0;
        //                  AutoPagerNS.getContentDocument().getElementById("contentXPath").focus();

        });
        autopagerSelector.registorStartFunction(function (){
            //              AutoPagerNS.getContentDocument().getElementById("xpathDeck").selectedIndex = 1;
            });
        autopagerSelector.registorQuitFunction(function (){
            //              AutoPagerNS.getContentDocument().getElementById("xpathDeck").selectedIndex = 0;
            });

        autopagerSelector.start({
            contentWindow:AutoPagerNS.window,
            contentDocument:AutoPagerNS.getContentDocument()
        });
    }
    ,
    autopager_set_prefs: function (request, sender, callback) {
        var msg = request.options
        var prefs = msg.prefs
        autopagerPref.autopager_set_prefs(prefs,true);
    //            for(var k in prefs)
    //            {
    //                var pref = prefs [k]
    //                var name = k
    //                if (name.indexOf("default-of-")>=0)
    //                    name =  name.substr(name.indexOf("default-of-")+11);
    //                autopagerPref.saveDefaultPref(name, pref);
    //                if (name=="enabled")
    //                    autopagerMain.handleCurrentDoc();
    //        
    //                autopagerBwUtil.consoleLog("autopager_set_pref:" +name + ":" +  pref)
    //            }
    }
    ,
    autopager_executeOnCurrentUrl : function(request, sender, callback)
    {
        callback({
            url:AutoPagerNS.getContentDocument().location.href
        })
    }
}
)
AutoPagerNS.browsercontent = AutoPagerNS.extend (AutoPagerNS.namespace("browsercontent"),
{
    post_init : function()
    {
        autopagerPref.init();
        var domLoad = function(ev) {
            AutoPagerNS.browser.removeEventListener("DOMContentLoaded", domLoad, false);
            AutoPagerNS.browser.removeEventListener("load", domLoad, false);
            try
            {
                if (typeof autopagerMain!="undefined")
                    autopagerMain.autopagerOnLoad(ev);
                if (typeof autopagerLite!="undefined")
                    autopagerLite.apRuleSiteOnInit(ev);
            }catch(e){
                autopagerBwUtil.consoleError("DOMContentLoaded with error:" + e)
            }
        }
        AutoPagerNS.browser.addEventListener("DOMContentLoaded", domLoad, false);               
        AutoPagerNS.browser.addEventListener("load", domLoad, false);  
        
//        if (typeof document!="undefined")
//        {
//            if (typeof autopagerMain!="undefined")
//                autopagerMain.autopagerOnLoad(document);
//            if (typeof autopagerLite!="undefined")
//                autopagerLite.apRuleSiteOnInit(document);
//        }
    }
})