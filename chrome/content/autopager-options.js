var autopagerOptions =
{   
    options : {},
    onload : function (document)
    {
//        autopagerBwUtil.consoleLog("load options 1")
        var Me = this;
        
        var onOptions= function(options){
            var onSaveChange = function ()
            {
                var enabled = document.getElementById("autopager-enabled");
                if (enabled)
                    options.disabled = !enabled.checked;
                var lite = document.getElementById("autopager-lite");
                if (lite)
                    options.litemode = lite.checked;
                var showicon = document.getElementById("autopager-showicon");
                if (showicon)
                    options.showicon = showicon.checked;

                var ignoresites = document.getElementById("ignoresites");
                if (ignoresites)
                {
                    options.ignoresites = ignoresites.value;
                }
                var showprompt = document.getElementById("autopager-showprompt");
                if (showprompt)
                {
                    options.noprompt = !showprompt.checked;
                }
                var disableOnDefault = document.getElementById("autopager-disable-on-default");
                if (disableOnDefault)
                {
                    options.disable_by_default = disableOnDefault.checked;
                }
                var disableOnDefaultDiv = document.getElementById("autopager-disable-on-default-div");
                if(disableOnDefaultDiv)
                {
                    disableOnDefaultDiv.style.display = options.noprompt?"block":"none";
                } 
                autopagerOptions.call_function("autopager_set_options",
                    options);
            };
//            autopagerBwUtil.consoleLog("load options 2")
            autopagerTranslate.translate(document);
//            autopagerBwUtil.consoleLog("load options 3")
            var enabled = document.getElementById("autopager-enabled");
            if (enabled)
            {
                enabled.checked= !options.disabled;
                enabled.addEventListener("change", onSaveChange, false)
            }
            var lite = document.getElementById("autopager-lite");
            if (lite)
            {
                lite.checked=options.litemode;
                lite.addEventListener("change", onSaveChange, false)
            }

            var showicon = document.getElementById("autopager-showicon");
            if (showicon)
            {
                showicon.checked = options.showicon;//!autopagerPref.loadBoolPref("hide-toolbar-icon");
                showicon.addEventListener("change", onSaveChange, false)
            }

            var ignoresites = document.getElementById("ignoresites");
            if (ignoresites)
            {
                ignoresites.value = autopagerUtils.toString(options.ignoresites) //autopagerPref.loadPref("ignoresites")
            }                        
//            autopagerBwUtil.consoleLog("load options 6")                
            var showprompt = document.getElementById("autopager-showprompt");
            if (showprompt)
            {
                showprompt.checked = !options.noprompt;
                showprompt.addEventListener("change", onSaveChange, false)
            }
            var disableOnDefault = document.getElementById("autopager-disable-on-default");
            if (disableOnDefault)
            {
                disableOnDefault.checked = options.disable_by_default;
                disableOnDefault.addEventListener("change", onSaveChange, false)
            }
            var disableOnDefaultDiv = document.getElementById("autopager-disable-on-default-div")
            if(disableOnDefaultDiv)
            {
                disableOnDefaultDiv.style.display = options.noprompt?"block":"none";
            }                    
            var saveignores = document.getElementById("saveignores");
            if (saveignores)
                saveignores.addEventListener("click", onSaveChange, false)
        }
        

//        autopagerBwUtil.consoleLog("load options 4")
        new autopagerDescription("AutoPagerSetting:",document);
//        autopagerBwUtil.consoleLog("load options 5")                
        AutoPagerNS.message.call_function("autopager_get_options",
        {},onOptions)
        
        var haveUrl = false;
        for(var i=1;i<=3;i++)
        {
            var url = document.getElementById("url" + i)
            if (url)
            {
                haveUrl = true;
                break;
            }
        }
        if (haveUrl)
        {
            AutoPagerNS.message.call_function("get_current_or_prepageurl",
            {},function (options){
//                autopagerBwUtil.consoleLog("get_current_or_prepageurl called") 
                if (options.url)
                {
                    for(var i=1;i<=3;i++)
                    {
                        var url = document.getElementById("url" + i)
                        if (url)
                            url.value = options.url;
                    }
                }
            })                
            
        }
        var update = document.getElementById("autopager-update");
        if (update)
            update.addEventListener("click", function(){
                autopagerOptions.call_function("autopager_update",
                {},function (){
//                    autopagerBwUtil.consoleLog("update called") 
                })                    
            }, false)
        var search = document.getElementById("autopager-search");
        if (search)
            search.addEventListener("click", function(){
                autopagerOptions.searchRules(document.getElementById('url1') && document.getElementById('url1').value)                              
            }, false)
            
        var importrules = document.getElementById("autopager-importrules");
        if (importrules)
            importrules.addEventListener("click", function(){
                autopagerOptions.importRules()                             
            }, false)
            
        var exportrules = document.getElementById("autopager-exportrules");
        if (exportrules)
            exportrules.addEventListener("click", function(){
                autopagerOptions.exportRules()                             
            }, false)        

        var clearrules = document.getElementById("autopager-clearrules");
        if (clearrules)
            clearrules.addEventListener("click", function(){
                autopagerOptions.clearRules()                             
            }, false) 
        var issue = document.getElementById("autopager-issue");
        if (issue)
            issue.addEventListener("click", function(){
                autopagerOptions.reportIssue(document.getElementById('url2').value)                            
            }, false) 
         
        var request = document.getElementById("autopager-request");
        if (request)
            request.addEventListener("click", function(){
                autopagerOptions.requestSite(document.getElementById('url3').value)                           
            }, false) 
        var options = document.getElementById("autopager-options");
        if (options)
            options.addEventListener("click", function(){
                autopagerOptions.openoptions()                             
            }, false) 

        var disablesite = document.getElementById("autopager-disable-site");
        if (disablesite)
        {
            AutoPagerNS.message.call_function("autopager_get_status",
            {},function(options){
                disablesite.checked= options.site_disabled;
                disablesite.addEventListener("change", Me.disableonsite, false)
            })
        }
        
        var xpathtester = document.getElementById("autopager-xpath-test");
        if (xpathtester)
            xpathtester.addEventListener("click", function(){
                autopagerOptions.openxpathtester()                             
            }, false);
        var xpather = document.getElementById("autopager-xpather");
        if (xpather)
            xpather.addEventListener("click", function(){
                autopagerOptions.openxpathpicker()                             
            }, false);
        var repositories = document.getElementById("autopager-repositories");
        var outputRepository = function (options){
            //todo create table
            var table = document.createElement("table");
            table.border=1
            var tr = document.createElement("tr")
            table.appendChild(tr)                    
            var td;
            td = document.createElement("th")
            tr.appendChild(td);
            td.textContent = autopagerUtils.autopagerGetString("setting.label.chkEnabled")


            td = document.createElement("th")
            tr.appendChild(td);
            td.textContent = autopagerUtils.autopagerGetString("repositoryname")

            td = document.createElement("th")
            tr.appendChild(td);
            td.textContent = autopagerUtils.autopagerGetString("rulecount")

            td = document.createElement("th")
            tr.appendChild(td);
            td.textContent = autopagerUtils.autopagerGetString("setting.tree.Description")
                
            function getEnableReppsitoryFunction(enabled,rep)
            {
                return function()
                {
                    autopagerOptions.call_function("autopager_enable_repository",{
                        filename:rep.filename,
                        enabled:enabled.checked
                    },function(options){                            
                        window.setTimeout(function(){
                            AutoPagerNS.message.call_function("autopager_get_repositories",
                            {},outputRepository)
                        },100);
                            
                    })
                }
            }
            //setting.label.chkEnabled
            var reps = [];
            for(var i in options.repositories)
            {
                reps.push(options.repositories[i])
            }
            
            reps = reps.reverse();
            for(var k in reps)
            {
                var rep = reps[k]
                tr = document.createElement("tr")                
                table.appendChild(tr)                    
                td = document.createElement("td")
                tr.appendChild(td);
                var enabled = document.createElement("input")
                enabled.type="checkbox"
                enabled.checked = rep.enabled
                tr.appendChild(td);
                td.appendChild(enabled)
                    
                enabled.addEventListener("change", getEnableReppsitoryFunction(enabled,rep,outputRepository), false);
                    
                td = document.createElement("td")
                tr.appendChild(td);
                td.textContent = rep.filename
                    
                td = document.createElement("td")
                tr.appendChild(td);
                td.textContent = "" +rep.ruleCount;
                    
                td = document.createElement("td")
                tr.appendChild(td);
                td.textContent = rep.desc;
                    

            }
            repositories.innerHTML="";
            repositories.appendChild(table)
        //repositories.textContent = autopagerBwUtil.encodeJSON(options.repositories);
        }
            
        if (repositories){
            AutoPagerNS.message.call_function("autopager_get_repositories",
            {},outputRepository)
        }
                
    }    
    ,
    clearRules : function ()
    {
        autopagerOptions.call_function("autopager_clear_rules",{})
    }    
    ,
    importRules : function ()
    {
        var str = prompt(autopagerUtils.autopagerGetString("statusbar.menuitem.autopager-showrules.label"),"");
        if (str != null)
        {
            autopagerOptions.call_function("autopager_import_rules",
            {
                ruletext:str
            },
            function(r){
                alert(r.msg)
            })
        }
    }
    ,
    exportRules : function ()
    {
        
        autopagerOptions.call_function("autopager_export_rules",
        {})
    }
    ,
    executeOnCurrentUrl : function (callback)
    {
        if (!callback)
            return ;
        AutoPagerNS.message.call_function("autopager_executeOnCurrentUrl",{},function(options){            
//            autopagerBwUtil.consoleLog("executeOnCurrentUrl response:" + options.url);
            callback(options.url)
        });
    }
    ,
    executeOnUrl : function (url,callback)
    {
        if (!callback)
            return;
        if (url && url!="undefined")
        {
            callback(url);
            return;
        }
        autopagerOptions.executeOnCurrentUrl(function(url){            
            callback(url);
        });
    }
    ,
    searchRules : function (url)
    {
        autopagerOptions.executeOnUrl(url,function(url){
            autopagerOptions.call_function("autopager_searchrules",{
                url:url
            }) 
        })          
    }
    ,
    reportIssue : function (url)
    {
        autopagerOptions.executeOnUrl(url,function(url){
            autopagerOptions.openInTab("http://autopager.teesoft.info/reportissues/" + url) 
        })  
    }
    ,
    requestSite : function (url)
    {
        autopagerOptions.executeOnUrl(url,function(url){
            autopagerOptions.openInTab("http://autopager.teesoft.info/requestsites/" + url) 
        })  
    }
    , 
    openInTab : function (url)
    {
        this.call_function("autopager_add_tab",{
            url:url
        })
    }
    ,
    openoptions:function()
    {
        this.call_function('autopager_open_options',{});
    }
    ,
    call_function : function(fn,options,callback)
    {
        //        var doc = AutoPagerNS.getContentDocument()
        //        if (doc && doc.location && doc.location.href && doc.location.href.indexOf("pagepopup.html")>0)
        //        {
        //            AutoPagerNS.window.close();
        //        }
        AutoPagerNS.message.call_function(fn,options,callback)
    }
    ,
    disableonsite:function(event)
    {
        autopagerOptions.call_function("autopager_set_site_status",{
            site_disabled:document.getElementById("autopager-disable-site").checked
        });
    }
    ,
    openxpathtester : function (event)
    {
        this.call_function("autopager_open_xpather",{});
        this.lazyClose();
    }
    ,
    openxpathpicker : function (event)
    {
        this.call_function("autopager_pickup_xpath",{});
        this.lazyClose();
    }    
    ,
    lazyClose : function()
    {
        window.setTimeout(function(){
            window.close();
        },100);
    }    
}

AutoPagerNS.options = AutoPagerNS.extend (AutoPagerNS.namespace("options"),
{
    post_init : function()
    {
//        autopagerBwUtil.consoleLog("content options post_init")
        var contentDomload = function(ev) {            
//            autopagerBwUtil.consoleLog("content DOMContentLoaded options")
            //AutoPagerNS.browser.removeEventListener("DOMContentLoaded", contentDomload, false);
                
            AutoPagerNS.message.call_function("autopager_get_addon_urlprefix",{},function(options){
                try
                {
                    var urlPrefix=options.urlPrefix
                    var doc = AutoPagerNS.getContentDocument();
//                    autopagerBwUtil.consoleLog(doc)
//                    autopagerBwUtil.consoleLog(doc.location.href)
//                    autopagerBwUtil.consoleLog(urlPrefix)
                    
                    if (doc && doc.location && doc.location.href 
                        && doc.location.href.indexOf(urlPrefix)==0)
                        {
//                        autopagerBwUtil.consoleLog("load options")
            
                        autopagerOptions.onload(doc);
                    }
                }catch(e){}
            })
        }
        AutoPagerNS.browser.addEventListener("DOMContentLoaded", contentDomload, false);
    }
});
