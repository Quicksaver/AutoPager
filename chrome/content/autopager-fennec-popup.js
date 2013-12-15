var AutoPagerPopup = {
    get box() {
        delete this.box;
        this.box = document.getElementById("autopager-popup");

        let [tabsSidebar, controlsSidebar] = [Elements.tabs.getBoundingClientRect(), Elements.controls.getBoundingClientRect()];
        this.box.setAttribute(tabsSidebar.left < controlsSidebar.left ? "right" : "left", controlsSidebar.width - this.box.offset);
        this.box.top = 100;//this.apButton.getBoundingClientRect().top - this.box.offset;

        // Hide the popup if there is any new page loading
        let self = this;
        messageManager.addMessageListener("pagehide", function(aMessage) {
            self.hide();
        });

        return this.box;
    },
    get apButton ()
    {
        delete this.apbutton;
        this.apbutton = document.getElementById("autopager-button-fennec");
        return this.apbutton;
    }
    ,
    hide : function hide() {
        this.box.hidden = true;
        BrowserUI.popPopup(this);
    },

    show : function show() {
        this.box.hidden = false;
        this.box.anchorTo(this.apButton);

        // include starButton here, so that click-to-dismiss works as expected
        BrowserUI.pushPopup(this, [this.box, this.apButton]);
    },

    toggle : function toggle() {
        if (this.box.hidden)
            this.show();
        else
            this.hide();
    }
};
