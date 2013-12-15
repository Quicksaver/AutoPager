/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

function autopagerTip(prefix)
{
    this.likPrefix = prefix;
}

autopagerTip.prototype= {
    tipsOn:0,
    previouseElement : null,
    likPrefix: null,
    eventAdded: false,
    moutIn : false,
    needShowTip : function(ele)
    {
        return ele.tagName == 'lable'
        || ele.tagName == 'textbox'
        || ele.tagName == 'button'
        || ele.tagName == 'tree'
        || ele.tagName == 'checkbox'
        || ele.tagName == 'menulist'
        || ele.tagName == 'toolbarbutton'
    ;
    },
    openHelpTip : function(ele)
    {
        document.getElementById('helptip').hidePopup();
        window.open(document.getElementById('helptip').getAttribute("href"), "_blank", "");
    },
    onMouseOver : function(event)
    {
        var ele = event.originalTarget;
        if (this.previouseElement!=null && ele==this.previouseElement)
            return;
        if (this.needShowTip(ele))
        {
            this.tipsOn=1;
            this.previouseElement = ele;
            document.getElementById('helptip').setAttribute("href","http://www.teesoft.info/wiki/" + this.likPrefix + ele.getAttribute("id"))
            document.getElementById('helptip').hidePopup();
            var obj = this;

            if (!this.eventAdded)
            {
                document.getElementById('helptip').addEventListener("mouseover", function(){
                    obj.mouseIn = true;
                }, false);
                document.getElementById('helptip').addEventListener("mouseoout", function(){
                    obj.mouseIn = false;
                    document.getElementById('helptip').hidePopup();
                }, false);
            }
            var archorEle = this.previouseElement;
            if (archorEle.tagName == "menulist")
                archorEle = archorEle.previousSibling;

            document.getElementById('helptip').openPopup(archorEle,
                'after_end',40,-30,false,null)  ;
            document.getElementById('helptip').sizeTo(48,48);

            var preEle = obj.previouseElement;
            window.setTimeout(function(){
                if (!obj.mouseIn &&(obj.previouseElement == preEle || obj.tipsOn==0))
                {
                    document.getElementById('helptip').hidePopup();
                    obj.previouseElement = null;
                }
            }
            ,3000);
        
        }
    },

    onMouseOut : function(event){
        this.tipsOn=0;
        var obj = this;
        var ele = event.target;
        if (this.previouseElement !=null && this.needShowTip(ele))
        {
            window.setTimeout(function(){
                if (!obj.mouseIn && obj.tipsOn==0)
                {
                    document.getElementById('helptip').hidePopup();
                    obj.previouseElement = null;
                }
            }
            ,3000);
            
        }
    }
}