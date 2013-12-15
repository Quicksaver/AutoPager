var autopagerPrefLocalstarage
var autopagerPref
try{
    autopagerPrefLocalstarage =
    {
        ids:"",
        init : function()
        {
            AutoPagerNS.message.call_function("autopager_get_prefs",{},function(options){
//                autopagerBwUtil.consoleLog(autopagerBwUtil.encodeJSON(options.prefs))
                autopagerPrefLocalstarage.autopager_set_prefs(options.prefs,false)
            })
        },
        loadUTF8Pref : function(name) {
            var str = this.loadPref(name);
            //TODO need to convert to UTF-8
            return str;            	  	
        },
        saveUTF8Pref : function(name,value) {
            try{
                this.savePref(value);
            }catch(e) {
                savePref(name,value);
            }	  	
        },
        loadPref : function(name,defaultValue) {
            var v = "";
//            autopagerBwUtil.consoleLog("loadPref:" +name + ":" + this.getLocalStorage())
            try{
                if (this.getLocalStorage()["autopager." + name] == null)
                {
                    if(this[name]!=null)
                        v = this[name]
                    else
                        v = this.getLocalStorage()["autopager.default-of-" + name]
                }
                else
                    v = this.getLocalStorage()["autopager." + name];
                if (typeof v == "undefined" && typeof defaultValue != "undefined")
                    v = defaultValue;
                if (name=='ids' && v==null && this.ids!=null)
                    v = this.ids;
            }catch(e) {
                autopagerBwUtil.consoleError("Unable to load pref:" + name + ":" + e)
            //autopagerMain.alertErr(e);
            //autopagerBwUtil.consoleError(e)
            }
            //    if (name=="enabled")
            //        alert(name + " = " + v)
//                autopagerBwUtil.consoleLog("after loadPref:" + name + ":" + v)
            return v;
        },
        getDatePrefs : function(name){
            var date = new Date();
            try{        
                var timestamp = this.loadPref(name); // get a pref
                date.setTime(timestamp);
            }catch(e) {
            //autopagerMain.alertErr(e);
            }     
            return date;
        },
        setDatePrefs : function(name,date){
            try{
                if (this.loadPref(name)!=date.getTime())
                    this.savePref( name,date.getTime()); // get a pref
            }catch(e) {
            //autopagerMain.alertErr(e);
            }     
        },

        loadBoolPref : function(name,defaultValue) {
            try{
                var v = this.loadPref(name,defaultValue);
                return (typeof v != "undefined") && (v=="true" || v=="1"); // get a pref
            }catch(e) {
                autopagerBwUtil.consoleError("Unable to load pref:" + name)
            //autopagerMain.alertErr(e);
            }
            return false;
        },
        savePref : function(name,value) {
            try{
                if (typeof value == "undefined")
                    value=""
                if(this[name]==value)
                    delete this.getLocalStorage()["autopager." + name];
                else if (this.loadPref(name)!=value)
                    this.getLocalStorage()["autopager." + name] = value; // set a pref
                if (name=='ids' && value)
                    this.ids = value;
            }catch(e) {
            //autopagerMain.alertErr(e);
            }
        },
        saveBoolPref : function(name,value) {
            try{
                this.savePref(name,value); // get a pref
            }catch(e) {
            //autopagerMain.alertErr(e);
            }
            return "";
        },
        resetPref : function(name,value) {
            try{
                this.savePref(name,this[name]);
                delete this.getLocalStorage()["autopager.default-of-" + name]
            }catch(e) {
            //autopagerMain.alertErr(e);
            }
        },
        userPrefs : function ()
        {
            var keys={}
            for(var k in this.getLocalStorage())
            {
                if (k.indexOf("autopager.")==0 && k.indexOf("autopager.default-of-")==-1&& k.indexOf("autopager.config.")==-1)
                {
                    var p = k.substr(k.indexOf("autopager.")+10);
                    keys[p]=p
                }
            }
            return keys;
        },
        saveMyName : function(myname) {
            this.saveUTF8Pref("myname", myname); // set a pref
        },
        loadMyName : function() {
            try{
        
                return this.loadUTF8Pref("myname"); // get a pref
            }catch(e) {
            //autopagerMain.alertErr(e);
            }
            return "";
        },
        changeMyName : function() {
            var name = prompt(autopagerUtils.autopagerGetString("inputname"),this.loadMyName());
            if (name!=null && name.length>0) {
                this.saveMyName(name);
            }
            return name;
        }
        , getLocalStorage : function ()
        {
            return localStorage; //this;//AutoPagerNS.window.
        }
        ,autopager_set_prefs: function (prefs,load) {
            for(var k in prefs)
            {
                var pref = prefs [k]
                var name = k
                if (name.indexOf("default-of-")>=0)
                    name =  name.substr(name.indexOf("default-of-")+11);
                autopagerPref.saveDefaultPref(name, pref);
                if (load && name=="enabled")
                    autopagerMain.handleCurrentDoc();
        
//                autopagerBwUtil.consoleLog("autopager_set_pref:" +name + ":" +  pref)
            }
        }
    }
    
    
    try{
        autopagerPref = autopagerPrefLocalstarage
        autopagerPref.oldSavePref = autopagerPref.savePref
        autopagerPref.saveDefaultPref
            = function(name,value)
            {
                autopagerPref[name] = value
            };

        autopagerPref.savePref = function(name,value)
        {
            if (name== "enabled" || name.indexOf("host.")==0){
                //store locally
                autopagerPref.oldSavePref(name,value)
            }
            else{
                autopagerPref.saveDefaultPref(name, value)
                AutoPagerNS.message.call_function("autopager_set_pref",{
                    name: name,
                    value:value
                });
            }
        }        
    //        alert(port)
    }catch(e)
    {
        autopagerBwUtil.consoleError(e)
    }

}catch(e)
{
    autopagerBwUtil.consoleError(e)
}
