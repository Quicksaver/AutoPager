var autopagerRules =
{
    autopagerCOMP:null,
    getAutopagerCOMP : function ()
    {
        if (this.autopagerCOMP == null)
        {
            this.autopagerCOMP = new AutopagerCOMPType();
        }
        return this.autopagerCOMP;
    },
    discoverRule: function(url,matchCallBack)
    {
        var callback = function(options) {        
            var pattern = options.pattern
            //alert("response:" + autopagerBwUtil.encodeJSON(posNew));
            if (pattern !=null && typeof pattern.promptNeed != "undefined")
            {
                autopagerLite.promptLiteDiscovery();
            }
            else{
                try{
                    matchCallBack(pattern);
                }catch(e)
                {
                    autopagerUtils.outputStack(e);
                }
            }
        }
        
        AutoPagerNS.message.call_function("autopager_discoverRule"
            ,{ "url": url},callback) 
    },
    getNextMatchedSiteConfig: function(url,pos,matchCallBack)
    {
//        autopagerBwUtil.consoleLog("getNextMatchedSiteConfig")
        try{
            AutoPagerNS.message.call_function('autopager_getNextMatchedSiteConfig',{
              url:url,pos:pos      
            },function (options){
//                autopagerBwUtil.consoleLog("getNextMatchedSiteConfig respnsed:" + options.posNew)
                try{
                    if (!matchCallBack(options.posNew) && options.posNew!=null)
                    {
                        autopagerRules.getNextMatchedSiteConfig(url,options.posNew,matchCallBack)
                    }
                }catch(e)
                {
                    autopagerBwUtil.consoleError(e);
                }
            });                        
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }

    }
    ,isAllowUpdate : function()
    {
        return false;
    }
    , addRule : function (key,rule)
    {
        AutoPagerNS.message.call_function('autopager_add_rule',{
              key:key,rule:rule      
            },function (options){
            })
    }
}
