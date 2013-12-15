AutoPagerNS.strings = AutoPagerNS.extend (AutoPagerNS.namespace("strings"),{
    inited : false,
    init : function ()
    {
        if (!this.inited)
        {
            this.loadFile({
                autopager:"autopager",
                command:"commands"
            });
            this.inited = true;
            AutoPagerNS.stringsfile.init();
        }
        return this;   
    }
    ,
    initClient : function()
    {
        this.init();
    }
    ,
    loadFile :function(filenames)
    {
        this.strings = {};
        // Help box hasn't been filled yet, need to do it now
        var stringService = Components.classes["@mozilla.org/intl/stringbundle;1"]
        .getService(Components.interfaces.nsIStringBundleService);
        for (var file in filenames)
        {
            try{
                this.strings[file] = (stringService.createBundle("chrome://autopager/locale/" + filenames[file] + ".properties"));            
            }catch(e){
                autopagerBwUtil.consoleError("error in new load file:" + e)    
            }
        }
    }
    ,
    getString : function (name)
    {
        if (!this.strings)
            this.post_init();
        if (this.strings != null)
        {
            for (var file in this.strings)
                try{
                    if (this.strings[file])
                        return this.strings[file].GetStringFromName(name);
                }catch(e)
                {
                //try next file
                }            
        }
        return AutoPagerNS.stringsfile.getString(name);
        //return name;
    }

    ,
    getFormattedString : function(name,params)
    {
//        autopagerBwUtil.consoleLog("getFormattedString:" + this.strings + ":" + name);
        if (this.strings != null)
        {
            for (var file in this.strings)
                try{
                    if (this.strings[file])
                        return this.strings[file].formatStringFromName(name,params,params.length);
                }catch(e)
                {
                //try next file
                }            
        }
        return AutoPagerNS.stringsfile.getFormattedString(name,params);
        //return this.getString(name);
    }
    ,   
    post_init : function()
    {
//        autopagerBwUtil.consoleLog("init strings");        
        try{
            if (AutoPagerNS.is_global())
                this.init(); 
            else
                this.initClient();        
        }catch(e){
            autopagerBwUtil.consoleError("error in new autopagerStrings:" + e)    
        }                   
    }
});

AutoPagerNS.stringsfile = AutoPagerNS.extend (AutoPagerNS.namespace("stringsfile"),{
    strings : {},
    inited : false,
    init : function()
    {        
        this.loadFile("autopager","dtd");
    
//        //fallback to client model
//        if (this.getString("autopager.label.value")=="autopager.label.value")
//        {
//            this.initClient()
//        }
        this.inited = true;
        return this;    
    },
    initClient : function(callback)
    {        
//        autopagerBwUtil.consoleLog("autopagerStrings initClient")
    
        if (this.getString("autopager.label.value")=="autopager.label.value")
        {
            var Me = this
            //not actuallly loaded, we may in a injected script, try let background page loaded
            AutoPagerNS.message.call_function("autopager_getstrings",{
                },function (options){
                    this.inited = true;
                    Me.strings = options.strings
//                    autopagerBwUtil.consoleLog("Me.strings:" + Me.strings +":" + Me.getString("autopager.label.value"))
                    if (callback)
                    {
                        callback(Me)
                    }
                })
        }else if (callback)
        {
            callback(Me)
        }
        return this;    
    }
    ,
    loadFile : function(filename,type)
    {

        try{
            var url = AutoPagerNS.get_url("/locale/" + filename + "." + type); // + lang + "/"
            var xhr = autopagerUtils.newXMLHttpRequest();
            xhr.overrideMimeType('text/plan');
            var Me = this;
            xhr.onreadystatechange = function() {
                Me.process(xhr.responseText, type);
            };
            xhr.open("GET",url, true);
            xhr.send(null);
            
        }catch(e)
        {
            autopagerBwUtil.consoleError("error load file:" + url +":" + e);
        }

    },
    process : function (strs,type)
    {
        if ("properties" == type)
        {
            this.processProperties(strs)
        }else
            this.processDtd(strs)
    },
    escape : function (str)
    {
        if (str==null)
            return str;
        return str.replace(/\\n/g,"\n").replace(/\\r/g,"\n").replace(/\\/g,"");
    },
    processProperties : function (strs)
    {
        var lines = strs.split("\n");
        for(var i=0;i<lines.length;i++)
        {
            var str = lines[i]
            if (!str.match(/^(\s)*\;/) && !str.match(/^(\s)*#/))
            {
                var pos = str.indexOf("=");
                if (pos!=-1)
                {
                    //alert(str.substring(0,pos) + ":" +str.substring(pos+1))
                    this.strings[str.substring(0,pos)] = this.escape(str.substring(pos+1))
                }
            }
        }
    },
    processDtd : function (strs)
    {
        var lines = strs.split("\n");
        for(var i=0;i<lines.length;i++)
        {
            var str = lines[i]
            //alert(str)
            //alert(str.match(/^(\s)*\<\!ENTITY/))
            if (str.match(/^(\s)*\<\!ENTITY/))
            {
                var pos = str.indexOf("<!ENTITY");
                var pos2 = str.indexOf(" ",pos+9);
                //alert((pos+8) + " " + pos2 + ":" +  str.substring(pos+8,pos2) + " = " + str.substring(pos2+2,str.length-2))
                this.strings[str.substring(pos+9,pos2)] = this.escape(str.substring(pos2+2,str.length-2))
            }
        }
    },
    getString : function (name)
    {
        if (!this.inited)
            this.init();
        
        try{
            if (this.strings != null)
            {
                var str = this.strings[name];
                if (typeof str != "undefined")
                    return str;
            }
        }catch(e)
        {
        }
        return name;
    }
    ,
    GetStringFromName:function (name)
    {
        return this.getString();
    }
    ,
    formatStringFromName : function (name,params)
    {
        return this.getFormattedString(name,params)
    }
    ,
    getFormattedString : function(name,params)
    {
        if (!this.inited)
            this.init();        
        try{
            var str = this.getString(name)
            return this.formatString(str,params);
        }catch(e)
        {
        }
        return this.getString(name);
    }
    ,
    formatString : function(format,params)
    {
        var strs = format.split("%S");
        var str = "";
        for(var i=0;i<strs.length;i++)
        {
            str += strs[i]
            if (i<params.length)
            {
                str += params[i]
            }
        }
        return str;
    }
//    ,   
//    post_init : function()
//    {
//        try{
//            if (AutoPagerNS.is_global())
//                this.init(); 
//            else
//                this.initClient();        
//        }catch(e){
//            autopagerBwUtil.consoleError("error in new autopagerStrings:" + e)    
//        }                   
//    }
});