/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Scott MacGregor <mscott@netscape.com>
 *   Jens Bannmann <jens.b@web.de>
 *   Pete Burgers <updatescanner@gmail.com>
 *   Wind Li <wind@teesoft.info>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var autopagerAlert=
{
    gFinalHeight : 50,
    gSlideIncrement : 4,
    gSlideTime : 100,
    gOpenTime : 5000,
    gOpenTimeAfterLinkClick : 3000, // Close 3 second after clicking on the link
    gPermanent : false, // should the window stay open permanently (until manually closed)

    g_MAX_HEIGHT : 134,
    title : null,
    message : null,
    link : null,
    onLoad : function()
    {
        var me = autopagerAlert;
        if(typeof sizeToContent == "function")
            sizeToContent();        
        me.gFinalHeight = window.outerHeight;  //134  5 lines - 152 6 lines
        if ( me.gFinalHeight > me.g_MAX_HEIGHT ) {
            me.gFinalHeight = me.g_MAX_HEIGHT;
        }

        window.outerHeight = 1;
        // be sure to offset the alert by 10 pixels from the far right edge of the screen
        window.moveTo( (screen.availLeft + screen.availWidth - window.outerWidth) - 10, screen.availTop + screen.availHeight - window.outerHeight);
        setTimeout(me._animateAlert, me.gSlideTime);
    }
    ,
    prefillAlertInfo : function()
    {
        var me = autopagerAlert;
        var args
        if (typeof window.arguments != "undefined")
        {
            args = window.arguments
        }else
        {
            args = opener.arguments
        }
        me.title = args[0];
        me.message = args[1];
        me.link = args[2];
        me.callback = args[3];
        if (typeof args[4] != "undefined")
            me.gOpenTime = args[4];

        var msgLabel = document.getElementById("message");
        msgLabel.value=me.message;
        msgLabel.textContent = me.message;
        var titleLabel = document.getElementById("title");
        titleLabel.value=me.title;
        titleLabel.textContent = me.title;
    },
    onAlertClick : function()
    {
        if (autopagerAlert.callback)
            autopagerAlert.callback({})
        else
            AutoPagerNS.add_tab({url:autopagerAlert.link});
    },
    onLinkClick : function(aEvent)
    {
        if (autopagerAlert.callback)
            autopagerAlert.callback({})
        else
            AutoPagerNS.add_tab({url:autopagerAlert.link});
        // Close the alert soon
        setTimeout(autopagerAlert._closeAlert, autopagerAlert.gOpenTimeAfterLinkClick);
        // Don't open the sidebar
        aEvent.stopPropagation();
    },

    onAlertClose: function()
    {
        var me = autopagerAlert;
        me._closeAlert();
    },
    _animateAlert : function()
    {
        var me = autopagerAlert;
        if (window.outerHeight < me.gFinalHeight) {
            window.screenY -= me.gSlideIncrement;
            window.outerHeight += me.gSlideIncrement;
            setTimeout(me._animateAlert, me.gSlideTime);
        } else {
            //            if (prefBranch.getBoolPref("playSound")) {
            //                me._playSound();
            //            }
            if (!me.gPermanent) {
                setTimeout(me._closeAlert, me.gOpenTime);
            }
        }
    },

    _closeAlert : function()
    {
        var me = autopagerAlert;
        if (window.outerHeight > 1)
        {
            window.screenY += me.gSlideIncrement;
            window.outerHeight -= me.gSlideIncrement;
            setTimeout(me._closeAlert, me.gSlideTime);
        }
        else
        {
            window.close();
        }
    }
}
