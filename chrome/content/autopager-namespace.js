var AutoPagerNS = typeof AutoPagerNS != "undefined"?AutoPagerNS:{};
AutoPagerNS.is_global = function() {
    return false;
};
AutoPagerNS.namespace = function(ns) {
    if (!ns || !ns.length) {
        return null;
    }
    var levels = ns.split(".");
    var nsobj = AutoPagerNS;

    //ignore AutoPagerNS if it is included
    for (var i=(levels[0] == "AutoPagerNS") ? 1 : 0; i<levels.length; ++i) {
        nsobj[levels[i]] = nsobj[levels[i]] || {};
        nsobj = nsobj[levels[i]];
    }
    return nsobj;
};
AutoPagerNS.get = function(p,ns) {
    if (!p || !ns || !ns.length) {
        return null;
    }
    var levels = ns.split(".");
    var nsobj = p;

    //ignore AutoPagerNS if it is included
    for (var i=0; nsobj && i<levels.length; ++i) {
        nsobj = nsobj[levels[i]];
    }
    return nsobj;
};
AutoPagerNS.createDelegate = function(instance, method)
{
    return function()
    {
        return method.apply(instance, arguments);
    };
};

AutoPagerNS.extend  = function(destination, source) {
    if (typeof destination=="undefined") destination = {};
    for (var property in source) {
        if (property=="post_init")
        {
            if (typeof destination["_post_inits"] == "undefined")
            {
                destination["_post_inits"] = [];
                destination["post_init"]= function(){
                    var inits = destination["_post_inits"];
                    for(var i in inits)
                    {
                        try{
                            if (inits[i])
                                inits[i].apply(destination,arguments);
                        }catch(e){
                            autopagerBwUtil.consoleError(e);
                        }
                    }
                };
            }
            destination["_post_inits"].push(source[property]);
        }
        else{
            if (destination[property])
            {
                if (!destination["superObj"])
                    destination["superObj"]={};
                var p = source[property];
                if (typeof destination[property] == "function")
                {
                    p = AutoPagerNS.createDelegate(destination,destination[property]);
                }
                destination["superObj"][property] = p;
            }           
            destination[property] = source[property];
        }
    }
    return destination;
};
AutoPagerNS.enableEvents = function(obj)
{
    return AutoPagerNS.extend(obj,{
        _eventListenters : [],
        attachEventListener :function(event,method,allowblock,instance){
            this._eventListenters.push({event:event,method:method,allowblock:allowblock,instance:instance});
        }
        ,
        detachEventListener :function(event,method,allowblock,instance){
            for(var i in this._eventListenters)
            {
                var el = this._eventListenters[i];
                if (el && el.event == event && el.method == method && el.instance == instance)
                {
                    this._eventListenters.splice(i,1);
                    return i;
                }
            }
            return -1;
        }
        ,
        cleanEventListeners : function()
        {
            this._eventListenters = [];
        }
        ,
        triggerEvents : function(eventName/*,other arguments*/)
        {
            for(var i in this._eventListenters)
            {
                var el = this._eventListenters[i];
                if (el && eventName==el.event && el.method)
                {
                    try{
                        var ret = el.method.apply(el.instance,arguments);
                        //return true if listener allow block and the handler return true
                        if (el.allowblock && ret)
                            return true;                        
                    }catch(e){
                        autopagerBwUtil.consoleError(e);
                    }
                }
            }
            return false;
        }
        ,
        getEventListenters : function(){
            return this._eventListenters;
        }
    });
};
AutoPagerNS.namespace("util");
AutoPagerNS.namespace("strings");

AutoPagerNS = AutoPagerNS.extend(AutoPagerNS,{
    window: typeof window != "undefined" ? window : typeof content != "undefined"? content:{}
    ,
    getDocument: function(){var doc =AutoPagerNS.get(this.window,"document"); if (doc) return doc; else return ((typeof document != "undefined") ? document : undefined);}
    ,
    document: AutoPagerNS.get(this.window,"document") || typeof document != "undefined" ? document : undefined
    ,
    getContentDocument : function() {return ((typeof content != "undefined") && content && (typeof content.document != "undefined")) ? content.document:this.getDocument();}
    ,
    getContentWindow : function() {
        var win = typeof window != "undefined" ? window : typeof content != "undefined"? content:null;
        if (win)
            return win;
        return null;
    }
    ,
    XPathResult : typeof XPathResult != "undefined" ? XPathResult : AutoPagerNS.get(this.window,"XPathResult") || {    
        ANY_TYPE 	:0,
        NUMBER_TYPE 	:1,
        STRING_TYPE 	:2,
        BOOLEAN_TYPE 	:3,
        UNORDERED_NODE_ITERATOR_TYPE 	:4,
        ORDERED_NODE_ITERATOR_TYPE 	:5,
        UNORDERED_NODE_SNAPSHOT_TYPE 	:6,
        ORDERED_NODE_SNAPSHOT_TYPE 	:7,
        ANY_UNORDERED_NODE_TYPE 	:8,
        FIRST_ORDERED_NODE_TYPE 	:9
    }
    ,
    do_get_windows : function () //get browser windows
    {
        //need be implemented in each browser implementation
        //must not return null
        //this should never been call directly since some brower doesn't support it
        return [];
    }
    ,
    do_get_tabs : function (win) //get browser tab
    {
        //need be implemented in each browser implementation
        //must not return null
        //this should never been call directly since some brower doesn't support it
        return [];
    }
    ,
    walk_windows : function (callback) //walk through browser windows
    {
        //can be override in each browser implementation
        if (!callback)
            return;
        var ws = this.do_get_windows();
        for(var k in ws)
        {
            callback(ws[k]);
        }
    }
    ,
    walk_tabs : function (win,callback) //walk through browser window tabs
    {
        //can be override in each browser implementation
        if (!callback)
            return;
        var tabs = this.do_get_tabs(win);
        for(var k in tabs)
        {
            callback(win,tabs[k]);
        }
    }
    ,
    do_get_current_window : function () //get current browser window
    {
        //need be implemented in each browser implementation
        //this should never been call directly since some brower doesn't support it
        return null;
    }
    ,
    do_get_current_tab : function () //get current browser tab
    {
        //need be implemented in each browser implementation
        //this should never been call directly since some brower doesn't support it
        return null;
    }
    ,
    get_current_window : function (callback) //get current browser window
    {
        if (callback)
        {
            callback(this.do_get_current_window());
        }
    }
    ,
    get_current_tab : function (callback) //get current browser tb
    {
        if (callback)
        {
            callback(this.do_get_current_tab());
        }
    }
    ,
    get_messager : function (tab) //get messager
    {
        //need be implemented in each browser implementation
        return null;
    }
    ,
    get_tab_content : function (tab) //get messager
    {
        //need be implemented in each browser implementation
        return null;
    }
    ,
    get_tab_url : function (tab) //get tab_url
    {
        var doc = this.get_tab_content(tab);
        if (doc && doc.location && doc.location.href)
            return doc.location.href;
        return null;
    }
    ,close_tab : function (tab) //get tab_url
    {
        if(tab)
        {
            if (tab.close)
                tab.close();
            else if(tab.parentNode){
                tab.parentNode.removeChild(tab);
            }
        }
    }
    ,
    get_accept_languages : function (callback)
    {
        if (callback)
        {
            callback(this.do_get_accept_languages());
        }
    }
    ,
    do_get_accept_languages : function () //never call to this,need be implemented in each browser implementation if the default not applied
    {
        var lang = "en-US";
        if (typeof navigator!="undefined" && navigator && navigator.language)
            lang = navigator.language;
        else if (typeof AutoPagerNS.window.navigator!="undefined" && AutoPagerNS.window.navigator && AutoPagerNS.window.navigator.language)
            lang = AutoPagerNS.window.navigator.language;
        return [lang];
    }
    ,
    get_url : function (relative)
    {
        return relative;
    }
    , 
    newXMLHttpRequest: function()
    {
        var xmlhttp = null;
        try{
            xmlhttp = new AutoPagerNS.window.XMLHttpRequest();
        }catch(e){
            try{
                xmlhttp = new XMLHttpRequest();
            }catch(ex){
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");                          
            }
        }
        return xmlhttp;
    },
    createWindow : function(url,name,specs,replace)
    {
        return window.open(url,name,specs,replace);
    },
    add_tab : function(options)
    {
        if (options && options.url)
        {
            if (!AutoPagerNS.is_global())
                return AutoPagerNS.message.call_function("autopager_add_tab",options);
            else
                return autopagerBwUtil.autopagerOpenIntab(options.url);
        }
    }    
});

//include gloable function like addEventListener/removeEventListener on window
AutoPagerNS.browser = AutoPagerNS.extend(AutoPagerNS.namespace("browser"),{
    addEventListener : (typeof addEventListener== "function") ? AutoPagerNS.createDelegate(undefined,addEventListener): AutoPagerNS.createDelegate(AutoPagerNS.window,AutoPagerNS.window.addEventListener)
    ,
    removeEventListener : (typeof removeEventListener== "function") ? AutoPagerNS.createDelegate(undefined,removeEventListener): AutoPagerNS.createDelegate(AutoPagerNS.window,AutoPagerNS.window.removeEventListener)
});

AutoPagerNS.message = AutoPagerNS.extend (AutoPagerNS.namespace("message"),
{
    callbacks : {},
    msgname: "APInternalMessage",
    call_function : function(fn,options,callback)
    {
//        autopagerBwUtil.consoleLog("call_function:" + fn)
        this.call_function_on_object(fn,options,callback);
    }
    ,call_function_on_object : function(fn,options,callback,messager)
    {
//        autopagerBwUtil.consoleLog("call_function_on_object:" + fn)
        options = this.prepareOptions(fn,options,callback,messager);
        if (typeof callback != 'undefined' && callback!=null)
        {
            var subfix = "";
            for(var i=0;i<6;i++)
                subfix += Math.floor(Math.random()*16).toString(16).toUpperCase();
            options.callback=fn + "_" + subfix;
            this.callbacks[options.callback] = callback;
            this.callbacks.length++;
        }
        var msg = {
                fn:fn,
                options:options
            };
        try{
            this.do_call_function_on_object(messager,this.msgname,msg);
        }catch(e){
            autopagerBwUtil.consoleError("error call_function_on_object:" + fn + ":" + messager + ":" + e) ;
        }
    }
    ,handle_callback : function (data)
    {
        var callback = this.callbacks[data.fn];
//        autopagerBwUtil.consoleLog("handle_callback:" + data.fn + ":" + callback)
        if (callback)
        {
            delete this.callbacks[data.fn];
            
            callback(data.options);
        }   
    }
    ,broadcastMessage : function(fn,options,callback)
    {
        var me = this;
        AutoPagerNS.walk_windows(function(w){
            AutoPagerNS.walk_tabs(w,function(win,tab){
                me.call_function_on_object(fn,options,callback,AutoPagerNS.get_messager(tab));
            });
        });
    }
    ,prepareOptions : function (fn,options,callback,messager)
    {
        if (typeof options == 'undefined')
        {
            options = {};
        }
        //attach some caller info
        if (AutoPagerNS.getContentWindow() && AutoPagerNS.getContentWindow().location)
        {
            var location = AutoPagerNS.getContentWindow().location;
            if (!options["host"] && location.host )
                options["host"] = location.host;
            if (!options["url"] && location.href )
                options["url"] = location.href;      
        }
        return options;
    }
    ,do_call_function_on_object : function(messager,msgname,msg)
    {
        //need be implemented in each browser implementation
    }
    ,request_handler : function(request, sender){
        if (request==null)
            return;
        if (request.fn_res)
        {
            this.handle_callback(request);
        }
        else if (AutoPagerNS.namespace("message_handlers")[request.fn])
        {
            var options = request.options;
            var Me = this;
            AutoPagerNS.namespace("message_handlers")[request.fn](request, sender,function(msg){
                if (options.callback)
                {
//                    autopagerBwUtil.consoleLog("call back:" + request.fn + " " + msg + " on " + sender)
                    AutoPagerNS.message.do_call_function_on_object(sender,AutoPagerNS.message.msgname,{
                        fn:options.callback,
                        fn_res:true,
                        options:Me.prepareOptions(request.fn,msg,null,sender)
                    });
//                    autopagerBwUtil.consoleLog("done call back:" + request.fn + " " + msg + " on " + request)
                    
                }
            });
        }            
    }
});

AutoPagerNS.message_handlers = AutoPagerNS.extend (AutoPagerNS.namespace("message_handlers"),
{
    autopager_open_alert : function(request, sender, callback)
    {
        if (AutoPagerNS.browser.open_alert)
        {
            var options = request.options;
            AutoPagerNS.browser.open_alert(options.title,options.message,options.link,callback,options);            
        }        
    }
    ,autopager_open_notification : function(request, sender, callback)
    {
        if (AutoPagerNS.browser.open_notification)
        {
            var options = request.options;
            AutoPagerNS.browser.open_notification(options.id,options.message,options.buttons,callback,options);            
        }        
    }
});

AutoPagerNS.buttons = AutoPagerNS.extend (AutoPagerNS.namespace("buttons"),
{
    updateButton : function (icon)
    {
        var item = this.getButton();
        if (!item)
            this.addButton(icon);
        else
            if (typeof icon!="undefined")
            {
                try{
                    this.setButtonIcon(item, icon);
                }catch(e){
//                    autopagerBwUtil.consoleLog("updateButton:" + item + ":" + icon + " with error:" +e)
                    this.removeButton();
                    this.addButton(icon);
                }
                //opera.contexts.toolbar.removeItem(item)
                //this.addButton(icon)
            }
            
    }
    ,setButtonIcon : function(button,icon)
    {
        //need be implemented in each browser implementation
    }
    ,addButton : function(icon)
    {
        //need be implemented in each browser implementation
    },getButton : function()
    {
        //need be implemented in each browser implementation
    },
    removeButton : function()
    {
        //need be implemented in each browser implementation
    }
});
