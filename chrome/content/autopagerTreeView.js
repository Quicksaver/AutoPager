function autopagerTreeView() {}

autopagerTreeView.prototype = {
  /* debugging */
  get wrappedJSObject() { return this; },
  /* nsISupports */
  QueryInterface: function QueryInterface(aIID)
  {
    if (Components.interfaces.nsITreeView.equals(aIID) ||
        Components.interfaces.nsIClassInfo.equals(aIID) ||
        Components.interfaces.nsISupportsString.equals(aIID) ||
        Components.interfaces.nsISupportsWeakReference.equals(aIID) ||
        Components.interfaces.nsISupports.equals(aIID))
      return this;
    throw 0x80004002; // Components.results.NS_NOINTERFACE;
  },
  /* nsIClassInfo */
  getInterfaces: function getInterfaces(count) {
    count.value = 5;
    return [Components.interfaces.nsITreeView,
            Components.interfaces.nsIClassInfo,
            Components.interfaces.nsISupportsString,
            Components.interfaces.nsISupportsWeakReference,
            Components.interfaces.nsISupports];
  },
  getHelperForLanguage: function getHelperForLanguage(language) { return null; },
  get contractID() { return null; },
  get classDescription() { return "autopagerTreeView"; },
  get classID() { return null; },
  get implementationLanguage() { return Components.interfaces.nsIProgrammimgLanguage.JAVASCRIPT; },
  get flags() { return Components.interfaces.nsIClassInfo.MAIN_THREAD_ONLY | Components.interfaces.nsIClassInfo.DOM_OBJECT; },
  /* nsISupportsString */
  get data() { return "[object " + this.classDescription + "]"; },
  toString: function toString() { return this.data; },
  /* nsITreeView */
  get rowCount() {
      return this._subtreeItems.length; 
  },
  selection: null,
  getRowProperties: function getRowProperties(index, props) { 
//    var site = this.getItemAtIndex(index).site;
//    if (site!=null)
//    {
//          var aserv=Components.classes["@mozilla.org/atom-service;1"].
//              getService(Components.interfaces.nsIAtomService);
//          props.AppendElement(aserv.getAtom("status" + getColor(site)));
//          
//      }
  },
  getCellProperties: function getCellProperties(index, treecol, props) {
      var site = this.getItemAtIndex(index).site;
    if (site==null)
    {
        site = this.getItemAtIndex(index).updateSite;
    }
    if (site!=null)
    {
          var aserv=Components.classes["@mozilla.org/atom-service;1"].
              getService(Components.interfaces.nsIAtomService);
          props.AppendElement(aserv.getAtom("status" + getColor(site)));
          
      }
  },
  getColumnProperties: function getColumnProperties(treecol, props) { },
  isContainer: function isContainer(index) {
    if (index in this._subtreeItems)
      return this._subtreeItems[index]._childItems.length;
    throw 0x8000FFFF; // Components.results.NS_ERROR_UNEXPECTED;
  },
  isContainerOpen: function isContainerOpen(index) { return this._subtreeItems[index]._open; },
  isContainerEmpty: function isContainerEmpty(index) { return false; },
  isSeparator: function isSeparator(index) { return false; },
  isSorted: function isSorted() { return false; },
  // d&d not implemented yet!
  canDropOn: function canDropOn(index) { return false; },
  canDropBeforeAfter: function canDropBeforeAfter(index, before) { return false; },
  canDrop: function canDrop(index, orientation) { return false; },
  drop: function drop(index, orientation) { },
  getParentIndex: function getParentIndex(index) { return this.getIndexOfItem(this._subtreeItems[index]._parentItem); },
  hasNextSibling: function hasNextSibling(index, after) { return this._subtreeItems[index]._hasNext; },
  getLevel: function getLevel(index) {
    if (index in this._subtreeItems) {
      var level = 0;
      for (var item = this._subtreeItems[index]; item._parentItem != this; ++level)
        item = item._parentItem;
      return level;
    }
    throw 0x8000FFFF; // Components.results.NS_ERROR_UNEXPECTED;
  },
  getImageSrc: function getImageSrc(index, treecol) { },
  getProgressMode : function getProgressMode(index, treecol) { },
  getCellValue: function getCellValue(index, treecol) { },
  getCellText: function getCellText(index, treecol) {
    if (index in this._subtreeItems) {
      if ("nsITreeColumn" in Components.interfaces)
        treecol = treecol.id;
      return this._subtreeItems[index][treecol];
    }
    throw 0x8000FFFF; // Components.results.NS_ERROR_UNEXPECTED;
  },
  setTree: function setTree(treeBox) { this._treeBox = treeBox; if (!treeBox) this.selection = null; },
  cycleHeader: function cycleHeader(treecol, elem) { },
  selectionChanged: function selectionChanged() { },
  cycleCell: function cycleCell(index, treecol) { },
  isEditable: function isEditable(index, treecol) { return false; },
  isSelectable: function isEditable(index, treecol) { return false; },
  setCellValue: function setCellValue(index, treecol, value) { },
  setCellText: function setCellText(index, treecol, value) { },
  performAction: function performAction(action) { },
  performActionOnCell: function performActionOnCell(action, index, treecol) { },
  toggleOpenState: function toggleOpenState(index) { this._subtreeItems[index].toggleState(); },
  /* utility methods */
  getChildCount: function getChildCount() { return this._childItems.length; },
  getIndexOfItem: function getIndexOfItem(item) {
    if (!item)
      throw 0x80004003; // Components.results.NS_ERROR_NULL_POINTER;
    var index = -1;
    while (item != this) {
      var parent = item._parentItem;
      if (!parent)
        throw 0x80004005; // Components.results.NS_ERROR_FAILURE;
      var tmp;
      for (var i = 0; (tmp = parent._childItems[i]) != item; ++i)
        if (tmp._open)
          index += tmp._subtreeItems.length;
      index += i + 1;
      item = parent;
    }
    return index;
  },
  getIndexOfChild: function getIndexOfChild(item) {
    if (!item)
      throw 0x80004003; // Components.results.NS_ERROR_NULL_POINTER;
    if (item._parentItem != this)
      throw 0x80004005; // Components.results.NS_ERROR_FAILURE;
    for (var i = 0; i < this._childItems.length; ++i)
      if (this._childItems.length[i] == item)
        return i;
    throw 0x80004005; // Components.results.NS_ERROR_FAILURE;
  },
  getItemAtIndex: function getItemAtIndex(index) {
    index = parseInt(index) || 0;
    if (index < 0 || index >= this._subtreeItems.length)
      throw 0x80004005; // Components.results.NS_ERROR_FAILURE;
    return this._subtreeItems[index];
  },
  getChildAtIndex: function getChildAtIndex(index) {
    index = parseInt(index) || 0;
    if (index < 0 || index >= this._childItems.length)
      throw 0x80004005; // Components.results.NS_ERROR_FAILURE;
    return this._childItems[index];
  },
  selectItem: function selectItem(item) {
    for (var parent = item.parentItem(); parent != this; parent = parent.parentItem())
      if (!parent)
        throw 0x80004005; // Components.results.NS_ERROR_FAILURE;
      else if (!parent.isOpen())
        parent.toggleState();
    var index = this.getIndexOfItem(item);
    if (this.selection)
        this.selection.select(index);
    this._treeBox.ensureRowIsVisible(index);
  },
  invalidateRow: function invalidate() {
    var offset = -1;
    var parent;
    for (var item = this; parent = item._parentItem; item = parent) {
      offset += item._getOffset();
      if (parent._treeBox)
        parent._treeBox.invalidateRow(offset);
      if (!parent._open)
        break;
    }
  },
  invalidatePrimaryCell: function invalidatePrimaryCell() {
    var offset = -1;
    var parent;
    for (var item = this; parent = item._parentItem; item = parent) {
      offset += item._getOffset();
      if (parent._treeBox)
        parent._invalidatePrimaryCell(offset);
      if (!parent._open)
        break;
    }
  },
  invalidateCell: function invalidateCell(column) {
    var offset = -1;
    var parent;
    for (var item = this; parent = item._parentItem; item = parent) {
      offset += item._getOffset();
      if (parent._treeBox)
        parent._treeBox.invalidateCell(offset);
      if (!parent._open)
        break;
    }
  },
  toggleState: function toggleState() {
    this._open = !this._open;
    if (this._subtreeItems.length && this._parentItem)
      if (this._open)
        this._parentItem._itemExpanded(this._getOffset(), this._subtreeItems);
      else
        this._parentItem._itemCollapsed(this._getOffset(), this._subtreeItems.length);
  },
  removeItem: function removeItem(item) {
    if (!item)
      throw 0x80004003; // Components.results.NS_ERROR_NULL_POINTER;
    if (item._parentItem != this)
      throw 0x80004005; // Components.results.NS_ERROR_FAILURE;
    var change = 1;
    if (item._open)
      change += item._subtreeItems.length;
    var offset = 0;
    var tmp;
    for (var i = 0; (tmp = this._childItems[i]) != item; ++i)
      if (tmp._open)
        offset += tmp._subtreeItems.length;
    offset += i;
    this._childItems.splice(i, 1);
    if (i)
      this._childItems[i - 1]._hasNext = item._hasNext;
    item._hasNext = false;
    this._subtreeItems.splice(offset, change);
    if (this._treeBox)
      this._treeBox.rowCountChanged(offset, -change);
    if (this._parentItem)
      this._parentItem._itemCollapsed(offset + this._getOffset(), this._open ? change : 0, this._childItems.length);
    item._parentItem = null;
  },
  quickAppendItem: function quickAppendItem(item) {
    if (!item)
      throw 0x80004003; // Components.results.NS_ERROR_NULL_POINTER;
    var length = this._childItems.length;
    item._parentItem = this;
    if (!length)
      this._childItems = [item];
    else {
      this._childItems.push(item);
      this._childItems[length - 1]._hasNext = true;
    }
    if (length==0)
    {
        this._subtreeItems = new Array();
    }
    this._subtreeItems.push(item);    
  },
  appendItem: function appendItem(item) {
    this.insertItem(item, this._childItems.length);
  },
  insertItem: function insertItem(item, index) {
    if (!item)
      throw 0x80004003; // Components.results.NS_ERROR_NULL_POINTER;
    var length = this._childItems.length;
    index = parseInt(index) || 0;
    if (index < 0 || index > length)
      throw 0x80004005; // Components.results.NS_ERROR_FAILURE;
    if (item._parentItem)
      item._parentItem.removeItem(item);
    item._parentItem = this;
    var newItems = [item];
    var offset = index;
    if (!length)
      this._childItems = newItems;
    else {
      this._childItems.splice(index, 0, item);
      if (index == length) {
        this._childItems[length - 1]._hasNext = true;
        offset = this._subtreeItems.length;
      } else {
        item._hasNext = true;
        for (var i = 0; i < index; ++i)
          if (this._childItems[i]._open)
            offset += this._childItems[i]._subtreeItems.length;
      }
    }
    if (item._open)
      newItems = newItems.concat(item._subtreeItems);
    this._subtreeItems = this._subtreeItems.splice(0, offset).concat(newItems, this._subtreeItems);
    if (this._treeBox)
      this._treeBox.rowCountChanged(offset, newItems.length);
    if (this._parentItem && (this._open || !length))
      this._parentItem._itemExpanded(offset + this._getOffset(), this._open ? newItems : [], length);
  },
  parentItem: function parentItem() {
    return this._parentItem;
  },
  isOpen: function isOpen() {
    return this._open;
  },
  /* helper methods */
  _itemExpanded: function _itemExpanded(offset, newItems, notwisty) {
    if (offset == this._subtreeItems.length)
        for(var i=0;i<newItems.length;i++)
            this._subtreeItems.push(newItems[i]);
    else
        this._subtreeItems = this._subtreeItems.splice(0, offset).concat(newItems, this._subtreeItems);
    if (this._treeBox) {
      this._treeBox.rowCountChanged(offset, newItems.length);
      if (offset && !notwisty)
        this._invalidatePrimaryCell(offset - 1);
    }
    if (this._open && this._parentItem)
      this._parentItem._itemExpanded(offset + this._getOffset(), newItems);
  },
  _itemCollapsed: function _itemCollapsed(offset, change, notwisty) {
    this._subtreeItems.splice(offset, change);
    if (this._treeBox) {
      this._treeBox.rowCountChanged(offset, -change);
      if (offset && !notwisty)
        this._invalidatePrimaryCell(offset - 1);
    }
    if (this._open && this._parentItem)
      this._parentItem._itemCollapsed(offset + this._getOffset(), change);
  },
  _getOffset: function _getOffset() {
    var offset = 1;
    var tmp;
    for (var i = 0; (tmp = this._parentItem._childItems[i]) != this; ++i)
      if (tmp._open)
        offset += tmp._subtreeItems.length;
    return offset + i;
  },
  _invalidatePrimaryCell: function _invalidatePrimaryCell(index)
  {
    if ("invalidatePrimaryCell" in this._treeBox) {
      this._treeBox.invalidatePrimaryCell(index);
      return;
    }
    var treecol = this._treeBox.columns.getPrimaryColumn();
    if (treecol)
      this._treeBox.invalidateCell(index, treecol);
  },
  /* default values */
  _parentItem: null,
  _hasNext: false,
  _childItems: [],
  _subtreeItems: [],
  _open: false,
  _treeBox: null,
  _rowCount: -1
};

function autopagerSitesItem(parent, sites) {
  this.updateSite = sites.updateSite;
  this.sites = sites
  this.urlPatternCol = sites.updateSite.filename;
  this.descCol = sites.updateSite.desc;
  this._subtreeItems = new Array();
  parent.quickAppendItem(this);
}
autopagerSitesItem.prototype = new autopagerTreeView();

function autopagerSiteItem(parent, site) {
  this.site = site;
  this.urlPatternCol = site.urlPattern;
  this.descCol = site.desc;
  this._subtreeItems = new Array();
  parent.quickAppendItem(this);
}
autopagerSiteItem.prototype = new autopagerTreeView();

function getAutoPagerTree(allSites,firstItem,filter,select)
{

    var levels = [new autopagerTreeView()];
    
    var k = 1;
    var parent = 0;
    var matched = false;
    for (var key in allSites){
        if (!allSites[key].updateSite || allSites[key].updateSite.filename=="smartpaging.xml" || allSites[key].updateSite.filename=="testing.xml")
            continue;
        var sites = null;
        if (allSites[key].updateSite.filename == "autopager.xml")
            sites = firstItem;
        else
            sites = allSites[key];

        levels[k] = new autopagerSitesItem(levels[parent], sites);
        
        var siteIndex = levels[k];
        k++;
        for (var i = 0; i < sites.length; i++) {
            var site = sites[i];
            if (!filter || filter == "" ||( site.urlPattern.toLowerCase().indexOf(filter) != -1
                    ||  (site.desc != null && site.desc.toLowerCase().indexOf(filter) != -1)
                    ||  ( autopagerUtils.getRegExp(site).test(filter))               
                    ))
            {
                levels[k] = new autopagerSiteItem(siteIndex, site)
                if (!select || select == "" ||( site.urlPattern.toLowerCase().indexOf(select) != -1
                    ||  (site.desc != null && site.desc.toLowerCase().indexOf(select) != -1)
                    ||  ( autopagerUtils.getRegExp(site).test(select))               
                    ))
                {
                    if (!matched){
                        matched = true;
                        levels.selected = levels[k];
                    }                    
                }
                k++;
            }
//            siteIndex.toggleState();
        }
    };
    return levels;
}
