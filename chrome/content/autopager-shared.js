//common routers shared by both global and content pages
//class constructor
function AutopagerCOMPType() {
    // If you only need to access your component from Javascript, uncomment the following line:
    this.wrappedJSObject = this;
}

// class definition
AutopagerCOMPType.prototype = {

    allSiteSetting: [],
    updateSites: [],
    siteConfirms : [],
    discoverdUrls : [],
    // define the function we want to expose in our interface
    loadAll: function() {
        return this.allSiteSetting;
    },
    setAll: function(settings) {
        this.allSiteSetting = settings;
    },

    getUpdateSites : function() {
        return this.updateSites;
    },
    setUpdateSites : function(sites) {
        this.updateSites = sites;
    },
    getSiteConfirms : function() {
        return this.siteConfirms;
    },
    setSiteConfirms : function(sites) {
        this.siteConfirms = sites;
    },
    getDiscoveredUrls : function()
    {
        return this.discoverdUrls;
    }
    ,
    existingPatterns : null
    ,
    getPatterns : function() {
        return this.existingPatterns;
    }
    ,
    setPatterns : function(patterns) {
        this.existingPatterns = patterns;
    }

//        ,
////        QueryInterface: function(aIID)
////        {
////                if (!aIID.equals(nsIAutopagerCOMP) &&
////                        !aIID.equals(nsISupports))
////                        throw Components.results.NS_ERROR_NO_INTERFACE;
////                return this;
////        }
};

