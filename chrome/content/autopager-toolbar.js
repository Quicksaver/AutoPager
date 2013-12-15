var autopagerToolbar =
{
    getBrowserDocument : function(){
        var doc;
        if(typeof document=="undefined")
        {
            if (typeof AutoPagerNS.getBrowserDocument=="undefined")
                return;
            else
                doc = AutoPagerNS.getBrowserDocument();
        }else
            doc = document;
        return doc;
    }
    ,
    addAutopagerButton : function() {
        if (autopagerBwUtil.usermodifingToolbar)
            return;
        var doc = this.getBrowserDocument();
        if (!doc)
            return;
        var toolbox = doc.getElementById("navigator-toolbox");
        if (!toolbox)
            return;
        if (AutoPagerNS.toolbar && !AutoPagerNS.toolbar.button)
            AutoPagerNS.toolbar.init();
        var toolboxDocument = toolbox.ownerDocument;

        var hasAutopagerButton = false;
        for (var i = 0; i < toolbox.childNodes.length; ++i) {
            var toolbar = toolbox.childNodes[i];
            if (toolbar.localName == "toolbar" && toolbar.getAttribute("customizable") == "true") {
                if (toolbar.currentSet.indexOf("autopager-button") > -1) {
                    hasAutopagerButton = true;
                }
            }
        }

        if(!hasAutopagerButton) {
            for (var i = 0; i < toolbox.childNodes.length; ++i) {
                toolbar = toolbox.childNodes[i];
                if (toolbar.localName == "toolbar" &&  toolbar.getAttribute("customizable") == "true" && toolbar.id == "nav-bar") {
                    var newSet = "";
                    var child = toolbar.firstChild;
                    while (child) {
                        newSet += child.id + ",";
                        if(!hasAutopagerButton && (child.id == "search-container" || child.id =="home-button") ) {
                            newSet += "autopager-button,";
                            hasAutopagerButton = true;
                        }
                        child = child.nextSibling;
                    }
                    newSet = newSet.substring(0, newSet.length - 1);
                    toolbar.currentSet = newSet;
                    toolbar.setAttribute("currentset", newSet);                    
                    toolboxDocument.persist(toolbar.id, "currentset");
                    try {
                        BrowserToolboxCustomizeDone(true);
                    } catch (e) {}
                    break;
                }
            }
        }
    },
    removeAutopagerButton : function() {
        if (autopagerBwUtil.usermodifingToolbar)
            return;
        var doc = this.getBrowserDocument();
        if (!doc)
            return;
        var toolbox = doc.getElementById("navigator-toolbox");
        if (!toolbox)
            return;
        var toolboxDocument = toolbox.ownerDocument;

        var hasAutopagerButton = false;
        for (var i = 0; i < toolbox.childNodes.length; ++i) {
            var toolbar = toolbox.childNodes[i];
            if (toolbar.localName == "toolbar" && toolbar.getAttribute("customizable") == "true") {
                if (toolbar.currentSet.indexOf("autopager-button") > -1) {
                    hasAutopagerButton = true;
                }
            }
        }

        autopagerToolbar.removing = true;
        if(hasAutopagerButton) {
            for (var i = 0; i < toolbox.childNodes.length; ++i) {
                toolbar = toolbox.childNodes[i];
                if (toolbar.localName == "toolbar" &&  toolbar.getAttribute("customizable") == "true" && toolbar.id == "nav-bar") {
                    var newSet = "";
                    var child = toolbar.firstChild;
                    while (child) {
                        if(child.id != "autopager-button")
                        {
                            newSet += child.id + ",";
                        }
                        child = child.nextSibling;
                    }
                    newSet = newSet.substring(0, newSet.length - 1);
                    toolbar.currentSet = newSet;
                    toolbar.setAttribute("currentset", newSet);
                    toolboxDocument.persist(toolbar.id, "currentset");
                    try {
                        BrowserToolboxCustomizeDone(true);
                    } catch (e) {}
                    break;
                }
            }
        }
        autopagerToolbar.removing = false;
    },

    autopagerToobarInit : function() {
        //var autopagerHome = "http://www.teesoft.info/content/view/27/1/";
        var autopagerHome = autopagerPref.loadPref("repository-site");
        var subfix = "&app=autopager&bid=" + autopagerBwUtil.apBrowserId();
        //    var autopagerHome = "http://www.teesoft.info";
        var lv = autopagerPref.loadPref("last_version");
        if (typeof lv=="undefined" || lv==null || lv=="") {  // new user        
            if (autopagerBwUtil.autopagerOpenIntab(autopagerHome + "installed?i=" + autopagerUtils.version + subfix,null))
            {
                autopagerPref.savePref("last_version", autopagerUtils.version);
                autopagerToolbar.addAutopagerButton();
                if (autopagerBwUtil.isMobileVersion())
                {
                    autopagerPref.saveBoolPref("noprompt", true);
                }
                //autopagerBwUtil.autopagerOpenIntab("chrome://autopager/content/options.xul");
            }
            autopagerConfig.autopagerUpdate();
        } else { // check for upgrade
            var lastVersion = lv;
            var currentVersion = autopagerUtils.version;
            if (lastVersion != autopagerUtils.version)
            {
                //check if migrate is needed
                autopagerUtils.migrateAfterUpgrade(currentVersion)
                var vers = currentVersion.split('.');
                var lastVers = lastVersion.split('.');
                //a dev update if the last number is an odd number
                if (vers[vers.length-1]%2==1 && (vers[vers.length-1] - lastVers[lastVers.length-1])==1)
                {
                    autopagerPref.savePref("last_version", autopagerUtils.version);
                }else //a major update if the last number is an even number
                {
                    if (autopagerBwUtil.autopagerOpenIntab(autopagerHome+ "updated?u=" + lastVersion + "&i=" + autopagerUtils.version + subfix,null))
                    {
                        autopagerPref.savePref("last_version", autopagerUtils.version);
                    //autopagerToolbar.addAutopagerButton();
                    //autopagerBwUtil.autopagerOpenIntab("chrome://autopager/content/options.xul");
                    }
                }
            }
        }
    }
};

AutoPagerNS.buttons = AutoPagerNS.extend (AutoPagerNS.namespace("buttons"),
{
    post_init : function()
    {
        var domLoad = function(ev) {
            AutoPagerNS.browser.removeEventListener("load", domLoad, false);
            try
            {
                if (typeof setTimeout != "undefined")
                    setTimeout(autopagerToolbar.autopagerToobarInit, 1000);
                else if (AutoPagerNS.get_current_window)
                    AutoPagerNS.get_current_window(function(window){
                        window.setTimeout(autopagerToolbar.autopagerToobarInit, 1000);
                    });
                    
            }catch(e){
                autopagerBwUtil.consoleError("DOMContentLoaded with error:" + e)
            }
        }
        AutoPagerNS.browser.addEventListener("load", domLoad, false);    
    }
})
