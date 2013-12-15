var autopagerBwUtil =
{
    debug: false,
    getConfigFile : function(fileName) {
        var file = this.getConfigDir();
        file.append(fileName);
        if (!file.exists()) {
            file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, parseInt("0755", 8));
        }

        return file;
    },

    getConfigDir : function() {
        try{
            var file = Components.classes["@mozilla.org/file/directory_service;1"]
            .getService(Components.interfaces.nsIProperties)
            .get("ProfD", Components.interfaces.nsILocalFile);
            file.append("autopager");
            if (!file.exists()) {
                file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt("0755", 8));
            }
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
        return file;
  
    },
    getConfigFileURI : function(fileName) {
        try{
            return Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService)
            .newFileURI(this.getConfigFile(fileName));
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    },
    getConfigFileContents : function(file, charset,warn){
        var aURL = this.getConfigFileURI(file);
        return autopagerBwUtil.getFileContents(aURL);
    }
    ,
    getFileContents : function(aURL, charset,warn){
        if (!aURL)
            return "";
        var str="";
        try{
            if( charset == null) {
                charset = "UTF-8";
                warn = false;
            }
            var ioService=Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService);
            var scriptableStream=Components
            .classes["@mozilla.org/scriptableinputstream;1"]
            .getService(Components.interfaces.nsIScriptableInputStream);
            // http://lxr.mozilla.org/mozilla/source/intl/uconv/idl/nsIScriptableUConv.idl
            var unicodeConverter = Components
            .classes["@mozilla.org/intl/scriptableunicodeconverter"]
            .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
            unicodeConverter.charset = charset;

            var channel=ioService.newChannelFromURI(aURL);
            var input=channel.open();
            scriptableStream.init(input);
            str=scriptableStream.read(input.available());
            scriptableStream.close();
            input.close();

            try {
                return unicodeConverter.ConvertToUnicode(str);
            } catch( e ) {
                return str;
            }
        } catch( e ) {
            if (warn)
                alert("unable to load file because:" + e);
        }
        return str
    },
    saveContentToConfigFile: function(str,filename)
    {
        var file = this.getConfigFile(filename);
        this.saveContentToFile(str,file)
    },
    saveContentToFile: function(str,saveFile)
    {
        try{
            var fStream = autopagerConfig.getWriteStream(saveFile);
            var configStream = autopagerConfig.getConverterWriteStream(fStream);
            configStream.writeString(str);
            configStream.close();
            fStream.close();
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    },
    autopagerOpenIntab : function(url,obj)
    {
        if (typeof Components == "object")
        {
            if (url)
            {
                var focus = (!obj || typeof obj.focus=="undefined" || obj.focus);
                var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
                var mainWindow = wm.getMostRecentWindow("navigator:browser");
                var browser = !mainWindow?null:(mainWindow && mainWindow.gBrowser)? mainWindow.gBrowser : mainWindow.BrowserApp;
                if (browser)
                {
                    var tab = browser.addTab(url);
                    if (focus)
                        browser.selectedTab = tab;
                    return tab;
                }else if (AutoPagerNS.window){
                    return AutoPagerNS.window.open(url,'_blank');
                }
            }
        }
        else
        {
            return window.open(url, "_blank")!=null;
        }
        return false;
    },
    isMobileVersion : function()
    {
        var f= typeof navigator == "undefined" || (navigator.userAgent.indexOf(" Fennec/")!=-1)
        || (navigator.userAgent.indexOf(" Maemo/")!=-1);
        return f;
    }
    ,getContentImage : function(name)
    {
        return "chrome://autopagerimg/content/" + name;
    },    
    getCallStack : function() {
      var callstack = [];
      var isCallstackPopulated = false;
      try {
        i.dont.exist+=0; //doesn't exist- that's the point
      } catch(e) {          
        if (e.stack) { //Firefox
          var lines = e.stack.split('\n');
          for (var i=0, len=lines.length; i<len; i++) {
            callstack.push(lines[i]);           
          }
          //Remove call to printStackTrace()
          callstack.shift();
          isCallstackPopulated = true;
        }
      }
      if (!isCallstackPopulated) { //IE and Safari
        var currentFunction = arguments.callee.caller;
        while (currentFunction) {
          var fn = currentFunction.toString();
          var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('')) || 'anonymous';
          callstack.push(fname);
          currentFunction = currentFunction.caller;
        }
      }
      return (callstack);
    },
    consoleLog: function(message) {
        if (autopagerBwUtil.debug)
        {            
            var consoleService = Components.classes['@mozilla.org/consoleservice;1']
            .getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage(message + "@" + autopagerBwUtil.getCallStack().join("\n"))
        }
    },
    consoleError: function(e) {
//       var consoleService = Components.classes['@mozilla.org/consoleservice;1']
//        .getService(Components.interfaces.nsIConsoleService);
//        consoleService.logStringMessage(e + "@" + autopagerBwUtil.getCallStack().join("\n"))

        if (e && e.stack)
            Components.utils.reportError(e + "@" + e.stack)
        else
            Components.utils.reportError(e+ "@" + autopagerBwUtil.getCallStack().join("\n"))
    }
    ,
    newDOMParser : function ()
    {
        return (typeof Components == "object")? Components.classes["@mozilla.org/xmlextras/domparser;1"]
        .createInstance(Components.interfaces.nsIDOMParser):new window.DOMParser()

    }
    ,
    doDecodeJSON : function (str)
    {
        try{
            return JSON.parse(str);
        }catch(e){
            this.consoleLog("error parser:" +e + ":"  + str)
            if (Components && Components.classes["@mozilla.org/dom/json;1"])
            {
                var nativeJSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);
                return nativeJSON.decode(str);
            }
            throw "unable to parser str";
        }
    }
    ,
    decodeJSON : function (str)
    {
        var info = [];
        if (str==="")
            return info;
        //try native json first
        try{
            info = this.doDecodeJSON(str);
        }catch(ex){
            //try parse it manually
            var strs = str.split("},{");
            var v
            if (strs.length>=1)
            {
                v = this.doDecodeJSON( strs[0] + "}]");
                if (v && v[0])
                    info.push(v[0]);
            }
            for(var index=1; index<strs.length-1;index++)
            {
                v = this.doDecodeJSON( "{" + strs[index] + "}");
                if (v)
                    info.push(v);
            }
            if (strs.length>1)
            {
                v = this.doDecodeJSON("[{" + strs[strs.length-1]);
                if (v && v[0])
                    info.push(v[0]);
            }
        }
        return info;
    }
    ,
    encodeJSON : function (obj)
    {
        var str = null;
        //try native json first
        try{
            return JSON.stringify(obj);
        }catch(e){
            var Ci = Components.interfaces;
            var Cc = Components.classes;

            if (Cc["@mozilla.org/dom/json;1"])
            {
                var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
                str = nativeJSON.encode(obj);
            }            
        }
        return str;
    }
    ,
    supportHiddenBrowser : function ()
    {
        return false;
        return !autopagerPref.loadBoolPref("disable-hidden-browser");
    //return !autopagerBwUtil.isMobileVersion();
    }
    ,
    createHTMLDocumentFromStr : function(str,urlStr) {
        return null;
    }
    ,
    openAlert : function(title,message,link,callback,openTimeout)
    {
        if (autopagerBwUtil.isMobileVersion())
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
        else
        {
            window.openDialog("chrome://autopager/content/alert.xul",
                "alert:alert",
                "chrome,dialog=yes,titlebar=no,popup=yes",
                title,message,link,callback,openTimeout);
        }
    }
    ,
    processXPath : function (xpath)
    {
        return xpath;
    }
    ,
    isInPrivateMode : function()
    {
        try{
            var pbs = Components.classes["@mozilla.org/privatebrowsing;1"]
            .getService(Components.interfaces.nsIPrivateBrowsingService);
            var inPrivateBrowsingMode = pbs.privateBrowsingEnabled;
            return inPrivateBrowsingMode;
        }catch(e)
        {
            return false;
        }
    }
    ,
    apBrowserId : function()
    {
        //AutoPager supported browser id
        //Firefox 0, Fennec 1, MicroB 2, Chrome 3
        if  (AutoPagerNS.getContentWindow().navigator.userAgent.indexOf(" Fennec/")!=-1)
            return 1;
        if (AutoPagerNS.getContentWindow().navigator.userAgent.indexOf(" Maemo/")!=-1)
            return 2;
        return 0;
    }
    ,
    allowModifyHeader : function()
    {
        return true;
    }
    ,
    notification : function (id,message,buttons)
    {
        var notificationBox = null;
        if (typeof gBrowser!="undefined")
            notificationBox = gBrowser.getNotificationBox();
        else if (typeof Browser!="undefined" && Browser.getNotificationBox())
        {
            notificationBox = Browser.getNotificationBox();
        }else{
            var newbuttons = autopagerUtils.clone(buttons)
            for(var b in newbuttons)
            {
                var btn = newbuttons[b]
                if (btn.callback)
                   btn.callback = true;
            }
            AutoPagerNS.message.call_function("autopager_open_notification",{
                id: id,
                message:message,
                buttons:newbuttons
            },function(options){
                try{
                    var btn = buttons[options.button];
                    btn.callback(btn);
                }catch(e){
                    autopagerBwUtil.consoleError(e)
                }
            });
            return;
        }
        
        var notification = notificationBox.getNotificationWithValue(id);
        if (notification) {
            notificationBox.removeNotification(notification)
        }
        
        function createButtonDelegate (btn)
        {
            btn = AutoPagerNS.extend (btn,{
                callback:function(){
                    btn.superObj.callback(btn);
                }
            })
        }
//        //adjust callback
        for(var b in buttons)
        {
            var btn = buttons[b]
            if (btn.callback)
               btn = createButtonDelegate(btn)
//                var btn = buttons[b];
//                var callback = btn.callback
//                buttons[b].callback = function(){
//                    callback(btn);
//                }
        }
        var priority = notificationBox.PRIORITY_INFO_MEDIUM;
        notificationBox.appendNotification(message, id,
            "chrome://autopager/skin/autopager32.png",
            priority, buttons);
    }

    ,
    deleteConfigFolder : function ()
    {
        var file = this.getConfigDir();
        if (file.exists()) {
            file.remove(true);
        }
    }
    ,
    getAddonsList: function _getAddonsList() {
        if (this.addonsList==null)
        {
            try{
                var extensionDir = Components.classes["@mozilla.org/file/directory_service;1"]
                .getService(Components.interfaces.nsIProperties)
                .get("ProfD", Components.interfaces.nsIFile);
                extensionDir.append("extensions");
                var entries = extensionDir.directoryEntries;

                var list = [];

                while (entries.hasMoreElements()) {
                    var entry = entries.getNext();
                    entry.QueryInterface(Components.interfaces.nsIFile);
                    if (!entry.isDirectory())
                        continue;
                    var guid = entry.leafName;
                    list.push(guid);
                }
                this.addonsList = list;
            }catch(e){
                this.addonsList = []
                //autopagerBwUtil.consoleError(e)
            }
        }
        return this.addonsList;
    },
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
    updateStatus : function(enabled,siteenabeld,discoveredRules,options) {        
      AutoPagerNS.buttons.setPageIcon(enabled,siteenabeld,discoveredRules,options);
      var doc = this.getBrowserDocument();
        if (!doc)
            return;
        
        var apStatus = autopagerUtils.getStatus(enabled,siteenabeld,discoveredRules);
        if(!doc.getElementById("autopager-button"))
        {
//            AutoPagerNS.buttons.setPageIcon(enabled,siteenabeld,discoveredRules,options);
            return ;
        }
//        autopagerBwUtil.consoleLog("updateStatus:" + apStatus) 
        var autopagerButton = doc.getElementById("autopager-button");
        if (autopagerButton){
            autopagerButton.setAttribute("tooltiptext",
            autopagerLite.isInLiteMode()? autopagerUtils.autopagerGetString("statusbar.menuitem.autopagerlite-discover.label"):
                            autopagerUtils.autopagerGetString("autopager.tooltip"));
        }
        var autopagerButton2= doc.getElementById("autopager-button-fennec");
        if (autopagerButton2){
            //autopagerButton2.setAttribute("hidden", !autopagerLite.isInLiteMode());
        }
        var autopagerButton3= doc.getElementById("autopager-pageaction-fennec");
        if (autopagerButton3)
        {
            var status = (!enabled || !siteenabeld)?"disabled":"enabled";
            status = autopagerUtils.autopagerGetString(status);
            var hostDisapley = "";
            var host = options.host;
            if (siteenabeld!=enabled && options.host)
            {                
                hostDisapley = options.host.replace(/^www\./, "");
            }
            else
                hostDisapley = autopagerUtils.autopagerGetString("allsites");
            
            var statusText = autopagerUtils.autopagerFormatString("autopagerstatus",[ status,hostDisapley ])
            autopagerButton3.setAttribute("title", statusText);
            var autopagerButton4= doc.getElementById("autopager-site-enable-popup");
            if (autopagerButton4)
            {
                if (host)
                {
                    autopagerButton4.hidden = false
                    autopagerButton3.hidden = false
                }
                else
                {
                    autopagerButton4.hidden = true
                    autopagerButton3.hidden = true
                }
                var titleKey = "enableon"
                if (siteenabeld)
                {
                    titleKey = "disableon"
                }
                autopagerButton4.setAttribute("label", autopagerUtils.autopagerFormatString(titleKey,[ host ]));                
            }
        }
//        autopagerBwUtil.consoleLog("updateStatus autopagerButton3:" + autopagerButton3) 
        var image = doc.getElementById("autopager_status");
        if (autopagerButton!=null || image!=null || autopagerButton2!=null || autopagerButton3!=null)
        {
            this.changeButtonStatus(autopagerButton,apStatus);
            this.changeButtonStatus(autopagerButton2,apStatus);
            this.changeButtonStatus(autopagerButton3,apStatus);
            if (image)
            {
                if (apStatus =="ap-disabled")
                    image.setAttribute("src", "chrome://autopager/skin/autopager-small.off.png");
                else if (apStatus =="ap-enabled")
                    image.setAttribute("src", "chrome://autopager/skin/autopager-small.on.png");
                else if (apStatus =="ap-site-disabled")
                    image.setAttribute("src", "chrome://autopager/skin/autopager-small-site.off.png");
                else if (apStatus =="ap-lite")
                    image.setAttribute("src", "chrome://autopager/skin/autopager-small.lite.png");
            }
        }
        this.showStatus();
        //this.showToolbarIcon();
    }
    ,
    showStatus : function(){
        var doc = this.getBrowserDocument();
            var statusBar = doc.getElementById("autopager_status");
            if (statusBar!=null)
                statusBar.hidden = autopagerPref.loadBoolPref("hide-status");
            var separator1 = doc.getElementById("autopager-context-separator1");
            if (separator1!=null)
                separator1.hidden = autopagerPref.loadBoolPref("hide-context-menu");
            var menu = doc.getElementById("autopager-context-menu");
            if (menu!=null)
                menu.hidden = autopagerPref.loadBoolPref("hide-context-menu");

    },
    showToolbarIcon : function(){
        if (!autopagerPref.loadBoolPref("hide-toolbar-icon"))
        {
            autopagerToolbar.addAutopagerButton();
        }
        else
            autopagerToolbar.removeAutopagerButton();
    },
    changeButtonStatus : function (autopagerButton,apStatus)
    {
        if (autopagerButton)
        {
            autopagerButton.setAttribute("apstatus",apStatus)
        }
    }   
    ,
    addTabSelectListener : function (callback,useCapture)
    {
        if (typeof callback == "undefined")
            return;
        var container = null;
        var browser = null;
        if (typeof gBrowser != 'undefined' && gBrowser.tabContainer)
        {
            browser = gBrowser;
            container = browser.tabContainer;
        }
        else{
            var w = AutoPagerNS.do_get_current_window();
            if (w)
            {
                if(w.gBrowser){
                    browser = w.gBrowser;
                    container = browser.tabContainer;                    
                }else if (w.BrowserApp){
                    browser = w.BrowserApp;
                    container = browser.deck;   
                }
            }
        }
        if (container)
        {
            var listner=function(event)
            {
                if (browser && browser.selectedTab && browser.selectedTab.linkedBrowser)
                {
                    var doc = browser.selectedTab.linkedBrowser.contentDocument;
                    callback(doc);
                }else if (browser && browser.selectedTab && browser.selectedTab.browser)
                {
                    var doc = browser.selectedTab.browser.contentDocument;
                    callback(doc);
                }
            };
            container.addEventListener("TabSelect", listner, useCapture);
            var tabUnload = function(){
                container.removeEventListener("TabSelect", listner, useCapture);
                var w = AutoPagerNS.do_get_current_window()
                if (w)
                    w.removeEventListener("unload", tabUnload, false);
            }
            AutoPagerNS.do_get_current_window().addEventListener("unload", tabUnload ,false);
        }
    },
    createXpath : function(doc) {
        toggleSidebar('autopagerSiteWizardSidebar',true);
        window.setTimeout(function(){
            var sidebar = document.getElementById("sidebar");
            var pickupContentPath = sidebar.contentDocument.getElementById("pickupContentPath");
            pickupContentPath.doCommand();
        },200);
    },
    testXPathTest : function(doc) {
        toggleSidebar('autopagerSiteWizardSidebar',true);
        window.setTimeout(function(){
            var sidebar = document.getElementById("sidebar");
            var contentXPath = sidebar.contentDocument.getElementById("contentXPath");
            contentXPath.focus();
        },200);
    },
sitewizard : function(doc) {
    if (autopagerPref.loadBoolPref("show-workshop-in-sidebar"))
    {
        toggleSidebar('autopagerSiteWizardSidebar',true);
        window.setTimeout(function(){
            var sidebar = document.getElementById("sidebar");
            var discoverPath = sidebar.contentDocument.getElementById("discoverPath");
            discoverPath.doCommand();

        },400);
    }else
    {
        var win=autopagerBwUtil.openWorkshopInDialog(doc.location.href);
    }
},
    openWorkshopInDialog : function(url,obj) {
        window.autopagerSelectUrl=url;
        window.autopagerOpenerObj = obj;
        var win= window.open("chrome://autopager/content/autopager-workshopWin.xul", "autopager-workshopWin",
                "chrome,resizable,centerscreen,width=700,height=600");
        win.focus();
        return win;
    },
    changeSessionUrl: function (container, url,pagenum)
    {
        var browser = AutoPagerNS.apSplitbrowse.getBrowserNode(container);
        if (!browser || !browser.docShell)
            return;
        var webNav = browser.docShell.QueryInterface(Components.interfaces.nsIWebNavigation);
        var newHistory = webNav.sessionHistory;

        newHistory = newHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);
        var entry = newHistory.getEntryAtIndex(newHistory.index,false).QueryInterface(Components.interfaces.nsISHEntry);
        //autopagerBwUtil.consoleLog(url)
        if (entry==null || entry.URI==null || entry.URI.spec==url)
        {
            return;
        }
        if (newHistory.index==0 ||
            (newHistory.getEntryAtIndex(newHistory.index-1,false)
                .QueryInterface(Components.interfaces.nsISHEntry) &&
                !(newHistory.getEntryAtIndex(newHistory.index-1,false)
                    .QueryInterface(Components.interfaces.nsISHEntry).URI.spec == container.location.href)))
                    {
            var newEntry = AutoPagerNS.apSplitbrowse.cloneHistoryEntry(entry);
            if (newEntry)
            {
                var uri = autopagerConfig.getRemoteURI(url);
                newEntry.setURI (uri);
                var histories = [];
                //copy all forward enties
                for(var i =newHistory.index+1 ;i<newHistory.count;i++)
                {
                    histories.push(newHistory.getEntryAtIndex(i,false).QueryInterface(Components.interfaces.nsISHEntry));
                }
                for(var i=0;i<histories.length;i++)
                {
                    newHistory.addEntry(histories[i], true);
                }
                newHistory.addEntry(newEntry, true);
                newEntry.saveLayoutStateFlag= false;
            }
        }
        else{
            var uri = autopagerConfig.getRemoteURI(url);
            entry.setURI (uri);
            entry.saveLayoutStateFlag= false;
        }
    },
 showAbout: function ()
 {
   try {
       var thisAddon = Application.extensions.get("autopager@mozilla.org");
     var extensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
       .getService(Components.interfaces.nsIExtensionManager);
var rds = extensionManager.datasource.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
  if (rds)
    rds.Flush();
     var database =
       Components.classes["@mozilla.org/rdf/datasource;1?name=composite-datasource"]
       .getService(Components.interfaces.nsIRDFCompositeDataSource);

     database.AddDataSource(extensionManager.datasource);
   window.openDialog("chrome://mozapps/content/extensions/about.xul",
                     "autopagerAbout",
                     "chrome,centerscreen,modal",
                     "urn:mozilla:item:autopager@mozilla.org",//thisAddon.id,
                     extensionManager.datasource);
   } catch (ex) {

   }

 } 
    ,
    isHTMLDocument : function(doc)
    {
        if (typeof doc=="undefined" || !doc)
            return false;
        if (typeof HTMLDocument !="undefined" && (!(doc instanceof HTMLDocument)))
            return false;
        else{
            return (typeof doc.documentElement!="undefined");
        }
        if (typeof XULElement !="undefined" && (doc instanceof XULElement))
            return false;
        if (typeof XULElement !="undefined" && (doc instanceof XULElement))
            return false;
        if (typeof Event !="undefined" && (doc instanceof Event))
            return false;
        if (typeof doc.documentElement=="undefined")
        {
            return false;
        }
        try{            
            return (/[Hh][Tt][Mm][Ll]Element/.test(doc.documentElement.toString()));
        }catch(e){
        }
        return false;
    },
    openSettingForDoc : function(doc)
    {
         var url = AutoPagerNS.getContentDocument().location.href;
         try{
             var docs = autopagerMain.getAllEnabledDoc(doc)
             if (docs != null && docs.length >0)
             {
                 var i=0;
                 while(docs[i].location == null && i< docs.length )
                    i++;
                  if (i<docs.length )
                  {
                      url = docs[i].location.href;
                  }
             }
         }catch(e){}
         autopagerBwUtil.openSetting(url);
    },
    openSetting : function(url,obj) {
        var settingUrl = "chrome://autopager/content/autopager.xul";
        if (!autopagerBwUtil.isMobileVersion())
        {
            var wm =  Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
            var windows = wm.getEnumerator(null);
            while (windows.hasMoreElements()) {
              var win = windows.getNext();
              if (win.document.documentURI == settingUrl) {
                win.focus();
                return;
              }
            }
            window.autopagerSelectUrl=url;
            window.autopagerOpenerObj = obj;
            var win = window.open(settingUrl, "autopager",
            "chrome,resizable,centerscreen");
            win.focus();
        }else
        {
            AutoPagerNS.window.location.href=settingUrl;
            if (typeof Browser!="undefined" && Browser._browserView)
            {
                var bv = Browser._browserView
                bv.setZoomLevel(0.5);
            }
        }
    }
    ,frameSafe : function()
    {
        return false;
    }
    ,
    toolbarDisableMonitor: function(e) {
        if (autopagerToolbar.removing)
            return;
        
        if ((e.type == 'DOMNodeRemoved') && e.target && e.relatedNode && (e.target.id == 'autopager-button') && e.relatedNode.id == 'wrapper-autopager-button')
        {
            autopagerBwUtil.usermodifingToolbar = true;
            return;
        }
        if (autopagerBwUtil.usermodifingToolbar){
            if ((e.type == 'DOMNodeInserted') && e.target && e.relatedNode && (e.target.id == 'autopager-button') && e.relatedNode.id != 'wrapper-autopager-button')
            {
                //toolbar icon added by user
                if (autopagerPref.loadBoolPref("hide-toolbar-icon"))
                {
                    autopagerPref.saveBoolPref("hide-toolbar-icon", false);
                }
                autopagerBwUtil.usermodifingToolbar = false;
            }
            else if ((e.type == 'DOMNodeRemoved') && e.target && e.relatedNode && (e.target.id == 'wrapper-autopager-button') && e.relatedNode.id != 'wrapper-autopager-button')
            {
                //toolbar icon removed by user
                if (!autopagerPref.loadBoolPref("hide-toolbar-icon"))
                {
                    autopagerPref.saveBoolPref("hide-toolbar-icon", true);
                }
                autopagerBwUtil.usermodifingToolbar = false;
            }
        }
    }
    }

//autopagerBwUtil.consoleLog("autopagerBwUtil loaded")
