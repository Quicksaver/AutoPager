//common routers for global pages
AutoPagerNS.message_handlers = AutoPagerNS.extend (AutoPagerNS.namespace("message_handlers"),{
    autopager_reportissue: function (request, sender, callback)
    {
        AutoPagerNS.get_current_tab(function(tab) {
                var result = autopagerBwUtil.autopagerOpenIntab("http://autopager.teesoft.info/reportissues/" + AutoPagerNS.get_tab_url(tab));
                callback(result);
        });
    }
    ,
    autopager_requesthelp: function (request, sender, callback)
    {
        AutoPagerNS.get_current_tab(function(tab) {
                var result = autopagerBwUtil.autopagerOpenIntab("http://autopager.teesoft.info/requestsites/" + AutoPagerNS.get_tab_url(tab));
                callback(result);
        });
    }
    ,
    autopager_get_status: function (request, sender, callback)
    {        
        request.options.disabled = !autopagerPref.loadBoolPref("enabled");
        request.fn = "autopager_get_content_status";
        var called = false;
        var mycallback=function(msg){
            called = true;
//            autopagerBwUtil.consoleLog("autopager_get_status mycallback:" + msg.site_disabled)
            if (callback)
                callback({
                    disabled:!autopagerPref.loadBoolPref("enabled"),
                    site_disabled:msg.site_disabled,
                    discovered_rules :  msg.discovered_rules,
                    litemode:autopagerLite.isInLiteMode()
                });
            autopagerBwUtil.updateStatus(autopagerPref.loadBoolPref("enabled"),!msg.site_disabled,msg.discovered_rules,request.options)
        };
        AutoPagerNS.get_current_tab(function(tab) {            
            var messager = AutoPagerNS.get_messager(tab);
//            autopagerBwUtil.consoleLog("autopager_get_status:" + autopagerUtils.dumpObject(tab,1)) 
            if (messager)
                AutoPagerNS.message.call_function_on_object(request.fn,autopagerUtils.clone(request.options),mycallback,messager);

            window.setTimeout(function(){
                if (!called)
                {
//                    autopagerBwUtil.consoleLog("fallback call")
                    mycallback({
                        site_disabled:!autopagerPref.loadBoolPref("enabled")
                    });
                }

            }, 200);
        })
        
    }
    ,
    autopager_set_status: function (request, sender, callback)
    {
        AutoPagerNS.get_current_tab(function(tab) {            
            var messager = AutoPagerNS.get_messager(tab);
            if (messager)
                AutoPagerNS.message.call_function_on_object(request.fn,autopagerUtils.clone(request.options),callback,messager);
        
        });
    }
    ,
    autopager_get_site_status: function (request, sender, callback)
    {
        AutoPagerNS.get_current_tab(function(tab) {            
            var messager = AutoPagerNS.get_messager(tab);
            if (messager)
                AutoPagerNS.message.call_function_on_object(request.fn,autopagerUtils.clone(request.options),callback,messager);
        
        });
    }
    ,
    autopager_set_site_status: function (request, sender, callback)
    {
        AutoPagerNS.get_current_tab(function(tab) {            
            var messager = AutoPagerNS.get_messager(tab);
            if (messager)
                AutoPagerNS.message.call_function_on_object("autopager_set_content_status",autopagerUtils.clone(request.options),callback,messager);
        
            autopagerBwUtil.updateStatus(autopagerPref.loadBoolPref("enabled"),!request.options.site_disabled,request.options.discovered_rules,request.options)
        });
    }
    ,
    autopager_update_site_status: function (request, sender, callback)
    {
        autopagerBwUtil.updateStatus(autopagerPref.loadBoolPref("enabled"),!request.options.site_disabled,request.options.discovered_rules,request.options)
    }
    ,
    autopager_import_rules: function (request, sender, callback)
    {
        var rules = request.options.ruletext
        autopagerConfig.importText(rules,true,function(r){
            var msg = autopagerUtils.autopagerFormatString("importdone",[r.insertCount,r.updatedCount,r.ignoreCount]);
            if (callback)
                callback({
                    msg:msg
                })
        });
    }
    ,
    autopager_export_rules: function (request, sender, callback)
    {
        var str = autopagerConfig.exportToJson();
        var htmlurl = autopagerUtils.html_textarea_data_url("AutoPager Rules", str);
        autopagerBwUtil.autopagerOpenIntab(htmlurl);
    }
    ,
    autopager_clear_rules: function (request, sender, callback)
    {
        autopagerConfig.clearLocalRules()
    }
    ,
    autopager_update : function(request, sender, callback)
    {
        AutoPagerNS.UpdateSites.updateOnline(true);
        if (callback)
            callback();
    }
    ,
    autopager_switch_to_lite : function(request, sender, callback)
    {
        var litemode = request.options.litemode
        autopagerLite.switchToLite(litemode);
        if (callback)
            callback({
                litemode:litemode
            });
    }
    ,
    autopager_searchrules : function(request, sender, callback)
    {
        var options = request.options
        function doit(url)
        {
            var result = autopagerLite.openRulesSelectorForUrl(url);
            if (callback)
                callback(result);
        }
        if (options && options.url)
        {
            doit(options.url);
        }
        else{
            AutoPagerNS.get_current_tab(function(tab) {    
                if (tab)
                {
                    doit(AutoPagerNS.get_tab_url(tab));
                }                
            })
        }
    }
    ,
    autopager_getNextMatchedSiteConfig : function(request, sender, callback)
    {
        try{
//            autopagerBwUtil.consoleLog("autopager_getNextMatchedSiteConfig")
            var pos = autopagerRules.getNextMatchedSiteConfig(request.options.url,request.options.pos)
            callback({
                posNew:pos
            });
//            autopagerBwUtil.consoleLog("autopager_getNextMatchedSiteConfig:" + pos)                            
        }catch(e){                
            autopagerBwUtil.consoleError(e)
        }
    }
    ,
    autopager_add_rule : function(request, sender, callback)
    {
        try{
//            autopagerBwUtil.consoleLog("autopager_getNextMatchedSiteConfig")
            var pos = autopagerRules.addRule(request.options.key,request.options.rule)
            if(callback)
            callback({
                posNew:pos
            });
        }catch(e){                
            autopagerBwUtil.consoleError(e)
        }
    }
    ,
    autopager_getRelelatedSearchOptions : function(request, sender, callback)
    {
        autopagerRelated.getRelelatedSearchOptions(request.options.host,function(options){
            callback({
                options:options
            });
        })
    }        
    ,
    autopager_getRelelatedSearchText : function(request, sender, callback)
    {
        autopagerRelated.getRelelatedSearchText(request.options.options,request.options.ut,function(texts){
            callback({
                texts:texts
            });
        })
    } 
    ,
    autopager_discoverRule : function(request, sender, callback)
    {
        var pattern = autopagerRules.discoverRule(request.options.url)
        callback({
            pattern:pattern
        });
    }
    ,
    autopager_getstrings : function(request, sender, callback)
    {
        var strings = AutoPagerNS.strings;
        callback({
            strings:strings.strings
        });
    }
    ,
    autopager_executeOnCurrentUrl : function(request, sender, callback)
    {
        AutoPagerNS.get_current_tab(function(tab) {    
            if (tab)
            {
                callback({
                    url:AutoPagerNS.get_tab_url(tab)
                })                    
            }                
        })
    }
    ,
    autopager_add_tab : function(request, sender, callback)
    {
        autopagerBwUtil.autopagerOpenIntab(request.options.url);
        if (callback)
            callback();
    }
    ,
    autopager_set_pref : function(request, sender, callback)
    {
        autopagerPref.savePref (request.options.name,request.options.value)
    }
    ,
    autopager_get_options : function(request, sender, callback)
    {
        callback({
            disabled:!autopagerPref.loadBoolPref("enabled"),
            litemode:autopagerLite.isInLiteMode(),
            showicon:!autopagerPref.loadBoolPref("hide-toolbar-icon"),
            ignoresites:autopagerPref.loadPref("ignoresites"),
            noprompt:autopagerPref.loadBoolPref("noprompt"),
            disable_by_default:autopagerPref.loadBoolPref("disable-by-default"),
            optionpageurl:AutoPagerNS.get_url("/options.html")
        });
    }
    ,
    autopager_set_options : function(request, sender, callback)
    {
        callback({
            disabled:!autopagerPref.loadBoolPref("enabled"),
            litemode:autopagerLite.isInLiteMode(),
            showicon:!autopagerPref.loadBoolPref("hide-toolbar-icon"),
            noprompt:autopagerPref.loadBoolPref("noprompt"),
            disable_by_default:autopagerPref.loadBoolPref("disable-by-default"),
            ignoresites:autopagerPref.loadPref("ignoresites")
        });
        var options = request.options
        var changed = false;
        changed = autopagerPref.saveBoolPref("enabled",!options.disabled);
        changed = autopagerLite.switchToLite(options.litemode) || changed;
        changed = autopagerPref.saveBoolPref("hide-toolbar-icon",!options.showicon) || changed;
        changed = autopagerPref.savePref("ignoresites",options.ignoresites) || changed;
        autopagerPref.saveBoolPref("disable-by-default",options.disable_by_default)
        autopagerPref.saveBoolPref("noprompt",options.noprompt)
        if (changed)
        {
            if (options.showicon)
                autopagerBwUtil.updateStatus(autopagerPref.loadBoolPref("enabled"),true,0,request.options)
            else
            {
                AutoPagerNS.buttons.removeButton();
            }            
        }
    }
    ,
    autopager_get_prefs : function(request, sender, callback)
    {
//        autopagerBwUtil.consoleLog("autopager_get_prefs")
        if (!callback)
            return;
        var prefs = autopagerPref.userPrefValues()
//        autopagerBwUtil.consoleLog("autopager_get_prefs:" + prefs)
        callback({prefs:prefs});
    }
    ,
    autopager_get_addon_urlprefix : function(request, sender, callback)
    {
//        autopagerBwUtil.consoleLog("autopager_get_addon_urlprefix")
        if (!callback)
            return;
        var prefs = autopagerPref.userPrefValues()
//        autopagerBwUtil.consoleLog("autopager_get_prefs:" + prefs)
        callback({urlPrefix:AutoPagerNS.get_url("/")});
    },
    get_current_or_prepageurl : function(request, sender, callback)
    {
        try{
            AutoPagerNS.get_current_or_prepageurl(request.options.url,callback);
        }catch(e){
            autopagerBwUtil.consoleError(e) 
        }
    }
    ,
    autopager_open_xpather: function (request, sender, callback)
    {
        AutoPagerNS.get_current_tab(function(tab) {
//            autopagerBwUtil.consoleLog("autopager_open_xpather:" + autopagerUtils.dumpObject(tab,1)) 
            if (tab)
                AutoPagerNS.message.call_function_on_object("autopager_open_xpather",autopagerUtils.clone(request.options),callback,tab);
        })        
    }
    ,
    autopager_test_xpath: function (request, sender, callback)
    {
        AutoPagerNS.get_current_tab(function(tab) {
//            autopagerBwUtil.consoleLog("autopager_test_xpath:" + autopagerUtils.dumpObject(tab,1)) 
            if (tab)
                AutoPagerNS.message.call_function_on_object("autopager_test_xpath_content",autopagerUtils.clone(request.options),callback,tab);
        })        
    }
    ,autopager_pickup_xpath : function (request, sender, callback)
    {
        var myCallback = function(options){
            var xpathes ="<table border=1><tr><th>" + autopagerUtils.autopagerGetString("treecol.xpathCol.label") 
                                     +"</th><th>" +  autopagerUtils.autopagerGetString("treecol.machedCol.label") 
                                     +"</th><th>" + autopagerUtils.autopagerGetString("treecol.authorityCol.label") 
                                     +"</th></tr>";
            for(var i in options.xpathes)
            {
                var x = options.xpathes[i]
                xpathes += "<tr><td>" + x.xpath + "</td><td>" + x.matchCount + "</td><td>" + x.authority + "</td></tr>"
            }
            xpathes+= "</table>";
            
            var htmlurl = autopagerUtils.html_data_url("XPathes",xpathes);

            autopagerBwUtil.autopagerOpenIntab(htmlurl);
            if (!callback)
                callback(options)
        }
        AutoPagerNS.get_current_tab(function(tab) {
//            autopagerBwUtil.consoleLog("autopager_pickup_xpath:" + autopagerUtils.dumpObject(tab,1)) 
            if (tab)
                AutoPagerNS.message.call_function_on_object("autopager_pickup_xpath",{},myCallback,tab);
        }) 
    }
    ,
    autopager_open_options: function (request, sender, callback)
    {
        var options_url=AutoPagerNS.get_url("options.html")
        autopagerBwUtil.autopagerOpenIntab(options_url)
    }
    ,
    autopager_get_repositories: function (request, sender, callback)
    {
        if (callback)
        {
            AutoPagerNS.UpdateSites.getUpdateSites();
            AutoPagerNS.UpdateSites.loadAll();
            callback({repositories:autopagerUtils.clone(AutoPagerNS.UpdateSites.getUpdateSites(),3,true,true)});
        }
    }
    ,autopager_enable_repository: function (request, sender, callback)
    {
        request.options.repositories= [{filename:request.options.filename,
                        enabled:request.options.enabled}];
        this.autopager_enable_repositories(request, sender, callback)
    }
    ,autopager_enable_repositories: function (request, sender, callback)
    {
        var reps = AutoPagerNS.UpdateSites.getUpdateSites();
        var changed =false;
        var repositories = request.options.repositories;
        for(var k in reps)
        {
            var rep = reps[k]
            for(var i in repositories)
            {
                var r = repositories[i]
                if (rep.filename==r.filename)
                {
                    changed = changed || rep.enabled != request.options.enabled;
                    rep.enabled = r.enabled
                    if (rep.enabled)
                    {
                        AutoPagerNS.UpdateSites.updateRepositoryOnline(rep.filename,true);
                    }
                }                
            }
        }
        if (changed)
            AutoPagerNS.AutoPagerUpdateTypes.saveSettingSiteConfig(AutoPagerNS.UpdateSites.getUpdateSites())
        if (callback){
            callback(request.options)
        }

    }

});

AutoPagerNS = AutoPagerNS.extend(AutoPagerNS,{
    is_global : function() {
        return true;
    }
    ,get_current_or_prepageurl : function(current_url,callback)
    {
        if (!callback)
            return;        
        var called = false;
        var myCallback = function (options)
        {
            called = true
            callback(options)
        }
        AutoPagerNS.get_current_tab(function(tab) {
//            autopagerBwUtil.consoleLog("get_current_tab:" + tab)
            var url = AutoPagerNS.get_tab_url(tab);
            if (url && current_url!=url)
                myCallback({url:url});
        });
        var currurl=null;
        var urlpassed = false;
        AutoPagerNS.walk_windows(function(win) {
//            autopagerBwUtil.consoleLog("walk_windows:" + autopagerUtils.dumpObject(win,1))
            if (!called)
            {
                AutoPagerNS.walk_tabs(win,function(win,tab){
//                    autopagerBwUtil.consoleLog("walk_tabs:" + tab)
            
                    if (!called)
                    {
                        var url = AutoPagerNS.get_tab_url(tab);
//                        autopagerBwUtil.consoleLog("walk_tabs:" + url)
                        if (current_url==url)
                        {
                            if (currurl)
                            {
                                myCallback({url:currurl}); 
                            }else
                            {
                                urlpassed = true;
                            }
                        }else if (urlpassed)
                        {
                            myCallback({url:currurl}); 
                        }
                        currurl = url;
                    }
                });
            }            
        });        
        AutoPagerNS.window.setTimeout(function(){
//            autopagerBwUtil.consoleLog("setTimeout:" + called + " " + currurl)
            if (!called && currurl){
                myCallback({url:currurl}); 
            }
        }, 200);
    }
});

AutoPagerNS.buttons = AutoPagerNS.extend (AutoPagerNS.namespace("buttons"),
{
    icons : ["autopager.png","autopager.off.png","autopager-site.off.png","autopager.lite.png"]
    ,getIcon : function(enabled,siteenabeld,discoveredRules,options)
    {
        var pos = 0;
        if (!siteenabeld)
            pos = 2;
        else
        if (!enabled)
            pos =1;
        else if(discoveredRules && discoveredRules>0)
            pos =3;
        var img = "skin/classic/" + this.icons[pos];
        return img;
    },
    setPageIcon : function (enabled,site_enabled,discoveredRules,options)
    {
        if (!autopagerPref.loadBoolPref("hide-toolbar-icon"))
        {
            try{
                this.updateButton(this.getIcon(enabled,site_enabled,discoveredRules,options));
            }catch(e){
                autopagerBwUtil.consoleError("error set page icon:" + e)
            }
        }else
        {
            this.removeButton();
        }
    },
    draw : function(enabled,site_enabled,discoveredRules,options)
    {
        //"20,96,170",
        //aRgb,pRgb
        var aRgb="20,96,170";
        var pRgb="20,96,170";
        if (!enabled)
        {
            aRgb="138,138,138";
            pRgb="138,138,138";
        }else
        {
            if (!site_enabled)
            {
                aRgb = "205,194,21";
                pRgb="250,94,58";
            }else 
            if (discoveredRules && discoveredRules>0)
            {
                aRgb="255,30,90";
                pRgb="150,94,58";
            }            
        }
        return this.doDraw(aRgb,pRgb);
    },
    doDraw:function(aRgb,pRgb) {
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "rgba(" + aRgb + ",255)";
        context.font = "20px Times New Roman";
        context.fillText("A", 0, 15);
        context.font = "14px Times New Roman";
        context.fillStyle = "rgba(" + pRgb + ",255)";
        context.fillText("p", 11, 14);
        return context.getImageData(0, 0, 19, 19);
    }
    ,drawAndGetDataURL : function(enabled,site_enabled)
    {
        this.draw(enabled,site_enabled);
        var canvas = document.getElementById('canvas');
        return canvas.toDataURL();
    }
})

AutoPagerNS.browserend = AutoPagerNS.extend (AutoPagerNS.namespace("browserend"),
{
    post_init : function()
    {
        autopagerConfig.autopagerUpdate();
    }
})

AutoPagerNS.util = AutoPagerNS.extend (AutoPagerNS.namespace("util"),
{
    post_init : function()
    {
        AutoPagerNS.enableEvents(autopagerPref);
        autopagerPref.attachEventListener("change",function(event,name){
            switch(name)
            {
                case "enabled":
                    try{
                        AutoPagerNS.message.call_function("autopager_get_content_status",{
                            disabled:!autopagerPref.loadBoolPref("enabled")
                        },function(options){
                            autopagerBwUtil.updateStatus(autopagerPref.loadBoolPref("enabled"),!options.site_disabled,options.discovered_rules,options);
                        })
                    }catch(e){}         
                    break;
                case "hide-status":
                    try{
                        autopagerBwUtil.showStatus();
                    }catch(e){}
                    break;
                case "hide-toolbar-icon":
                    try{
                        autopagerBwUtil.showToolbarIcon();
                    }catch(e){}
                    break;
                case "with-lite-recommended-rules":
                    AutoPagerNS.UpdateSites.updateRepositoryOnline("autopagerLite.xml",true);
                    break;
                case "ids":
                    AutoPagerNS.UpdateSites.updateRepositoryOnline("autopagerLite.xml",true);
                    var callback = function()
                    {
                        var doc = null;

                        if (AutoPagerNS.getContentDocument() && AutoPagerNS.getContentDocument().location){
                            if (AutoPagerNS.getContentDocument().defaultView && AutoPagerNS.getContentDocument().location.href.match(autopagerLite.apSiteRegex()))
                                AutoPagerNS.getContentDocument().defaultView.close();
                            else {
                                 AutoPagerNS.get_current_tab(function(tab) {
                                     var url = AutoPagerNS.get_tab_url(tab);
                                     if (url.match(autopagerLite.apSiteRegex()))
                                     {
                                         AutoPagerNS.close_tab(tab);
                                         AutoPagerNS.window.setTimeout(function(){
                                             AutoPagerNS.get_current_tab(function(tab) {
                                                 var messager = AutoPagerNS.get_messager(tab);
                                                 if (messager){
                                                     AutoPagerNS.message.call_function_on_object("autopager_retry",{},null,messager)
                                                 }
                                             })                                             
                                         },100)
                                     }
                                 })
                            }
                            doc = AutoPagerNS.getContentDocument();
                        }
                        if (doc)
                            autopagerMain.doContentLoad(doc);
                    }
                    AutoPagerNS.browser.open_alert(autopagerUtils.autopagerGetString('rulesupdated'),autopagerUtils.autopagerGetString('clicktotrynewrules'),autopagerPref.loadPref("repository-site"),callback)
                    break;
                case "work-in-lite-mode":
                    var e = autopagerLite.isInLiteMode();
                    //autopagerPref.saveBoolPref("with-lite-discovery",e);
                    if (e)
                    {
                        autopagerPref.saveBoolPref("noprompt",true);
                        autopagerPref.saveBoolPref("disable-by-default",false);
                    }
                    AutoPagerNS.message_handlers.autopager_enable_repositories({
                        options:{
                            repositories:[
                            {filename:"autopagerTee.xml",
                        enabled:!e},
                            {filename:"autopagerLite.xml",
                        enabled:true},
                            {filename:"autopagerizeJson.xml",
                        enabled:!e}
                        ]
                        }
                    })
                    //alert("You need restart firefox to make this change take effect.");
                    autopagerBwUtil.autopagerOpenIntab("http://autopager.teesoft.info/lite.html");
                    AutoPagerNS.UpdateSites.updateOnline(false);
                    break;
                case "with-lite-discovery-aways-display":
                    if (autopagerPref.loadBoolPref("with-lite-discovery-aways-display"))
                        autopagerLite.hiddenStatus(false);
                    break;

            }
        },false)
    }
})


AutoPagerNS.browser = AutoPagerNS.extend (AutoPagerNS.namespace("browser"),
{
    open_alert : function (title,message,link,callback,options)
    {
        AutoPagerNS.get_current_tab(function(tab) {            
            var messager = AutoPagerNS.get_messager(tab);
            //            autopagerBwUtil.consoleLog("autopager_get_status:" + autopagerUtils.dumpObject(tab,1)) 
            if (messager)
                AutoPagerNS.message.call_function_on_object("autopager_open_alert",{
                    title: title,
                    message:message,
                    link:link,
                    hasCallback : (typeof callback != "undefined")
                },function(options){
                    if (callback)
                        callback(options)
                },messager)
                });   
    }
});
