AutoPagerNS.message = AutoPagerNS.extend (AutoPagerNS.namespace("message"),
{
    do_call_function_on_object : function(messager,msgname,msg)
    {
//        autopagerBwUtil.consoleLog("do_call_function_on_object:" + msg.fn)
        try{
            if (typeof messager != "undefined")
            {
                messager.sendAsyncMessage(msgname,msg)
            }
            else
            {
                sendAsyncMessage(msgname,msg)
            }            
        }catch(e){
            autopagerBwUtil.consoleError("error call_function_on_object:" + msg.fn + ":" + messager + ":" + e) 
        }
    }
}
);


autopagerPref = AutoPagerNS.extend (autopagerPref,{
    getLocalStorage : function ()
    {
        return this;
    }
}
);
addMessageListener(AutoPagerNS.message.msgname, function(event) {    
    if (event && event.name==AutoPagerNS.message.msgname && event.json && event.json.fn)
    {
        AutoPagerNS.message.request_handler(event.json,event.target.messageManager)        
    }
})

AutoPagerNS.browser = AutoPagerNS.extend (AutoPagerNS.namespace("browser"),
{
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

AutoPagerNS.browsercontent = AutoPagerNS.extend (AutoPagerNS.namespace("browsercontent"),
{
    post_init : function()
    {
         var domLoad = function(ev) {
            AutoPagerNS.browser.removeEventListener("DOMContentLoaded", domLoad, false);
            try
            {
                autopagerMain.onContentLoad(ev);
            }catch(e){
                autopagerBwUtil.consoleError("DOMContentLoaded with error:" + e)
            }
        }
        AutoPagerNS.browser.addEventListener("DOMContentLoaded",domLoad, false);               
                        
    }
})