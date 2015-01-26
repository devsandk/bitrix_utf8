; /* /bitrix/js/fileman/html_editor/range.js*/
; /* /bitrix/js/fileman/html_editor/html-actions.js*/
; /* /bitrix/js/fileman/html_editor/html-views.js*/
; /* /bitrix/js/fileman/html_editor/html-parser.js*/
; /* /bitrix/js/fileman/html_editor/html-base-controls.js*/
; /* /bitrix/js/fileman/html_editor/html-controls.js*/
; /* /bitrix/js/fileman/html_editor/html-components.js*/
; /* /bitrix/js/fileman/html_editor/html-snippets.js*/
; /* /bitrix/js/fileman/html_editor/html-editor.js*/

; /* Start:/bitrix/js/fileman/html_editor/range.js*/
/**
 * Rangy, a cross-browser JavaScript range and selection library
 * http://code.google.com/p/rangy/
 *
 * Copyright 2013, Tim Down
 * Licensed under the MIT license.
 * Version: 1.3alpha.804
 * Build date: 8 December 2013
 */

(function(global) {
    var amdSupported = (typeof global.define == "function" && global.define.amd);

    var OBJECT = "object", FUNCTION = "function", UNDEFINED = "undefined";

    // Minimal set of properties required for DOM Level 2 Range compliance. Comparison constants such as START_TO_START
    // are omitted because ranges in KHTML do not have them but otherwise work perfectly well. See issue 113.
    var domRangeProperties = ["startContainer", "startOffset", "endContainer", "endOffset", "collapsed",
        "commonAncestorContainer"];

    // Minimal set of methods required for DOM Level 2 Range compliance
    var domRangeMethods = ["setStart", "setStartBefore", "setStartAfter", "setEnd", "setEndBefore",
        "setEndAfter", "collapse", "selectNode", "selectNodeContents", "compareBoundaryPoints", "deleteContents",
        "extractContents", "cloneContents", "insertNode", "surroundContents", "cloneRange", "toString", "detach"];

    var textRangeProperties = ["boundingHeight", "boundingLeft", "boundingTop", "boundingWidth", "htmlText", "text"];

    // Subset of TextRange's full set of methods that we're interested in
    var textRangeMethods = ["collapse", "compareEndPoints", "duplicate", "moveToElementText", "parentElement", "select",
        "setEndPoint", "getBoundingClientRect"];

    /*----------------------------------------------------------------------------------------------------------------*/

    // Trio of functions taken from Peter Michaux's article:
    // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
    function isHostMethod(o, p) {
        var t = typeof o[p];
        return t == FUNCTION || (!!(t == OBJECT && o[p])) || t == "unknown";
    }

    function isHostObject(o, p) {
        return !!(typeof o[p] == OBJECT && o[p]);
    }

    function isHostProperty(o, p) {
        return typeof o[p] != UNDEFINED;
    }

    // Creates a convenience function to save verbose repeated calls to tests functions
    function createMultiplePropertyTest(testFunc) {
        return function(o, props) {
            var i = props.length;
            while (i--) {
                if (!testFunc(o, props[i])) {
                    return false;
                }
            }
            return true;
        };
    }

    // Next trio of functions are a convenience to save verbose repeated calls to previous two functions
    var areHostMethods = createMultiplePropertyTest(isHostMethod);
    var areHostObjects = createMultiplePropertyTest(isHostObject);
    var areHostProperties = createMultiplePropertyTest(isHostProperty);

    function isTextRange(range) {
        return range && areHostMethods(range, textRangeMethods) && areHostProperties(range, textRangeProperties);
    }

    function getBody(doc) {
        return isHostObject(doc, "body") ? doc.body : doc.getElementsByTagName("body")[0];
    }

    var modules = {};

    var api = {
        version: "1.3alpha.804",
        initialized: false,
        supported: true,

        util: {
            isHostMethod: isHostMethod,
            isHostObject: isHostObject,
            isHostProperty: isHostProperty,
            areHostMethods: areHostMethods,
            areHostObjects: areHostObjects,
            areHostProperties: areHostProperties,
            isTextRange: isTextRange,
            getBody: getBody
        },

        features: {},

        modules: modules,
        config: {
            alertOnFail: true,
            alertOnWarn: false,
            preferTextRange: false
        }
    };

    function consoleLog(msg) {
        if (isHostObject(window, "console") && isHostMethod(window.console, "log")) {
            window.console.log(msg);
        }
    }

    function alertOrLog(msg, shouldAlert) {
        if (shouldAlert) {
            window.alert(msg);
        } else  {
            consoleLog(msg);
        }
    }

    function fail(reason) {
        api.initialized = true;
        api.supported = false;
        alertOrLog("Rangy is not supported on this page in your browser. Reason: " + reason, api.config.alertOnFail);
    }

    api.fail = fail;

    function warn(msg) {
        alertOrLog("Rangy warning: " + msg, api.config.alertOnWarn);
    }

    api.warn = warn;

    // Add utility extend() method
    if ({}.hasOwnProperty) {
        api.util.extend = function(obj, props, deep) {
            var o, p;
            for (var i in props) {
                if (props.hasOwnProperty(i)) {
                    o = obj[i];
                    p = props[i];
                    //if (deep) alert([o !== null, typeof o == "object", p !== null, typeof p == "object"])
                    if (deep && o !== null && typeof o == "object" && p !== null && typeof p == "object") {
                        api.util.extend(o, p, true);
                    }
                    obj[i] = p;
                }
            }
            return obj;
        };
    } else {
        fail("hasOwnProperty not supported");
    }

    // Test whether Array.prototype.slice can be relied on for NodeLists and use an alternative toArray() if not
    (function() {
        var el = document.createElement("div");
        el.appendChild(document.createElement("span"));
        var slice = [].slice;
        var toArray;
        try {
            if (slice.call(el.childNodes, 0)[0].nodeType == 1) {
                toArray = function(arrayLike) {
                    return slice.call(arrayLike, 0);
                };
            }
        } catch (e) {}

        if (!toArray) {
            toArray = function(arrayLike) {
                var arr = [];
                for (var i = 0, len = arrayLike.length; i < len; ++i) {
                    arr[i] = arrayLike[i];
                }
                return arr;
            };
        }

        api.util.toArray = toArray;
    })();


    // Very simple event handler wrapper function that doesn't attempt to solve issues such as "this" handling or
    // normalization of event properties
    var addListener;
    if (isHostMethod(document, "addEventListener")) {
        addListener = function(obj, eventType, listener) {
            obj.addEventListener(eventType, listener, false);
        };
    } else if (isHostMethod(document, "attachEvent")) {
        addListener = function(obj, eventType, listener) {
            obj.attachEvent("on" + eventType, listener);
        };
    } else {
        fail("Document does not have required addEventListener or attachEvent method");
    }

    api.util.addListener = addListener;

    var initListeners = [];

    function getErrorDesc(ex) {
        return ex.message || ex.description || String(ex);
    }

    // Initialization
    function init() {
        if (api.initialized) {
            return;
        }
        var testRange;
        var implementsDomRange = false, implementsTextRange = false;

        // First, perform basic feature tests

        if (isHostMethod(document, "createRange")) {
            testRange = document.createRange();
            if (areHostMethods(testRange, domRangeMethods) && areHostProperties(testRange, domRangeProperties)) {
                implementsDomRange = true;
            }
            testRange.detach();
        }

        var body = getBody(document);
        if (!body || body.nodeName.toLowerCase() != "body") {
            fail("No body element found");
            return;
        }

        if (body && isHostMethod(body, "createTextRange")) {
            testRange = body.createTextRange();
            if (isTextRange(testRange)) {
                implementsTextRange = true;
            }
        }

        if (!implementsDomRange && !implementsTextRange) {
            fail("Neither Range nor TextRange are available");
            return;
        }

        api.initialized = true;
        api.features = {
            implementsDomRange: implementsDomRange,
            implementsTextRange: implementsTextRange
        };

        // Initialize modules
        var module, errorMessage;
        for (var moduleName in modules) {
            if ( (module = modules[moduleName]) instanceof Module ) {
                module.init(module, api);
            }
        }

        // Call init listeners
        for (var i = 0, len = initListeners.length; i < len; ++i) {
            try {
                initListeners[i](api);
            } catch (ex) {
                errorMessage = "Rangy init listener threw an exception. Continuing. Detail: " + getErrorDesc(ex);
                consoleLog(errorMessage);
            }
        }
    }

    // Allow external scripts to initialize this library in case it's loaded after the document has loaded
    api.init = init;

    // Execute listener immediately if already initialized
    api.addInitListener = function(listener) {
        if (api.initialized) {
            listener(api);
        } else {
            initListeners.push(listener);
        }
    };

    var createMissingNativeApiListeners = [];

    api.addCreateMissingNativeApiListener = function(listener) {
        createMissingNativeApiListeners.push(listener);
    };

    function createMissingNativeApi(win) {
        win = win || window;
        init();

        // Notify listeners
        for (var i = 0, len = createMissingNativeApiListeners.length; i < len; ++i) {
            createMissingNativeApiListeners[i](win);
        }
    }

    api.createMissingNativeApi = createMissingNativeApi;

    function Module(name, dependencies, initializer) {
        this.name = name;
        this.dependencies = dependencies;
        this.initialized = false;
        this.supported = false;
        this.initializer = initializer;
    }

    Module.prototype = {
        init: function(api) {
            var requiredModuleNames = this.dependencies || [];
            for (var i = 0, len = requiredModuleNames.length, requiredModule, moduleName; i < len; ++i) {
                moduleName = requiredModuleNames[i];

                requiredModule = modules[moduleName];
                if (!requiredModule || !(requiredModule instanceof Module)) {
                    throw new Error("required module '" + moduleName + "' not found");
                }

                requiredModule.init();

                if (!requiredModule.supported) {
                    throw new Error("required module '" + moduleName + "' not supported");
                }
            }

            // Now run initializer
            this.initializer(this)
        },

        fail: function(reason) {
            this.initialized = true;
            this.supported = false;
            throw new Error("Module '" + this.name + "' failed to load: " + reason);
        },

        warn: function(msg) {
            api.warn("Module " + this.name + ": " + msg);
        },

        deprecationNotice: function(deprecated, replacement) {
            api.warn("DEPRECATED: " + deprecated + " in module " + this.name + "is deprecated. Please use "
                + replacement + " instead");
        },

        createError: function(msg) {
            return new Error("Error in Rangy " + this.name + " module: " + msg);
        }
    };

    function createModule(isCore, name, dependencies, initFunc) {
        var newModule = new Module(name, dependencies, function(module) {
            if (!module.initialized) {
                module.initialized = true;
                try {
                    initFunc(api, module);
                    module.supported = true;
                } catch (ex) {
                    var errorMessage = "Module '" + name + "' failed to load: " + getErrorDesc(ex);
                    consoleLog(errorMessage);
                }
            }
        });
        modules[name] = newModule;

/*
        // Add module AMD support
        if (!isCore && amdSupported) {
            global.define(["rangy-core"], function(rangy) {

            });
        }
*/
    }

    api.createModule = function(name) {
        // Allow 2 or 3 arguments (second argument is an optional array of dependencies)
        var initFunc, dependencies;
        if (arguments.length == 2) {
            initFunc = arguments[1];
            dependencies = [];
        } else {
            initFunc = arguments[2];
            dependencies = arguments[1];
        }
        createModule(false, name, dependencies, initFunc);
    };

    api.createCoreModule = function(name, dependencies, initFunc) {
        createModule(true, name, dependencies, initFunc);
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    // Ensure rangy.rangePrototype and rangy.selectionPrototype are available immediately

    function RangePrototype() {}
    api.RangePrototype = RangePrototype;
    api.rangePrototype = new RangePrototype();

    function SelectionPrototype() {}
    api.selectionPrototype = new SelectionPrototype();

    /*----------------------------------------------------------------------------------------------------------------*/

    // Wait for document to load before running tests

    var docReady = false;

    var loadHandler = function(e) {
        if (!docReady) {
            docReady = true;
            if (!api.initialized) {
                init();
            }
        }
    };

    // Test whether we have window and document objects that we will need
    if (typeof window == UNDEFINED) {
        fail("No window found");
        return;
    }
    if (typeof document == UNDEFINED) {
        fail("No document found");
        return;
    }

    if (isHostMethod(document, "addEventListener")) {
        document.addEventListener("DOMContentLoaded", loadHandler, false);
    }

    // Add a fallback in case the DOMContentLoaded event isn't supported
    addListener(window, "load", loadHandler);

    /*----------------------------------------------------------------------------------------------------------------*/

    // AMD, for those who like this kind of thing

    if (amdSupported) {
        // AMD. Register as an anonymous module.
        global.define(function() {
            api.amd = true;
            return api;
        });
    }

    // Create a "rangy" property of the global object in any case. Other Rangy modules (which use Rangy's own simple
    // module system) rely on the existence of this global property
    global.rangy = api;
})(this);

rangy.createCoreModule("DomUtil", [], function(api, module) {
    var UNDEF = "undefined";
    var util = api.util;

    // Perform feature tests
    if (!util.areHostMethods(document, ["createDocumentFragment", "createElement", "createTextNode"])) {
        module.fail("document missing a Node creation method");
    }

    if (!util.isHostMethod(document, "getElementsByTagName")) {
        module.fail("document missing getElementsByTagName method");
    }

    var el = document.createElement("div");
    if (!util.areHostMethods(el, ["insertBefore", "appendChild", "cloneNode"] ||
            !util.areHostObjects(el, ["previousSibling", "nextSibling", "childNodes", "parentNode"]))) {
        module.fail("Incomplete Element implementation");
    }

    // innerHTML is required for Range's createContextualFragment method
    if (!util.isHostProperty(el, "innerHTML")) {
        module.fail("Element is missing innerHTML property");
    }

    var textNode = document.createTextNode("test");
    if (!util.areHostMethods(textNode, ["splitText", "deleteData", "insertData", "appendData", "cloneNode"] ||
            !util.areHostObjects(el, ["previousSibling", "nextSibling", "childNodes", "parentNode"]) ||
            !util.areHostProperties(textNode, ["data"]))) {
        module.fail("Incomplete Text Node implementation");
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // Removed use of indexOf because of a bizarre bug in Opera that is thrown in one of the Acid3 tests. I haven't been
    // able to replicate it outside of the test. The bug is that indexOf returns -1 when called on an Array that
    // contains just the document as a single element and the value searched for is the document.
    var arrayContains = /*Array.prototype.indexOf ?
        function(arr, val) {
            return arr.indexOf(val) > -1;
        }:*/

        function(arr, val) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === val) {
                    return true;
                }
            }
            return false;
        };

    // Opera 11 puts HTML elements in the null namespace, it seems, and IE 7 has undefined namespaceURI
    function isHtmlNamespace(node) {
        var ns;
        return typeof node.namespaceURI == UNDEF || ((ns = node.namespaceURI) === null || ns == "http://www.w3.org/1999/xhtml");
    }

    function parentElement(node) {
        var parent = node.parentNode;
        return (parent.nodeType == 1) ? parent : null;
    }

    function getNodeIndex(node) {
        var i = 0;
        while( (node = node.previousSibling) ) {
            ++i;
        }
        return i;
    }

    function getNodeLength(node) {
        switch (node.nodeType) {
            case 7:
            case 10:
                return 0;
            case 3:
            case 8:
                return node.length;
            default:
                return node.childNodes.length;
        }
    }

    function getCommonAncestor(node1, node2) {
        var ancestors = [], n;
        for (n = node1; n; n = n.parentNode) {
            ancestors.push(n);
        }

        for (n = node2; n; n = n.parentNode) {
            if (arrayContains(ancestors, n)) {
                return n;
            }
        }

        return null;
    }

    function isAncestorOf(ancestor, descendant, selfIsAncestor) {
        var n = selfIsAncestor ? descendant : descendant.parentNode;
        while (n) {
            if (n === ancestor) {
                return true;
            } else {
                n = n.parentNode;
            }
        }
        return false;
    }

    function isOrIsAncestorOf(ancestor, descendant) {
        return isAncestorOf(ancestor, descendant, true);
    }

    function getClosestAncestorIn(node, ancestor, selfIsAncestor) {
        var p, n = selfIsAncestor ? node : node.parentNode;
        while (n) {
            p = n.parentNode;
            if (p === ancestor) {
                return n;
            }
            n = p;
        }
        return null;
    }

    function isCharacterDataNode(node) {
        var t = node.nodeType;
        return t == 3 || t == 4 || t == 8 ; // Text, CDataSection or Comment
    }

    function isTextOrCommentNode(node) {
        if (!node) {
            return false;
        }
        var t = node.nodeType;
        return t == 3 || t == 8 ; // Text or Comment
    }

    function insertAfter(node, precedingNode) {
        var nextNode = precedingNode.nextSibling, parent = precedingNode.parentNode;
        if (nextNode) {
            parent.insertBefore(node, nextNode);
        } else {
            parent.appendChild(node);
        }
        return node;
    }

    // Note that we cannot use splitText() because it is bugridden in IE 9.
    function splitDataNode(node, index, positionsToPreserve) {
        var newNode = node.cloneNode(false);
        newNode.deleteData(0, index);
        node.deleteData(index, node.length - index);
        insertAfter(newNode, node);

        // Preserve positions
        if (positionsToPreserve) {
            for (var i = 0, position; position = positionsToPreserve[i++]; ) {
                // Handle case where position was inside the portion of node after the split point
                if (position.node == node && position.offset > index) {
                    position.node = newNode;
                    position.offset -= index;
                }
                // Handle the case where the position is a node offset within node's parent
                else if (position.node == node.parentNode && position.offset > getNodeIndex(node)) {
                    ++position.offset;
                }
            }
        }
        return newNode;
    }

    function getDocument(node) {
        if (node.nodeType == 9) {
            return node;
        } else if (typeof node.ownerDocument != UNDEF) {
            return node.ownerDocument;
        } else if (typeof node.document != UNDEF) {
            return node.document;
        } else if (node.parentNode) {
            return getDocument(node.parentNode);
        } else {
            throw module.createError("getDocument: no document found for node");
        }
    }

    function getWindow(node) {
        var doc = getDocument(node);
        if (typeof doc.defaultView != UNDEF) {
            return doc.defaultView;
        } else if (typeof doc.parentWindow != UNDEF) {
            return doc.parentWindow;
        } else {
            throw module.createError("Cannot get a window object for node");
        }
    }

    function getIframeDocument(iframeEl) {
        if (typeof iframeEl.contentDocument != UNDEF) {
            return iframeEl.contentDocument;
        } else if (typeof iframeEl.contentWindow != UNDEF) {
            return iframeEl.contentWindow.document;
        } else {
            throw module.createError("getIframeDocument: No Document object found for iframe element");
        }
    }

    function getIframeWindow(iframeEl) {
        if (typeof iframeEl.contentWindow != UNDEF) {
            return iframeEl.contentWindow;
        } else if (typeof iframeEl.contentDocument != UNDEF) {
            return iframeEl.contentDocument.defaultView;
        } else {
            throw module.createError("getIframeWindow: No Window object found for iframe element");
        }
    }

    // This looks bad. Is it worth it?
    function isWindow(obj) {
        return obj && util.isHostMethod(obj, "setTimeout") && util.isHostObject(obj, "document");
    }

    function getContentDocument(obj, module, methodName) {
        var doc;

        if (!obj) {
            doc = document;
        }

        // Test if a DOM node has been passed and obtain a document object for it if so
        else if (util.isHostProperty(obj, "nodeType")) {
            doc = (obj.nodeType == 1 && obj.tagName.toLowerCase() == "iframe")
                ? getIframeDocument(obj) : getDocument(obj);
        }

        // Test if the doc parameter appears to be a Window object
        else if (isWindow(obj)) {
            doc = obj.document;
        }

        if (!doc) {
            throw module.createError(methodName + "(): Parameter must be a Window object or DOM node");
        }

        return doc;
    }

    function getRootContainer(node) {
        var parent;
        while ( (parent = node.parentNode) ) {
            node = parent;
        }
        return node;
    }

    function comparePoints(nodeA, offsetA, nodeB, offsetB) {
        // See http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html#Level-2-Range-Comparing
        var nodeC, root, childA, childB, n;
        if (nodeA == nodeB) {
            // Case 1: nodes are the same
            return offsetA === offsetB ? 0 : (offsetA < offsetB) ? -1 : 1;
        } else if ( (nodeC = getClosestAncestorIn(nodeB, nodeA, true)) ) {
            // Case 2: node C (container B or an ancestor) is a child node of A
            return offsetA <= getNodeIndex(nodeC) ? -1 : 1;
        } else if ( (nodeC = getClosestAncestorIn(nodeA, nodeB, true)) ) {
            // Case 3: node C (container A or an ancestor) is a child node of B
            return getNodeIndex(nodeC) < offsetB  ? -1 : 1;
        } else {
            root = getCommonAncestor(nodeA, nodeB);
            if (!root) {
                throw new Error("comparePoints error: nodes have no common ancestor");
            }

            // Case 4: containers are siblings or descendants of siblings
            childA = (nodeA === root) ? root : getClosestAncestorIn(nodeA, root, true);
            childB = (nodeB === root) ? root : getClosestAncestorIn(nodeB, root, true);

            if (childA === childB) {
                // This shouldn't be possible
                throw module.createError("comparePoints got to case 4 and childA and childB are the same!");
            } else {
                n = root.firstChild;
                while (n) {
                    if (n === childA) {
                        return -1;
                    } else if (n === childB) {
                        return 1;
                    }
                    n = n.nextSibling;
                }
            }
        }
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // Test for IE's crash (IE 6/7) or exception (IE >= 8) when a reference to garbage-collected text node is queried
    var crashyTextNodes = false;

    function isBrokenNode(node) {
        try {
            node.parentNode;
            return false;
        } catch (e) {
            return true;
        }
    }

    (function() {
        var el = document.createElement("b");
        el.innerHTML = "1";
        var textNode = el.firstChild;
        el.innerHTML = "<br>";
        crashyTextNodes = isBrokenNode(textNode);

        api.features.crashyTextNodes = crashyTextNodes;
    })();

    /*----------------------------------------------------------------------------------------------------------------*/

    function inspectNode(node) {
        if (!node) {
            return "[No node]";
        }
        if (crashyTextNodes && isBrokenNode(node)) {
            return "[Broken node]";
        }
        if (isCharacterDataNode(node)) {
            return '"' + node.data + '"';
        }
        if (node.nodeType == 1) {
            var idAttr = node.id ? ' id="' + node.id + '"' : "";
            return "<" + node.nodeName + idAttr + ">[" + getNodeIndex(node) + "][" + node.childNodes.length + "][" + (node.innerHTML || "[innerHTML not supported]").slice(0, 25) + "]";
        }
        return node.nodeName;
    }

    function fragmentFromNodeChildren(node) {
        var fragment = getDocument(node).createDocumentFragment(), child;
        while ( (child = node.firstChild) ) {
            fragment.appendChild(child);
        }
        return fragment;
    }

    var getComputedStyleProperty;
    if (typeof window.getComputedStyle != UNDEF) {
        getComputedStyleProperty = function(el, propName) {
            return getWindow(el).getComputedStyle(el, null)[propName];
        };
    } else if (typeof document.documentElement.currentStyle != UNDEF) {
        getComputedStyleProperty = function(el, propName) {
            return el.currentStyle[propName];
        };
    } else {
        module.fail("No means of obtaining computed style properties found");
    }

    function NodeIterator(root) {
        this.root = root;
        this._next = root;
    }

    NodeIterator.prototype = {
        _current: null,

        hasNext: function() {
            return !!this._next;
        },

        next: function() {
            var n = this._current = this._next;
            var child, next;
            if (this._current) {
                child = n.firstChild;
                if (child) {
                    this._next = child;
                } else {
                    next = null;
                    while ((n !== this.root) && !(next = n.nextSibling)) {
                        n = n.parentNode;
                    }
                    this._next = next;
                }
            }
            return this._current;
        },

        detach: function() {
            this._current = this._next = this.root = null;
        }
    };

    function createIterator(root) {
        return new NodeIterator(root);
    }

    function DomPosition(node, offset) {
        this.node = node;
        this.offset = offset;
    }

    DomPosition.prototype = {
        equals: function(pos) {
            return !!pos && this.node === pos.node && this.offset == pos.offset;
        },

        inspect: function() {
            return "[DomPosition(" + inspectNode(this.node) + ":" + this.offset + ")]";
        },

        toString: function() {
            return this.inspect();
        }
    };

    function DOMException(codeName) {
        this.code = this[codeName];
        this.codeName = codeName;
        this.message = "DOMException: " + this.codeName;
    }

    DOMException.prototype = {
        INDEX_SIZE_ERR: 1,
        HIERARCHY_REQUEST_ERR: 3,
        WRONG_DOCUMENT_ERR: 4,
        NO_MODIFICATION_ALLOWED_ERR: 7,
        NOT_FOUND_ERR: 8,
        NOT_SUPPORTED_ERR: 9,
        INVALID_STATE_ERR: 11
    };

    DOMException.prototype.toString = function() {
        return this.message;
    };

    api.dom = {
        arrayContains: arrayContains,
        isHtmlNamespace: isHtmlNamespace,
        parentElement: parentElement,
        getNodeIndex: getNodeIndex,
        getNodeLength: getNodeLength,
        getCommonAncestor: getCommonAncestor,
        isAncestorOf: isAncestorOf,
        isOrIsAncestorOf: isOrIsAncestorOf,
        getClosestAncestorIn: getClosestAncestorIn,
        isCharacterDataNode: isCharacterDataNode,
        isTextOrCommentNode: isTextOrCommentNode,
        insertAfter: insertAfter,
        splitDataNode: splitDataNode,
        getDocument: getDocument,
        getWindow: getWindow,
        getIframeWindow: getIframeWindow,
        getIframeDocument: getIframeDocument,
        getBody: util.getBody,
        isWindow: isWindow,
        getContentDocument: getContentDocument,
        getRootContainer: getRootContainer,
        comparePoints: comparePoints,
        isBrokenNode: isBrokenNode,
        inspectNode: inspectNode,
        getComputedStyleProperty: getComputedStyleProperty,
        fragmentFromNodeChildren: fragmentFromNodeChildren,
        createIterator: createIterator,
        DomPosition: DomPosition
    };

    api.DOMException = DOMException;
});
rangy.createCoreModule("DomRange", ["DomUtil"], function(api, module) {
    var dom = api.dom;
    var util = api.util;
    var DomPosition = dom.DomPosition;
    var DOMException = api.DOMException;

    var isCharacterDataNode = dom.isCharacterDataNode;
    var getNodeIndex = dom.getNodeIndex;
    var isOrIsAncestorOf = dom.isOrIsAncestorOf;
    var getDocument = dom.getDocument;
    var comparePoints = dom.comparePoints;
    var splitDataNode = dom.splitDataNode;
    var getClosestAncestorIn = dom.getClosestAncestorIn;
    var getNodeLength = dom.getNodeLength;
    var arrayContains = dom.arrayContains;
    var getRootContainer = dom.getRootContainer;
    var crashyTextNodes = api.features.crashyTextNodes;

    /*----------------------------------------------------------------------------------------------------------------*/

    // Utility functions

    function isNonTextPartiallySelected(node, range) {
        return (node.nodeType != 3) &&
               (isOrIsAncestorOf(node, range.startContainer) || isOrIsAncestorOf(node, range.endContainer));
    }

    function getRangeDocument(range) {
        return range.document || getDocument(range.startContainer);
    }

    function getBoundaryBeforeNode(node) {
        return new DomPosition(node.parentNode, getNodeIndex(node));
    }

    function getBoundaryAfterNode(node) {
        return new DomPosition(node.parentNode, getNodeIndex(node) + 1);
    }

    function insertNodeAtPosition(node, n, o) {
        var firstNodeInserted = node.nodeType == 11 ? node.firstChild : node;
        if (isCharacterDataNode(n)) {
            if (o == n.length) {
                dom.insertAfter(node, n);
            } else {
                n.parentNode.insertBefore(node, o == 0 ? n : splitDataNode(n, o));
            }
        } else if (o >= n.childNodes.length) {
            n.appendChild(node);
        } else {
            n.insertBefore(node, n.childNodes[o]);
        }
        return firstNodeInserted;
    }

    function rangesIntersect(rangeA, rangeB, touchingIsIntersecting) {
        assertRangeValid(rangeA);
        assertRangeValid(rangeB);

        if (getRangeDocument(rangeB) != getRangeDocument(rangeA)) {
            throw new DOMException("WRONG_DOCUMENT_ERR");
        }

        var startComparison = comparePoints(rangeA.startContainer, rangeA.startOffset, rangeB.endContainer, rangeB.endOffset),
            endComparison = comparePoints(rangeA.endContainer, rangeA.endOffset, rangeB.startContainer, rangeB.startOffset);

        return touchingIsIntersecting ? startComparison <= 0 && endComparison >= 0 : startComparison < 0 && endComparison > 0;
    }

    function cloneSubtree(iterator) {
        var partiallySelected;
        for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {
            partiallySelected = iterator.isPartiallySelectedSubtree();
            node = node.cloneNode(!partiallySelected);
            if (partiallySelected) {
                subIterator = iterator.getSubtreeIterator();
                node.appendChild(cloneSubtree(subIterator));
                subIterator.detach(true);
            }

            if (node.nodeType == 10) { // DocumentType
                throw new DOMException("HIERARCHY_REQUEST_ERR");
            }
            frag.appendChild(node);
        }
        return frag;
    }

    function iterateSubtree(rangeIterator, func, iteratorState) {
        var it, n;
        iteratorState = iteratorState || { stop: false };
        for (var node, subRangeIterator; node = rangeIterator.next(); ) {
            if (rangeIterator.isPartiallySelectedSubtree()) {
                if (func(node) === false) {
                    iteratorState.stop = true;
                    return;
                } else {
                    // The node is partially selected by the Range, so we can use a new RangeIterator on the portion of
                    // the node selected by the Range.
                    subRangeIterator = rangeIterator.getSubtreeIterator();
                    iterateSubtree(subRangeIterator, func, iteratorState);
                    subRangeIterator.detach(true);
                    if (iteratorState.stop) {
                        return;
                    }
                }
            } else {
                // The whole node is selected, so we can use efficient DOM iteration to iterate over the node and its
                // descendants
                it = dom.createIterator(node);
                while ( (n = it.next()) ) {
                    if (func(n) === false) {
                        iteratorState.stop = true;
                        return;
                    }
                }
            }
        }
    }

    function deleteSubtree(iterator) {
        var subIterator;
        while (iterator.next()) {
            if (iterator.isPartiallySelectedSubtree()) {
                subIterator = iterator.getSubtreeIterator();
                deleteSubtree(subIterator);
                subIterator.detach(true);
            } else {
                iterator.remove();
            }
        }
    }

    function extractSubtree(iterator) {
        for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {

            if (iterator.isPartiallySelectedSubtree()) {
                node = node.cloneNode(false);
                subIterator = iterator.getSubtreeIterator();
                node.appendChild(extractSubtree(subIterator));
                subIterator.detach(true);
            } else {
                iterator.remove();
            }
            if (node.nodeType == 10) { // DocumentType
                throw new DOMException("HIERARCHY_REQUEST_ERR");
            }
            frag.appendChild(node);
        }
        return frag;
    }

    function getNodesInRange(range, nodeTypes, filter) {
        var filterNodeTypes = !!(nodeTypes && nodeTypes.length), regex;
        var filterExists = !!filter;
        if (filterNodeTypes) {
            regex = new RegExp("^(" + nodeTypes.join("|") + ")$");
        }

        var nodes = [];
        iterateSubtree(new RangeIterator(range, false), function(node) {
            if (filterNodeTypes && !regex.test(node.nodeType)) {
                return;
            }
            if (filterExists && !filter(node)) {
                return;
            }
            // Don't include a boundary container if it is a character data node and the range does not contain any
            // of its character data. See issue 190.
            var sc = range.startContainer;
            if (node == sc && isCharacterDataNode(sc) && range.startOffset == sc.length) {
                return;
            }

            var ec = range.endContainer;
            if (node == ec && isCharacterDataNode(ec) && range.endOffset == 0) {
                return;
            }

            nodes.push(node);
        });
        return nodes;
    }

    function inspect(range) {
        var name = (typeof range.getName == "undefined") ? "Range" : range.getName();
        return "[" + name + "(" + dom.inspectNode(range.startContainer) + ":" + range.startOffset + ", " +
                dom.inspectNode(range.endContainer) + ":" + range.endOffset + ")]";
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // RangeIterator code partially borrows from IERange by Tim Ryan (http://github.com/timcameronryan/IERange)

    function RangeIterator(range, clonePartiallySelectedTextNodes) {
        this.range = range;
        this.clonePartiallySelectedTextNodes = clonePartiallySelectedTextNodes;


        if (!range.collapsed) {
            this.sc = range.startContainer;
            this.so = range.startOffset;
            this.ec = range.endContainer;
            this.eo = range.endOffset;
            var root = range.commonAncestorContainer;

            if (this.sc === this.ec && isCharacterDataNode(this.sc)) {
                this.isSingleCharacterDataNode = true;
                this._first = this._last = this._next = this.sc;
            } else {
                this._first = this._next = (this.sc === root && !isCharacterDataNode(this.sc)) ?
                    this.sc.childNodes[this.so] : getClosestAncestorIn(this.sc, root, true);
                this._last = (this.ec === root && !isCharacterDataNode(this.ec)) ?
                    this.ec.childNodes[this.eo - 1] : getClosestAncestorIn(this.ec, root, true);
            }
        }
    }

    RangeIterator.prototype = {
        _current: null,
        _next: null,
        _first: null,
        _last: null,
        isSingleCharacterDataNode: false,

        reset: function() {
            this._current = null;
            this._next = this._first;
        },

        hasNext: function() {
            return !!this._next;
        },

        next: function() {
            // Move to next node
            var current = this._current = this._next;
            if (current) {
                this._next = (current !== this._last) ? current.nextSibling : null;

                // Check for partially selected text nodes
                if (isCharacterDataNode(current) && this.clonePartiallySelectedTextNodes) {
                    if (current === this.ec) {
                        (current = current.cloneNode(true)).deleteData(this.eo, current.length - this.eo);
                    }
                    if (this._current === this.sc) {
                        (current = current.cloneNode(true)).deleteData(0, this.so);
                    }
                }
            }

            return current;
        },

        remove: function() {
            var current = this._current, start, end;

            if (isCharacterDataNode(current) && (current === this.sc || current === this.ec)) {
                start = (current === this.sc) ? this.so : 0;
                end = (current === this.ec) ? this.eo : current.length;
                if (start != end) {
                    current.deleteData(start, end - start);
                }
            } else {
                if (current.parentNode) {
                    current.parentNode.removeChild(current);
                } else {
                }
            }
        },

        // Checks if the current node is partially selected
        isPartiallySelectedSubtree: function() {
            var current = this._current;
            return isNonTextPartiallySelected(current, this.range);
        },

        getSubtreeIterator: function() {
            var subRange;
            if (this.isSingleCharacterDataNode) {
                subRange = this.range.cloneRange();
                subRange.collapse(false);
            } else {
                subRange = new Range(getRangeDocument(this.range));
                var current = this._current;
                var startContainer = current, startOffset = 0, endContainer = current, endOffset = getNodeLength(current);

                if (isOrIsAncestorOf(current, this.sc)) {
                    startContainer = this.sc;
                    startOffset = this.so;
                }
                if (isOrIsAncestorOf(current, this.ec)) {
                    endContainer = this.ec;
                    endOffset = this.eo;
                }

                updateBoundaries(subRange, startContainer, startOffset, endContainer, endOffset);
            }
            return new RangeIterator(subRange, this.clonePartiallySelectedTextNodes);
        },

        detach: function(detachRange) {
            if (detachRange) {
                this.range.detach();
            }
            this.range = this._current = this._next = this._first = this._last = this.sc = this.so = this.ec = this.eo = null;
        }
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    // Exceptions

    function RangeException(codeName) {
        this.code = this[codeName];
        this.codeName = codeName;
        this.message = "RangeException: " + this.codeName;
    }

    RangeException.prototype = {
        BAD_BOUNDARYPOINTS_ERR: 1,
        INVALID_NODE_TYPE_ERR: 2
    };

    RangeException.prototype.toString = function() {
        return this.message;
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    var beforeAfterNodeTypes = [1, 3, 4, 5, 7, 8, 10];
    var rootContainerNodeTypes = [2, 9, 11];
    var readonlyNodeTypes = [5, 6, 10, 12];
    var insertableNodeTypes = [1, 3, 4, 5, 7, 8, 10, 11];
    var surroundNodeTypes = [1, 3, 4, 5, 7, 8];

    function createAncestorFinder(nodeTypes) {
        return function(node, selfIsAncestor) {
            var t, n = selfIsAncestor ? node : node.parentNode;
            while (n) {
                t = n.nodeType;
                if (arrayContains(nodeTypes, t)) {
                    return n;
                }
                n = n.parentNode;
            }
            return null;
        };
    }

    var getDocumentOrFragmentContainer = createAncestorFinder( [9, 11] );
    var getReadonlyAncestor = createAncestorFinder(readonlyNodeTypes);
    var getDocTypeNotationEntityAncestor = createAncestorFinder( [6, 10, 12] );

    function assertNoDocTypeNotationEntityAncestor(node, allowSelf) {
        if (getDocTypeNotationEntityAncestor(node, allowSelf)) {
            throw new RangeException("INVALID_NODE_TYPE_ERR");
        }
    }

    function assertNotDetached(range) {
        if (!range.startContainer) {
            throw new DOMException("INVALID_STATE_ERR");
        }
    }

    function assertValidNodeType(node, invalidTypes) {
        if (!arrayContains(invalidTypes, node.nodeType)) {
            throw new RangeException("INVALID_NODE_TYPE_ERR");
        }
    }

    function assertValidOffset(node, offset) {
        if (offset < 0 || offset > (isCharacterDataNode(node) ? node.length : node.childNodes.length)) {
            throw new DOMException("INDEX_SIZE_ERR");
        }
    }

    function assertSameDocumentOrFragment(node1, node2) {
        if (getDocumentOrFragmentContainer(node1, true) !== getDocumentOrFragmentContainer(node2, true)) {
            throw new DOMException("WRONG_DOCUMENT_ERR");
        }
    }

    function assertNodeNotReadOnly(node) {
        if (getReadonlyAncestor(node, true)) {
            throw new DOMException("NO_MODIFICATION_ALLOWED_ERR");
        }
    }

    function assertNode(node, codeName) {
        if (!node) {
            throw new DOMException(codeName);
        }
    }

    function isOrphan(node) {
        return (crashyTextNodes && dom.isBrokenNode(node)) ||
            !arrayContains(rootContainerNodeTypes, node.nodeType) && !getDocumentOrFragmentContainer(node, true);
    }

    function isValidOffset(node, offset) {
        return offset <= (isCharacterDataNode(node) ? node.length : node.childNodes.length);
    }

    function isRangeValid(range) {
        return (!!range.startContainer && !!range.endContainer
                && !isOrphan(range.startContainer)
                && !isOrphan(range.endContainer)
                && isValidOffset(range.startContainer, range.startOffset)
                && isValidOffset(range.endContainer, range.endOffset));
    }

    function assertRangeValid(range) {
        assertNotDetached(range);
        if (!isRangeValid(range)) {
            throw new Error("Range error: Range is no longer valid after DOM mutation (" + range.inspect() + ")");
        }
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // Test the browser's innerHTML support to decide how to implement createContextualFragment
    var styleEl = document.createElement("style");
    var htmlParsingConforms = false;
    try {
        styleEl.innerHTML = "<b>x</b>";
        htmlParsingConforms = (styleEl.firstChild.nodeType == 3); // Opera incorrectly creates an element node
    } catch (e) {
        // IE 6 and 7 throw
    }

    api.features.htmlParsingConforms = htmlParsingConforms;

    var createContextualFragment = htmlParsingConforms ?

        // Implementation as per HTML parsing spec, trusting in the browser's implementation of innerHTML. See
        // discussion and base code for this implementation at issue 67.
        // Spec: http://html5.org/specs/dom-parsing.html#extensions-to-the-range-interface
        // Thanks to Aleks Williams.
        function(fragmentStr) {
            // "Let node the context object's start's node."
            var node = this.startContainer;
            var doc = getDocument(node);

            // "If the context object's start's node is null, raise an INVALID_STATE_ERR
            // exception and abort these steps."
            if (!node) {
                throw new DOMException("INVALID_STATE_ERR");
            }

            // "Let element be as follows, depending on node's interface:"
            // Document, Document Fragment: null
            var el = null;

            // "Element: node"
            if (node.nodeType == 1) {
                el = node;

            // "Text, Comment: node's parentElement"
            } else if (isCharacterDataNode(node)) {
                el = dom.parentElement(node);
            }

            // "If either element is null or element's ownerDocument is an HTML document
            // and element's local name is "html" and element's namespace is the HTML
            // namespace"
            if (el === null || (
                el.nodeName == "HTML"
                && dom.isHtmlNamespace(getDocument(el).documentElement)
                && dom.isHtmlNamespace(el)
            )) {

            // "let element be a new Element with "body" as its local name and the HTML
            // namespace as its namespace.""
                el = doc.createElement("body");
            } else {
                el = el.cloneNode(false);
            }

            // "If the node's document is an HTML document: Invoke the HTML fragment parsing algorithm."
            // "If the node's document is an XML document: Invoke the XML fragment parsing algorithm."
            // "In either case, the algorithm must be invoked with fragment as the input
            // and element as the context element."
            el.innerHTML = fragmentStr;

            // "If this raises an exception, then abort these steps. Otherwise, let new
            // children be the nodes returned."

            // "Let fragment be a new DocumentFragment."
            // "Append all new children to fragment."
            // "Return fragment."
            return dom.fragmentFromNodeChildren(el);
        } :

        // In this case, innerHTML cannot be trusted, so fall back to a simpler, non-conformant implementation that
        // previous versions of Rangy used (with the exception of using a body element rather than a div)
        function(fragmentStr) {
            assertNotDetached(this);
            var doc = getRangeDocument(this);
            var el = doc.createElement("body");
            el.innerHTML = fragmentStr;

            return dom.fragmentFromNodeChildren(el);
        };

    function splitRangeBoundaries(range, positionsToPreserve) {
        assertRangeValid(range);

        var sc = range.startContainer, so = range.startOffset, ec = range.endContainer, eo = range.endOffset;
        var startEndSame = (sc === ec);

        if (isCharacterDataNode(ec) && eo > 0 && eo < ec.length) {
            splitDataNode(ec, eo, positionsToPreserve);
        }

        if (isCharacterDataNode(sc) && so > 0 && so < sc.length) {
            sc = splitDataNode(sc, so, positionsToPreserve);
            if (startEndSame) {
                eo -= so;
                ec = sc;
            } else if (ec == sc.parentNode && eo >= getNodeIndex(sc)) {
                eo++;
            }
            so = 0;
        }
        range.setStartAndEnd(sc, so, ec, eo);
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    var rangeProperties = ["startContainer", "startOffset", "endContainer", "endOffset", "collapsed",
        "commonAncestorContainer"];

    var s2s = 0, s2e = 1, e2e = 2, e2s = 3;
    var n_b = 0, n_a = 1, n_b_a = 2, n_i = 3;

    util.extend(api.rangePrototype, {
        compareBoundaryPoints: function(how, range) {
            assertRangeValid(this);
            assertSameDocumentOrFragment(this.startContainer, range.startContainer);

            var nodeA, offsetA, nodeB, offsetB;
            var prefixA = (how == e2s || how == s2s) ? "start" : "end";
            var prefixB = (how == s2e || how == s2s) ? "start" : "end";
            nodeA = this[prefixA + "Container"];
            offsetA = this[prefixA + "Offset"];
            nodeB = range[prefixB + "Container"];
            offsetB = range[prefixB + "Offset"];
            return comparePoints(nodeA, offsetA, nodeB, offsetB);
        },

        insertNode: function(node) {
            assertRangeValid(this);
            assertValidNodeType(node, insertableNodeTypes);
            assertNodeNotReadOnly(this.startContainer);

            if (isOrIsAncestorOf(node, this.startContainer)) {
                throw new DOMException("HIERARCHY_REQUEST_ERR");
            }

            // No check for whether the container of the start of the Range is of a type that does not allow
            // children of the type of node: the browser's DOM implementation should do this for us when we attempt
            // to add the node

            var firstNodeInserted = insertNodeAtPosition(node, this.startContainer, this.startOffset);
            this.setStartBefore(firstNodeInserted);
        },

        cloneContents: function() {
            assertRangeValid(this);

            var clone, frag;
            if (this.collapsed) {
                return getRangeDocument(this).createDocumentFragment();
            } else {
                if (this.startContainer === this.endContainer && isCharacterDataNode(this.startContainer)) {
                    clone = this.startContainer.cloneNode(true);
                    clone.data = clone.data.slice(this.startOffset, this.endOffset);
                    frag = getRangeDocument(this).createDocumentFragment();
                    frag.appendChild(clone);
                    return frag;
                } else {
                    var iterator = new RangeIterator(this, true);
                    clone = cloneSubtree(iterator);
                    iterator.detach();
                }
                return clone;
            }
        },

        canSurroundContents: function() {
            assertRangeValid(this);
            assertNodeNotReadOnly(this.startContainer);
            assertNodeNotReadOnly(this.endContainer);

            // Check if the contents can be surrounded. Specifically, this means whether the range partially selects
            // no non-text nodes.
            var iterator = new RangeIterator(this, true);
            var boundariesInvalid = (iterator._first && (isNonTextPartiallySelected(iterator._first, this)) ||
                    (iterator._last && isNonTextPartiallySelected(iterator._last, this)));
            iterator.detach();
            return !boundariesInvalid;
        },

        surroundContents: function(node) {
            assertValidNodeType(node, surroundNodeTypes);

            if (!this.canSurroundContents()) {
                throw new RangeException("BAD_BOUNDARYPOINTS_ERR");
            }

            // Extract the contents
            var content = this.extractContents();

            // Clear the children of the node
            if (node.hasChildNodes()) {
                while (node.lastChild) {
                    node.removeChild(node.lastChild);
                }
            }

            // Insert the new node and add the extracted contents
            insertNodeAtPosition(node, this.startContainer, this.startOffset);
            node.appendChild(content);

            this.selectNode(node);
        },

        cloneRange: function() {
            assertRangeValid(this);
            var range = new Range(getRangeDocument(this));
            var i = rangeProperties.length, prop;
            while (i--) {
                prop = rangeProperties[i];
                range[prop] = this[prop];
            }
            return range;
        },

        toString: function() {
            assertRangeValid(this);
            var sc = this.startContainer;
            if (sc === this.endContainer && isCharacterDataNode(sc)) {
                return (sc.nodeType == 3 || sc.nodeType == 4) ? sc.data.slice(this.startOffset, this.endOffset) : "";
            } else {
                var textParts = [], iterator = new RangeIterator(this, true);
                iterateSubtree(iterator, function(node) {
                    // Accept only text or CDATA nodes, not comments
                    if (node.nodeType == 3 || node.nodeType == 4) {
                        textParts.push(node.data);
                    }
                });
                iterator.detach();
                return textParts.join("");
            }
        },

        // The methods below are all non-standard. The following batch were introduced by Mozilla but have since
        // been removed from Mozilla.

        compareNode: function(node) {
            assertRangeValid(this);

            var parent = node.parentNode;
            var nodeIndex = getNodeIndex(node);

            if (!parent) {
                throw new DOMException("NOT_FOUND_ERR");
            }

            var startComparison = this.comparePoint(parent, nodeIndex),
                endComparison = this.comparePoint(parent, nodeIndex + 1);

            if (startComparison < 0) { // Node starts before
                return (endComparison > 0) ? n_b_a : n_b;
            } else {
                return (endComparison > 0) ? n_a : n_i;
            }
        },

        comparePoint: function(node, offset) {
            assertRangeValid(this);
            assertNode(node, "HIERARCHY_REQUEST_ERR");
            assertSameDocumentOrFragment(node, this.startContainer);

            if (comparePoints(node, offset, this.startContainer, this.startOffset) < 0) {
                return -1;
            } else if (comparePoints(node, offset, this.endContainer, this.endOffset) > 0) {
                return 1;
            }
            return 0;
        },

        createContextualFragment: createContextualFragment,

        toHtml: function() {
            assertRangeValid(this);
            var container = this.commonAncestorContainer.parentNode.cloneNode(false);
            container.appendChild(this.cloneContents());
            return container.innerHTML;
        },

        // touchingIsIntersecting determines whether this method considers a node that borders a range intersects
        // with it (as in WebKit) or not (as in Gecko pre-1.9, and the default)
        intersectsNode: function(node, touchingIsIntersecting) {
            assertRangeValid(this);
            assertNode(node, "NOT_FOUND_ERR");
            if (getDocument(node) !== getRangeDocument(this)) {
                return false;
            }

            var parent = node.parentNode, offset = getNodeIndex(node);
            assertNode(parent, "NOT_FOUND_ERR");

            var startComparison = comparePoints(parent, offset, this.endContainer, this.endOffset),
                endComparison = comparePoints(parent, offset + 1, this.startContainer, this.startOffset);

            return touchingIsIntersecting ? startComparison <= 0 && endComparison >= 0 : startComparison < 0 && endComparison > 0;
        },

        isPointInRange: function(node, offset) {
            assertRangeValid(this);
            assertNode(node, "HIERARCHY_REQUEST_ERR");
            assertSameDocumentOrFragment(node, this.startContainer);

            return (comparePoints(node, offset, this.startContainer, this.startOffset) >= 0) &&
                   (comparePoints(node, offset, this.endContainer, this.endOffset) <= 0);
        },

        // The methods below are non-standard and invented by me.

        // Sharing a boundary start-to-end or end-to-start does not count as intersection.
        intersectsRange: function(range) {
            return rangesIntersect(this, range, false);
        },

        // Sharing a boundary start-to-end or end-to-start does count as intersection.
        intersectsOrTouchesRange: function(range) {
            return rangesIntersect(this, range, true);
        },

        intersection: function(range) {
            if (this.intersectsRange(range)) {
                var startComparison = comparePoints(this.startContainer, this.startOffset, range.startContainer, range.startOffset),
                    endComparison = comparePoints(this.endContainer, this.endOffset, range.endContainer, range.endOffset);

                var intersectionRange = this.cloneRange();
                if (startComparison == -1) {
                    intersectionRange.setStart(range.startContainer, range.startOffset);
                }
                if (endComparison == 1) {
                    intersectionRange.setEnd(range.endContainer, range.endOffset);
                }
                return intersectionRange;
            }
            return null;
        },

        union: function(range) {
            if (this.intersectsOrTouchesRange(range)) {
                var unionRange = this.cloneRange();
                if (comparePoints(range.startContainer, range.startOffset, this.startContainer, this.startOffset) == -1) {
                    unionRange.setStart(range.startContainer, range.startOffset);
                }
                if (comparePoints(range.endContainer, range.endOffset, this.endContainer, this.endOffset) == 1) {
                    unionRange.setEnd(range.endContainer, range.endOffset);
                }
                return unionRange;
            } else {
                throw new RangeException("Ranges do not intersect");
            }
        },

        containsNode: function(node, allowPartial) {
            if (allowPartial) {
                return this.intersectsNode(node, false);
            } else {
                return this.compareNode(node) == n_i;
            }
        },

        containsNodeContents: function(node) {
            return this.comparePoint(node, 0) >= 0 && this.comparePoint(node, getNodeLength(node)) <= 0;
        },

        containsRange: function(range) {
            var intersection = this.intersection(range);
            return intersection !== null && range.equals(intersection);
        },

        containsNodeText: function(node) {
            var nodeRange = this.cloneRange();
            nodeRange.selectNode(node);
            var textNodes = nodeRange.getNodes([3]);
            if (textNodes.length > 0) {
                nodeRange.setStart(textNodes[0], 0);
                var lastTextNode = textNodes.pop();
                nodeRange.setEnd(lastTextNode, lastTextNode.length);
                var contains = this.containsRange(nodeRange);
                nodeRange.detach();
                return contains;
            } else {
                return this.containsNodeContents(node);
            }
        },

        getNodes: function(nodeTypes, filter) {
            assertRangeValid(this);
            return getNodesInRange(this, nodeTypes, filter);
        },

        getDocument: function() {
            return getRangeDocument(this);
        },

        collapseBefore: function(node) {
            assertNotDetached(this);

            this.setEndBefore(node);
            this.collapse(false);
        },

        collapseAfter: function(node) {
            assertNotDetached(this);

            this.setStartAfter(node);
            this.collapse(true);
        },

        getBookmark: function(containerNode) {
            var doc = getRangeDocument(this);
            var preSelectionRange = api.createRange(doc);
            containerNode = containerNode || dom.getBody(doc);
            preSelectionRange.selectNodeContents(containerNode);
            var range = this.intersection(preSelectionRange);
            var start = 0, end = 0;
            if (range) {
                preSelectionRange.setEnd(range.startContainer, range.startOffset);
                start = preSelectionRange.toString().length;
                end = start + range.toString().length;
                preSelectionRange.detach();
            }

            return {
                start: start,
                end: end,
                containerNode: containerNode
            };
        },

        moveToBookmark: function(bookmark) {
            var containerNode = bookmark.containerNode;
            var charIndex = 0;
            this.setStart(containerNode, 0);
            this.collapse(true);
            var nodeStack = [containerNode], node, foundStart = false, stop = false;
            var nextCharIndex, i, childNodes;

            while (!stop && (node = nodeStack.pop())) {
                if (node.nodeType == 3) {
                    nextCharIndex = charIndex + node.length;
                    if (!foundStart && bookmark.start >= charIndex && bookmark.start <= nextCharIndex) {
                        this.setStart(node, bookmark.start - charIndex);
                        foundStart = true;
                    }
                    if (foundStart && bookmark.end >= charIndex && bookmark.end <= nextCharIndex) {
                        this.setEnd(node, bookmark.end - charIndex);
                        stop = true;
                    }
                    charIndex = nextCharIndex;
                } else {
                    childNodes = node.childNodes;
                    i = childNodes.length;
                    while (i--) {
                        nodeStack.push(childNodes[i]);
                    }
                }
            }
        },

        getName: function() {
            return "DomRange";
        },

        equals: function(range) {
            return Range.rangesEqual(this, range);
        },

        isValid: function() {
            return isRangeValid(this);
        },

        inspect: function() {
            return inspect(this);
        }
    });

    function copyComparisonConstantsToObject(obj) {
        obj.START_TO_START = s2s;
        obj.START_TO_END = s2e;
        obj.END_TO_END = e2e;
        obj.END_TO_START = e2s;

        obj.NODE_BEFORE = n_b;
        obj.NODE_AFTER = n_a;
        obj.NODE_BEFORE_AND_AFTER = n_b_a;
        obj.NODE_INSIDE = n_i;
    }

    function copyComparisonConstants(constructor) {
        copyComparisonConstantsToObject(constructor);
        copyComparisonConstantsToObject(constructor.prototype);
    }

    function createRangeContentRemover(remover, boundaryUpdater) {
        return function() {
            assertRangeValid(this);

            var sc = this.startContainer, so = this.startOffset, root = this.commonAncestorContainer;

            var iterator = new RangeIterator(this, true);

            // Work out where to position the range after content removal
            var node, boundary;
            if (sc !== root) {
                node = getClosestAncestorIn(sc, root, true);
                boundary = getBoundaryAfterNode(node);
                sc = boundary.node;
                so = boundary.offset;
            }

            // Check none of the range is read-only
            iterateSubtree(iterator, assertNodeNotReadOnly);

            iterator.reset();

            // Remove the content
            var returnValue = remover(iterator);
            iterator.detach();

            // Move to the new position
            boundaryUpdater(this, sc, so, sc, so);

            return returnValue;
        };
    }

    function createPrototypeRange(constructor, boundaryUpdater, detacher) {
        function createBeforeAfterNodeSetter(isBefore, isStart) {
            return function(node) {
                assertNotDetached(this);
                assertValidNodeType(node, beforeAfterNodeTypes);
                assertValidNodeType(getRootContainer(node), rootContainerNodeTypes);

                var boundary = (isBefore ? getBoundaryBeforeNode : getBoundaryAfterNode)(node);
                (isStart ? setRangeStart : setRangeEnd)(this, boundary.node, boundary.offset);
            };
        }

        function setRangeStart(range, node, offset) {
            var ec = range.endContainer, eo = range.endOffset;
            if (node !== range.startContainer || offset !== range.startOffset) {
                // Check the root containers of the range and the new boundary, and also check whether the new boundary
                // is after the current end. In either case, collapse the range to the new position
                if (getRootContainer(node) != getRootContainer(ec) || comparePoints(node, offset, ec, eo) == 1) {
                    ec = node;
                    eo = offset;
                }
                boundaryUpdater(range, node, offset, ec, eo);
            }
        }

        function setRangeEnd(range, node, offset) {
            var sc = range.startContainer, so = range.startOffset;
            if (node !== range.endContainer || offset !== range.endOffset) {
                // Check the root containers of the range and the new boundary, and also check whether the new boundary
                // is after the current end. In either case, collapse the range to the new position
                if (getRootContainer(node) != getRootContainer(sc) || comparePoints(node, offset, sc, so) == -1) {
                    sc = node;
                    so = offset;
                }
                boundaryUpdater(range, sc, so, node, offset);
            }
        }

        // Set up inheritance
        var F = function() {};
        F.prototype = api.rangePrototype;
        constructor.prototype = new F();

        util.extend(constructor.prototype, {
            setStart: function(node, offset) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);
                assertValidOffset(node, offset);

                setRangeStart(this, node, offset);
            },

            setEnd: function(node, offset) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);
                assertValidOffset(node, offset);

                setRangeEnd(this, node, offset);
            },

            /**
             * Convenience method to set a range's start and end boundaries. Overloaded as follows:
             * - Two parameters (node, offset) creates a collapsed range at that position
             * - Three parameters (node, startOffset, endOffset) creates a range contained with node starting at
             *   startOffset and ending at endOffset
             * - Four parameters (startNode, startOffset, endNode, endOffset) creates a range starting at startOffset in
             *   startNode and ending at endOffset in endNode
             */
            setStartAndEnd: function() {
                assertNotDetached(this);

                var args = arguments;
                var sc = args[0], so = args[1], ec = sc, eo = so;

                switch (args.length) {
                    case 3:
                        eo = args[2];
                        break;
                    case 4:
                        ec = args[2];
                        eo = args[3];
                        break;
                }

                boundaryUpdater(this, sc, so, ec, eo);
            },

            setBoundary: function(node, offset, isStart) {
                this["set" + (isStart ? "Start" : "End")](node, offset);
            },

            setStartBefore: createBeforeAfterNodeSetter(true, true),
            setStartAfter: createBeforeAfterNodeSetter(false, true),
            setEndBefore: createBeforeAfterNodeSetter(true, false),
            setEndAfter: createBeforeAfterNodeSetter(false, false),

            collapse: function(isStart) {
                assertRangeValid(this);
                if (isStart) {
                    boundaryUpdater(this, this.startContainer, this.startOffset, this.startContainer, this.startOffset);
                } else {
                    boundaryUpdater(this, this.endContainer, this.endOffset, this.endContainer, this.endOffset);
                }
            },

            selectNodeContents: function(node) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);

                boundaryUpdater(this, node, 0, node, getNodeLength(node));
            },

            selectNode: function(node) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, false);
                assertValidNodeType(node, beforeAfterNodeTypes);

                var start = getBoundaryBeforeNode(node), end = getBoundaryAfterNode(node);
                boundaryUpdater(this, start.node, start.offset, end.node, end.offset);
            },

            extractContents: createRangeContentRemover(extractSubtree, boundaryUpdater),

            deleteContents: createRangeContentRemover(deleteSubtree, boundaryUpdater),

            canSurroundContents: function() {
                assertRangeValid(this);
                assertNodeNotReadOnly(this.startContainer);
                assertNodeNotReadOnly(this.endContainer);

                // Check if the contents can be surrounded. Specifically, this means whether the range partially selects
                // no non-text nodes.
                var iterator = new RangeIterator(this, true);
                var boundariesInvalid = (iterator._first && (isNonTextPartiallySelected(iterator._first, this)) ||
                        (iterator._last && isNonTextPartiallySelected(iterator._last, this)));
                iterator.detach();
                return !boundariesInvalid;
            },

            detach: function() {
                detacher(this);
            },

            splitBoundaries: function() {
                splitRangeBoundaries(this);
            },

            splitBoundariesPreservingPositions: function(positionsToPreserve) {
                splitRangeBoundaries(this, positionsToPreserve);
            },

            normalizeBoundaries: function() {
                assertRangeValid(this);

                var sc = this.startContainer, so = this.startOffset, ec = this.endContainer, eo = this.endOffset;

                var mergeForward = function(node) {
                    var sibling = node.nextSibling;
                    if (sibling && sibling.nodeType == node.nodeType) {
                        ec = node;
                        eo = node.length;
                        node.appendData(sibling.data);
                        sibling.parentNode.removeChild(sibling);
                    }
                };

                var mergeBackward = function(node) {
                    var sibling = node.previousSibling;
                    if (sibling && sibling.nodeType == node.nodeType) {
                        sc = node;
                        var nodeLength = node.length;
                        so = sibling.length;
                        node.insertData(0, sibling.data);
                        sibling.parentNode.removeChild(sibling);
                        if (sc == ec) {
                            eo += so;
                            ec = sc;
                        } else if (ec == node.parentNode) {
                            var nodeIndex = getNodeIndex(node);
                            if (eo == nodeIndex) {
                                ec = node;
                                eo = nodeLength;
                            } else if (eo > nodeIndex) {
                                eo--;
                            }
                        }
                    }
                };

                var normalizeStart = true;

                if (isCharacterDataNode(ec)) {
                    if (ec.length == eo) {
                        mergeForward(ec);
                    }
                } else {
                    if (eo > 0) {
                        var endNode = ec.childNodes[eo - 1];
                        if (endNode && isCharacterDataNode(endNode)) {
                            mergeForward(endNode);
                        }
                    }
                    normalizeStart = !this.collapsed;
                }

                if (normalizeStart) {
                    if (isCharacterDataNode(sc)) {
                        if (so == 0) {
                            mergeBackward(sc);
                        }
                    } else {
                        if (so < sc.childNodes.length) {
                            var startNode = sc.childNodes[so];
                            if (startNode && isCharacterDataNode(startNode)) {
                                mergeBackward(startNode);
                            }
                        }
                    }
                } else {
                    sc = ec;
                    so = eo;
                }

                boundaryUpdater(this, sc, so, ec, eo);
            },

            collapseToPoint: function(node, offset) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);
                assertValidOffset(node, offset);
                this.setStartAndEnd(node, offset);
            }
        });

        copyComparisonConstants(constructor);
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // Updates commonAncestorContainer and collapsed after boundary change
    function updateCollapsedAndCommonAncestor(range) {
        range.collapsed = (range.startContainer === range.endContainer && range.startOffset === range.endOffset);
        range.commonAncestorContainer = range.collapsed ?
            range.startContainer : dom.getCommonAncestor(range.startContainer, range.endContainer);
    }

    function updateBoundaries(range, startContainer, startOffset, endContainer, endOffset) {
        range.startContainer = startContainer;
        range.startOffset = startOffset;
        range.endContainer = endContainer;
        range.endOffset = endOffset;
        range.document = dom.getDocument(startContainer);

        updateCollapsedAndCommonAncestor(range);
    }

    function detach(range) {
        assertNotDetached(range);
        range.startContainer = range.startOffset = range.endContainer = range.endOffset = range.document = null;
        range.collapsed = range.commonAncestorContainer = null;
    }

    function Range(doc) {
        this.startContainer = doc;
        this.startOffset = 0;
        this.endContainer = doc;
        this.endOffset = 0;
        this.document = doc;
        updateCollapsedAndCommonAncestor(this);
    }

    createPrototypeRange(Range, updateBoundaries, detach);

    util.extend(Range, {
        rangeProperties: rangeProperties,
        RangeIterator: RangeIterator,
        copyComparisonConstants: copyComparisonConstants,
        createPrototypeRange: createPrototypeRange,
        inspect: inspect,
        getRangeDocument: getRangeDocument,
        rangesEqual: function(r1, r2) {
            return r1.startContainer === r2.startContainer &&
                r1.startOffset === r2.startOffset &&
                r1.endContainer === r2.endContainer &&
                r1.endOffset === r2.endOffset;
        }
    });

    api.DomRange = Range;
    api.RangeException = RangeException;
});
rangy.createCoreModule("WrappedRange", ["DomRange"], function(api, module) {
    var WrappedRange, WrappedTextRange;
    var dom = api.dom;
    var util = api.util;
    var DomPosition = dom.DomPosition;
    var DomRange = api.DomRange;
    var getBody = dom.getBody;
    var getContentDocument = dom.getContentDocument;
    var isCharacterDataNode = dom.isCharacterDataNode;


    /*----------------------------------------------------------------------------------------------------------------*/

    if (api.features.implementsDomRange) {
        // This is a wrapper around the browser's native DOM Range. It has two aims:
        // - Provide workarounds for specific browser bugs
        // - provide convenient extensions, which are inherited from Rangy's DomRange

        (function() {
            var rangeProto;
            var rangeProperties = DomRange.rangeProperties;

            function updateRangeProperties(range) {
                var i = rangeProperties.length, prop;
                while (i--) {
                    prop = rangeProperties[i];
                    range[prop] = range.nativeRange[prop];
                }
                // Fix for broken collapsed property in IE 9.
                range.collapsed = (range.startContainer === range.endContainer && range.startOffset === range.endOffset);
            }

            function updateNativeRange(range, startContainer, startOffset, endContainer, endOffset) {
                var startMoved = (range.startContainer !== startContainer || range.startOffset != startOffset);
                var endMoved = (range.endContainer !== endContainer || range.endOffset != endOffset);
                var nativeRangeDifferent = !range.equals(range.nativeRange);

                // Always set both boundaries for the benefit of IE9 (see issue 35)
                if (startMoved || endMoved || nativeRangeDifferent) {
                    range.setEnd(endContainer, endOffset);
                    range.setStart(startContainer, startOffset);
                }
            }

            function detach(range) {
                range.nativeRange.detach();
                range.detached = true;
                var i = rangeProperties.length;
                while (i--) {
                    range[ rangeProperties[i] ] = null;
                }
            }

            var createBeforeAfterNodeSetter;

            WrappedRange = function(range) {
                if (!range) {
                    throw module.createError("WrappedRange: Range must be specified");
                }
                this.nativeRange = range;
                updateRangeProperties(this);
            };

            DomRange.createPrototypeRange(WrappedRange, updateNativeRange, detach);

            rangeProto = WrappedRange.prototype;

            rangeProto.selectNode = function(node) {
                this.nativeRange.selectNode(node);
                updateRangeProperties(this);
            };

            rangeProto.cloneContents = function() {
                return this.nativeRange.cloneContents();
            };

            // Due to a long-standing Firefox bug that I have not been able to find a reliable way to detect,
            // insertNode() is never delegated to the native range.

            rangeProto.surroundContents = function(node) {
                this.nativeRange.surroundContents(node);
                updateRangeProperties(this);
            };

            rangeProto.collapse = function(isStart) {
                this.nativeRange.collapse(isStart);
                updateRangeProperties(this);
            };

            rangeProto.cloneRange = function() {
                return new WrappedRange(this.nativeRange.cloneRange());
            };

            rangeProto.refresh = function() {
                updateRangeProperties(this);
            };

            rangeProto.toString = function() {
                return this.nativeRange.toString();
            };

            // Create test range and node for feature detection

            var testTextNode = document.createTextNode("test");
            getBody(document).appendChild(testTextNode);
            var range = document.createRange();

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for Firefox 2 bug that prevents moving the start of a Range to a point after its current end and
            // correct for it

            range.setStart(testTextNode, 0);
            range.setEnd(testTextNode, 0);

            try {
                range.setStart(testTextNode, 1);

                rangeProto.setStart = function(node, offset) {
                    this.nativeRange.setStart(node, offset);
                    updateRangeProperties(this);
                };

                rangeProto.setEnd = function(node, offset) {
                    this.nativeRange.setEnd(node, offset);
                    updateRangeProperties(this);
                };

                createBeforeAfterNodeSetter = function(name) {
                    return function(node) {
                        this.nativeRange[name](node);
                        updateRangeProperties(this);
                    };
                };

            } catch(ex) {

                rangeProto.setStart = function(node, offset) {
                    try {
                        this.nativeRange.setStart(node, offset);
                    } catch (ex) {
                        this.nativeRange.setEnd(node, offset);
                        this.nativeRange.setStart(node, offset);
                    }
                    updateRangeProperties(this);
                };

                rangeProto.setEnd = function(node, offset) {
                    try {
                        this.nativeRange.setEnd(node, offset);
                    } catch (ex) {
                        this.nativeRange.setStart(node, offset);
                        this.nativeRange.setEnd(node, offset);
                    }
                    updateRangeProperties(this);
                };

                createBeforeAfterNodeSetter = function(name, oppositeName) {
                    return function(node) {
                        try {
                            this.nativeRange[name](node);
                        } catch (ex) {
                            this.nativeRange[oppositeName](node);
                            this.nativeRange[name](node);
                        }
                        updateRangeProperties(this);
                    };
                };
            }

            rangeProto.setStartBefore = createBeforeAfterNodeSetter("setStartBefore", "setEndBefore");
            rangeProto.setStartAfter = createBeforeAfterNodeSetter("setStartAfter", "setEndAfter");
            rangeProto.setEndBefore = createBeforeAfterNodeSetter("setEndBefore", "setStartBefore");
            rangeProto.setEndAfter = createBeforeAfterNodeSetter("setEndAfter", "setStartAfter");

            /*--------------------------------------------------------------------------------------------------------*/

            // Always use DOM4-compliant selectNodeContents implementation: it's simpler and less code than testing
            // whether the native implementation can be trusted
            rangeProto.selectNodeContents = function(node) {
                this.setStartAndEnd(node, 0, dom.getNodeLength(node));
            };

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for and correct WebKit bug that has the behaviour of compareBoundaryPoints round the wrong way for
            // constants START_TO_END and END_TO_START: https://bugs.webkit.org/show_bug.cgi?id=20738

            range.selectNodeContents(testTextNode);
            range.setEnd(testTextNode, 3);

            var range2 = document.createRange();
            range2.selectNodeContents(testTextNode);
            range2.setEnd(testTextNode, 4);
            range2.setStart(testTextNode, 2);

            if (range.compareBoundaryPoints(range.START_TO_END, range2) == -1 &&
                    range.compareBoundaryPoints(range.END_TO_START, range2) == 1) {
                // This is the wrong way round, so correct for it

                rangeProto.compareBoundaryPoints = function(type, range) {
                    range = range.nativeRange || range;
                    if (type == range.START_TO_END) {
                        type = range.END_TO_START;
                    } else if (type == range.END_TO_START) {
                        type = range.START_TO_END;
                    }
                    return this.nativeRange.compareBoundaryPoints(type, range);
                };
            } else {
                rangeProto.compareBoundaryPoints = function(type, range) {
                    return this.nativeRange.compareBoundaryPoints(type, range.nativeRange || range);
                };
            }

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for IE 9 deleteContents() and extractContents() bug and correct it. See issue 107.

            var el = document.createElement("div");
            el.innerHTML = "123";
            var textNode = el.firstChild;
            var body = getBody(document);
            body.appendChild(el);

            range.setStart(textNode, 1);
            range.setEnd(textNode, 2);
            range.deleteContents();

            if (textNode.data == "13") {
                // Behaviour is correct per DOM4 Range so wrap the browser's implementation of deleteContents() and
                // extractContents()
                rangeProto.deleteContents = function() {
                    this.nativeRange.deleteContents();
                    updateRangeProperties(this);
                };

                rangeProto.extractContents = function() {
                    var frag = this.nativeRange.extractContents();
                    updateRangeProperties(this);
                    return frag;
                };
            } else {
            }

            body.removeChild(el);
            body = null;

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for existence of createContextualFragment and delegate to it if it exists
            if (util.isHostMethod(range, "createContextualFragment")) {
                rangeProto.createContextualFragment = function(fragmentStr) {
                    return this.nativeRange.createContextualFragment(fragmentStr);
                };
            }

            /*--------------------------------------------------------------------------------------------------------*/

            // Clean up
            getBody(document).removeChild(testTextNode);
            range.detach();
            range2.detach();

            rangeProto.getName = function() {
                return "WrappedRange";
            };

            api.WrappedRange = WrappedRange;

            api.createNativeRange = function(doc) {
                doc = getContentDocument(doc, module, "createNativeRange");
                return doc.createRange();
            };
        })();
    }

    if (api.features.implementsTextRange) {
        /*
        This is a workaround for a bug where IE returns the wrong container element from the TextRange's parentElement()
        method. For example, in the following (where pipes denote the selection boundaries):

        <ul id="ul"><li id="a">| a </li><li id="b"> b |</li></ul>

        var range = document.selection.createRange();
        alert(range.parentElement().id); // Should alert "ul" but alerts "b"

        This method returns the common ancestor node of the following:
        - the parentElement() of the textRange
        - the parentElement() of the textRange after calling collapse(true)
        - the parentElement() of the textRange after calling collapse(false)
        */
        var getTextRangeContainerElement = function(textRange) {
            var parentEl = textRange.parentElement();
            var range = textRange.duplicate();
            range.collapse(true);
            var startEl = range.parentElement();
            range = textRange.duplicate();
            range.collapse(false);
            var endEl = range.parentElement();
            var startEndContainer = (startEl == endEl) ? startEl : dom.getCommonAncestor(startEl, endEl);

            return startEndContainer == parentEl ? startEndContainer : dom.getCommonAncestor(parentEl, startEndContainer);
        };

        var textRangeIsCollapsed = function(textRange) {
            return textRange.compareEndPoints("StartToEnd", textRange) == 0;
        };

        // Gets the boundary of a TextRange expressed as a node and an offset within that node. This function started out as
        // an improved version of code found in Tim Cameron Ryan's IERange (http://code.google.com/p/ierange/) but has
        // grown, fixing problems with line breaks in preformatted text, adding workaround for IE TextRange bugs, handling
        // for inputs and images, plus optimizations.
        var getTextRangeBoundaryPosition = function(textRange, wholeRangeContainerElement, isStart, isCollapsed, startInfo) {
            var workingRange = textRange.duplicate();
            workingRange.collapse(isStart);
            var containerElement = workingRange.parentElement();

            // Sometimes collapsing a TextRange that's at the start of a text node can move it into the previous node, so
            // check for that
            if (!dom.isOrIsAncestorOf(wholeRangeContainerElement, containerElement)) {
                containerElement = wholeRangeContainerElement;
            }


            // Deal with nodes that cannot "contain rich HTML markup". In practice, this means form inputs, images and
            // similar. See http://msdn.microsoft.com/en-us/library/aa703950%28VS.85%29.aspx
            if (!containerElement.canHaveHTML) {
                var pos = new DomPosition(containerElement.parentNode, dom.getNodeIndex(containerElement));
                return {
                    boundaryPosition: pos,
                    nodeInfo: {
                        nodeIndex: pos.offset,
                        containerElement: pos.node
                    }
                };
            }

            var workingNode = dom.getDocument(containerElement).createElement("span");

            // Workaround for HTML5 Shiv's insane violation of document.createElement(). See Rangy issue 104 and HTML5
            // Shiv issue 64: https://github.com/aFarkas/html5shiv/issues/64
            if (workingNode.parentNode) {
                workingNode.parentNode.removeChild(workingNode);
            }

            var comparison, workingComparisonType = isStart ? "StartToStart" : "StartToEnd";
            var previousNode, nextNode, boundaryPosition, boundaryNode;
            var start = (startInfo && startInfo.containerElement == containerElement) ? startInfo.nodeIndex : 0;
            var childNodeCount = containerElement.childNodes.length;
            var end = childNodeCount;

            // Check end first. Code within the loop assumes that the endth child node of the container is definitely
            // after the range boundary.
            var nodeIndex = end;

            while (true) {
                if (nodeIndex == childNodeCount) {
                    containerElement.appendChild(workingNode);
                } else {
                    containerElement.insertBefore(workingNode, containerElement.childNodes[nodeIndex]);
                }
                workingRange.moveToElementText(workingNode);
                comparison = workingRange.compareEndPoints(workingComparisonType, textRange);
                if (comparison == 0 || start == end) {
                    break;
                } else if (comparison == -1) {
                    if (end == start + 1) {
                        // We know the endth child node is after the range boundary, so we must be done.
                        break;
                    } else {
                        start = nodeIndex;
                    }
                } else {
                    end = (end == start + 1) ? start : nodeIndex;
                }
                nodeIndex = Math.floor((start + end) / 2);
                containerElement.removeChild(workingNode);
            }


            // We've now reached or gone past the boundary of the text range we're interested in
            // so have identified the node we want
            boundaryNode = workingNode.nextSibling;

            if (comparison == -1 && boundaryNode && isCharacterDataNode(boundaryNode)) {
                // This is a character data node (text, comment, cdata). The working range is collapsed at the start of the
                // node containing the text range's boundary, so we move the end of the working range to the boundary point
                // and measure the length of its text to get the boundary's offset within the node.
                workingRange.setEndPoint(isStart ? "EndToStart" : "EndToEnd", textRange);

                var offset;

                if (/[\r\n]/.test(boundaryNode.data)) {
                    /*
                    For the particular case of a boundary within a text node containing rendered line breaks (within a <pre>
                    element, for example), we need a slightly complicated approach to get the boundary's offset in IE. The
                    facts:

                    - Each line break is represented as \r in the text node's data/nodeValue properties
                    - Each line break is represented as \r\n in the TextRange's 'text' property
                    - The 'text' property of the TextRange does not contain trailing line breaks

                    To get round the problem presented by the final fact above, we can use the fact that TextRange's
                    moveStart() and moveEnd() methods return the actual number of characters moved, which is not necessarily
                    the same as the number of characters it was instructed to move. The simplest approach is to use this to
                    store the characters moved when moving both the start and end of the range to the start of the document
                    body and subtracting the start offset from the end offset (the "move-negative-gazillion" method).
                    However, this is extremely slow when the document is large and the range is near the end of it. Clearly
                    doing the mirror image (i.e. moving the range boundaries to the end of the document) has the same
                    problem.

                    Another approach that works is to use moveStart() to move the start boundary of the range up to the end
                    boundary one character at a time and incrementing a counter with the value returned by the moveStart()
                    call. However, the check for whether the start boundary has reached the end boundary is expensive, so
                    this method is slow (although unlike "move-negative-gazillion" is largely unaffected by the location of
                    the range within the document).

                    The method below is a hybrid of the two methods above. It uses the fact that a string containing the
                    TextRange's 'text' property with each \r\n converted to a single \r character cannot be longer than the
                    text of the TextRange, so the start of the range is moved that length initially and then a character at
                    a time to make up for any trailing line breaks not contained in the 'text' property. This has good
                    performance in most situations compared to the previous two methods.
                    */
                    var tempRange = workingRange.duplicate();
                    var rangeLength = tempRange.text.replace(/\r\n/g, "\r").length;

                    offset = tempRange.moveStart("character", rangeLength);
                    while ( (comparison = tempRange.compareEndPoints("StartToEnd", tempRange)) == -1) {
                        offset++;
                        tempRange.moveStart("character", 1);
                    }
                } else {
                    offset = workingRange.text.length;
                }
                boundaryPosition = new DomPosition(boundaryNode, offset);
            } else {

                // If the boundary immediately follows a character data node and this is the end boundary, we should favour
                // a position within that, and likewise for a start boundary preceding a character data node
                previousNode = (isCollapsed || !isStart) && workingNode.previousSibling;
                nextNode = (isCollapsed || isStart) && workingNode.nextSibling;
                if (nextNode && isCharacterDataNode(nextNode)) {
                    boundaryPosition = new DomPosition(nextNode, 0);
                } else if (previousNode && isCharacterDataNode(previousNode)) {
                    boundaryPosition = new DomPosition(previousNode, previousNode.data.length);
                } else {
                    boundaryPosition = new DomPosition(containerElement, dom.getNodeIndex(workingNode));
                }
            }

            // Clean up
            workingNode.parentNode.removeChild(workingNode);

            return {
                boundaryPosition: boundaryPosition,
                nodeInfo: {
                    nodeIndex: nodeIndex,
                    containerElement: containerElement
                }
            };
        };

        // Returns a TextRange representing the boundary of a TextRange expressed as a node and an offset within that node.
        // This function started out as an optimized version of code found in Tim Cameron Ryan's IERange
        // (http://code.google.com/p/ierange/)
        var createBoundaryTextRange = function(boundaryPosition, isStart) {
            var boundaryNode, boundaryParent, boundaryOffset = boundaryPosition.offset;
            var doc = dom.getDocument(boundaryPosition.node);
            var workingNode, childNodes, workingRange = getBody(doc).createTextRange();
            var nodeIsDataNode = isCharacterDataNode(boundaryPosition.node);

            if (nodeIsDataNode) {
                boundaryNode = boundaryPosition.node;
                boundaryParent = boundaryNode.parentNode;
            } else {
                childNodes = boundaryPosition.node.childNodes;
                boundaryNode = (boundaryOffset < childNodes.length) ? childNodes[boundaryOffset] : null;
                boundaryParent = boundaryPosition.node;
            }

            // Position the range immediately before the node containing the boundary
            workingNode = doc.createElement("span");

            // Making the working element non-empty element persuades IE to consider the TextRange boundary to be within the
            // element rather than immediately before or after it
            workingNode.innerHTML = "&#feff;";

            // insertBefore is supposed to work like appendChild if the second parameter is null. However, a bug report
            // for IERange suggests that it can crash the browser: http://code.google.com/p/ierange/issues/detail?id=12
            if (boundaryNode) {
                boundaryParent.insertBefore(workingNode, boundaryNode);
            } else {
                boundaryParent.appendChild(workingNode);
            }

            workingRange.moveToElementText(workingNode);
            workingRange.collapse(!isStart);

            // Clean up
            boundaryParent.removeChild(workingNode);

            // Move the working range to the text offset, if required
            if (nodeIsDataNode) {
                workingRange[isStart ? "moveStart" : "moveEnd"]("character", boundaryOffset);
            }

            return workingRange;
        };

        /*------------------------------------------------------------------------------------------------------------*/

        // This is a wrapper around a TextRange, providing full DOM Range functionality using rangy's DomRange as a
        // prototype

        WrappedTextRange = function(textRange) {
            this.textRange = textRange;
            this.refresh();
        };

        WrappedTextRange.prototype = new DomRange(document);

        WrappedTextRange.prototype.refresh = function() {
            var start, end, startBoundary;

            // TextRange's parentElement() method cannot be trusted. getTextRangeContainerElement() works around that.
            var rangeContainerElement = getTextRangeContainerElement(this.textRange);

            if (textRangeIsCollapsed(this.textRange)) {
                end = start = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, true,
                    true).boundaryPosition;
            } else {
                startBoundary = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, true, false);
                start = startBoundary.boundaryPosition;

                // An optimization used here is that if the start and end boundaries have the same parent element, the
                // search scope for the end boundary can be limited to exclude the portion of the element that precedes
                // the start boundary
                end = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, false, false,
                    startBoundary.nodeInfo).boundaryPosition;
            }

            this.setStart(start.node, start.offset);
            this.setEnd(end.node, end.offset);
        };

        WrappedTextRange.prototype.getName = function() {
            return "WrappedTextRange";
        };

        DomRange.copyComparisonConstants(WrappedTextRange);

        WrappedTextRange.rangeToTextRange = function(range) {
            if (range.collapsed) {
                return createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true);
            } else {
                var startRange = createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true);
                var endRange = createBoundaryTextRange(new DomPosition(range.endContainer, range.endOffset), false);
                var textRange = getBody( DomRange.getRangeDocument(range) ).createTextRange();
                textRange.setEndPoint("StartToStart", startRange);
                textRange.setEndPoint("EndToEnd", endRange);
                return textRange;
            }
        };

        api.WrappedTextRange = WrappedTextRange;

        // IE 9 and above have both implementations and Rangy makes both available. The next few lines sets which
        // implementation to use by default.
        if (!api.features.implementsDomRange || api.config.preferTextRange) {
            // Add WrappedTextRange as the Range property of the global object to allow expression like Range.END_TO_END to work
            var globalObj = (function() { return this; })();
            if (typeof globalObj.Range == "undefined") {
                globalObj.Range = WrappedTextRange;
            }

            api.createNativeRange = function(doc) {
                doc = getContentDocument(doc, module, "createNativeRange");
                return getBody(doc).createTextRange();
            };

            api.WrappedRange = WrappedTextRange;
        }
    }

    api.createRange = function(doc) {
        doc = getContentDocument(doc, module, "createRange");
        return new api.WrappedRange(api.createNativeRange(doc));
    };

    api.createRangyRange = function(doc) {
        doc = getContentDocument(doc, module, "createRangyRange");
        return new DomRange(doc);
    };

    api.createIframeRange = function(iframeEl) {
        module.deprecationNotice("createIframeRange()", "createRange(iframeEl)");
        return api.createRange(iframeEl);
    };

    api.createIframeRangyRange = function(iframeEl) {
        module.deprecationNotice("createIframeRangyRange()", "createRangyRange(iframeEl)");
        return api.createRangyRange(iframeEl);
    };

    api.addCreateMissingNativeApiListener(function(win) {
        var doc = win.document;
        if (typeof doc.createRange == "undefined") {
            doc.createRange = function() {
                return api.createRange(doc);
            };
        }
        doc = win = null;
    });
});
// This module creates a selection object wrapper that conforms as closely as possible to the Selection specification
// in the HTML Editing spec (http://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#selections)
rangy.createCoreModule("WrappedSelection", ["DomRange", "WrappedRange"], function(api, module) {
    api.config.checkSelectionRanges = true;

    var BOOLEAN = "boolean";
    var NUMBER = "number";
    var dom = api.dom;
    var util = api.util;
    var isHostMethod = util.isHostMethod;
    var DomRange = api.DomRange;
    var WrappedRange = api.WrappedRange;
    var DOMException = api.DOMException;
    var DomPosition = dom.DomPosition;
    var getNativeSelection;
    var selectionIsCollapsed;
    var features = api.features;
    var CONTROL = "Control";
    var getDocument = dom.getDocument;
    var getBody = dom.getBody;
    var rangesEqual = DomRange.rangesEqual;


    // Utility function to support direction parameters in the API that may be a string ("backward" or "forward") or a
    // Boolean (true for backwards).
    function isDirectionBackward(dir) {
        return (typeof dir == "string") ? /^backward(s)?$/i.test(dir) : !!dir;
    }

    function getWindow(win, methodName) {
        if (!win) {
            return window;
        } else if (dom.isWindow(win)) {
            return win;
        } else if (win instanceof WrappedSelection) {
            return win.win;
        } else {
            var doc = dom.getContentDocument(win, module, methodName);
            return dom.getWindow(doc);
        }
    }

    function getWinSelection(winParam) {
        return getWindow(winParam, "getWinSelection").getSelection();
    }

    function getDocSelection(winParam) {
        return getWindow(winParam, "getDocSelection").document.selection;
    }

    function winSelectionIsBackward(sel) {
        var backward = false;
        if (sel.anchorNode) {
            backward = (dom.comparePoints(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset) == 1);
        }
        return backward;
    }

    // Test for the Range/TextRange and Selection features required
    // Test for ability to retrieve selection
    var implementsWinGetSelection = isHostMethod(window, "getSelection"),
        implementsDocSelection = util.isHostObject(document, "selection");

    features.implementsWinGetSelection = implementsWinGetSelection;
    features.implementsDocSelection = implementsDocSelection;

    var useDocumentSelection = implementsDocSelection && (!implementsWinGetSelection || api.config.preferTextRange);

    if (useDocumentSelection) {
        getNativeSelection = getDocSelection;
        api.isSelectionValid = function(winParam) {
            var doc = getWindow(winParam, "isSelectionValid").document, nativeSel = doc.selection;

            // Check whether the selection TextRange is actually contained within the correct document
            return (nativeSel.type != "None" || getDocument(nativeSel.createRange().parentElement()) == doc);
        };
    } else if (implementsWinGetSelection) {
        getNativeSelection = getWinSelection;
        api.isSelectionValid = function() {
            return true;
        };
    } else {
        module.fail("Neither document.selection or window.getSelection() detected.");
    }

    api.getNativeSelection = getNativeSelection;

    var testSelection = getNativeSelection();
    var testRange = api.createNativeRange(document);
    var body = getBody(document);

    // Obtaining a range from a selection
    var selectionHasAnchorAndFocus = util.areHostProperties(testSelection,
        ["anchorNode", "focusNode", "anchorOffset", "focusOffset"]);

    features.selectionHasAnchorAndFocus = selectionHasAnchorAndFocus;

    // Test for existence of native selection extend() method
    var selectionHasExtend = isHostMethod(testSelection, "extend");
    features.selectionHasExtend = selectionHasExtend;

    // Test if rangeCount exists
    var selectionHasRangeCount = (typeof testSelection.rangeCount == NUMBER);
    features.selectionHasRangeCount = selectionHasRangeCount;

    var selectionSupportsMultipleRanges = false;
    var collapsedNonEditableSelectionsSupported = true;

    var addRangeBackwardToNative = selectionHasExtend ?
        function(nativeSelection, range) {
            var doc = DomRange.getRangeDocument(range);
            var endRange = api.createRange(doc);
            endRange.collapseToPoint(range.endContainer, range.endOffset);
            nativeSelection.addRange(getNativeRange(endRange));
            nativeSelection.extend(range.startContainer, range.startOffset);
        } : null;

    if (util.areHostMethods(testSelection, ["addRange", "getRangeAt", "removeAllRanges"]) &&
            typeof testSelection.rangeCount == NUMBER && features.implementsDomRange) {

        (function() {
            // Previously an iframe was used but this caused problems in some circumstances in IE, so tests are
            // performed on the current document's selection. See issue 109.

            // Note also that if a selection previously existed, it is wiped by these tests. This should usually be fine
            // because initialization usually happens when the document loads, but could be a problem for a script that
            // loads and initializes Rangy later. If anyone complains, code could be added to save and restore the
            // selection.
            var sel = window.getSelection();
            if (sel) {
                // Store the current selection
                var originalSelectionRangeCount = sel.rangeCount;
                var selectionHasMultipleRanges = (originalSelectionRangeCount > 1);
                var originalSelectionRanges = [];
                var originalSelectionBackward = winSelectionIsBackward(sel);
                for (var i = 0; i < originalSelectionRangeCount; ++i) {
                    originalSelectionRanges[i] = sel.getRangeAt(i);
                }

                // Create some test elements
                var body = getBody(document);
                var testEl = body.appendChild( document.createElement("div") );
                testEl.contentEditable = "false";
                var textNode = testEl.appendChild( document.createTextNode("\u00a0\u00a0\u00a0") );

                // Test whether the native selection will allow a collapsed selection within a non-editable element
				if (navigator.userAgent.toLowerCase().indexOf('chrome') != -1)
				{
					collapsedNonEditableSelectionsSupported = false;
					selectionSupportsMultipleRanges = false;
				}
				else
				{
					var r1 = document.createRange();
					r1.setStart(textNode, 1);
					r1.collapse(true);
					sel.addRange(r1);
					collapsedNonEditableSelectionsSupported = (sel.rangeCount == 1);
					sel.removeAllRanges();

					// Test whether the native selection is capable of supporting multiple ranges
					var r2 = r1.cloneRange();
					r1.setStart(textNode, 0);
					r2.setEnd(textNode, 3);
					r2.setStart(textNode, 2);
					sel.addRange(r1);
					sel.addRange(r2);
					selectionSupportsMultipleRanges = (sel.rangeCount == 2);
				}

                // Clean up
                body.removeChild(testEl);
                sel.removeAllRanges();

                for (i = 0; i < originalSelectionRangeCount; ++i) {
                    if (i == 0 && originalSelectionBackward) {
                        if (addRangeBackwardToNative) {
                            addRangeBackwardToNative(sel, originalSelectionRanges[i]);
                        } else {
                            api.warn("Rangy initialization: original selection was backwards but selection has been restored forwards because browser does not support Selection.extend");
                            sel.addRange(originalSelectionRanges[i])
                        }
                    } else {
                        sel.addRange(originalSelectionRanges[i])
                    }
                }
            }
        })();
    }

    features.selectionSupportsMultipleRanges = selectionSupportsMultipleRanges;
    features.collapsedNonEditableSelectionsSupported = collapsedNonEditableSelectionsSupported;

    // ControlRanges
    var implementsControlRange = false, testControlRange;

    if (body && isHostMethod(body, "createControlRange")) {
        testControlRange = body.createControlRange();
        if (util.areHostProperties(testControlRange, ["item", "add"])) {
            implementsControlRange = true;
        }
    }
    features.implementsControlRange = implementsControlRange;

    // Selection collapsedness
    if (selectionHasAnchorAndFocus) {
        selectionIsCollapsed = function(sel) {
            return sel.anchorNode === sel.focusNode && sel.anchorOffset === sel.focusOffset;
        };
    } else {
        selectionIsCollapsed = function(sel) {
            return sel.rangeCount ? sel.getRangeAt(sel.rangeCount - 1).collapsed : false;
        };
    }

    function updateAnchorAndFocusFromRange(sel, range, backward) {
        var anchorPrefix = backward ? "end" : "start", focusPrefix = backward ? "start" : "end";
        sel.anchorNode = range[anchorPrefix + "Container"];
        sel.anchorOffset = range[anchorPrefix + "Offset"];
        sel.focusNode = range[focusPrefix + "Container"];
        sel.focusOffset = range[focusPrefix + "Offset"];
    }

    function updateAnchorAndFocusFromNativeSelection(sel) {
        var nativeSel = sel.nativeSelection;
        sel.anchorNode = nativeSel.anchorNode;
        sel.anchorOffset = nativeSel.anchorOffset;
        sel.focusNode = nativeSel.focusNode;
        sel.focusOffset = nativeSel.focusOffset;
    }

    function updateEmptySelection(sel) {
        sel.anchorNode = sel.focusNode = null;
        sel.anchorOffset = sel.focusOffset = 0;
        sel.rangeCount = 0;
        sel.isCollapsed = true;
        sel._ranges.length = 0;
    }

    function getNativeRange(range) {
        var nativeRange;
        if (range instanceof DomRange) {
            nativeRange = api.createNativeRange(range.getDocument());
            nativeRange.setEnd(range.endContainer, range.endOffset);
            nativeRange.setStart(range.startContainer, range.startOffset);
        } else if (range instanceof WrappedRange) {
            nativeRange = range.nativeRange;
        } else if (features.implementsDomRange && (range instanceof dom.getWindow(range.startContainer).Range)) {
            nativeRange = range;
        }
        return nativeRange;
    }

    function rangeContainsSingleElement(rangeNodes) {
        if (!rangeNodes.length || rangeNodes[0].nodeType != 1) {
            return false;
        }
        for (var i = 1, len = rangeNodes.length; i < len; ++i) {
            if (!dom.isAncestorOf(rangeNodes[0], rangeNodes[i])) {
                return false;
            }
        }
        return true;
    }

    function getSingleElementFromRange(range) {
        var nodes = range.getNodes();
        if (!rangeContainsSingleElement(nodes)) {
            throw module.createError("getSingleElementFromRange: range " + range.inspect() + " did not consist of a single element");
        }
        return nodes[0];
    }

    // Simple, quick test which only needs to distinguish between a TextRange and a ControlRange
    function isTextRange(range) {
        return !!range && typeof range.text != "undefined";
    }

    function updateFromTextRange(sel, range) {
        // Create a Range from the selected TextRange
        var wrappedRange = new WrappedRange(range);
        sel._ranges = [wrappedRange];

        updateAnchorAndFocusFromRange(sel, wrappedRange, false);
        sel.rangeCount = 1;
        sel.isCollapsed = wrappedRange.collapsed;
    }

    function updateControlSelection(sel) {
        // Update the wrapped selection based on what's now in the native selection
        sel._ranges.length = 0;
        if (sel.docSelection.type == "None") {
            updateEmptySelection(sel);
        } else {
            var controlRange = sel.docSelection.createRange();
            if (isTextRange(controlRange)) {
                // This case (where the selection type is "Control" and calling createRange() on the selection returns
                // a TextRange) can happen in IE 9. It happens, for example, when all elements in the selected
                // ControlRange have been removed from the ControlRange and removed from the document.
                updateFromTextRange(sel, controlRange);
            } else {
                sel.rangeCount = controlRange.length;
                var range, doc = getDocument(controlRange.item(0));
                for (var i = 0; i < sel.rangeCount; ++i) {
                    range = api.createRange(doc);
                    range.selectNode(controlRange.item(i));
                    sel._ranges.push(range);
                }
                sel.isCollapsed = sel.rangeCount == 1 && sel._ranges[0].collapsed;
                updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], false);
            }
        }
    }

    function addRangeToControlSelection(sel, range) {
        var controlRange = sel.docSelection.createRange();
        var rangeElement = getSingleElementFromRange(range);

        // Create a new ControlRange containing all the elements in the selected ControlRange plus the element
        // contained by the supplied range
        var doc = getDocument(controlRange.item(0));
        var newControlRange = getBody(doc).createControlRange();
        for (var i = 0, len = controlRange.length; i < len; ++i) {
            newControlRange.add(controlRange.item(i));
        }
        try {
            newControlRange.add(rangeElement);
        } catch (ex) {
            throw module.createError("addRange(): Element within the specified Range could not be added to control selection (does it have layout?)");
        }
        newControlRange.select();

        // Update the wrapped selection based on what's now in the native selection
        updateControlSelection(sel);
    }

    var getSelectionRangeAt;

    if (isHostMethod(testSelection, "getRangeAt")) {
        // try/catch is present because getRangeAt() must have thrown an error in some browser and some situation.
        // Unfortunately, I didn't write a comment about the specifics and am now scared to take it out. Let that be a
        // lesson to us all, especially me.
        getSelectionRangeAt = function(sel, index) {
            try {
                return sel.getRangeAt(index);
            } catch (ex) {
                return null;
            }
        };
    } else if (selectionHasAnchorAndFocus) {
        getSelectionRangeAt = function(sel) {
            var doc = getDocument(sel.anchorNode);
            var range = api.createRange(doc);
            range.setStartAndEnd(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset);

            // Handle the case when the selection was selected backwards (from the end to the start in the
            // document)
            if (range.collapsed !== this.isCollapsed) {
                range.setStartAndEnd(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset);
            }

            return range;
        };
    }

    function WrappedSelection(selection, docSelection, win) {
        this.nativeSelection = selection;
        this.docSelection = docSelection;
        this._ranges = [];
        this.win = win;
        this.refresh();
    }

    WrappedSelection.prototype = api.selectionPrototype;

    function deleteProperties(sel) {
        sel.win = sel.anchorNode = sel.focusNode = sel._ranges = null;
        sel.rangeCount = sel.anchorOffset = sel.focusOffset = 0;
        sel.detached = true;
    }

    var cachedRangySelections = [];

    function actOnCachedSelection(win, action) {
        var i = cachedRangySelections.length, cached, sel;
        while (i--) {
            cached = cachedRangySelections[i];
            sel = cached.selection;
            if (action == "deleteAll") {
                deleteProperties(sel);
            } else if (cached.win == win) {
                if (action == "delete") {
                    cachedRangySelections.splice(i, 1);
                    return true;
                } else {
                    return sel;
                }
            }
        }
        if (action == "deleteAll") {
            cachedRangySelections.length = 0;
        }
        return null;
    }

    var getSelection = function(win) {
        // Check if the parameter is a Rangy Selection object
        if (win && win instanceof WrappedSelection) {
            win.refresh();
            return win;
        }

        win = getWindow(win, "getNativeSelection");

        var sel = actOnCachedSelection(win);
        var nativeSel = getNativeSelection(win), docSel = implementsDocSelection ? getDocSelection(win) : null;
        if (sel) {
            sel.nativeSelection = nativeSel;
            sel.docSelection = docSel;
            sel.refresh();
        } else {
            sel = new WrappedSelection(nativeSel, docSel, win);
            cachedRangySelections.push( { win: win, selection: sel } );
        }
        return sel;
    };

    api.getSelection = getSelection;

    api.getIframeSelection = function(iframeEl) {
        module.deprecationNotice("getIframeSelection()", "getSelection(iframeEl)");
        return api.getSelection(dom.getIframeWindow(iframeEl));
    };

    var selProto = WrappedSelection.prototype;

    function createControlSelection(sel, ranges) {
        // Ensure that the selection becomes of type "Control"
        var doc = getDocument(ranges[0].startContainer);
        var controlRange = getBody(doc).createControlRange();
        for (var i = 0, el, len = ranges.length; i < len; ++i) {
            el = getSingleElementFromRange(ranges[i]);
            try {
                controlRange.add(el);
            } catch (ex) {
                throw module.createError("setRanges(): Element within one of the specified Ranges could not be added to control selection (does it have layout?)");
            }
        }
        controlRange.select();

        // Update the wrapped selection based on what's now in the native selection
        updateControlSelection(sel);
    }

    // Selecting a range
    if (!useDocumentSelection && selectionHasAnchorAndFocus && util.areHostMethods(testSelection, ["removeAllRanges", "addRange"])) {
        selProto.removeAllRanges = function() {
            this.nativeSelection.removeAllRanges();
            updateEmptySelection(this);
        };

        var addRangeBackward = function(sel, range) {
            addRangeBackwardToNative(sel.nativeSelection, range);
            sel.refresh();
        };

        if (selectionHasRangeCount) {
            selProto.addRange = function(range, direction) {
                if (implementsControlRange && implementsDocSelection && this.docSelection.type == CONTROL) {
                    addRangeToControlSelection(this, range);
                } else {
                    if (isDirectionBackward(direction) && selectionHasExtend) {
                        addRangeBackward(this, range);
                    } else {
                        var previousRangeCount;
                        if (selectionSupportsMultipleRanges) {
                            previousRangeCount = this.rangeCount;
                        } else {
                            this.removeAllRanges();
                            previousRangeCount = 0;
                        }
                        // Clone the native range so that changing the selected range does not affect the selection.
                        // This is contrary to the spec but is the only way to achieve consistency between browsers. See
                        // issue 80.
                        this.nativeSelection.addRange(getNativeRange(range).cloneRange());

                        // Check whether adding the range was successful
                        this.rangeCount = this.nativeSelection.rangeCount;

                        if (this.rangeCount == previousRangeCount + 1) {
                            // The range was added successfully

                            // Check whether the range that we added to the selection is reflected in the last range extracted from
                            // the selection
                            if (api.config.checkSelectionRanges) {
                                var nativeRange = getSelectionRangeAt(this.nativeSelection, this.rangeCount - 1);
                                if (nativeRange && !rangesEqual(nativeRange, range)) {
                                    // Happens in WebKit with, for example, a selection placed at the start of a text node
                                    range = new WrappedRange(nativeRange);
                                }
                            }
                            this._ranges[this.rangeCount - 1] = range;
                            updateAnchorAndFocusFromRange(this, range, selectionIsBackward(this.nativeSelection));
                            this.isCollapsed = selectionIsCollapsed(this);
                        } else {
                            // The range was not added successfully. The simplest thing is to refresh
                            this.refresh();
                        }
                    }
                }
            };
        } else {
            selProto.addRange = function(range, direction) {
                if (isDirectionBackward(direction) && selectionHasExtend) {
                    addRangeBackward(this, range);
                } else {
                    this.nativeSelection.addRange(getNativeRange(range));
                    this.refresh();
                }
            };
        }

        selProto.setRanges = function(ranges) {
            if (implementsControlRange && ranges.length > 1) {
                createControlSelection(this, ranges);
            } else {
                this.removeAllRanges();
                for (var i = 0, len = ranges.length; i < len; ++i) {
                    this.addRange(ranges[i]);
                }
            }
        };
    } else if (isHostMethod(testSelection, "empty") && isHostMethod(testRange, "select") &&
               implementsControlRange && useDocumentSelection) {

        selProto.removeAllRanges = function() {
            // Added try/catch as fix for issue #21
            try {
                this.docSelection.empty();

                // Check for empty() not working (issue #24)
                if (this.docSelection.type != "None") {
                    // Work around failure to empty a control selection by instead selecting a TextRange and then
                    // calling empty()
                    var doc;
                    if (this.anchorNode) {
                        doc = getDocument(this.anchorNode);
                    } else if (this.docSelection.type == CONTROL) {
                        var controlRange = this.docSelection.createRange();
                        if (controlRange.length) {
                            doc = getDocument( controlRange.item(0) );
                        }
                    }
                    if (doc) {
                        var textRange = getBody(doc).createTextRange();
                        textRange.select();
                        this.docSelection.empty();
                    }
                }
            } catch(ex) {}
            updateEmptySelection(this);
        };

        selProto.addRange = function(range) {
            if (this.docSelection.type == CONTROL) {
                addRangeToControlSelection(this, range);
            } else {
                api.WrappedTextRange.rangeToTextRange(range).select();
                this._ranges[0] = range;
                this.rangeCount = 1;
                this.isCollapsed = this._ranges[0].collapsed;
                updateAnchorAndFocusFromRange(this, range, false);
            }
        };

        selProto.setRanges = function(ranges) {
            this.removeAllRanges();
            var rangeCount = ranges.length;
            if (rangeCount > 1) {
                createControlSelection(this, ranges);
            } else if (rangeCount) {
                this.addRange(ranges[0]);
            }
        };
    } else {
        module.fail("No means of selecting a Range or TextRange was found");
        return false;
    }

    selProto.getRangeAt = function(index) {
        if (index < 0 || index >= this.rangeCount) {
            throw new DOMException("INDEX_SIZE_ERR");
        } else {
            // Clone the range to preserve selection-range independence. See issue 80.
            return this._ranges[index].cloneRange();
        }
    };

    var refreshSelection;

    if (useDocumentSelection) {
        refreshSelection = function(sel) {
            var range;
            if (api.isSelectionValid(sel.win)) {
                range = sel.docSelection.createRange();
            } else {
                range = getBody(sel.win.document).createTextRange();
                range.collapse(true);
            }

            if (sel.docSelection.type == CONTROL) {
                updateControlSelection(sel);
            } else if (isTextRange(range)) {
                updateFromTextRange(sel, range);
            } else {
                updateEmptySelection(sel);
            }
        };
    } else if (isHostMethod(testSelection, "getRangeAt") && typeof testSelection.rangeCount == NUMBER) {
        refreshSelection = function(sel) {
            if (implementsControlRange && implementsDocSelection && sel.docSelection.type == CONTROL) {
                updateControlSelection(sel);
            } else {
                sel._ranges.length = sel.rangeCount = sel.nativeSelection.rangeCount;
                if (sel.rangeCount) {
                    for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                        sel._ranges[i] = new api.WrappedRange(sel.nativeSelection.getRangeAt(i));
                    }
                    updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], selectionIsBackward(sel.nativeSelection));
                    sel.isCollapsed = selectionIsCollapsed(sel);
                } else {
                    updateEmptySelection(sel);
                }
            }
        };
    } else if (selectionHasAnchorAndFocus && typeof testSelection.isCollapsed == BOOLEAN && typeof testRange.collapsed == BOOLEAN && features.implementsDomRange) {
        refreshSelection = function(sel) {
            var range, nativeSel = sel.nativeSelection;
            if (nativeSel.anchorNode) {
                range = getSelectionRangeAt(nativeSel, 0);
                sel._ranges = [range];
                sel.rangeCount = 1;
                updateAnchorAndFocusFromNativeSelection(sel);
                sel.isCollapsed = selectionIsCollapsed(sel);
            } else {
                updateEmptySelection(sel);
            }
        };
    } else {
        module.fail("No means of obtaining a Range or TextRange from the user's selection was found");
        return false;
    }

    selProto.refresh = function(checkForChanges) {
        var oldRanges = checkForChanges ? this._ranges.slice(0) : null;
        var oldAnchorNode = this.anchorNode, oldAnchorOffset = this.anchorOffset;

        refreshSelection(this);
        if (checkForChanges) {
            // Check the range count first
            var i = oldRanges.length;
            if (i != this._ranges.length) {
                return true;
            }

            // Now check the direction. Checking the anchor position is the same is enough since we're checking all the
            // ranges after this
            if (this.anchorNode != oldAnchorNode || this.anchorOffset != oldAnchorOffset) {
                return true;
            }

            // Finally, compare each range in turn
            while (i--) {
                if (!rangesEqual(oldRanges[i], this._ranges[i])) {
                    return true;
                }
            }
            return false;
        }
    };

    // Removal of a single range
    var removeRangeManually = function(sel, range) {
        var ranges = sel.getAllRanges();
        sel.removeAllRanges();
        for (var i = 0, len = ranges.length; i < len; ++i) {
            if (!rangesEqual(range, ranges[i])) {
                sel.addRange(ranges[i]);
            }
        }
        if (!sel.rangeCount) {
            updateEmptySelection(sel);
        }
    };

    if (implementsControlRange) {
        selProto.removeRange = function(range) {
            if (this.docSelection.type == CONTROL) {
                var controlRange = this.docSelection.createRange();
                var rangeElement = getSingleElementFromRange(range);

                // Create a new ControlRange containing all the elements in the selected ControlRange minus the
                // element contained by the supplied range
                var doc = getDocument(controlRange.item(0));
                var newControlRange = getBody(doc).createControlRange();
                var el, removed = false;
                for (var i = 0, len = controlRange.length; i < len; ++i) {
                    el = controlRange.item(i);
                    if (el !== rangeElement || removed) {
                        newControlRange.add(controlRange.item(i));
                    } else {
                        removed = true;
                    }
                }
                newControlRange.select();

                // Update the wrapped selection based on what's now in the native selection
                updateControlSelection(this);
            } else {
                removeRangeManually(this, range);
            }
        };
    } else {
        selProto.removeRange = function(range) {
            removeRangeManually(this, range);
        };
    }

    // Detecting if a selection is backward
    var selectionIsBackward;
    if (!useDocumentSelection && selectionHasAnchorAndFocus && features.implementsDomRange) {
        selectionIsBackward = winSelectionIsBackward;

        selProto.isBackward = function() {
            return selectionIsBackward(this);
        };
    } else {
        selectionIsBackward = selProto.isBackward = function() {
            return false;
        };
    }

    // Create an alias for backwards compatibility. From 1.3, everything is "backward" rather than "backwards"
    selProto.isBackwards = selProto.isBackward;

    // Selection stringifier
    // This is conformant to the old HTML5 selections draft spec but differs from WebKit and Mozilla's implementation.
    // The current spec does not yet define this method.
    selProto.toString = function() {
        var rangeTexts = [];
        for (var i = 0, len = this.rangeCount; i < len; ++i) {
            rangeTexts[i] = "" + this._ranges[i];
        }
        return rangeTexts.join("");
    };

    function assertNodeInSameDocument(sel, node) {
        if (sel.win.document != getDocument(node)) {
            throw new DOMException("WRONG_DOCUMENT_ERR");
        }
    }

    // No current browser conforms fully to the spec for this method, so Rangy's own method is always used
    selProto.collapse = function(node, offset) {
        assertNodeInSameDocument(this, node);
        var range = api.createRange(node);
        range.collapseToPoint(node, offset);
        this.setSingleRange(range);
        this.isCollapsed = true;
    };

    selProto.collapseToStart = function() {
        if (this.rangeCount) {
            var range = this._ranges[0];
            this.collapse(range.startContainer, range.startOffset);
        } else {
            throw new DOMException("INVALID_STATE_ERR");
        }
    };

    selProto.collapseToEnd = function() {
        if (this.rangeCount) {
            var range = this._ranges[this.rangeCount - 1];
            this.collapse(range.endContainer, range.endOffset);
        } else {
            throw new DOMException("INVALID_STATE_ERR");
        }
    };

    // The spec is very specific on how selectAllChildren should be implemented so the native implementation is
    // never used by Rangy.
    selProto.selectAllChildren = function(node) {
        assertNodeInSameDocument(this, node);
        var range = api.createRange(node);
        range.selectNodeContents(node);
        this.setSingleRange(range);
    };

    selProto.deleteFromDocument = function() {
        // Sepcial behaviour required for IE's control selections
        if (implementsControlRange && implementsDocSelection && this.docSelection.type == CONTROL) {
            var controlRange = this.docSelection.createRange();
            var element;
            while (controlRange.length) {
                element = controlRange.item(0);
                controlRange.remove(element);
                element.parentNode.removeChild(element);
            }
            this.refresh();
        } else if (this.rangeCount) {
            var ranges = this.getAllRanges();
            if (ranges.length) {
                this.removeAllRanges();
                for (var i = 0, len = ranges.length; i < len; ++i) {
                    ranges[i].deleteContents();
                }
                // The spec says nothing about what the selection should contain after calling deleteContents on each
                // range. Firefox moves the selection to where the final selected range was, so we emulate that
                this.addRange(ranges[len - 1]);
            }
        }
    };

    // The following are non-standard extensions
    selProto.eachRange = function(func, returnValue) {
        for (var i = 0, len = this._ranges.length; i < len; ++i) {
            if ( func( this.getRangeAt(i) ) ) {
                return returnValue;
            }
        }
    };

    selProto.getAllRanges = function() {
        var ranges = [];
        this.eachRange(function(range) {
            ranges.push(range);
        });
        return ranges;
    };

    selProto.setSingleRange = function(range, direction) {
        this.removeAllRanges();
        this.addRange(range, direction);
    };

    selProto.callMethodOnEachRange = function(methodName, params) {
        var results = [];
        this.eachRange( function(range) {
            results.push( range[methodName].apply(range, params) );
        } );
        return results;
    };

    function createStartOrEndSetter(isStart) {
        return function(node, offset) {
            var range;
            if (this.rangeCount) {
                range = this.getRangeAt(0);
                range["set" + (isStart ? "Start" : "End")](node, offset);
            } else {
                range = api.createRange(this.win.document);
                range.setStartAndEnd(node, offset);
            }
            this.setSingleRange(range, this.isBackward());
        };
    }

    selProto.setStart = createStartOrEndSetter(true);
    selProto.setEnd = createStartOrEndSetter(false);

    // Add select() method to Range prototype. Any existing selection will be removed.
    api.rangePrototype.select = function(direction) {
        getSelection( this.getDocument() ).setSingleRange(this, direction);
    };

    selProto.changeEachRange = function(func) {
        var ranges = [];
        var backward = this.isBackward();

        this.eachRange(function(range) {
            func(range);
            ranges.push(range);
        });

        this.removeAllRanges();
        if (backward && ranges.length == 1) {
            this.addRange(ranges[0], "backward");
        } else {
            this.setRanges(ranges);
        }
    };

    selProto.containsNode = function(node, allowPartial) {
        return this.eachRange( function(range) {
            return range.containsNode(node, allowPartial);
        }, true );
    };

    selProto.getBookmark = function(containerNode) {
        return {
            backward: this.isBackward(),
            rangeBookmarks: this.callMethodOnEachRange("getBookmark", [containerNode])
        };
    };

    selProto.moveToBookmark = function(bookmark) {
        var selRanges = [];
        for (var i = 0, rangeBookmark, range; rangeBookmark = bookmark.rangeBookmarks[i++]; ) {
            range = api.createRange(this.win);
            range.moveToBookmark(rangeBookmark);
            selRanges.push(range);
        }
        if (bookmark.backward) {
            this.setSingleRange(selRanges[0], "backward");
        } else {
            this.setRanges(selRanges);
        }
    };

    selProto.toHtml = function() {
        return this.callMethodOnEachRange("toHtml").join("");
    };

    function inspect(sel) {
        var rangeInspects = [];
        var anchor = new DomPosition(sel.anchorNode, sel.anchorOffset);
        var focus = new DomPosition(sel.focusNode, sel.focusOffset);
        var name = (typeof sel.getName == "function") ? sel.getName() : "Selection";

        if (typeof sel.rangeCount != "undefined") {
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                rangeInspects[i] = DomRange.inspect(sel.getRangeAt(i));
            }
        }
        return "[" + name + "(Ranges: " + rangeInspects.join(", ") +
                ")(anchor: " + anchor.inspect() + ", focus: " + focus.inspect() + "]";
    }

    selProto.getName = function() {
        return "WrappedSelection";
    };

    selProto.inspect = function() {
        return inspect(this);
    };

    selProto.detach = function() {
        actOnCachedSelection(this.win, "delete");
        deleteProperties(this);
    };

    WrappedSelection.detachAll = function() {
        actOnCachedSelection(null, "deleteAll");
    };

    WrappedSelection.inspect = inspect;
    WrappedSelection.isDirectionBackward = isDirectionBackward;

    api.Selection = WrappedSelection;

    api.selectionPrototype = selProto;

    api.addCreateMissingNativeApiListener(function(win) {
        if (typeof win.getSelection == "undefined") {
            win.getSelection = function() {
                return getSelection(win);
            };
        }
        win = null;
    });
});

/* End */
;
; /* Start:/bitrix/js/fileman/html_editor/html-actions.js*/
/**
 * Bitrix HTML Editor 3.0
 * Date: 24.04.13
 * Time: 4:23
 *
 * Commands class
 * Rich Text Query/Formatting Commands
 */
(function()
{
	function BXEditorActions(editor)
	{
		this.editor = editor;
		this.document = editor.sandbox.GetDocument();
		BX.addCustomEvent(this.editor, 'OnIframeReInit', BX.proxy(function(){this.document = this.editor.sandbox.GetDocument();}, this));
		this.actions = this.GetActionList();
		this.contentActionIndex = {
			removeFormat: 1,
			bold: 1,
			italic: 1,
			underline: 1,
			strikeout: 1,
			fontSize: 1,
			foreColor: 1,
			backgroundColor: 1,
			formatInline: 1,
			formatBlock: 1,
			createLink: 1,
			insertHTML: 1,
			insertImage: 1,
			insertLineBreak: 1,
			removeLink: 1,
			insertOrderedList: 1,
			insertUnorderedList: 1,
			align: 1,
			indent: 1,
			outdent: 1,
			formatStyle: 1,
			fontFamily: 1,
			universalFormatStyle: 1,
			quote: 1,
			code: 1,
			sub: 1,
			sup: 1,
			insertSmile: 1
		};
	}

	BXEditorActions.prototype =
	{
		IsSupportedByBrowser: function(action)
		{
			// Following actions are supported but contain bugs in some browsers
			var
				isIe = BX.browser.IsIE() || BX.browser.IsIE10() || BX.browser.IsIE11(),
				arBuggyActions = {
					indent: isIe,
					outdent: isIe,
					formatBlock: isIe,
					insertUnorderedList: BX.browser.IsIE() || BX.browser.IsOpera(),
					insertOrderedList: BX.browser.IsIE() || BX.browser.IsOpera()
				},
				arSupportedActions = { // Firefox throws some errors for queryCommandSupported...
					insertHTML: BX.browser.IsFirefox()
				};

			if (!arBuggyActions[action])
			{
				// Firefox throws errors when invoking queryCommandSupported or queryCommandEnabled
				try {
					return this.document.queryCommandSupported(action);
				} catch(e1) {}

				try {
					return this.document.queryCommandEnabled(action);
				} catch(e2) {
					return !!arSupportedActions[action];
				}
			}
			return false;
		},

		IsSupported: function(action)
		{
			return !!this.actions[action];
		},

		IsContentAction: function(action)
		{
			return this.contentActionIndex[action];
		},

		Exec: function(action, value, bSilent)
		{
			var
				_this = this,
				oAction = this.actions[action],
				func = oAction && oAction.exec,
				isContentAction = this.IsContentAction(action),
				result = null;

			if (!bSilent)
			{
				this.editor.On("OnBeforeCommandExec", [isContentAction]);
			}

			if (isContentAction)
			{
				this.editor.Focus(false);
			}

			if (func)
			{
				result = func.apply(oAction, arguments);
			}
			else
			{
				try
				{
					result = this.document.execCommand(action, false, value);
				} catch(e){}
			}

			if (isContentAction)
			{
				setTimeout(function(){_this.editor.Focus(false);}, 1);
			}

			if (!bSilent)
			{
				this.editor.On("OnAfterCommandExec", [isContentAction]);
			}

			return result;
		},

		CheckState: function(action, value)
		{
			var
				oAction = this.actions[action],
				result = null;

			if (oAction && oAction.state)
			{
				result = oAction.state.apply(oAction, arguments);
			}
			else
			{
				try
				{
					result = this.document.queryCommandState(action);
				}
				catch(e)
				{
					result = false;
				}
			}
			return result;
		},

		/**
		 * Get the current command's value
		 *
		 * @param {String} command The command string which to check (eg. "formatBlock")
		 * @return {String} The command value
		 * @example
		 *    var currentBlockElement = commands.value("formatBlock");
		 */
		GetValue: function(command)
		{
			var
				obj = this.commands[command],
				method  = obj && obj.value;

			if (method)
			{
				return method.call(obj, this.composer, command);
			}
			else
			{
				try {
					// try/catch for buggy firefox
					return this.document.queryCommandValue(command);
				} catch(e) {
					return null;
				}
			}
		},

		GetActionList: function()
		{
			this.actions = {
				changeView: this.GetChangeView(),
				splitMode: this.GetChangeSplitMode(),
				fullscreen: this.GetFullscreen(),
				changeTemplate: this.GetChangeTemplate(),
				removeFormat: this.GetRemoveFormat(),

				// Format text
				bold: this.GetBold(),
				italic: this.GetItalic(),
				underline: this.GetUnderline(),
				strikeout: this.GetStrikeout(),
				// Size
				fontSize: this.GetFontSize(),
				// Color
				foreColor: this.GetForeColor(),
				backgroundColor: this.GetBackgroundColor(),
				//
				formatInline: this.GetFormatInline(),
				formatBlock: this.GetFormatBlock(),
				// Insert
				createLink: this.GetCreateLink(),
				insertHTML: this.GetInsertHTML(),
				insertImage: this.GetInsertImage(),
				insertLineBreak: this.GetInsertLineBreak(),
				insertTable: this.GetInsertTable(),
				removeLink: this.GetRemoveLink(),
				// Lists
				insertOrderedList: this.GetInsertList({bOrdered: true}),
				insertUnorderedList: this.GetInsertList({bOrdered: false}),
				align: this.GetAlign(),
				indent: this.GetIndent(),
				outdent: this.GetOutdent(),

				formatStyle: this.GetFormatStyle(),
				fontFamily: this.GetFontFamily(),
				universalFormatStyle: this.GetUniversalFormatStyle(),

				selectNode: this.GetSelectNode(),
				doUndo: this.GetUndoRedo(true),
				doRedo: this.GetUndoRedo(false),

				sub: this.GetSubSup('sub'),
				sup: this.GetSubSup('sup'),
				quote: this.GetQuote(),
				code: this.GetCode(),
				insertSmile: this.GetInsertSmile(),

				// Bbcodes actions
				formatBbCode: this.GetFormatBbCode()
			};

			this.editor.On("OnGetActionsList");

			return this.actions;
		},

		GetChangeView: function()
		{
			var _this = this;
			return {
				exec: function()
				{
					var value = arguments[1];
					if ({'code': 1, 'wysiwyg': 1, 'split': 1}[value])
						_this.editor.SetView(value)
				},

				state: function() {
					return false;
				},

				value: function() {}
			};
		},

		GetChangeSplitMode: function()
		{
			var _this = this;
			return {
				exec: function()
				{
					_this.editor.SetSplitMode(arguments[1] == 1);
				},

				state: function() {
					return _this.editor.GetSplitMode();
				},

				value: function() {}
			};
		},

		GetFullscreen: function()
		{
			var _this = this;
			return {
				exec: function()
				{
					_this.editor.Expand();
				},

				state: function()
				{
					return _this.editor.IsExpanded();
				},

				value: function() {}
			};
		},

		/**
		 * formatInline scenarios for tag "B" (| = caret, |foo| = selected text)
		 *
		 *   #1 caret in unformatted text:
		 *      abcdefg|
		 *   output:
		 *      abcdefg<b>|</b>
		 *
		 *   #2 unformatted text selected:
		 *      abc|deg|h
		 *   output:
		 *      abc<b>|deg|</b>h
		 *
		 *   #3 unformatted text selected across boundaries:
		 *      ab|c <span>defg|h</span>
		 *   output:
		 *      ab<b>|c </b><span><b>defg</b>|h</span>
		 *
		 *   #4 formatted text entirely selected
		 *      <b>|abc|</b>
		 *   output:
		 *      |abc|
		 *
		 *   #5 formatted text partially selected
		 *      <b>ab|c|</b>
		 *   output:
		 *      <b>ab</b>|c|
		 *
		 *   #6 formatted text selected across boundaries
		 *      <span>ab|c</span> <b>de|fgh</b>
		 *   output:
		 *      <span>ab|c</span> de|<b>fgh</b>
		 */
		GetFormatInline: function()
		{
			var
				_this = this,
				TAG_ALIAS = {
					strong: "b",
					em: "i",
					b: "strong",
					i: "em"
				},
				htmlApplier = {};

			function getKey(tagName, style, className)
			{
				var key = tagName + ":";
				if (className)
					key += className;
				if (style)
				{
					for (var i in style)
						if (style.hasOwnProperty(i))
							key += i + '=' + style[i] + ';';
				}
				return key;
			}

			function getStyler(tagName, style, className)
			{
				var key = getKey(tagName, style, className);
				if (!htmlApplier[key])
				{
					var alias = TAG_ALIAS[tagName];
					var tags = alias ? [tagName.toLowerCase(), alias.toLowerCase()] : [tagName.toLowerCase()];
					htmlApplier[key] = new _this.editor.HTMLStyler(_this.editor, tags, style, className, true);
				}
				return htmlApplier[key];
			}

			return {
				exec: function(command, value, tagName, arStyle, cssClass, params)
				{
					params = (!params || typeof params != 'object') ? {} : params;
					_this.editor.iframeView.Focus();
					var range = _this.editor.selection.GetRange();
					if (!range)
					{
						return false;
					}

					var applier = getStyler(tagName, arStyle, cssClass);

//					if (false && params.bSelectParentIfCollapsed && range.collapsed)
//					{
//						var parents = applier.IsAppliedToRange(range, false);
//						if (parents && parents[0])
//						{
//							//range = applier.SelectNode(range, parents[0]);
//							range = _this.editor.selection.SelectNode(parents[0]);
//						}
//					}

					if (params.bClear)
					{
						range = applier.UndoToRange(range, false);
					}
					else
					{
						range = applier.ToggleRange(range);
					}

					setTimeout(function()
					{
						_this.editor.selection.SetSelection(range);

						var lastCreatedNode = _this.editor.selection.GetSelectedNode();
						if (lastCreatedNode && lastCreatedNode.nodeType == 1)
						{
							_this.editor.lastCreatedId = Math.round(Math.random() * 1000000);
							lastCreatedNode.setAttribute('data-bx-last-created-id', _this.editor.lastCreatedId);
						}

					}, 10);
				},

				state: function(action, value, tagName, arStyle, cssClass)
				{
					var
						doc = _this.editor.GetIframeDoc(),
						aliasTagName = TAG_ALIAS[tagName] || tagName;

					// Check whether the document contains a node with the desired tagName
					if (
						!_this.editor.util.DocumentHasTag(doc, tagName)
						&&
						(tagName != aliasTagName && !_this.editor.util.DocumentHasTag(doc, aliasTagName))
						)
					{
						return false;
					}

					var range = _this.editor.selection.GetRange();
					if (!range)
					{
						return false;
					}

					var applier = getStyler(tagName, arStyle, cssClass);
					return applier.IsAppliedToRange(range, false);
				},

				value: BX.DoNothing
			};
		},

		/*
		* TODO: 1. Clean useless spans when H1-H6 are created
		* */
		GetFormatBlock: function()
		{
			var
				_this = this,
				DEFAULT_NODE_NAME = "DIV",
				blockTags = _this.editor.GetBlockTags(),
				nestedBlockTags = _this.editor.NESTED_BLOCK_TAGS;

			/**
			 * Remove similiar classes (based on classRegExp)
			 * and add the desired class name
			 */
			function _addClass(element, className, classRegExp)
			{
				if (element.className)
				{
					_removeClass(element, classRegExp);
					element.className += " " + className;
				}
				else
				{
					element.className = className;
				}
			}

			function _removeClass(element, classRegExp)
			{
				element.className = element.className.replace(classRegExp, "");
			}

			/**
			 * Adds line breaks before and after the given node if the previous and next siblings
			 * aren't already causing a visual line break (block element or <br>)
			 */
			function addBrBeforeAndAfter(node)
			{
				var
					nextSibling = _this.editor.util.GetNextNotEmptySibling(node),
					previousSibling = _this.editor.util.GetPreviousNotEmptySibling(node);

				if (nextSibling && !isBrOrBlockElement(nextSibling))
				{
					node.parentNode.insertBefore(_this.document.createElement("BR"), nextSibling);
				}

				if (previousSibling && !isBrOrBlockElement(previousSibling))
				{
					node.parentNode.insertBefore(_this.document.createElement("BR"), node);
				}
			}

			// Removes line breaks before and after the given node
			function removeBrBeforeAndAfter(node)
			{
				var
					nextSibling = _this.editor.util.GetNextNotEmptySibling(node),
					previousSibling = _this.editor.util.GetPreviousNotEmptySibling(node);

				if (nextSibling && nextSibling.nodeName === "BR")
				{
					nextSibling.parentNode.removeChild(nextSibling);
				}

				if (previousSibling && previousSibling.nodeName === "BR")
				{
					previousSibling.parentNode.removeChild(previousSibling);
				}
			}

			function removeLastChildBr(node)
			{
				var lastChild = node.lastChild;
				if (lastChild && lastChild.nodeName === "BR")
				{
					lastChild.parentNode.removeChild(lastChild);
				}
			}

			function isBrOrBlockElement(element)
			{
				return element.nodeName === "BR" || _this.editor.util.IsBlockElement(element);
			}

			// Execute native query command
			function execNativeCommand(command, nodeName, className, style)
			{
				if (className || style)
				{
//					var eventListener = dom.observe(doc, "DOMNodeInserted", function(event)
//					{
//						var target = event.target,
//							displayStyle;
//						if (target.nodeType !== 1 /* element node */)
//							return;
//
//						displayStyle = dom.getStyle("display").from(target);
//						if (displayStyle.substr(0, 6) !== "inline")
//						{
//							// Make sure that only block elements receive the given class
//							target.className += " " + className;
//						}
//					});
				}
				_this.document.execCommand(command, false, nodeName);
//				if (eventListener)
//					eventListener.stop();
			}

			function _hasClasses(element)
			{
				return !element.className || BX.util.trim(element.className) === '';
			}

			function applyBlockElement(node, newNodeName, className, arStyle)
			{
				// Rename current block element to new block element and add class
				if (newNodeName)
				{
					if (node.nodeName !== newNodeName)
					{
						node = _this.editor.util.RenameNode(node, newNodeName);
					}
					if (className)
					{
						BX.addClass(node, className);
					}
					if (arStyle && arStyle.length > 0)
					{
						_this.editor.util.SetCss(node, arStyle);
					}
				}
				else // Get rid of node
				{
					// Insert a line break afterwards and beforewards when there are siblings
					// that are not of type line break or block element
					addBrBeforeAndAfter(node);
					_this.editor.util.ReplaceWithOwnChildren(node);
				}
			}

			return {
				exec: function(command, nodeName, className, arStyle, params)
				{
					params = params || {};
					nodeName = typeof nodeName === "string" ? nodeName.toUpperCase() : nodeName;
					var
						childBlockNodes, i, allNodes, createdBlockNodes,
						range = params.range || _this.editor.selection.GetRange(),
						blockElement = nodeName ? _this.actions.formatBlock.state(command, nodeName, className, arStyle) : false,
						selectedNode;

					if (params.range)
						_this.editor.selection.RestoreBookmark();

					if (blockElement) // Same block element
					{
						// Divs and blockquotes can be inside each other
						if (BX.util.in_array(nodeName, nestedBlockTags))
						{
							// create new div
							blockElement = _this.document.createElement(nodeName || DEFAULT_NODE_NAME);
							if (className)
							{
								blockElement.className = className;
							}

							// Select line with wrap
							_this.editor.selection.Surround(blockElement);
							_this.editor.selection.SelectNode(blockElement);
						}
						else
						{
							_this.editor.util.SetCss(blockElement, arStyle);
							setTimeout(function()
							{
								_this.editor.selection.SelectNode(blockElement);
							}, 10);
						}
					}
					else
					{
						// Find other block element and rename it (<h2></h2> => <h1></h1>)
						if (nodeName === null || BX.util.in_array(nodeName, blockTags))
						{
							//allNodes = range.getNodes([1]);
							blockElement = false;
							selectedNode = _this.editor.selection.GetSelectedNode();

							if (selectedNode)
							{
								if (selectedNode.nodeType == 1 && BX.util.in_array(selectedNode.nodeName, blockTags))
								{
									blockElement = selectedNode;
								}
								else
								{
									blockElement = BX.findParent(selectedNode, function(n)
									{
										return BX.util.in_array(n.nodeName, blockTags);
									}, _this.document.body);
								}
							}
							else
							{
								var
									commonAncestor = _this.editor.selection.GetCommonAncestorForRange(range);

								if (commonAncestor && commonAncestor.nodeName !== 'BODY' &&
									BX.util.in_array(commonAncestor.nodeName, blockTags))
								{
									blockElement = commonAncestor;
								}
							}

							if (blockElement && !_this.actions.quote.checkNode(blockElement))
							{
								_this.editor.selection.ExecuteAndRestoreSimple(function()
								{
									applyBlockElement(blockElement, nodeName, className, arStyle);
								});
								return true;
							}
						}

						blockElement = BX.create(nodeName || DEFAULT_NODE_NAME, {}, _this.document);
						if (className)
						{
							blockElement.className = className;
						}
						_this.editor.util.SetCss(blockElement, arStyle);

						if (range.collapsed || selectedNode && selectedNode.nodeType == 3 /* text node*/)
						{
							// Select node
							_this.editor.selection.SelectNode(selectedNode);
						}
						else if (range.collapsed)
						{
							// Select line with wrap
							_this.editor.selection.SelectLine();
						}

						_this.editor.selection.Surround(blockElement, range);
						removeBrBeforeAndAfter(blockElement);
						removeLastChildBr(blockElement);

						// Used in align action
						if (params.leaveChilds)
						{
							return blockElement;
						}

						if (nodeName && !BX.util.in_array(nodeName, nestedBlockTags))
						{
							range = _this.editor.selection.GetRange();
							createdBlockNodes = range.getNodes([1]);

							// 1. Find all child "P" and remove them
							if (nodeName == 'P')
							{
								childBlockNodes = blockElement.getElementsByTagName(nodeName);
								// Clean empty bogus H1, H2, H3...
								for (i = 0; i < createdBlockNodes.length; i++)
								{
									if (arStyle && _this.editor.util.CheckCss(createdBlockNodes[i], arStyle, false) && _this.editor.util.IsEmptyNode(createdBlockNodes[i], true, true))
									{
										BX.remove(createdBlockNodes[i]);
									}
								}

								while (childBlockNodes[0])
								{
									addBrBeforeAndAfter(childBlockNodes[0]);
									_this.editor.util.ReplaceWithOwnChildren(childBlockNodes[0]);
								}
							}
							else if (nodeName.substr(0, 1) == 'H')
							{
								// Clean empty bogus H1, H2, H3...
								for (i = 0; i < createdBlockNodes.length; i++)
								{
									if (createdBlockNodes[i].nodeName !== nodeName && _this.editor.util.IsEmptyNode(createdBlockNodes[i], true, true))
									{
										BX.remove(createdBlockNodes[i]);
									}
								}

								var childHeaders = BX.findChild(blockElement, function(n)
								{
									return BX.util.in_array(n.nodeName, blockTags) && n.nodeName.substr(0, 1) == 'H';
								}, true, true);

								for (i = 0; i < childHeaders.length; i++)
								{
									addBrBeforeAndAfter(childHeaders[i]);
									_this.editor.util.ReplaceWithOwnChildren(childHeaders[i]);
								}
							}
						}

						if (blockElement && params.bxTagParams && typeof params.bxTagParams == 'object')
						{
							_this.editor.SetBxTag(blockElement, params.bxTagParams);
						}

						if (blockElement && blockElement.parentNode)
						{
							var parent = blockElement.parentNode;
							if (parent.nodeName == 'UL' || parent.nodeName == 'OL')
							{
								// 1. Clean empty LI before and after
								var li = _this.editor.util.GetPreviousNotEmptySibling(blockElement);
								if (_this.editor.util.IsEmptyLi(li))
								{
									BX.remove(li);
								}
								li = _this.editor.util.GetNextNotEmptySibling(blockElement);
								if (_this.editor.util.IsEmptyLi(li))
								{
									BX.remove(li);
								}

								// 2. If parent list doesn't have other items - put it inside blockquote
								if (!_this.editor.util.GetPreviousNotEmptySibling(blockElement) && !_this.editor.util.GetNextNotEmptySibling(blockElement))
								{
									var blockElementNew = blockElement.cloneNode(false);
									parent.parentNode.insertBefore(blockElementNew, parent);
									_this.editor.util.ReplaceWithOwnChildren(blockElement);
									blockElementNew.appendChild(parent);
								}
							}

							if (blockElement.firstChild && blockElement.firstChild.nodeName == 'BLOCKQUOTE')
							{
								var prev = _this.editor.util.GetPreviousNotEmptySibling(blockElement);
								if (prev && prev.nodeName == 'BLOCKQUOTE' && _this.editor.util.IsEmptyNode(prev))
								{
									BX.remove(prev);
								}
							}

							if ((blockElement.nodeName == 'BLOCKQUOTE' || blockElement.nodeName == 'PRE') && _this.editor.util.IsEmptyNode(blockElement))
							{
								blockElement.innerHTML = '';
								var br = _this.document.createElement("br");
								blockElement.appendChild(br);
								_this.editor.selection.SetAfter(br);
							}
						}

						setTimeout(function()
						{
							if (blockElement)
							{
								_this.editor.selection.SelectNode(blockElement);
							}
						}, 10);

						return true;
					}
				},

				state: function(command, nodeName, className, style)
				{
					nodeName = typeof(nodeName) === "string" ? nodeName.toUpperCase() : nodeName;
					var
						result = false,
						selectedNode = _this.editor.selection.GetSelectedNode();

					if (selectedNode && selectedNode.nodeName)
					{
						if (selectedNode.nodeName != nodeName)
						{
							selectedNode = BX.findParent(selectedNode, function(n)
							{
								return n.nodeName == nodeName;
							}, _this.document.body);
						}
						result = (selectedNode && selectedNode.tagName == nodeName) ? selectedNode : false;
					}
					else
					{
						var
							range = _this.editor.selection.GetRange(),
							commonAncestor = _this.editor.selection.GetCommonAncestorForRange(range);

						if (commonAncestor.nodeName == nodeName)
						{
							result = commonAncestor;
						}
					}
					return result;
				},

				value: BX.DoNothing,

				removeBrBeforeAndAfter: removeBrBeforeAndAfter,
				addBrBeforeAndAfter: addBrBeforeAndAfter
			};
		},

		GetRemoveFormat: function()
		{
			var
				FORMAT_NODES_INLINE = {
					"B": 1,
					"STRONG": 1,
					"I": 1,
					"EM": 1,
					"U": 1,
					"DEL": 1,
					"S": 1,
					"STRIKE": 1,
					"A": 1,
					"SPAN" : 1,
					"CODE" : 1,
					"NOBR" : 1,
					"Q" : 1,
					"FONT" : 1,
					"CENTER": 1,
					"CITE": 1
				},
				FORMAT_NODES_BLOCK = {
					"H1": 1,
					"H2": 1,
					"H3": 1,
					"H4": 1,
					"H5": 1,
					"H6": 1,
					"DIV": 1,
					"P": 1,
					"LI": 1,
					"UL" : 1,
					"OL" : 1,
					"MENU" : 1,
					"BLOCKQUOTE": 1,
					"PRE": 1
				},
				_this = this;

			function checkAndCleanNode(node)
			{
				var nodeName = node.nodeName;
				if (FORMAT_NODES_INLINE[nodeName])
				{
					_this.editor.util.ReplaceWithOwnChildren(node);
				}
				else if (FORMAT_NODES_BLOCK[nodeName])
				{
					_this.actions.formatBlock.addBrBeforeAndAfter(node);
					_this.editor.util.ReplaceWithOwnChildren(node);
				}
				else
				{
					node.removeAttribute("style");
					node.removeAttribute("class");
					node.removeAttribute("align");

					if (_this.editor.bbCode && node.nodeName == 'TABLE')
					{
						node.removeAttribute('align');
					}
				}
			}

			function checkTableNode(node)
			{
				return BX.findParent(node, function(n)
				{
					return n.nodeName == "TABLE";
				}, _this.editor.GetIframeDoc().body);
			}

			function getUnitaryParent(textNode)
			{
				var
					prevSibling, nextSibling,
					parent = textNode.parentNode;

				while (parent && parent.nodeName !== 'BODY')
				{
					prevSibling = parent.previousSibling && !_this.editor.util.IsEmptyNode(parent.previousSibling);
					nextSibling = parent.nextSibling && !_this.editor.util.IsEmptyNode(parent.nextSibling);

					if (prevSibling || nextSibling || parent.parentNode.nodeName == 'BODY')
					{
						break;
					}
					parent = parent.parentNode;
				}
				return parent;
			}

			function checkParentList(node)
			{
				var
					doc = _this.editor.GetIframeDoc(),
					list = BX.findParent(node, function(n)
					{
						return n.nodeName == "UL" || n.nodeName == "OL" || n.nodeName == "MENU";
					}, doc.body);

				if (list)
				{
					var
						i, child,
						listBefore = list.cloneNode(false),
						listAfter = list.cloneNode(false),
						before = true;

					BX.cleanNode(listBefore);
					BX.cleanNode(listAfter);

					for (i = 0; i < list.childNodes.length; i++)
					{
						child = list.childNodes[i];
						if (child == node)
						{
							before = false;
						}

						if (child.nodeName == 'LI')
						{
							if (!_this.editor.util.IsEmptyNode(child, true, true))
							{
								(before ? listBefore : listAfter).appendChild(child.cloneNode(true));
							}
						}
					}

					if (listBefore.childNodes.length > 0)
					{
						list.parentNode.insertBefore(listBefore, list);
					}
					list.parentNode.insertBefore(node, list);
					if (listAfter.childNodes.length > 0)
					{
						list.parentNode.insertBefore(listAfter, list);
					}
					BX.remove(list);
					return true;
				}
				return false;
			}

			function cleanNodes(nodes)
			{
				if (nodes && nodes.length > 0)
				{
					var i, len, sorted = [];
					for (i = 0, len = nodes.length; i < len; i++)
					{
						if (!_this.editor.util.CheckSurrogateNode(nodes[i]))
						{
							sorted.push({node: nodes[i], nesting: _this.editor.util.GetNodeDomOffset(nodes[i])});
						}
					}
					sorted = sorted.sort(function(a, b){return b.nesting - a.nesting});
					for (i = 0, len = sorted.length; i < len; i++)
					{
						checkAndCleanNode(sorted[i].node);
					}
				}
			}

			function _selectAndGetNodes(node)
			{
				var
					i, found = false,
					range = _this.editor.selection.SelectNode(node),
					nodes = range.getNodes([1]);

				if (node.nodeType == 1)
				{
					for (i = 0; i < nodes.length; i++)
					{
						if (nodes[i] == node)
						{
							found = true;
							break;
						}
					}
					if (!found)
					{
						nodes = [node].concat(nodes);
					}
				}

				if (!nodes || typeof nodes != 'object' || nodes.length == 0)
				{
					nodes = [node];
				}
				return nodes;
			}

			return {
				exec: function(action, value)
				{
					var range = _this.editor.selection.GetRange();

					if (range && !_this.editor.iframeView.IsEmpty())
					{
						var
							bSurround = true,
							i,
							textNodes, textNode, node, tmpNode,
							nodes = range.getNodes([1]),
							doc = _this.editor.GetIframeDoc();

						// Range is collapsed or text node is selected
						if (nodes.length == 0)
						{
							textNodes = range.getNodes([3]);

							if (textNodes && textNodes.length == 1)
							{
								textNode = textNodes[0];
							}

							if (!textNode && range.startContainer == range.endContainer)
							{
								if (range.startContainer.nodeType == 3)
								{
									textNode = range.startContainer;
								}
								else
								{
									bSurround = false;
									nodes = _selectAndGetNodes(range.startContainer);
								}
							}

							if (textNode && nodes.length == 0)
							{
								node = getUnitaryParent(textNode);
								if (node && (node.nodeName != 'BODY' || range.collapsed))
								{
									bSurround = false;
									nodes = _selectAndGetNodes(node);
								}
							}
						}
						else
						{
							var
								updateSel = false,
								clearRanges = [],
								startTableCheck = checkTableNode(range.startContainer),
								endTableCheck = checkTableNode(range.endContainer);

							if (startTableCheck)
							{
								clearRanges.push(
									{
										startContainer: range.startContainer,
										startOffset: range.startOffset,
										end: startTableCheck
									}
								);

								range.setStartAfter(startTableCheck);
								updateSel = true;
							}

							if (endTableCheck)
							{
								updateSel = true;
								clearRanges.push(
									{
										start: endTableCheck,
										endContainer: range.endContainer,
										endOffset: range.endOffset
									}
								);
								range.setEndBefore(endTableCheck);
							}

							if (updateSel)
							{
								_this.editor.selection.SetSelection(range);
								nodes = range.getNodes([1]);
							}
						}

						if (bSurround)
						{
							tmpNode = doc.createElement("span");
							_this.editor.selection.Surround(tmpNode, range);
							nodes = _selectAndGetNodes(tmpNode);
						}

						if (nodes && nodes.length > 0)
						{
							_this.editor.selection.ExecuteAndRestoreSimple(function()
							{
								cleanNodes(nodes);
							});
						}

						if (clearRanges && clearRanges.length > 0)
						{
							var
								_range = range.cloneRange();

							for (i = 0; i < clearRanges.length; i++)
							{
								if (clearRanges[i].start)
								{
									_range.setStartBefore(clearRanges[i].start);
								}
								else
								{
									_range.setStart(clearRanges[i].startContainer, clearRanges[i].startOffset);
								}
								if (clearRanges[i].end)
								{
									_range.setEndAfter(clearRanges[i].end);
								}
								else
								{
									_range.setEnd(clearRanges[i].endContainer,  clearRanges[i].endOffset);
								}
								_this.editor.selection.SetSelection(_range);
								cleanNodes(_range.getNodes([1]));
							}

							_this.editor.selection.SetSelection(range);
						}

						if (bSurround && tmpNode && tmpNode.parentNode)
						{
							if (checkParentList(tmpNode))
							{
								_this.editor.selection.SelectNode(tmpNode);
							}

							_this.editor.selection.ExecuteAndRestoreSimple(function()
							{
								_this.editor.util.ReplaceWithOwnChildren(tmpNode);
							});
						}
					}
				},
				state: BX.DoNothing,
				value: BX.DoNothing
			};
		},

		GetBold: function()
		{
			var _this = this;
			return {
				exec: function(action, value)
				{
					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						return _this.actions.formatInline.exec(action, value, "b");
					}
					else // BBCode mode
					{
						return _this.actions.formatBbCode.exec(action, {tag: 'B'});
					}
				},
				state: function(action, value)
				{
					return _this.actions.formatInline.state(action, value, "b");
				},
				value: BX.DoNothing
			};
		},

		GetItalic: function()
		{
			var _this = this;
			return {
				exec: function(action, value)
				{
					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						return _this.actions.formatInline.exec(action, value, "i");
					}
					else
					{
						return _this.actions.formatBbCode.exec(action, {tag: 'I'});
					}
				},
				state: function(action, value)
				{
					return _this.actions.formatInline.state(action, value, "i");
				},
				value: BX.DoNothing
			};
		},

		GetUnderline: function()
		{
			var _this = this;
			return {
				exec: function(action, value)
				{
					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						return _this.actions.formatInline.exec(action, value, "u");
					}
					else
					{
						return _this.actions.formatBbCode.exec(action, {tag: 'U'});
					}
				},
				state: function(action, value)
				{
					return _this.actions.formatInline.state(action, value, "u");
				},
				value: BX.DoNothing
			};
		},

		GetStrikeout: function()
		{
			var _this = this;
			return {
				exec: function(action, value)
				{
					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						return _this.actions.formatInline.exec(action, value, "del");
					}
					else
					{
						return _this.actions.formatBbCode.exec(action, {tag: 'S'});
					}
				},
				state: function(action, value)
				{
					return _this.actions.formatInline.state(action, value, "del");
				},
				value: BX.DoNothing
			};
		},

		GetFontSize: function()
		{
			var _this = this;
			return {
				exec: function(action, value)
				{
					var res;
					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						if (value > 0) // Format
							res = _this.actions.formatInline.exec(action, value, "span", {fontSize: value + 'pt'});
						else // Clear font-size format
							res = _this.actions.formatInline.exec(action, value, "span", {fontSize: null}, null, {bClear: true});
					}
					else // textarea + bbcode
					{
						res = _this.actions.formatBbCode.exec(action, {tag: 'SIZE', value: value + 'pt'});
					}
					return res;
				},

				state: function(action, value)
				{
					return _this.actions.formatInline.state(action, value, "span", {fontSize: value + 'pt'});
				},

				value: BX.DoNothing
			};
		},

		GetForeColor: function()
		{
			var _this = this;

			function checkListItemColor()
			{
				var
					doc = _this.editor.GetIframeDoc(),
					i, item, res = [],
					range = _this.editor.selection.GetRange();

				if (range)
				{
					var nodes = range.getNodes([1]);

					if (nodes.length == 0 && range.startContainer == range.endContainer &&  range.startContainer.nodeName != 'BODY')
					{
						nodes = [range.startContainer];
					}

					for (i = 0; i < nodes.length; i++)
					{
						item = BX.findParent(nodes[i], function(n){
							return n.nodeName == 'LI' && n.style && n.style.color;
						}, doc.body);

						if (item)
						{
							res.push(item);
						}
					}
				}

				return res.length === 0 ? false : res;
			}

			function checkAndApplyColorListItems(value)
			{
				var
					doc = _this.editor.GetIframeDoc(),
					node = _this.editor.selection.GetSelectedNode(),
					i, j, spans, range, span, li,
					nodes;

				if (node && (node.nodeType === 3 || node.nodeName == 'SPAN'))
				{
					span = node.nodeName == 'SPAN' ? node : BX.findParent(node, {tag: 'span'}, doc.body);
					if (span && span.style.color)
					{
						li = BX.findParent(span, {tag: 'li'}, doc.body);
						if (li)
						{
							if (li.childNodes.length == 1 && li.firstChild == span)
							{
								_this.editor.selection.ExecuteAndRestoreSimple(function()
								{
									li.style.color = value;
									span.style.color = '';
									if (BX.util.trim(span.style.cssText) == '')
									{
										_this.editor.util.ReplaceWithOwnChildren(span);
									}
								});
							}
						}
					}
				}
				else
				{
					if (!node)
					{
						range = _this.editor.selection.GetRange();
						nodes = range.getNodes([1]);
					}
					else
					{
						nodes = [node];
					}

					for (i = 0; i < nodes.length; i++)
					{
						if (nodes[i] && nodes[i].nodeName == "LI")
						{
							// 1. Add color to LI
							nodes[i].style.color = value;
							// Find and clear all spans created by action
							spans = BX.findChild(nodes[i], function(n)
							{
								return n.nodeName == "SPAN";
							}, true, true);

							_this.editor.selection.ExecuteAndRestoreSimple(function()
							{
								for (j = 0; j < spans.length; j++)
								{
									if (spans[j] && spans[j].parentNode &&
										spans[j].parentNode.parentNode &&
										spans[j].parentNode.parentNode.parentNode)
									{
										try{
											spans[j].style.color = '';
											if (BX.util.trim(spans[j].style.cssText) == '')
											{
												_this.editor.util.ReplaceWithOwnChildren(spans[j]);
											}
										}
										catch(e)
										{}
									}
								}
							});
						}
					}
				}
			}

			return {
				exec: function(action, value)
				{
					var res;

					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						if (value == '')
						{
							res = _this.actions.formatInline.exec(action, value, "span", {color: null}, null, {bClear: true});
						}
						else
						{
							res =  _this.actions.formatInline.exec(action, value, "span", {color: value});
							checkAndApplyColorListItems(value);
						}
					}
					else if (value) // textarea + bbcode
					{
						res = _this.actions.formatBbCode.exec(action, {tag: 'COLOR', value: value});
					}

					return res;
				},

				state: function(action, value)
				{
					var state = _this.actions.formatInline.state(action, value, "span", {color: value});
					if (!state)
					{
						state = checkListItemColor();
					}

					return state;
				},

				value: BX.DoNothing
			};
		},

		GetBackgroundColor: function()
		{
			var _this = this;

			return {
				exec: function(action, value)
				{
					var res;
					if (value == '')
					{
						res =  _this.actions.formatInline.exec(action, value, "span", {backgroundColor: null}, null, {bClear: true});
					}
					else
					{
						res =  _this.actions.formatInline.exec(action, value, "span", {backgroundColor: value});
					}
					return res;
				},

				state: function(action, value)
				{
					return _this.actions.formatInline.state(action, value, "span", {backgroundColor: value});
				},

				value: BX.DoNothing
			};
		},

		GetCreateLink: function()
		{
			var
				ATTRIBUTES = ['title', 'id', 'name', 'target', 'rel'],
				_this = this;

			return {
				exec: function(action, value)
				{
					// Only for bbCode == true
					if (_this.editor.bbCode && _this.editor.synchro.IsFocusedOnTextarea())
					{
						_this.editor.textareaView.Focus();
						var linkHtml = "[URL=" + value.href + "]" + (value.text || value.href) + "[/URL]";
						_this.editor.textareaView.WrapWith(false, false, linkHtml);
					}
					else
					{
						_this.editor.iframeView.Focus();

						var
							nodeToSetCarret,
							params = typeof(value) === "object" ? value : {href: value},
							i, link, linksCount = 0, lastLink,
							links;

						function applyAttributes(link, params)
						{
							var attr;
							link.removeAttribute("class");
							link.removeAttribute("target");

							for (attr in params)
							{
								if (params.hasOwnProperty(attr) && BX.util.in_array(attr, ATTRIBUTES))
								{
									if (params[attr] == '' || params[attr] == undefined)
									{
										link.removeAttribute(attr);
									}
									else
									{
										link.setAttribute(attr, params[attr]);
									}
								}
							}
							if (params.className)
								link.className = params.className;
							link.href = params.href || '';

							if (params.noindex)
							{
								link.setAttribute("data-bx-noindex", "Y");
							}
							else
							{
								link.removeAttribute("data-bx-noindex");
							}
						}

						links = _this.actions.formatInline.state(action, value, "a");
						if (links)
						{
							// Selection contains links
							for (i = 0; i < links.length; i++)
							{
								link = links[i];
								if (link)
								{
									applyAttributes(link, params);
									lastLink = link;
									linksCount++;
								}
							}

							if (linksCount === 1 && lastLink && !lastLink.querySelector("*") && params.text != '')
							{
								_this.editor.util.SetTextContent(lastLink, params.text);
							}
							nodeToSetCarret = lastLink;

							if (nodeToSetCarret)
								_this.editor.selection.SetAfter(nodeToSetCarret);

							setTimeout(function()
							{
								if (nodeToSetCarret)
									_this.editor.selection.SetAfter(nodeToSetCarret);
							}, 10);
						}
						else
						{

							var
								tmpClass = "_bx-editor-temp-" + Math.round(Math.random() * 1000000),
								invisText,
								isEmpty,
								textContent;

							// Create LINKS
							_this.actions.formatInline.exec(action, value, "A", false, tmpClass);

							links = _this.document.querySelectorAll("A." + tmpClass);

							for (i = 0; i < links.length; i++)
							{
								link = links[i];
								if (link)
								{
									applyAttributes(link, params);
								}
							}

							nodeToSetCarret = link; // last link

							if (links.length === 1)
							{
								textContent = _this.editor.util.GetTextContent(link);
								isEmpty = textContent === "" || textContent === _this.editor.INVISIBLE_SPACE;

								if (textContent != params.text)
								{
									_this.editor.util.SetTextContent(link, params.text || params.href);
								}

								if (!link.querySelector("*") && isEmpty) // Link is empty
								{
									_this.editor.util.SetTextContent(link, params.text || params.href);
								}
							}

							if (link)
							{
								if (link.nextSibling && link.nextSibling.nodeType == 3 && _this.editor.util.IsEmptyNode(link.nextSibling))
								{
									invisText = link.nextSibling;
								}
								else
								{
									invisText = _this.editor.util.GetInvisibleTextNode();
								}
								_this.editor.util.InsertAfter(invisText, link);
								nodeToSetCarret = invisText;
							}

							if (nodeToSetCarret)
								_this.editor.selection.SetAfter(nodeToSetCarret);

							setTimeout(function()
							{
								if (nodeToSetCarret)
									_this.editor.selection.SetAfter(nodeToSetCarret);
							}, 10);
						}
					}
				},

				state: function(action, value)
				{
					return _this.actions.formatInline.state(action, value, "a");
				},

				value: BX.DoNothing
			};
		},

		GetRemoveLink: function()
		{
			var _this = this;
			return {
				exec: function(action, value)
				{
					_this.editor.iframeView.Focus();

					var
						i, link, links;

					if (value && typeof value == 'object')
					{
						links = value;
					}
					else
					{
						links = _this.actions.formatInline.state(action, value, "a");
					}

					if (links)
					{
						// Selection contains links
						_this.editor.selection.ExecuteAndRestoreSimple(function()
						{
							for (i = 0; i < links.length; i++)
							{
								link = links[i];
								if (link)
								{
									_this.editor.util.ReplaceWithOwnChildren(links[i]);
								}
							}
						});
					}
				},

				state: function(action, value)
				{
					//return _this.actions.formatInline.state(action, value, "a");
				},
				value: BX.DoNothing
			};
		},

		GetInsertHTML: function()
		{
			var _this = this;

			return {
				exec: function(action, html)
				{
					_this.editor.iframeView.Focus();

					if (_this.IsSupportedByBrowser(action))
						_this.document.execCommand(action, false, html);
					else
						_this.editor.selection.InsertHTML(html);
				},

				state: function()
				{
					return false;
				},

				value: BX.DoNothing
			};
		},

		GetInsertImage: function()
		{
			var
				ATTRIBUTES = ['title', 'alt', 'width', 'height', 'align'],
				_this = this;

			return {
				exec: function(action, value)
				{
					// Only for bbCode == true
					if (_this.editor.bbCode && _this.editor.synchro.IsFocusedOnTextarea())
					{
						_this.editor.textareaView.Focus();
						var size = '';
						if (value.width)
							size += ' WIDTH=' + parseInt(value.width);
						if (value.height)
							size += ' HEIGHT=' + parseInt(value.height);
						var imgHtml = "[IMG" + size + "]" + value.src + "[/IMG]";
						_this.editor.textareaView.WrapWith(false, false, imgHtml);
						return;
					}

					_this.editor.iframeView.Focus();
					var
						params = typeof(value) === "object" ? value : {src: value},
						image = value.image || _this.actions.insertImage.state(action, value),
						invisText, sibl;

					function applyAttributes(image, params)
					{
						var attr, appAttr;
						image.removeAttribute("class");

						for (attr in params)
						{
							if (params.hasOwnProperty(attr) && BX.util.in_array(attr, ATTRIBUTES))
							{
								if (params[attr] == '' || params[attr] == undefined)
								{
									image.removeAttribute(attr);
								}
								else
								{
									appAttr = image.getAttribute('data-bx-app-ex-' + attr);
									if (!appAttr || _this.editor.phpParser.AdvancedPhpGetFragmentByCode(appAttr, true) != params[attr])
									{
										image.setAttribute(attr, params[attr]);
										if (appAttr)
										{
											image.removeAttribute('data-bx-app-ex-' + attr);
										}
									}
								}
							}
						}

						if (params.className)
						{
							image.className = params.className;
						}

						appAttr = image.getAttribute('data-bx-app-ex-src');
						if (!appAttr || _this.editor.phpParser.AdvancedPhpGetFragmentByCode(appAttr, true) != params.src)
						{
							image.src = params.src || '';
							if (appAttr)
							{
								image.removeAttribute('data-bx-app-ex-src');
							}
						}

					}

					if (!image)
					{
						image = _this.document.createElement('IMG');
						applyAttributes(image, params);
						_this.editor.selection.InsertNode(image);
					}
					else
					{
						applyAttributes(image, params);
					}

					var
						nodeToSetCarret = image,
						parentLink = (image.parentNode && image.parentNode.nodeName == 'A') ? image.parentNode : null;

					if (params.link)
					{
						if (parentLink)
						{
							// Just change url
							parentLink.href = params.link;
						}
						else
						{
							// Add surrounding link
							parentLink = _this.document.createElement('A');
							parentLink.href = params.link;
							image.parentNode.insertBefore(parentLink, image);
							parentLink.appendChild(image);
						}
						nodeToSetCarret = parentLink;
					}
					else if (parentLink)
					{
						// Remove parent link
						_this.editor.util.ReplaceWithOwnChildren(parentLink);
					}

					// For IE it's impssible to set the caret after an <img> if it's the lastChild in the document
					if (BX.browser.IsIE())
					{
						_this.editor.selection.SetAfter(image);
						sibl = image.nextSibling;
						if (sibl && sibl.nodeType == 3 && _this.editor.util.IsEmptyNode(sibl))
							invisText = sibl;
						else
							invisText = _this.editor.util.GetInvisibleTextNode();
						_this.editor.selection.InsertNode(invisText);
						nodeToSetCarret = invisText;
					}

					_this.editor.selection.SetAfter(nodeToSetCarret);
					_this.editor.util.Refresh();
				},

				state: function()
				{
					var
						selectedNode,
						text,
						selectedImg;

					if (!_this.editor.util.DocumentHasTag(_this.document, 'IMG'))
						return false;

					selectedNode = _this.editor.selection.GetSelectedNode();
					if (!selectedNode)
						return false;

					if (selectedNode.nodeName === 'IMG')
						return selectedNode;

					if (selectedNode.nodeType !== 1 /* element node */)
						return false;

					text = BX.util.trim(_this.editor.selection.GetText());
					if (text && text != _this.editor.INVISIBLE_SPACE)
						return false;

					selectedImg = _this.editor.selection.GetNodes(1, function(node)
					{
						return node.nodeName === "IMG";
					});

					// Works only for one image
					if (selectedImg.length !== 1)
						return false;

					return selectedImg[0];
				},

				value: BX.DoNothing
//				value: function(composer) {
//					var image = this.state(composer);
//					return image && image.src;
//				}
			};
		},

		GetInsertLineBreak: function()
		{
			var
				_this = this,
				br = "<br>" + (BX.browser.IsOpera() ? " " : "");

			return {
				exec: function(action)
				{
					if (_this.IsSupportedByBrowser(action))
					{
						_this.document.execCommand(action, false, null);
					}
					else
					{
						_this.actions.insertHTML.exec("insertHTML", br);
					}

					if (BX.browser.IsChrome() || BX.browser.IsSafari() || BX.browser.IsIE10())
					{
						_this.editor.selection.ScrollIntoView();
					}
				},

				state: BX.DoNothing,
				value: BX.DoNothing
			};
		},

		GetInsertTable: function()
		{
			var
				_this = this,
				ATTRIBUTES = ['title', 'id', 'border', 'cellSpacing', 'cellPadding', 'align'];

			function replaceTdByTh(td)
			{
				var
				//i, attribute,
					th = _this.document.createElement('TH');

				while (td.firstChild)
					th.appendChild(td.firstChild);

				//for (i = 0; i < td.attributes.length; i++)
				//{
				//	attribute = td.attributes[i];
				//	th.setAttribute(td.getAttribute());
				//}
				_this.editor.util.ReplaceNode(td, th);
			}

			function replaceThByTd(th)
			{
				var
					td = _this.document.createElement('TD');

				while (th.firstChild)
					td.appendChild(th.firstChild);

				_this.editor.util.ReplaceNode(th, td);
			}

			function applyAttributes(table, params)
			{
				var attr;
				table.removeAttribute("class");

				for (attr in params)
				{
					if (params.hasOwnProperty(attr) && BX.util.in_array(attr, ATTRIBUTES))
					{
						if (params[attr] == '' || params[attr] == undefined)
						{
							table.removeAttribute(attr);
						}
						else
						{
							table.setAttribute(attr, params[attr]);
						}
					}
				}
				if (params.className)
				{
					table.className = params.className;
				}

				table.removeAttribute("data-bx-no-border");
				if (table.getAttribute("border") == 0 || !table.getAttribute("border"))
				{
					table.removeAttribute("border");
					table.setAttribute("data-bx-no-border", "Y");
				}

				if (params.width)
				{
					if (parseInt(params.width) == params.width)
					{
						params.width = params.width + 'px';
					}

					if (table.getAttribute("width"))
					{
						table.setAttribute("width", params.width);
					}
					else
					{
						table.style.width = params.width;
					}
				}

				if (params.height)
				{
					if (parseInt(params.height) == params.height)
					{
						params.height = params.height + 'px';
					}

					if (table.getAttribute("height"))
					{
						table.setAttribute("height", params.height);
					}
					else
					{
						table.style.height = params.height;
					}
				}

				var r, c, pCell;
				for(r = 0; r < table.rows.length; r++)
				{
					for(c = 0; c < table.rows[r].cells.length; c++)
					{
						pCell = table.rows[r].cells[c];
						if (
							((params.headers == 'top' || params.headers == 'topleft') && r == 0)
								||
								((params.headers == 'left' || params.headers == 'topleft') && c == 0)
							)
						{
							replaceTdByTh(pCell);
						}
						else if (pCell.nodeName == 'TH')
						{
							replaceThByTd(pCell);
						}
					}
				}

				var pCaption = BX.findChild(table, {tag: 'CAPTION'}, false);
				if (params.caption)
				{
					if (pCaption)
					{
						pCaption.innerHTML = BX.util.htmlspecialchars(params.caption);
					}
					else
					{
						pCaption = _this.document.createElement('CAPTION');
						pCaption.innerHTML = BX.util.htmlspecialchars(params.caption);
						table.insertBefore(pCaption, table.firstChild);
					}
				}
				else if (pCaption)
				{
					BX.remove(pCaption);
				}
			}

			return {
				exec: function(action, params)
				{
					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						if (!params || !params.rows || !params.cols)
						{
							return false;
						}

						_this.editor.iframeView.Focus();
						var table = params.table || _this.actions.insertTable.state(action, params);

						params.rows = parseInt(params.rows) || 1;
						params.cols = parseInt(params.cols) || 1;

						if (params.align == 'left' || _this.editor.bbCode)
						{
							params.align = '';
						}

						if (!table)
						{
							table = _this.document.createElement('TABLE');

							var
								tbody = table.appendChild(_this.document.createElement('TBODY')),
								r, c, row, cell;

							params.rows = parseInt(params.rows) || 1;
							params.cols = parseInt(params.cols) || 1;

							for(r = 0; r < params.rows; r++)
							{
								row = tbody.insertRow(-1);
								for(c = 0; c < params.cols; c++)
								{
									cell = BX.adjust(row.insertCell(-1), {html: '&nbsp;'});
								}
							}
							applyAttributes(table, params);
							_this.editor.selection.InsertNode(table);
						}
						else
						{
							applyAttributes(table, params);
						}

						var nodeToSetCarret = table.rows[0].cells[0].firstChild;
						if (nodeToSetCarret)
						{
							_this.editor.selection.SetAfter(nodeToSetCarret);
						}

						// For Firefox refresh white markers
						setTimeout(function(){_this.editor.util.Refresh(table);}, 10);
					}
					else // bbcode + textarea
					{
						_this.editor.textareaView.Focus();
						var
							tbl = '',
							i, j,
							cellHTML = _this.editor.INVISIBLE_SPACE;

						if (params.rows > 0 && params.cols > 0)
						{
							tbl += "[TABLE]\n";
							for(i = 0; i < params.rows; i++)
							{
								tbl += "\t[TR]\n";
								for(j = 0; j < params.cols; j++)
								{
									tbl += "\t\t[TD]" + cellHTML + "[/TD]\n";
								}
								tbl += "\t[/TR]\n";
							}
							tbl += "[/TABLE]\n";
						}

						_this.editor.textareaView.WrapWith(false, false, tbl);
					}
				},

				state: function(action, value)
				{
					var
						selectedNode,
						selectedTable;

					if (!_this.editor.util.DocumentHasTag(_this.document, 'TABLE'))
					{
						return false;
					}

					selectedNode = _this.editor.selection.GetSelectedNode();
					if (!selectedNode)
					{
						return false;
					}

					if (selectedNode.nodeName === 'TABLE')
					{
						return selectedNode;
					}

					if (selectedNode.nodeType !== 1 /* element node */)
					{
						return false;
					}

					selectedTable = _this.editor.selection.GetNodes(1, function(node)
					{
						return node.nodeName === "TABLE";
					});

					// Works only for one table
					if (selectedTable.length !== 1)
					{
						return false;
					}

					return selectedTable[0];
				},
				value: BX.DoNothing
			};
		},

		//
		GetInsertList: function(params)
		{
			var _this = this;
			var
				bOrdered = !!params.bOrdered,
				listTag = bOrdered ? 'OL' : 'UL',
				otherListTag = bOrdered ? 'UL' : 'OL';

			function getNextNotEmptySibling(node)
			{
				var nextSibling = node.nextSibling;
				while (nextSibling && nextSibling.nodeType == 3 && _this.editor.util.IsEmptyNode(nextSibling, true))
				{
					nextSibling = nextSibling.nextSibling;
				}
				return nextSibling;
			}

			function removeList(list)
			{
				if (list.nodeName !== "MENU" && list.nodeName !== "UL" && list.nodeName !== "OL")
				{
					return;
				}

				var
					frag = _this.document.createDocumentFragment(),
					previousSibling = list.previousSibling,
					firstChild,
					lastChild,
					bAppendBr,
					listItem;

				if (previousSibling && !_this.editor.util.IsBlockElement(previousSibling) && !_this.editor.util.IsEmptyNode(previousSibling, true))
				{
					frag.appendChild(_this.document.createElement("BR"));
				}

				while (listItem = list.firstChild)
				{
					lastChild = listItem.lastChild;
					while (firstChild = listItem.firstChild)
					{
						bAppendBr = firstChild === lastChild &&
							!_this.editor.util.IsBlockElement(firstChild) &&
							firstChild.nodeName !== "BR";

						frag.appendChild(firstChild);
						if (bAppendBr)
						{
							frag.appendChild(_this.document.createElement("BR"));
						}
					}
					listItem.parentNode.removeChild(listItem);
				}

				var nextSibling = _this.editor.util.GetNextNotEmptySibling(list);
				if (nextSibling && nextSibling.nodeName == 'BR' && frag.lastChild && frag.lastChild.nodeName == 'BR')
				{
					// Remove unnecessary BR
					BX.remove(frag.lastChild);
				}

				list.parentNode.replaceChild(frag, list);
			}

			function convertToList(element, listType)
			{
				if (!element || !element.parentNode)
					return false;

				var nodeName = element.nodeName.toUpperCase();

				if (nodeName === "UL" || nodeName === "OL" || nodeName === "MENU")
				{
					return element;
				}

				var
					list = _this.document.createElement(listType),
					childNode,
					currentLi;

				while (element.firstChild)
				{
					currentLi = currentLi || list.appendChild(_this.document.createElement("li"));
					childNode = element.firstChild;

					if (_this.editor.util.IsBlockElement(childNode))
					{
						currentLi = currentLi.firstChild ? list.appendChild(_this.document.createElement("li")) : currentLi;
						currentLi.appendChild(childNode);
						currentLi = null;
						continue;
					}

					if (childNode.nodeName === "BR")
					{
						currentLi = currentLi.firstChild ? null : currentLi;
						element.removeChild(childNode);
						continue;
					}

					currentLi.appendChild(childNode);
				}

				element.parentNode.replaceChild(list, element);
				return list;
			}

			function isListNode(n)
			{
				return n.nodeName == 'OL' || n.nodeName == 'UL' || n.nodeName == 'MENU'
			}

			function getSelectedList(tag, node)
			{
				if (!node)
				{
					node = _this.editor.selection.GetSelectedNode();
				}

				if (!node)
				{
					var
						range = _this.editor.selection.GetRange(),
						commonAncestor = _this.editor.selection.GetCommonAncestorForRange(range);

					if (commonAncestor && isListNode(commonAncestor))
					{
						node = commonAncestor;
					}
					else
					{
						var
							i, n, onlyList = true, list, parentList,
							nodes = range.getNodes([1]),
							l = nodes.length;

						for (i = 0; i < l; i++)
						{
							parentList = BX.findParent(nodes[i], isListNode, commonAncestor);
							if (!parentList || (list && parentList != list))
							{
								onlyList = false;
								break;
							}

							list = parentList;
						}

						if (list)
						{
							node = list;
						}
					}
				}

				return node && node.nodeName == tag ? node : BX.findParent(node, {tagName: tag}, _this.document.body);
			}

			return {
				exec: function(action, params)
				{
					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						var range = _this.editor.selection.GetRange();

						if (_this.IsSupportedByBrowser(action) && range.collapsed)
						{
							_this.document.execCommand(action, false, null);
						}
						else
						{
							var
								selectedNode = _this.editor.selection.GetSelectedNode(),
								list = getSelectedList(listTag, selectedNode),
								otherList = getSelectedList(otherListTag, selectedNode),
								isEmpty,
								tempElement;

							if (list)
							{
								_this.editor.selection.ExecuteAndRestoreSimple(function()
								{
									removeList(list);
								});
							}
							else if (otherList)
							{
								_this.editor.selection.ExecuteAndRestoreSimple(function()
								{
									_this.editor.util.RenameNode(otherList, listTag);
								});
							}
							else
							{
								tempElement = _this.document.createElement("span");
								_this.editor.selection.Surround(tempElement);
								isEmpty = tempElement.innerHTML === "" || tempElement.innerHTML === _this.editor.INVISIBLE_SPACE;
								_this.editor.selection.ExecuteAndRestoreSimple(function()
								{
									list = convertToList(tempElement, listTag);
								});

								if (list)
								{
									var i = 0, item;
									while (i < list.childNodes.length)
									{
										item = list.childNodes[i];
										if (item.nodeName == 'LI')
										{
											if (_this.editor.util.IsEmptyNode(item, true, true))
											{
												BX.remove(item);
												continue;
											}
											i++;
										}
										else if (item.nodeType == 1)
										{
											BX.remove(item);
										}
									}

									// Mantis: #53646, #53820
									var prevSib = _this.editor.util.GetPreviousNotEmptySibling(list);
									if (prevSib && (
										prevSib.nodeName == 'BLOCKQUOTE' ||
										prevSib.nodeName == 'PRE' ||
										prevSib.nodeName == 'UL' ||
										prevSib.nodeName == 'OL'
										)
										&& list.childNodes[0] && BX.findChild(list.childNodes[0], {tag: prevSib.nodeName}))
									{
										if (BX.util.trim(_this.editor.util.GetTextContent(prevSib)) == '')
										{
											BX.remove(prevSib);
										}
									}
								}

								if (isEmpty && list)
								{
									_this.editor.selection.SelectNode(list.querySelector("li"));
								}
							}
						}
					}
					else // bbcode + textarea
					{
						if (params && params.items)
						{
							_this.editor.textareaView.Focus();
							var lst = '[LIST' + (bOrdered ? '=1' : '')+ ']\n', it;

							for(it = 0; it < params.items.length; it++)
							{
								lst += "\t[*]" + params.items[it] + "\n";
							}
							lst += "[/LIST]\n";

							_this.editor.textareaView.WrapWith(false, false, lst);
						}
					}
				},

				state: function(action, params)
				{
					return getSelectedList(listTag) || false;
				},

				value: BX.DoNothing
			};
		},

		GetAlign: function()
		{
			var
				LIST_ALIGN_ATTR = 'data-bx-checked-align-list',
				DEFAULT_VALUE = 'left',
				TABLE_NODES = {TD: 1, TR: 1, TH: 1, TABLE: 1, TBODY: 1, CAPTION: 1, COL: 1, COLGROUP: 1, TFOOT: 1, THEAD: 1},
				ALIGN_NODES = {IMG: 1, P: 1, DIV: 1, TABLE: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1},
				_this = this;

			function checkNodeAlign(n)
			{
				var
					nodeName = n.nodeName, align,
					res = false;

				if (n.nodeType === 1)
				{
					align = n.style.textAlign;
					if (n.style.textAlign)
					{
						res = {node: n, style: align};
					}

					if (ALIGN_NODES[nodeName])
					{
						align = n.getAttribute('align');
						if (align)
						{
							if (res)
							{
								res.attribute = align;
							}
							else
							{
								res = {node: n, attribute: align};
							}
						}
					}
				}
				return res;
			}

			function isCell(n)
			{
				return n && (n.nodeName == 'TD' || n.nodeName == 'TH');
			}

			function alignTableNode(n, value)
			{
				n.setAttribute('data-bx-tmp-align', value);
				n.style.textAlign = value;
			}

			function alignTable(n, value)
			{
				if (value == 'left' || value == 'justify' || _this.editor.bbCode)
				{
					n.removeAttribute('align');
				}
				else
				{
					n.setAttribute('align', value);
				}
			}

			function checkAlignTable(table, value)
			{
				var
					ths,
					i, res = true,
					tds = table.getElementsByTagName("TD");

				for (i = 0; i < tds.length; i++)
				{
					if (tds[i].getAttribute('data-bx-tmp-align') != value)
					{
						res = false;
						break;
					}
				}

				if (res)
				{
					ths = table.getElementsByTagName("TH");
					for (i = 0; i < ths.length; i++)
					{
						if (ths[i].getAttribute('data-bx-tmp-align') != value)
						{
							res = false;
							break;
						}
					}
				}

				if (res)
				{
					alignTable(table, value);
				}
			}

			function createAlignNodeInside(node, value)
			{
				var alignNode = BX.create("DIV", {style: {textAlign: value}, html: node.innerHTML}, _this.editor.GetIframeDoc());
				node.innerHTML = '';
				node.appendChild(alignNode);
				return alignNode;
			}

			function createAlignNodeOutside(node, value)
			{
				var alignNode = BX.create("DIV", {style: {textAlign: value}}, _this.editor.GetIframeDoc());
				node.parentNode.insertBefore(alignNode, node);
				alignNode.appendChild(node);
				return alignNode;
			}

			function checkListItemsAlign(list, item, value)
			{
				var
					doc = _this.editor.GetIframeDoc(),
					bb = _this.editor.bbCode;
				if (!list && item)
				{
					list = BX.findParent(item, function(n)
					{
						return n.nodeName == 'OL' || n.nodeName == 'UL' || n.nodeName == 'MENU';
					}, doc);
				}

				if (list && !list.getAttribute(LIST_ALIGN_ATTR))
				{
					var
						i, clean = true,
						lis = list.getElementsByTagName('LI');

					for (i = 0; i < lis.length; i++)
					{
						if (lis[i].style.textAlign !== value)
						{
							clean = false;
							break;
						}
					}

					if (bb)
					{
						list.style.textAlign = '';
						if (list.style.cssText == '')
						{
							list.removeAttribute('style');
						}
						cleanListItemsAlign(list);

						createAlignNodeOutside(list, value);
					}
					else if (clean)
					{
						list.style.textAlign = value;
						cleanListItemsAlign(list);
					}

					list.setAttribute(LIST_ALIGN_ATTR, 'Y');
					return list;
				}

				return false;
			}

			function cleanListItemsAlign(list)
			{
				var i, lis = list.getElementsByTagName('LI');
				for (i = 0; i < lis.length; i++)
				{
					lis[i].style.textAlign = '';
					if (lis[i].style.cssText == '')
					{
						lis[i].removeAttribute('style');
					}
				}
			}

			function pushTable(arr, newTable)
			{
				if (newTable && newTable.nodeName == 'TABLE')
				{
					var i, found = false;
					for (i = 0; i < arr.length; i++)
					{
						if (arr[i] == newTable)
						{
							found = true;
							break;
						}
					}
					if (!found)
					{
						arr.push(newTable);
					}
				}
				return arr;
			}

			return {
				exec: function(action, value)
				{
					var res;

					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						var
							i,
							tagName = 'P',
							range = _this.editor.selection.GetRange(),
							blockElement = false,
							tableElement = false,
							listNode = false,
							bookmark = _this.editor.selection.GetBookmark(),
							selectedNode = _this.editor.selection.GetSelectedNode();


						if (selectedNode)
						{
							if (_this.editor.util.IsBlockNode(selectedNode))
							{
								blockElement = selectedNode;
							}
							else if (selectedNode.nodeType == 1 && TABLE_NODES[selectedNode.nodeName])
							{
								tableElement = selectedNode;
								res = true;
								setTimeout(function(){
									_this.editor.selection.SelectNode(tableElement);
									if (tableElement.nodeName == 'TABLE')
									{
										alignTable(tableElement, value);
									}
								}, 10);
							}
							else
							{
								if (selectedNode.nodeName == 'LI')
								{
									listNode = selectedNode;
								}
								else if (selectedNode.nodeName == 'OL' || selectedNode.nodeName == 'UL' || selectedNode.nodeName == 'MENU')
								{
									if (_this.editor.bbCode)
									{
										createAlignNodeOutside(selectedNode, value);
										selectedNode.style.textAlign = '';
									}
									else
									{
										selectedNode.style.textAlign = value;
									}
									res = true;
									cleanListItemsAlign(selectedNode);
									setTimeout(function(){_this.editor.selection.SelectNode(selectedNode);}, 10);
								}
								else
								{
									listNode = BX.findParent(selectedNode, function(n)
									{
										return n.nodeName == 'LI';
									}, _this.document.body);

								}

								if (listNode)
								{
									if (_this.editor.bbCode)
									{
										createAlignNodeInside(listNode, value);
										listNode.style.textAlign = '';
									}
									else
									{
										listNode.style.textAlign = value;
									}
									res = true;
									setTimeout(function(){_this.editor.selection.SelectNode(listNode);}, 10);
								}
								else
								{
									blockElement = BX.findParent(selectedNode, function(n)
									{
										return _this.editor.util.IsBlockNode(n) && !_this.actions.quote.checkNode(n);
									}, _this.document.body);
								}
							}
						}
						else
						{
							// In Chrome when we select some parts of table we apply align for tds, but if entire table was selected - we trying to continue align other elements.
							var
								tables = [],
								tableIsHere = false,
								arLists = [], arLis = [],
								nodes = range.getNodes([1]);

							for (i = 0; i < nodes.length; i++)
							{
								if (isCell(nodes[i]))
								{
									tables = pushTable(tables, BX.findParent(nodes[i], {tagName: 'TABLE'}));
									alignTableNode(nodes[i], value);
									res = true;
								}

								if (nodes[i].nodeName == 'TABLE')
								{
									tables = pushTable(tables, nodes[i]);
									tableIsHere = true;
								}
								else if (nodes[i].nodeName == 'OL' || nodes[i].nodeName == 'UL' || nodes[i].nodeName == 'MENU')
								{
									nodes[i].style.textAlign = value;
									arLists.push(nodes[i]);
									res = true;
								}
								else if (nodes[i].nodeName == 'LI')
								{
									nodes[i].style.textAlign = value;
									res = true;
									arLis.push(nodes[i]);
								}
							}

							for (i = 0; i < tables.length; i++)
							{
								checkAlignTable(tables[i], value);
							}

							// Example: ctra+a was pressed
							if (res)
							{
								var commonAncestor = _this.editor.selection.GetCommonAncestorForRange(range);
								if (commonAncestor && commonAncestor.nodeName == 'BODY')
								{
									res = false;
								}
							}

							for (i = 0; i < arLists.length; i++)
							{
								cleanListItemsAlign(arLists[i]);
							}
							var arCheckedLists = [], checkedList;

							for (i = 0; i < arLis.length; i++)
							{
								checkedList = checkListItemsAlign(false, arLis[i], value);
								if (checkedList)
								{
									arCheckedLists.push(checkedList);
								}
							}
							for (i = 0; i < arCheckedLists.length; i++)
							{
								arCheckedLists[i].removeAttribute(LIST_ALIGN_ATTR);
							}
						}

						if (!res)
						{
							// Simple situation - we inside of the block element - just add text-align to it...
							if (blockElement)
							{
								if (_this.editor.bbCode)
								{
									createAlignNodeInside(blockElement, value);
									blockElement.style.textAlign = '';
								}
								else
								{
									// Accept all block tags except DIVs
									tagName = blockElement.tagName != 'DIV' ? blockElement.tagName : 'P';
									res = _this.actions.formatBlock.exec('formatBlock', tagName, null, {textAlign: value});
								}
								_this.editor.util.Refresh(blockElement);
							}
							else if(tableElement)
							{
								if (isCell(tableElement))
								{
									alignTableNode(tableElement, value);
								}
								else
								{
									var
										tds = BX.findChild(tableElement, isCell, true, true),
										ths = BX.findChild(tableElement, isCell, true, true);

									for (i = 0; i < tds.length; i++)
									{
										alignTableNode(tds[i], value);
									}
									for (i = 0; i < ths.length; i++)
									{
										alignTableNode(ths[i], value);
									}
								}
							}
							else if (range.collapsed)
							{
								res = _this.actions.formatBlock.exec('formatBlock', 'P', null, {textAlign: value});
							}
							else
							{
								// Image selected
								var image = _this.actions.insertImage.state();

								if (!res && false)
								{
									var onlyPar = true;
									nodes = range.getNodes([1]);
									if (nodes && nodes.length > 0)
									{
										for (i = 0; i < nodes.length; i++)
										{
											if (nodes[i].nodeName == "P")
											{
												nodes[i].style.textAlign = value;
											}
											else
											{
												onlyPar = false;
											}
										}
										res = onlyPar;
									}
								}

								// Mixed content
								if (!res)
								{
									tagName = _this.editor.bbCode ? 'DIV' : 'P';

									res = _this.actions.formatBlock.exec('formatBlock', tagName, null, {textAlign: value}, {leaveChilds: true});

									if (res && typeof res == 'object' && res.nodeName == tagName)
									{

										var
											iter = 0, maxIter = 2000, prev,
											child, newPar, createNewPar = false;

										// mantis:#54026
										if (res.firstChild && res.firstChild.nodeName == 'BLOCKQUOTE')
										{
											prev = _this.editor.util.GetPreviousNotEmptySibling(res);
											if (prev && prev.nodeName == 'BLOCKQUOTE' && _this.editor.util.IsEmptyNode(prev))
											{
												BX.remove(prev);
											}
										}

										i = 0;

										while (i < res.childNodes.length || iter > maxIter)
										{
											child = res.childNodes[i];
											if(_this.editor.util.IsBlockNode(child))
											{
												child.style.textAlign = value;
												createNewPar = true;
												i++;
											}
											else
											{
												if (!newPar || createNewPar)
												{
													newPar = _this.document.createElement(tagName);
													newPar.style.textAlign = value;
													res.insertBefore(newPar, child);
													i++;
												}

												newPar.appendChild(child);
												createNewPar = false;
											}
											iter++;
										}

										// Clean useless <p></p> before and after
										if (res.previousSibling && res.previousSibling.nodeName == "P" && _this.editor.util.IsEmptyNode(res.previousSibling, true, true))
										{
											BX.remove(res.previousSibling);
										}
										if (res.nextSibling && res.nextSibling.nodeName == "P" && _this.editor.util.IsEmptyNode(res.nextSibling, true, true))
										{
											BX.remove(res.nextSibling);
										}
										_this.editor.util.ReplaceWithOwnChildren(res);
									}
								}

								if (image)
								{
									// For Firefox
									_this.editor.util.Refresh(image);
								}
							}
						}

						setTimeout(function(){_this.editor.selection.SetBookmark(bookmark);}, 10);
					}
					else // bbcode + textarea
					{
						if (value)
						{
							res = _this.actions.formatBbCode.exec(action, {tag: value.toUpperCase()});
						}
					}

					return res;
				},
				state: function(action, value)
				{
					var
						alignRes, node,
						selectedNode = _this.editor.selection.GetSelectedNode();

					if (selectedNode)
					{
						alignRes = checkNodeAlign(selectedNode);
						if (!alignRes)
						{
							node = BX.findParent(selectedNode, function(n)
							{
								alignRes = checkNodeAlign(n);
								return alignRes;
							}, _this.document.body);
						}

						return {
							node: alignRes ? alignRes.node : null,
							value: alignRes ? (alignRes.style || alignRes.attribute) : DEFAULT_VALUE,
							res: alignRes
						};
					}
					else
					{
						var
							result = {node: null, value: DEFAULT_VALUE, res: true},
							range = _this.editor.selection.GetRange();
						if (!range.collapsed)
						{
							var
								alRes,
								curValue = '', i,
								nodes = range.getNodes([1]);

							for (i = 0; i < nodes.length; i++)
							{
								if (!_this.editor.util.CheckSurrogateNode(nodes[i]) &&
									nodes[i].nodeName !== 'BR' &&
									_this.editor.util.GetNodeDomOffset(nodes[i]) == 0
									)
								{
									alRes = checkNodeAlign(nodes[i]);
									value = alRes ? (alRes.style || alRes.attribute) : DEFAULT_VALUE;

									if (!curValue)
									{
										curValue = value;
									}

									if (value != curValue)
									{
										result.res = false;
										break;
									}

								}
							}
							if (result.res)
							{
								result.value = curValue;
							}
						}
						else
						{
							result.res = false;
						}

						return result;
					}
				},
				value: BX.DoNothing
			};
		},

		GetIndent: function()
		{
			var _this = this;
			return {
				exec: function(action, value)
				{
					if (_this.IsSupportedByBrowser(action))
					{
						_this.document.execCommand(action);
					}
					else
					{
						_this.actions.formatBlock.exec('formatBlock', 'BLOCKQUOTE');
					}

					var range = _this.editor.selection.GetRange();
					if (range)
					{
						var i, nodes = range.getNodes([1]);
						if (range.collapsed && range.startContainer && nodes.length == 0)
						{
							var bq = BX.findParent(range.startContainer, {tag: 'BLOCKQUOTE'});
							bq.removeAttribute('style');
							var invis_text = _this.editor.util.GetInvisibleTextNode();
							bq.appendChild(invis_text);
							_this.editor.selection.SetAfter(invis_text);
						}

						for (i = 0; i < nodes.length; i++)
						{
							if (nodes[i].nodeName == 'BLOCKQUOTE')
							{
								nodes[i].removeAttribute('style');
							}
						}
					}
				},
				state: function(action, value)
				{
					var
						res = false,
						range = _this.editor.selection.GetRange();
					if (range)
					{
						var commonAncestor = _this.editor.selection.GetCommonAncestorForRange(range);
						if (commonAncestor && commonAncestor.nodeType == 1 && commonAncestor.nodeName === 'BLOCKQUOTE')
						{
							res = commonAncestor;
						}
					}
					return res;
				},
				value: BX.DoNothing
			};
		},

		GetOutdent: function()
		{
			var _this = this;
			return {
				exec: function(action, value)
				{
					var
						i,
						attr = 'data-bx-tmp-flag',
						doc = _this.editor.GetIframeDoc(),
						blockNodes = doc.getElementsByTagName('BLOCKQUOTE');

					//if (blockNodes && blockNodes.length > 0)
					{
						var
							parNodesToClear = [],
							parNodes = doc.getElementsByTagName('P');
						for (i = 0; i < parNodes.length; i++)
						{
							parNodes[i].setAttribute(attr, 'Y');
						}
						_this.document.execCommand(action);

						parNodes = doc.getElementsByTagName('P');
						for (i = 0; i < parNodes.length; i++)
						{
							if (!parNodes[i].getAttribute(attr))
							{
								parNodesToClear.push(parNodes[i]);
							}
							else
							{
								parNodes[i].removeAttribute(attr);
							}
						}

						_this.editor.selection.ExecuteAndRestoreSimple(function()
						{
							for (i = 0; i < parNodesToClear.length; i++)
							{
								_this.actions.formatBlock.addBrBeforeAndAfter(parNodesToClear[i]);
								_this.editor.util.ReplaceWithOwnChildren(parNodesToClear[i]);
							}
						});
					}
				},
				state: function(action, value)
				{
					var
						range = _this.editor.selection.GetRange();

					return false;
				},
				value: BX.DoNothing
			};
		},

		GetFontFamily: function()
		{
			var _this = this;
			return {
				exec: function(action, value)
				{
					var res;

					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						if (value)
							res = _this.actions.formatInline.exec(action, value, "span", {fontFamily: value});
						else // Clear fontFamily format
							res = _this.actions.formatInline.exec(action, value, "span", {fontFamily: null}, null, {bClear: true});
					}
					else // textarea + bbcode
					{
						return _this.actions.formatBbCode.exec(action, {tag: 'FONT', value: value});
					}

					return res;
				},

				state: function(action, value)
				{
					return _this.actions.formatInline.state(action, value, "span", {fontFamily: value});
				},

				value: BX.DoNothing
			};
		},

		GetFormatStyle: function()
		{
			var
				_this = this,
				blockTags = _this.editor.GetBlockTags();

			function isNodeSuitable(node)
			{
				if (node && node.nodeType == 1 && node.nodeName !== 'BODY' && BX.util.in_array(node.nodeName, blockTags))
				{
					return !_this.editor.GetBxTag(node.id).tag;
				}
				return false;
			}

			return {
				exec: function(action, value)
				{
					if (!value) // Clear font style
					{
						return _this.actions.formatBlock.exec('formatBlock', null);
					}
					else if (typeof value === 'string') // Tag name - H1, H2
					{
						return _this.actions.formatBlock.exec('formatBlock', value);
					}
					else if (typeof value === 'object') // class name from template-s css
					{
						//return _this.actions.formatInline.exec(action, value, "span", {fontFamily: value});
					}
				},

				state: function(action, value)
				{
					var
						result = false,
						selectedNode = _this.editor.selection.GetSelectedNode();

					if (selectedNode)
					{
						if (isNodeSuitable(selectedNode))
						{
							result = selectedNode;
						}
						else
						{
							result = BX.findParent(selectedNode, isNodeSuitable, _this.document.body);
						}
					}
					else
					{
						var
							range = _this.editor.selection.GetRange(),
							commonAncestor = _this.editor.selection.GetCommonAncestorForRange(range);

						if (isNodeSuitable(commonAncestor))
						{
							result = commonAncestor;
						}
					}

					return result;
				},

				value: BX.DoNothing
			};
		},

		GetChangeTemplate: function()
		{
			var _this = this;
			return {
				exec: function(action, value)
				{
					_this.editor.ApplyTemplate(value);
				},

				state: function(action, value)
				{
					return _this.editor.GetTemplateId();
				},

				value: BX.DoNothing
			};
		},

		GetSelectNode: function()
		{
			var _this = this;
			return {
				exec: function(action, node)
				{
					if (!_this.editor.iframeView.IsFocused())
					{
						_this.editor.iframeView.Focus();
					}

					if (node === false || (node && node.nodeName == 'BODY')) // Select all
					{
						if (_this.IsSupportedByBrowser('SelectAll'))
						{
							_this.document.execCommand('SelectAll');
						}
						else
						{
							_this.editor.selection.SelectNode(node);
						}
					}
					else
					{
						_this.editor.selection.SelectNode(node);

					}
				},

				state: BX.DoNothing,
				value: BX.DoNothing
			};
		},

		GetUndoRedo: function(bUndo)
		{
			var _this = this;
			return {
				exec: function(action)
				{
					if (action == 'doUndo')
					{
						_this.editor.undoManager.Undo();
					}
					else if(action == 'doRedo')
					{
						_this.editor.undoManager.Redo();
					}
				},
				state: BX.DoNothing,
				value: BX.DoNothing
			};
		},

		GetUniversalFormatStyle: function()
		{
			var
				TEMP_CLASS = 'bx-tmp-ufs-class',
				STATUS_ATTR = 'data-bx-tmp-status',
				_this = this;

			function getAncestorNodes(nodes)
			{
				var result = [];
				if (nodes && nodes.length > 0)
				{
					var
						i, len, sorted = [], node, status;
					for (i = 0, len = nodes.length; i < len; i++)
					{
						if (!_this.editor.util.CheckSurrogateNode(nodes[i]) && nodes[i].nodeName !== 'BR')
						{
							nodes[i].setAttribute(STATUS_ATTR, 'Y');
							sorted.push({node: nodes[i], nesting: _this.editor.util.GetNodeDomOffset(nodes[i])});
						}
					}
					sorted = sorted.sort(function(a, b){return a.nesting - b.nesting});
					for (i = 0, len = sorted.length; i < len; i++)
					{
						node = sorted[i].node;
						status = node.getAttribute(STATUS_ATTR);
						if (status == 'Y' && !findUnIncludedNodes(node))
						{
							// Prevent including all childs of this node to result
							BX.findChild(node, function(n)
							{
								if (n.nodeType == 1 && n.nodeName !== 'BR' && n.setAttribute)
								{
									n.setAttribute(STATUS_ATTR, n.className == TEMP_CLASS ? 'GET_RID_OF' : 'SKIP');
								}
								return false;
							}, true, true);

							result.push(node);
						}
					}
				}
				return result;
			}

			function findUnIncludedNodes(node)
			{
				var res = BX.findChild(node, function(n)
				{
					return n.nodeType == 1 && n.nodeName !== 'BR' && n.getAttribute && n.getAttribute(STATUS_ATTR) !== 'Y';
				}, true, false);
				return !!res;
			}

			function adjustNodeStyle(node, className, style)
			{
				try
				{
					if (className !== false)
					{
						if (className == '')
						{
							node.removeAttribute('class');
						}
						else
						{
							node.className = className;
						}
					}
					if (style !== false)
					{
						if (style == '')
						{
							node.removeAttribute('style');
						}
						else
						{
							node.style.cssText = style;
						}
					}
				}
				catch(e)
				{}
			}

			return {
				exec: function(action, value)
				{
					if (value.nodes && value.nodes.length > 0)
					{
						for (i = 0; i < value.nodes.length; i++)
						{
							adjustNodeStyle(value.nodes[i], value.className, value.style);
						}
					}
					else
					{
						_this.actions.formatInline.exec(action, value, "span", false, TEMP_CLASS);

						var tmpSpanNodes = _this.editor.GetIframeDoc().querySelectorAll('.' + TEMP_CLASS);
						if (tmpSpanNodes)
						{
							for (i = 0; i < tmpSpanNodes.length; i++)
							{
								node = tmpSpanNodes[i];
								if (BX.util.trim(node.innerHTML) == '')
								{
									_this.editor.util.ReplaceWithOwnChildren(node);
								}
							}
						}

						var
							i, node,
							nodes = _this.actions.universalFormatStyle.state(action),
							existNodes = getAncestorNodes(nodes);

						for (i = 0; i < existNodes.length; i++)
						{
							adjustNodeStyle(existNodes[i], value.className, value.style);
						}

						tmpSpanNodes = _this.editor.GetIframeDoc().querySelectorAll('.' + TEMP_CLASS);
						if (tmpSpanNodes)
						{
							for (i = 0; i < tmpSpanNodes.length; i++)
							{
								node = tmpSpanNodes[i];
								if (node.getAttribute(STATUS_ATTR) == 'GET_RID_OF')
								{
									_this.editor.util.ReplaceWithOwnChildren(tmpSpanNodes[i]);
								}
								else
								{
									adjustNodeStyle(tmpSpanNodes[i], value.className, value.style);
								}
							}
						}
					}
				},
				state: function(action)
				{
					var range = _this.editor.selection.GetRange();

					if (range)
					{
						var
							textNodes, textNode, node,
							nodes = range.getNodes([1]);

						// Range is collapsed or text node is selected
						if (nodes.length == 0)
						{
							textNodes = range.getNodes([3]);
							if (textNodes && textNodes.length == 1)
							{
								textNode = textNodes[0];
							}

							if (!textNode && range.startContainer == range.endContainer)
							{
								if (range.startContainer.nodeType == 3)
								{
									textNode = range.startContainer;
								}
								else
								{
									_this.editor.selection.SelectNode(range.startContainer);
									nodes = [range.startContainer];
								}
							}

							if (textNode && nodes.length == 0)
							{
								node = textNode.parentNode;
								if (node)
								{
									nodes = [node];
								}
							}
						}
						return nodes;
					}
				},
				value: BX.DoNothing
			};
		},

		GetSubSup: function(type)
		{
			var _this = this;

			type = type == 'sup' ? 'sup' : 'sub';

			return {
				exec: function(action, value)
				{
					return _this.actions.formatInline.exec(action, value, type);
				},
				state: function(action, value)
				{
					return _this.actions.formatInline.state(action, value, type);
				},
				value: BX.DoNothing
			};
		},

		GetQuote: function()
		{
			var
				range,
				externalSelection,
				_this = this;

			function checkNode(n)
			{
				return n && n.className == 'bxhtmled-quote' && n.nodeName == 'BLOCKQUOTE';
			}

			function setExternalSelection(text)
			{
				externalSelection = text;
			}
			function getExternalSelection()
			{
				return externalSelection;
			}
			function setRange(rng)
			{
				return range = rng;
			}

			return {
				exec: function(action)
				{
					var
						res = false,
						sel = getExternalSelection();

					if (_this.editor.bbCode && _this.editor.synchro.IsFocusedOnTextarea())
					{
						_this.editor.textareaView.Focus();
						if(sel)
						{
							res = _this.editor.textareaView.WrapWith(false, false, "[QUOTE]" + sel + "[/QUOTE]");
						}
						else
						{
							res = _this.actions.formatBbCode.exec(action, {tag: 'QUOTE'});
						}
					}
					else
					{
						if(sel)
						{
							_this.editor.iframeView.Focus();
							if (range)
								_this.editor.selection.SetSelection(range);
							_this.editor.InsertHtml('<blockquote class="bxhtmled-quote">' + sel + '</blockquote>' + _this.editor.INVISIBLE_SPACE, range);
						}
						else
						{
							res = _this.actions.formatBlock.exec('formatBlock', 'blockquote', 'bxhtmled-quote', false, {range: range});
						}
					}
					return res;
				},
				state: function()
				{
					return _this.actions.formatBlock.state('formatBlock', 'blockquote', 'bxhtmled-quote');
				},
				value: BX.DoNothing,
				setExternalSelection : setExternalSelection,
				getExternalSelection : getExternalSelection,
				setRange : setRange,
				checkNode: checkNode
			};
		},

		GetCode: function()
		{
			var _this = this;
			return {
				exec: function(action)
				{
					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						var codeElement = _this.actions.code.state();
						if (codeElement)
						{
							_this.editor.selection.ExecuteAndRestoreSimple(function()
							{
								codeElement.className = '';
								codeElement = _this.editor.util.RenameNode(codeElement, 'P');
							});
						}
						else
						{
							_this.actions.formatBlock.exec('formatBlock', 'pre', 'bxhtmled-code');
						}
					}
					else // bbcode + textarea
					{
						return _this.actions.formatBbCode.exec(action, {tag: 'CODE'});
					}
				},
				state: function()
				{
					return _this.actions.formatBlock.state('formatBlock', 'pre', 'bxhtmled-code');
				},
				value: BX.DoNothing
			};
		},

		GetInsertSmile: function()
		{
			var _this = this;
			return {
				exec: function(action, value)
				{
					var smile = _this.editor.smilesIndex[value];
					if (_this.editor.bbCode && _this.editor.synchro.IsFocusedOnTextarea())
					{
						_this.editor.textareaView.Focus();
						_this.editor.textareaView.WrapWith(false, false, smile.code);
					}
					else
					{
						_this.editor.iframeView.Focus();
						if (smile)
						{
							var smileImg = BX.create("IMG", {props:
							{
								src: smile.path,
								title: smile.name || smile.code
							}});
							_this.editor.SetBxTag(smileImg, {tag: "smile", params: smile});
							_this.editor.selection.InsertNode(smileImg);

							_this.editor.selection.SetAfter(smileImg);
							setTimeout(function(){_this.editor.selection.SetAfter(smileImg);}, 10);
						}
					}
				},
				state: BX.DoNothing,
				value: BX.DoNothing
			};
		},

		GetFormatBbCode: function()
		{
			var _this = this;
			return {
				view: 'textarea',
				exec: function(action, params)
				{
					var
						value = params.value,
						tag = params.tag.toUpperCase(),
						tag_end = tag;

					if (tag == 'FONT' || tag == 'COLOR' || tag == 'SIZE')
					{
						tag += "=" + value;
					}

					_this.editor.textareaView.WrapWith("[" + tag + "]", "[/" + tag_end + "]");
				},
				state: BX.DoNothing,
				value: BX.DoNothing
			};
		}
	};

	top.BXEditorActions = window.BXEditorActions = BXEditorActions;
})();

/* End */
;
; /* Start:/bitrix/js/fileman/html_editor/html-views.js*/
/**
 * Bitrix HTML Editor 3.0
 * Date: 24.04.13
 * Time: 4:23
 *
 * Views class
 */
(function()
{

function BXEditorView(editor, element, container)
{
	this.editor = editor;
	this.element = element;
	this.container = container;
	this.config = editor.config || {};
	this.isShown = null;
	this.bbCode = editor.bbCode;
	BX.addCustomEvent(this.editor, "OnClickBefore", BX.proxy(this.OnClick, this));
}

BXEditorView.prototype = {
	Focus: function()
	{
		if (this.element.ownerDocument.querySelector(":focus") === this.element)
			return;

		try{this.element.focus();}catch(e){}
	},

	Hide: function()
	{
		this.isShown = false;
		this.container.style.display = "none";
	},

	Show: function()
	{
		this.isShown = true;
		this.container.style.display = "";
	},

	Disable: function()
	{
		this.element.setAttribute("disabled", "disabled");
	},

	Enable: function()
	{
		this.element.removeAttribute("disabled");
	},

	OnClick: function(params)
	{

	},

	IsShown: function()
	{
		return !!this.isShown;
	}
};


function BXEditorTextareaView(parent, textareaElement, container)
{
	// Call parrent constructor
	BXEditorIframeView.superclass.constructor.apply(this, arguments);
	this.name = "textarea";
	this.InitEventHandlers();

	if (!this.element.value && this.editor.config.content)
		this.SetValue(this.editor.config.content, false);
}

BX.extend(BXEditorTextareaView, BXEditorView);

BXEditorTextareaView.prototype.Clear = function()
{
	this.element.value = "";
};

BXEditorTextareaView.prototype.GetValue = function(bParse)
{
	var value = this.IsEmpty() ? "" : this.element.value;

	if (bParse)
	{
		value = this.parent.parse(value);
	}

	return value;
};

BXEditorTextareaView.prototype.SetValue = function(html, bParse, bFormat)
{
	if (bParse)
	{
		html = this.editor.Parse(html, true, bFormat);
	}

	this.editor.dom.pValueInput.value = this.element.value = html;
};


BXEditorTextareaView.prototype.SaveValue = function()
{
	if (this.editor.inited)
	{
		this.editor.dom.pValueInput.value = this.element.value;
	}
};

BXEditorTextareaView.prototype.HasPlaceholderSet = function()
{
	return false;
	var
		supportsPlaceholder = supportsPlaceholderAttributeOn(this.element),
		placeholderText = this.element.getAttribute("placeholder") || null,
		value = this.element.value,
		isEmpty = !value;
	return (supportsPlaceholder && isEmpty) || (value === placeholderText);
};

BXEditorTextareaView.prototype.IsEmpty = function()
{
	var value = BX.util.trim(this.element.value);
	return value === '' || this.HasPlaceholderSet();
};

BXEditorTextareaView.prototype.InitEventHandlers = function()
{
	var _this = this;
	BX.bind(this.element, "focus", function()
	{
		_this.editor.On("OnTextareaFocus");
		_this.isFocused = true;
	});

	BX.bind(this.element, "blur", function()
	{
		_this.editor.On("OnTextareaBlur");
		_this.isFocused = false;
	});

	BX.bind(this.element, "keydown", function(e)
	{
		// Handle Ctrl+Enter
		if ((e.ctrlKey || e.metaKey) && !e.altKey && e.keyCode === _this.editor.KEY_CODES["enter"])
		{
			_this.editor.On('OnCtrlEnter', [e, _this.editor.GetViewMode()]);
			return BX.PreventDefault(e);
		}
	});
};

BXEditorTextareaView.prototype.IsFocused = function()
{
	return this.isFocused;
};

BXEditorTextareaView.prototype.ScrollToSelectedText = function(searchText)
{
// http://blog.blupixelit.eu/scroll-textarea-to-selected-word-using-javascript-jquery/
//	var parola_cercata = "parola"; // the searched word
//	var posi = jQuery('#my_textarea').val().indexOf(parola_cercata); // take the position of the word in the text
//	if (posi != -1) {
//		var target = document.getElementById("my_textarea");
//		// select the textarea and the word
//		target.focus();
//		if (target.setSelectionRange)
//			target.setSelectionRange(posi, posi+parola_cercata.length);
//		else {
//			var r = target.createTextRange();
//			r.collapse(true);
//			r.moveEnd('character',  posi+parola_cercata);
//			r.moveStart('character', posi);
//			r.select();
//		}
//		var objDiv = document.getElementById("my_textarea");
//		var sh = objDiv.scrollHeight; //height in pixel of the textarea (n_rows*line_height)
//		var line_ht = jQuery('#my_textarea').css('line-height').replace('px',''); //height in pixel of each row
//		var n_lines = sh/line_ht; // the total amount of lines
//		var char_in_line = jQuery('#insert_textarea').val().length / n_lines; // amount of chars for each line
//		var height = Math.floor(posi/char_in_line); // amount of lines in the textarea
//		jQuery('#my_textarea').scrollTop(height*line_ht); // scroll to the selected line
//	} else {
//		alert('parola '+parola_cercata+' non trovata'); // alert word not found
//	}
};

BXEditorTextareaView.prototype.SelectText = function(searchText)
{
	var
		value = this.element.value,
	 	ind = value.indexOf(searchText);

	if(ind != -1)
	{
		this.element.focus();
		this.element.setSelectionRange(ind, ind + searchText.length);
	}
};

BXEditorTextareaView.prototype.GetTextSelection = function()
{
	var res = false;
	if (this.element.selectionStart != undefined)
	{
		res = this.element.value.substr(this.element.selectionStart, this.element.selectionEnd - this.element.selectionStart);
	}
	else if (document.selection && document.selection.createRange)
	{
		res = document.selection.createRange().text;
	}
	else if (window.getSelection)
	{
		res = window.getSelection();
		res = res.toString();
	}

	return res;
};

BXEditorTextareaView.prototype.WrapWith = function (tagBegin, tagEnd, postText)
{
	if (!tagBegin)
		tagBegin = "";
	if (!tagEnd)
		tagEnd = "";
	if (!postText)
		postText = "";

	if (tagBegin.length <= 0 && tagEnd.length <= 0 && postText.length <= 0)
		return true;

	var
		bReplaceText = !!postText,
		selectedText = this.GetTextSelection(),
		mode = (selectedText ? 'select' : (bReplaceText ? 'after' : 'in'));

	//if (!this.bTextareaFocus)
	//	this.pTextarea.focus(); // BUG IN IE

	if (bReplaceText)
	{
		postText = tagBegin + postText + tagEnd;
	}
	else if (selectedText)
	{
		postText = tagBegin + selectedText + tagEnd;
	}
	else
	{
		postText = tagBegin + tagEnd;
	}

	if (this.element.selectionStart != undefined)
	{
		var
			currentScroll = this.element.scrollTop,
			start = this.element.selectionStart,
			end = this.element.selectionEnd;

		this.element.value = this.element.value.substr(0, start) + postText + this.element.value.substr(end);

		if (mode == 'select')
		{
			this.element.selectionStart = start;
			this.element.selectionEnd = start + postText.length;
		}
		else if (mode == 'in')
		{
			this.element.selectionStart = this.element.selectionEnd = start + tagBegin.length;
		}
		else
		{
			this.element.selectionStart = this.element.selectionEnd = start + postText.length;
		}
		this.element.scrollTop = currentScroll;
	}
	else if (document.selection && document.selection.createRange)
	{
		var sel = document.selection.createRange();
		var selection_copy = sel.duplicate();
		postText = postText.replace(/\r?\n/g, '\n');
		sel.text = postText;
		sel.setEndPoint('StartToStart', selection_copy);
		sel.setEndPoint('EndToEnd', selection_copy);

		if (mode == 'select')
		{
			sel.collapse(true);
			postText = postText.replace(/\r\n/g, '1');
			sel.moveEnd('character', postText.length);
		}
		else if (mode == 'in')
		{
			sel.collapse(false);
			sel.moveEnd('character', tagBegin.length);
			sel.collapse(false);
		}
		else
		{
			sel.collapse(false);
			sel.moveEnd('character', postText.length);
			sel.collapse(false);
		}
		sel.select();
	}
	else
	{
		// failed - just stuff it at the end of the message
		this.element.value += postText;
	}
	return true;
};


function BXEditorIframeView(editor, textarea, container)
{
	// Call parrent constructor
	BXEditorIframeView.superclass.constructor.apply(this, arguments);
	this.name = "wysiwyg";
	this.caretNode = "<br>";
}

BX.extend(BXEditorIframeView, BXEditorView);

BXEditorIframeView.prototype.OnCreateIframe = function()
{
	this.document = this.editor.sandbox.GetDocument();
	this.element = this.document.body;
	this.editor.document = this.document;
	this.textarea = this.editor.dom.textarea;
	this.isFocused = false;
	this.InitEventHandlers();

	// Check and init external range library
	window.rangy.init();

	this.Enable();
};

BXEditorIframeView.prototype.Clear = function()
{
	//this.element.innerHTML = BX.browser.IsFirefox() ? this.caretNode : "";
	this.element.innerHTML = this.caretNode;
};

BXEditorIframeView.prototype.GetValue = function(bParse, bFormat)
{
	var value = this.IsEmpty() ? "" : this.editor.GetInnerHtml(this.element);
	if (bParse)
	{
		value = this.editor.Parse(value, false, bFormat);
	}
	return value;
};

BXEditorIframeView.prototype.SetValue = function(html, bParse)
{
	if (bParse)
	{
		html = this.editor.Parse(html);
	}

	this.element.innerHTML = html;
	// Check last child - if it's block node in the end - add <br> tag there
	this.CheckContentLastChild(this.element);
	this.editor.On('OnIframeSetValue', [html]);
};

BXEditorIframeView.prototype.Show = function()
{
	this.isShown = true;
	this.container.style.display = "";
	this.ReInit();
};

BXEditorIframeView.prototype.ReInit = function()
{
	// Firefox needs this, otherwise contentEditable becomes uneditable
	this.Disable();
	this.Enable();

	this.editor.On('OnIframeReInit');
};

BXEditorIframeView.prototype.Hide = function()
{
	this.isShown = false;
	this.container.style.display = "none";
};

BXEditorIframeView.prototype.Disable = function()
{
	this.element.removeAttribute("contentEditable");
};

BXEditorIframeView.prototype.Enable = function()
{
	this.element.setAttribute("contentEditable", "true");
};

BXEditorIframeView.prototype.Focus = function(setToEnd)
{
	if (BX.browser.IsIE() && this.HasPlaceholderSet())
	{
		this.Clear();
	}

	if (this.element.ownerDocument.querySelector(":focus") !== this.element || !this.IsFocused())
	{
		BX.focus(this.element);
	}

	if (setToEnd && this.element.lastChild)
	{
		if (this.element.lastChild.nodeName === "BR")
		{
			this.editor.selection.SetBefore(this.element.lastChild);
		}
		else
		{
			this.editor.selection.SetAfter(this.element.lastChild);
		}
	}
};

BXEditorIframeView.prototype.SetFocusedFlag = function(isFocused)
{
	this.isFocused = isFocused;
};

BXEditorIframeView.prototype.IsFocused = function()
{
	return this.isFocused;
};

BXEditorIframeView.prototype.GetTextContent = function()
{
	return this.editor.util.GetTextContent(this.element);
};

BXEditorIframeView.prototype.HasPlaceholderSet = function()
{
	return this.GetTextContent() == this.textarea.getAttribute("placeholder");
};

BXEditorIframeView.prototype.IsEmpty = function()
{
	var
		innerHTML = this.element.innerHTML,
		elementsWithVisualValue = "blockquote, ul, ol, img, embed, object, table, iframe, svg, video, audio, button, input, select, textarea";

	return innerHTML === "" ||
		innerHTML === this.caretNode ||
		this.HasPlaceholderSet() ||
		(this.GetTextContent() === "" && !this.element.querySelector(elementsWithVisualValue));
};

BXEditorIframeView.prototype._initObjectResizing = function()
{
	var properties = ["width", "height"],
		propertiesLength = properties.length,
		element = this.element;

	this.commands.exec("enableObjectResizing", this.config.allowObjectResizing);

	if (this.config.allowObjectResizing) {
		// IE sets inline styles after resizing objects
		// The following lines make sure _this the width/height css properties
		// are copied over to the width/height attributes
		if (browser.supportsEvent("resizeend")) {
			dom.observe(element, "resizeend", function(event) {
				var target = event.target || event.srcElement,
					style = target.style,
					i = 0,
					property;
				for(; i<propertiesLength; i++) {
					property = properties[i];
					if (style[property]) {
						target.setAttribute(property, parseInt(style[property], 10));
						style[property] = "";
					}
				}
				// After resizing IE sometimes forgets to remove the old resize handles
				redraw(element);
			});
		}
	} else {
		if (browser.supportsEvent("resizestart")) {
			dom.observe(element, "resizestart", function(event) { event.preventDefault(); });
		}
	}
};

/**
 * With "setActive" IE offers a smart way of focusing elements without scrolling them into view:
 * http://msdn.microsoft.com/en-us/library/ms536738(v=vs.85).aspx
 *
 * Other browsers need a more hacky way: (pssst don't tell my mama)
 * In order to prevent the element being scrolled into view when focusing it, we simply
 * move it out of the scrollable area, focus it, and reset it's position
 */

var focusWithoutScrolling = function(element)
{
	if (element.setActive) {
		// Following line could cause a js error when the textarea is invisible
		// See https://github.com/xing/wysihtml5/issues/9
		try { element.setActive(); } catch(e) {}
	} else {
		var elementStyle = element.style,
			originalScrollTop = doc.documentElement.scrollTop || doc.body.scrollTop,
			originalScrollLeft = doc.documentElement.scrollLeft || doc.body.scrollLeft,
			originalStyles = {
				position: elementStyle.position,
				top: elementStyle.top,
				left: elementStyle.left,
				WebkitUserSelect: elementStyle.WebkitUserSelect
			};

		dom.setStyles({
			position: "absolute",
			top: "-99999px",
			left: "-99999px",
			// Don't ask why but temporarily setting -webkit-user-select to none makes the whole thing performing smoother
			WebkitUserSelect: "none"
		}).on(element);

		element.focus();

		dom.setStyles(originalStyles).on(element);

		if (win.scrollTo) {
			// Some browser extensions unset this method to prevent annoyances
			// "Better PopUp Blocker" for Chrome http://code.google.com/p/betterpopupblocker/source/browse/trunk/blockStart.js#100
			// Issue: http://code.google.com/p/betterpopupblocker/issues/detail?id=1
			win.scrollTo(originalScrollLeft, originalScrollTop);
		}
	}
};


/**
 * Taking care of events
 * - Simulating 'change' event on contentEditable element
 * - Handling drag & drop logic
 * - Catch paste events
 * - Dispatch proprietary newword:composer event
 * - Keyboard shortcuts
 */

	BXEditorIframeView.prototype.InitEventHandlers = function()
	{
		var
			_this = this,
			editor = this.editor,
			value = this.GetValue(),
			element = this.element,
			_element = !BX.browser.IsOpera() ? element : this.editor.sandbox.GetWindow();

		if (this._eventsInitedObject && this._eventsInitedObject === _element)
			return;

		this._eventsInitedObject = _element;

		BX.bind(_element, "focus", function()
		{
			_this.editor.On("OnIframeFocus");
			_this.isFocused = true;
			if (value !== _this.GetValue())
				BX.onCustomEvent(editor, "OnIframeChange");
		});

		BX.bind(_element, "blur", function()
		{
			_this.editor.On("OnIframeBlur");
			_this.isFocused = false;
			setTimeout(function(){value = _this.GetValue();}, 0);
		});

		BX.bind(_element, "contextmenu", function(e)
		{
			if(e && !e.ctrlKey && !e.shiftKey && (BX.getEventButton(e) & BX.MSRIGHT))
			{
				_this.editor.On("OnIframeContextMenu", [e, e.target || e.srcElement]);
			}
		});

		BX.bind(_element, "mousedown", function(e)
		{
			var
				target = e.target || e.srcElement,
				bxTag = _this.editor.GetBxTag(target);

			if (_this.editor.synchro.IsSyncOn())
			{
				_this.editor.synchro.StopSync();
			}

			if (BX.browser.IsIE10() || BX.browser.IsIE11())
			{
				_this.editor.phpParser.RedrawSurrogates();
			}

			if (target.nodeName == 'BODY' || !_this.editor.phpParser.CheckParentSurrogate(target))
			{
				setTimeout(function()
				{
					var range = _this.editor.selection.GetRange();
					if (range && range.collapsed && range.startContainer && range.startContainer == range.endContainer)
					{
						var surr = _this.editor.phpParser.CheckParentSurrogate(range.startContainer);
						if (surr)
						{
							_this.editor.selection.SetInvisibleTextAfterNode(surr);
							_this.editor.selection.SetInvisibleTextBeforeNode(surr);
						}
					}
				}, 10);
			}

			editor.selection.SaveRange();
			_this.editor.On("OnIframeMouseDown", [e, target, bxTag]);
		});

		BX.bind(_element, "touchstart", function(e)
		{
			_this.Focus();
		});

		BX.bind(_element, "click", function(e)
		{
			var
				target = e.target || e.srcElement;
			_this.editor.On("OnIframeClick", [e, target]);

			var selNode = _this.editor.selection.GetSelectedNode();

			//var node = _this.CheckParentSurrogate(_this.editor.selection.GetSelectedNode());
//			setTimeout(function()
//			{
//				var newSelNode = _this.editor.selection.GetSelectedNode();
//				if (selNode !== newSelNode)
//				{
//				}
//				var node = _this.CheckParentSurrogate(_this.editor.selection.GetSelectedNode());
//				if(node)
//				{
//					_this.editor.selection.SetAfter(node);
//
////					if (node.nextSibling && node.nextSibling.nodeType == 3 && _this.editor.util.IsEmptyNode(link.nextSibling))
////						invisText = link.nextSibling;
////					else
//					var invisText = _this.editor.util.GetInvisibleTextNode();
//					_this.editor.selection.InsertNode(invisText);
//					_this.editor.selection.SetAfter(invisText);
//				}
//			}, 0);
		});

		BX.bind(_element, "dblclick", function(e)
		{
			var
				target = e.target || e.srcElement;
			_this.editor.On("OnIframeDblClick", [e, target]);
		});

		BX.bind(_element, "mouseup", function(e)
		{
			var target = e.target || e.srcElement;
			if (!_this.editor.synchro.IsSyncOn())
			{
				_this.editor.synchro.StartSync();
			}

			_this.editor.On("OnIframeMouseUp", [e, target]);
		});

		// resizestart
		// resizeend
		if (BX.browser.IsIOS() && false)
		{
			// When on iPad/iPhone/IPod after clicking outside of editor, the editor loses focus
			// but the UI still acts as if the editor has focus (blinking caret and onscreen keyboard visible)
			// We prevent _this by focusing a temporary input element which immediately loses focus

			BX.bind(element, "blur", function()
			{
				var
					input = BX.create('INPUT', {props: {type: 'text', value: ''}}, element.ownerDocument),
					originalScrollTop = document.documentElement.scrollTop || document.body.scrollTop,
					originalScrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

				try
				{
					_this.editor.selection.InsertNode(input);
				}
				catch(e)
				{
					element.appendChild(input);
				}

				BX.focus(input);
				BX.remove(input);
				window.scrollTo(originalScrollLeft, originalScrollTop);
			});
		}

		// --------- Drag & Drop events  ---------
		BX.bind(element, "dragover", function(){_this.editor.On("OnIframeDragOver");});
		BX.bind(element, "dragenter", function(){_this.editor.On("OnIframeDragEnter");});
		BX.bind(element, "dragleave", function(){_this.editor.On("OnIframeDragLeave");});
		BX.bind(element, "dragexit", function(){_this.editor.On("OnIframeDragExit");});
		BX.bind(element, "drop", function(){_this.editor.On("OnIframeDrop");});

		// Chrome & Safari & Firefox only fire the ondrop/ondragend/... events when the ondragover event is cancelled
		//if (BX.browser.IsChrome() || BX.browser.IsFirefox())
		// TODO: Truobles with firefox during selections http://jabber.bx/view.php?id=49370
		if (BX.browser.IsFirefox())
		{
			BX.bind(element, "dragover", function(e)
			{
				e.preventDefault();
			});
			BX.bind(element, "dragenter", function(e)
			{
				e.preventDefault();
			});
		}

		BX.bind(element, "drop", BX.delegate(this.OnPasteHandler, this));
		BX.bind(element, "paste", BX.delegate(this.OnPasteHandler, this));

		BX.bind(element, "keyup", function(e)
		{
			var
				keyCode = e.keyCode,
				target = editor.selection.GetSelectedNode(true);

			_this.SetFocusedFlag(true);
			if (keyCode === editor.KEY_CODES['space'] || keyCode === editor.KEY_CODES['enter'])
			{
				editor.On("OnIframeNewWord");
			}
			else
			{
				_this.OnKeyUpArrowsHandler(e, keyCode);
			}

			editor.selection.SaveRange();
			editor.On('OnIframeKeyup', [e, keyCode, target]);
		});

		BX.bind(element, "mousedown", function(e)
		{
			var target = e.target || e.srcElement;
			if (!editor.util.CheckImageSelectSupport() && target.nodeName === 'IMG')
			{
				editor.selection.SelectNode(target);
			}

			// Handle mousedown for "code" element in IE
			if (!editor.util.CheckPreCursorSupport() && target.nodeName === 'PRE')
			{
				var selectedNode = editor.selection.GetSelectedNode(true);
				if (selectedNode && selectedNode != target)
				{
					_this.FocusPreElement(target, true);
				}
			}
		});

		BX.bind(element, "keydown", BX.proxy(this.KeyDown, this));

		// Show urls and srcs in tooltip when hovering links or images
		var nodeTitles = {
			IMG: BX.message.SrcTitle + ": ",
			A: BX.message.UrlTitle + ": "
		};
		BX.bind(element, "mouseover", function(e)
		{
			var
				target = e.target || e.srcElement,
				nodeName = target.nodeName;

			if (!nodeTitles[nodeName])
			{
				return;
			}

			if(!target.hasAttribute("title"))
			{
				target.setAttribute("title", nodeTitles[nodeName] + (target.getAttribute("href") || target.getAttribute("src")));
				target.setAttribute("data-bx-clean-attribute", "title");
			}
		});
	};

	BXEditorIframeView.prototype.KeyDown = function(e)
	{
		this.SetFocusedFlag(true);
		this.editor.iframeKeyDownPreventDefault = false;

		var
			_this = this,
			keyCode = e.keyCode,
			KEY_CODES = this.editor.KEY_CODES,
			command = this.editor.SHORTCUTS[keyCode],
			selectedNode = this.editor.selection.GetSelectedNode(true),
			range = this.editor.selection.GetRange(),
			parent;

		if ((BX.browser.IsIE() || BX.browser.IsIE10() || BX.browser.IsIE11()) &&
			!BX.util.in_array(keyCode, [16, 17, 18, 20, 65, 144, 37, 38, 39, 40]))
		{
			var body = this.document.body;
			if (selectedNode && selectedNode.nodeName == "BODY"
				||
				range.startContainer && range.startContainer.nodeName == "BODY"
				||
				(range.startContainer == body.firstChild &&
				range.endContainer == body.lastChild &&
				range.startOffset == 0 &&
				range.endOffset == body.lastChild.length))
			{
				BX.addCustomEvent(this.editor, "OnIframeKeyup", BX.proxy(this._IEBodyClearHandler, this));
			}
		}

		// Last symbol in iframe and new paragraph in IE
		if ((BX.browser.IsIE() || BX.browser.IsIE10() || BX.browser.IsIE11()) &&
			keyCode == KEY_CODES['backspace'])
		{
			BX.addCustomEvent(this.editor, "OnIframeKeyup", BX.proxy(this._IEBodyClearHandlerEx, this));
		}

		this.isUserTyping = true;
		if (this.typingTimeout)
		{
			this.typingTimeout = clearTimeout(this.typingTimeout);
		}
		this.typingTimeout = setTimeout(function()
		{
			_this.isUserTyping = false;
		}, 1000);

		this.editor.synchro.StartSync(200);

		this.editor.On('OnIframeKeydown', [e, keyCode, command, selectedNode]);

		if (this.editor.iframeKeyDownPreventDefault)
			return BX.PreventDefault(e);

		// Handle  Shortcuts
		if ((e.ctrlKey || e.metaKey) && !e.altKey && command)
		{
			this.editor.action.Exec(command);
			return BX.PreventDefault(e);
		}

		// Clear link with image
		if (selectedNode && selectedNode.nodeName === "IMG" &&
			(keyCode === KEY_CODES['backspace'] || keyCode === KEY_CODES['delete']))
		{
			parent = selectedNode.parentNode;
			parent.removeChild(selectedNode); // delete image

			// Parent - is LINK, and it's hasn't got any other childs
			if (parent.nodeName === "A" && !parent.firstChild)
			{
				parent.parentNode.removeChild(parent);
			}

			setTimeout(function(){_this.editor.util.Refresh(_this.element);}, 0);
			BX.PreventDefault(e);
		}

		if (range.collapsed && this.OnKeyDownArrowsHandler(e, keyCode, range) === false)
		{
			return false;
		}

		// Handle Ctrl+Enter
		if ((e.ctrlKey || e.metaKey) && !e.altKey && keyCode === KEY_CODES["enter"])
		{
			if (_this.IsFocused())
				_this.editor.On("OnIframeBlur");

			_this.editor.On('OnCtrlEnter', [e, _this.editor.GetViewMode()]);
			return BX.PreventDefault(e);
		}

		// Handle "Enter"
		if (!e.shiftKey && (keyCode === KEY_CODES["enter"] || keyCode === KEY_CODES["backspace"]))
		{
			return this.OnEnterHandler(e, keyCode, selectedNode);
		}
	};

	BXEditorIframeView.prototype._IEBodyClearHandler = function(e)
	{
		var
			_this = this,
			p = this.document.body.firstChild;

		if (e.keyCode == this.editor.KEY_CODES['enter'] && p.nodeName == "P" && p != this.document.body.lastChild)
		{
			if (p.innerHTML && p.innerHTML.toLowerCase() == '<br>')
			{
				var newPar = p.nextSibling;
				this.editor.util.ReplaceWithOwnChildren(p);
				p = newPar;
			}
		}

		if (p && p.nodeName == "P" && p == this.document.body.lastChild)
		{
			_this.editor.util.ReplaceWithOwnChildren(p);
		}
		BX.removeCustomEvent(this.editor, "OnIframeKeyup", BX.proxy(this._IEBodyClearHandler, this));
	};

	BXEditorIframeView.prototype._IEBodyClearHandlerEx = function(e)
	{
		var p = this.document.body.firstChild;

		if (e.keyCode == this.editor.KEY_CODES['backspace'] &&
			p && p.nodeName == "P" && p == this.document.body.lastChild &&
			(this.editor.util.IsEmptyNode(p, true, true) || p.innerHTML && p.innerHTML.toLowerCase() == '<br>'))
		{
			this.editor.util.ReplaceWithOwnChildren(p);
		}

		BX.removeCustomEvent(this.editor, "OnIframeKeyup", BX.proxy(this._IEBodyClearHandlerEx, this));
	};

	BXEditorIframeView.prototype.OnEnterHandler = function(e, keyCode, selectedNode)
	{
		// Check selectedNode
		if (!selectedNode)
		{
			return;
		}

		var _this = this;
		function unwrap(node)
		{
			if (node)
			{
				if (node.nodeName !== "P" && node.nodeName !== "DIV")
				{
					node = BX.findParent(node, function(n)
					{
						return n.nodeName === "P" || n.nodeName === "DIV";
					}, _this.document.body);
				}

				var emptyNode = _this.editor.util.GetInvisibleTextNode();
				if (node)
				{
					node.parentNode.insertBefore(emptyNode, node);
					_this.editor.util.ReplaceWithOwnChildren(node);
					_this.editor.selection.SelectNode(emptyNode);
				}
			}
		}

		var
			list, i, li, br, blockElement,
			blockTags  = ["LI", "P", "H1", "H2", "H3", "H4", "H5", "H6"],
			listTags  = ["UL", "OL", "MENU"];


		// We trying to exit from list (double enter) (only in Chrome)
		if (keyCode === this.editor.KEY_CODES["enter"] &&
			BX.browser.IsChrome() &&
			selectedNode.nodeName === "LI" &&
			selectedNode.childNodes.length == 1 &&
			selectedNode.firstChild.nodeName === "BR")
		{
			// 1. Get parrent list
			list = BX.findParent(selectedNode, function(n)
			{
				return BX.util.in_array(n.nodeName, listTags);
			}, _this.document.body);

			li = list.getElementsByTagName('LI');

			// Last item - we have to exit from list and insert <br>
			if (selectedNode === li[li.length - 1])
			{
				br = BX.create("BR", {}, _this.document);
				this.editor.util.InsertAfter(br, list);
				this.editor.selection.SetBefore(br);
				this.editor.Focus();
				BX.remove(selectedNode);
			}
			else // We have to split list into 2 lists
			{
				var
					newList = list.ownerDocument.createElement(list.nodeName),
					toNew = false,
					invisText = _this.editor.util.GetInvisibleTextNode();

				for (i = 0; i < li.length; i++)
				{
					if (li[i] == selectedNode)
					{
						toNew = true;
						continue;
					}

					if (toNew)
					{
						newList.appendChild(li[i]);
					}
				}

				if (list.nextSibling)
				{
					list.parentNode.insertBefore(list.nextSibling, invisText);
					invisText.parentNode.insertBefore(invisText.nextSibling, newList);
				}
				else
				{
					list.parentNode.appendChild(invisText);
					list.parentNode.appendChild(newList);
				}
				this.editor.selection.SetAfter(invisText);

				this.editor.Focus();
				BX.remove(selectedNode);
			}

			return BX.PreventDefault(e);
		}
		else
		{
			if (BX.util.in_array(selectedNode.nodeName, blockTags))
			{
				blockElement = selectedNode;
			}
			else
			{
				blockElement = BX.findParent(selectedNode, function(n)
				{
					return BX.util.in_array(n.nodeName, blockTags);
				}, this.document.body);
			}

			if (blockElement)
			{
				// Some browsers create <p> elements after leaving a list
				// check after keydown of backspace and return whether a <p> got inserted and unwrap it
				if (blockElement.nodeName === "LI")
				{
					setTimeout(function()
					{
						var node = _this.editor.selection.GetSelectedNode(true);
						if (node)
						{
							list = BX.findParent(node, function(n)
							{
								return BX.util.in_array(n.nodeName, listTags);
							}, _this.document.body);

							if (!list)
							{
								unwrap(node);
							}
						}
					}, 0);
				}
				else if (blockElement.nodeName.match(/H[1-6]/) && keyCode === this.editor.KEY_CODES["enter"])
				{
					setTimeout(function()
					{
						unwrap(_this.editor.selection.GetSelectedNode());
					}, 0);
				}

				return true;
			}

			if (keyCode === this.editor.KEY_CODES["enter"] && !BX.browser.IsFirefox() && this.editor.action.IsSupported('insertLineBreak'))
			{
				if (BX.browser.IsIE10() || BX.browser.IsIE11())
				{
					this.editor.action.Exec('insertHTML', '<br>' + this.editor.INVISIBLE_SPACE);
				}
				else if(BX.browser.IsChrome())
				{
					this.editor.action.Exec('insertLineBreak');
					this.editor.action.Exec('insertHTML', this.editor.INVISIBLE_SPACE);
				}
				else
				{
					this.editor.action.Exec('insertLineBreak');
				}
				return BX.PreventDefault(e);
			}
		}

		if ((BX.browser.IsChrome() || BX.browser.IsIE10() || BX.browser.IsIE11()) && keyCode == this.editor.KEY_CODES['backspace'])
		{
			var checkNode = BX.create('SPAN', false, this.document);
			this.editor.selection.InsertNode(checkNode);
			var prev = checkNode.previousSibling;
			if (prev && prev.nodeType == 3 && this.editor.util.IsEmptyNode(prev, true, true))
			{
				BX.remove(prev);
			}
			BX.remove(checkNode);
		}
	};

	BXEditorIframeView.prototype.OnKeyDownArrowsHandler = function(e, keyCode, range)
	{
		var
			node, parentNode, nextNode, prevNode,
			KC = this.editor.KEY_CODES;

		this.keyDownRange = range;

		if (keyCode === KC['right'] || keyCode === KC['down'])
		{
			node = range.endContainer;
			nextNode = node ? node.nextSibling : false;
			parentNode = node ? node.parentNode : false;

			if (
				node.nodeType == 3 && node.length == range.endOffset
				&& parentNode && parentNode.nodeName !== 'BODY'
				&& (this.editor.util.IsBlockElement(parentNode) || this.editor.util.IsBlockNode(parentNode))
				)
			{
				this.editor.selection.SetInvisibleTextAfterNode(parentNode, true);
				return BX.PreventDefault(e);
			}
			else if(
					node.nodeType == 3 && this.editor.util.IsEmptyNode(node)
					&& nextNode
					&& (this.editor.util.IsBlockElement(nextNode) || this.editor.util.IsBlockNode(nextNode))
				)
			{
				BX.remove(node);
				if (nextNode.firstChild)
				{
					this.editor.selection.SetBefore(nextNode.firstChild);
				}
				else
				{
					this.editor.selection.SetAfter(nextNode);
				}
				return BX.PreventDefault(e);
			}
		}
		else if (keyCode === KC['left'] || keyCode === KC['up'])
		{
			node = range.startContainer;
			parentNode = node ? node.parentNode : false;
			prevNode = node ? node.previousSibling : false;

			if (
				node.nodeType == 3 && range.endOffset === 0
					&& parentNode && parentNode.nodeName !== 'BODY'
					&& (this.editor.util.IsBlockElement(parentNode) || this.editor.util.IsBlockNode(parentNode))
				)
			{
				this.editor.selection.SetInvisibleTextBeforeNode(parentNode);
				return BX.PreventDefault(e);
			}
			else if(
				node.nodeType == 3 && this.editor.util.IsEmptyNode(node)
					&& prevNode
					&& (this.editor.util.IsBlockElement(prevNode) || this.editor.util.IsBlockNode(prevNode))
				)
			{
				BX.remove(node);
				if (prevNode.lastChild)
				{
					this.editor.selection.SetAfter(prevNode.lastChild);
				}
				else
				{
					this.editor.selection.SetBefore(prevNode);
				}
				return BX.PreventDefault(e);
			}
		}

		return true;
	};

	BXEditorIframeView.prototype.OnKeyUpArrowsHandler = function(e, keyCode)
	{
		var
			_this = this,
			pre, prevToSur, nextToSur,
			keyDownNode, keyDownPre,
			range = this.editor.selection.GetRange(),
			node, parentNode, nextNode, prevNode, isEmpty, isSur, sameLastRange,
			startCont, endCont, startIsSur, endIsSur,
			KC = this.editor.KEY_CODES;

		// Arrows right or down
		if (keyCode === KC['right'] || keyCode === KC['down'])
		{
			this.editor.selection.GetStructuralTags();
			// Moving cursor by arrows (right & down)
			if (range.collapsed)
			{
				node = range.endContainer;

				isEmpty = this.editor.util.IsEmptyNode(node);
				// We check if last range was the same - it means that cursor doesn't
				// moved when user tried to move it
				sameLastRange = this.editor.selection.CheckLastRange(range);
				nextNode = node.nextSibling;

				if (!this.editor.util.CheckPreCursorSupport())
				{
					if (node.nodeName === 'PRE')
					{
						pre = node;
					}
					else if (node.nodeType == 3)
					{
						pre = BX.findParent(node, {tag: 'PRE'}, this.element);
					}

					if(pre)
					{
						if (this.keyDownRange)
						{
							keyDownNode = this.keyDownRange.endContainer;
							keyDownPre = keyDownNode == pre ? pre : BX.findParent(keyDownNode, function(n){return n == pre;}, this.element);
						}

						_this.FocusPreElement(pre, false, keyDownPre ? null : 'start');
					}
				}

				// If cursor in the invisible node - we take next node
				if (node.nodeType == 3 && isEmpty && nextNode)
				{
					node = nextNode;
					isEmpty = this.editor.util.IsEmptyNode(node);
				}

				isSur = this.editor.util.CheckSurrogateNode(node);

				// It's surrogate
				if (isSur)
				{
					nextToSur = node.nextSibling;
					if (nextToSur && nextToSur.nodeType == 3 && this.editor.util.IsEmptyNode(nextToSur))
						this.editor.selection._MoveCursorAfterNode(nextToSur);
					else
						this.editor.selection._MoveCursorAfterNode(node);

					BX.PreventDefault(e);
				}
				// If it's element
				else if (node.nodeType == 1 && node.nodeName != "BODY" && !isEmpty)
				{
					if (sameLastRange)
					{
						this.editor.selection._MoveCursorAfterNode(node);
						BX.PreventDefault(e);
					}
				}
				else if (sameLastRange && node.nodeType == 3 && /*node.length == range.endOffset &&*/ !isEmpty)
				{
					parentNode = node.parentNode;
					if (parentNode && node === parentNode.lastChild && parentNode.nodeName != "BODY")
					{
						this.editor.selection._MoveCursorAfterNode(parentNode);
					}
				}
				else if (node.nodeType == 3 && node.parentNode)
				{
					parentNode = node.parentNode;
					prevNode = parentNode.previousSibling;

					// It's empty invisible node before block element which was put there by us.
					// So we should remove it.
					if (
						(this.editor.util.IsBlockElement(parentNode) || this.editor.util.IsBlockNode(parentNode))
						&& prevNode && prevNode.nodeType == 3 && this.editor.util.IsEmptyNode(prevNode)
						)
					{
						BX.remove(prevNode);
					}
				}
			}
			else // Selection Shift + Right & Shift + down
			{
				startCont = range.startContainer;
				endCont = range.endContainer;
				startIsSur = this.editor.util.CheckSurrogateNode(startCont);
				endIsSur = this.editor.util.CheckSurrogateNode(endCont);

				if (startIsSur)
				{
					prevToSur = startCont.previousSibling;
					if (prevToSur && prevToSur.nodeType == 3 && this.editor.util.IsEmptyNode(prevToSur))
						range.setStartBefore(prevToSur);
					else
						range.setStartBefore(startCont);

					this.editor.selection.SetSelection(range);
				}

				if (endIsSur)
				{
					nextToSur = endCont.nextSibling;
					if (nextToSur && nextToSur.nodeType == 3 && this.editor.util.IsEmptyNode(nextToSur))
						range.setEndAfter(nextToSur);
					else
						range.setEndAfter(endCont);

					this.editor.selection.SetSelection(range);
				}
			}
		}
		// Arrows left or up
		else if (keyCode === KC['left'] || keyCode === KC['up'])
		{
			this.editor.selection.GetStructuralTags();

			// Moving cursor by arrows (left & up)
			if (range.collapsed)
			{
				node = range.startContainer;
				isEmpty = this.editor.util.IsEmptyNode(node);
				// We check if last range was the same - it means that cursor doesn't
				// moved when user tried to move it
				sameLastRange = this.editor.selection.CheckLastRange(range);

				// If cursor in the invisible node - we take next node
				if (node.nodeType == 3 && isEmpty && node.previousSibling)
				{
					node = node.previousSibling;
					isEmpty = this.editor.util.IsEmptyNode(node);
				}

				if (!this.editor.util.CheckPreCursorSupport())
				{
					if (node.nodeName === 'PRE')
					{
						pre = node;
					}
					else if (node.nodeType == 3)
					{
						pre = BX.findParent(node, {tag: 'PRE'}, this.element);
					}

					if(pre)
					{
						if (this.keyDownRange)
						{
							keyDownNode = this.keyDownRange.startContainer;
							keyDownPre = keyDownNode == pre ? pre : BX.findParent(keyDownNode, function(n){return n == pre;}, this.element);
						}
						_this.FocusPreElement(pre, false, keyDownPre ? null : 'end');
					}
				}

				isSur = this.editor.util.CheckSurrogateNode(node);
				// It's surrogate
				if (isSur)
				{
					prevToSur = node.previousSibling;
					if (prevToSur && prevToSur.nodeType == 3 && this.editor.util.IsEmptyNode(prevToSur))
						this.editor.selection._MoveCursorBeforeNode(prevToSur);
					else
						this.editor.selection._MoveCursorBeforeNode(node);

					BX.PreventDefault(e);
				}
				// If it's element
				else if (node.nodeType == 1 && node.nodeName != "BODY" && !isEmpty)
				{
					if (sameLastRange)
					{
						this.editor.selection._MoveCursorBeforeNode(node);
						BX.PreventDefault(e);
					}
				}
				//else if (sameLastRange && node.nodeType == 3 && range.startOffset == 0 && !isEmpty)
				else if (sameLastRange && node.nodeType == 3 && !isEmpty)
				{
					parentNode = node.parentNode;
					if (parentNode && node === parentNode.firstChild && parentNode.nodeName != "BODY")
					{
						this.editor.selection._MoveCursorBeforeNode(parentNode);
					}
				}
				else if (node.nodeType == 3 && node.parentNode)
				{
					parentNode = node.parentNode;
					prevNode = parentNode.nextSibling;

					// It's empty invisible node after block element which was put there by us.
					// So we should remove it.
					if (
						(this.editor.util.IsBlockElement(parentNode) || this.editor.util.IsBlockNode(parentNode))
							&& prevNode && prevNode.nodeType == 3 && this.editor.util.IsEmptyNode(prevNode)
						)
					{
						BX.remove(prevNode);
					}
				}

			}
			else // Selection Shift + left & Shift + up
			{
				startCont = range.startContainer;
				endCont = range.endContainer;
				startIsSur = this.editor.util.CheckSurrogateNode(startCont);
				endIsSur = this.editor.util.CheckSurrogateNode(endCont);

				if (startIsSur)
				{
					prevToSur = startCont.previousSibling;
					if (prevToSur && prevToSur.nodeType == 3 && this.editor.util.IsEmptyNode(prevToSur))
						range.setStartBefore(prevToSur);
					else
						range.setStartBefore(startCont);
					this.editor.selection.SetSelection(range);
				}

				if (endIsSur)
				{
					nextToSur = endCont.nextSibling;
					if (nextToSur && nextToSur.nodeType == 3 && this.editor.util.IsEmptyNode(nextToSur))
						range.setEndAfter(nextToSur);
					else
						range.setEndAfter(endCont);
					this.SetSelection(range);
				}
			}
		}

		this.keyDownRange = null;
	};

	BXEditorIframeView.prototype.FocusPreElement = function(preNode, timeout, mode)
	{
		var _this = this;

		if (this._focusPreElementTimeout)
			this._focusPreElementTimeout = clearTimeout(this._focusPreElementTimeout);

		if (timeout)
		{
			this._focusPreElementTimeout = setTimeout(function(){
				_this.FocusPreElement(preNode, false, mode);
			}, 100);
			return;
		}
		BX.focus(preNode);
		if (mode == 'end' && preNode.lastChild)
		{
			this.editor.selection.SetAfter(preNode.lastChild);
		}
		else if (mode == 'start' && preNode.firstChild)
		{
			this.editor.selection.SetBefore(preNode.firstChild);
		}
	};

	BXEditorIframeView.prototype.OnPasteHandler = function(e)
	{
		if (!this.editor.skipPasteHandler)
		{
			this.editor.skipPasteHandler = true;
			var
				_this = this,
				arNodes = [],
				curNode, i, node, qnodes;

			function markGoodNode(n)
			{
				if (n && n.setAttribute)
				{
					n.setAttribute('data-bx-paste-flag', 'Y');
				}
			}

			function getElementParent(n)
			{
				return n.nodeType == 1 ? n : BX.findParent(n, function(node)
				{
					return node.nodeType == 1;
				});
			}

			curNode = this.document.body;
			if (curNode)
			{
				qnodes = curNode.querySelectorAll("*");
				for (i = 0; i < qnodes.length; i++)
				{
					if (qnodes[i].nodeType == 1 && qnodes[i].nodeName != 'BODY' && qnodes[i].nodeName != 'HEAD')
					{
						arNodes.push(qnodes[i]);
					}
				}

				for (i = 0; i < curNode.parentNode.childNodes.length; i++)
				{
					node = curNode.parentNode.childNodes[i];
					if (node.nodeType == 1 && node.nodeName != 'BODY' && node.nodeName != 'HEAD')
					{
						arNodes.push(node);
					}
				}
			}

			for (i = 0; i < arNodes.length; i++)
			{
				markGoodNode(arNodes[i]);
			}

			setTimeout(function()
			{
				_this.editor.SetCursorNode();

				_this.editor.pasteHandleMode = true;
				_this.editor.bbParseContentMode = true;

				_this.editor.synchro.lastIframeValue = false;
				_this.editor.synchro.FromIframeToTextarea(true, true);

				_this.editor.pasteHandleMode = false;
				_this.editor.bbParseContentMode = false;

				_this.editor.synchro.lastTextareaValue = false;
				_this.editor.synchro.FromTextareaToIframe(true);

				_this.editor.RestoreCursor();

				_this.editor.On("OnIframePaste");
				_this.editor.On("OnIframeNewWord");
				_this.editor.skipPasteHandler = false;
			}, 10);
		}
	};

	BXEditorIframeView.prototype.InitAutoLinking = function()
	{
		var
			_this = this,
			editor = this.editor,
			nativeAutolinkCanBeDisabled = editor.action.IsSupportedByBrowser("autoUrlDetect"),
			nativeAutoLink = BX.browser.IsIE() || BX.browser.IsIE9() || BX.browser.IsIE10();

		if (nativeAutolinkCanBeDisabled)
			editor.action.Exec("autoUrlDetect", false);

		if (editor.config.autoLink === false)
			return;

		// Init Autolink system
		var
			ignorableParents = {"CODE" : 1, "PRE" : 1, "A" : 1, "SCRIPT" : 1, "HEAD" : 1, "TITLE" : 1, "STYLE" : 1},
			urlRegExp = /(((?:https?|ftp):\/\/|www\.)[^\s<]{3,})/gi,
			emailRegExp = /[\.a-z0-9_\-]+@[\.a-z0-9_\-]+\.[\.a-z0-9_\-]+/gi,
			MAX_LENGTH = 100,
			BRACKETS = {
				")": "(",
				"]": "[",
				"}": "{"
			};
		this.editor.autolinkUrlRegExp = urlRegExp;
		this.editor.autolinkEmailRegExp = emailRegExp;

		function autoLink(element)
		{
			if (element && !ignorableParents[element.nodeName])
			{
				var ignorableParent = BX.findParent(element, function(node)
				{
					return !!ignorableParents[node.nodeName];
				}, element.ownerDocument.body);

				if (ignorableParent)
					return element;

				if (element === element.ownerDocument.documentElement)
					element = element.ownerDocument.body;

				return parseNode(element);
			}
		}

		function convertUrlToLink(str)
		{
			return str.replace(urlRegExp, function(match, url)
			{
				var
					punctuation = (url.match(/([^\w\u0430-\u0456\u0451\/\-](,?))$/i) || [])[1] || "",
					opening = BRACKETS[punctuation];

				url = url.replace(/([^\w\u0430-\u0456\u0451\/\-](,?))$/i, "");

				if (url.split(opening).length > url.split(punctuation).length)
				{
					url = url + punctuation;
					punctuation = "";
				}

				var
					realUrl = url,
					displayUrl = url;

				if (url.length > MAX_LENGTH)
					displayUrl = displayUrl.substr(0, MAX_LENGTH) + "...";

				if (realUrl.substr(0, 4) === "www.")
					realUrl = "http://" + realUrl;

				return '<a href="' + realUrl + '">' + displayUrl + '</a>' + punctuation;
			});
		}

		function convertEmailToLink(str)
		{
			return str.replace(emailRegExp, function(email)
			{
				var
					punctuation = (email.match(/([^\w\/\-](,?))$/i) || [])[1] || "",
					opening = BRACKETS[punctuation];
//
				email = email.replace(/([^\w\/\-](,?))$/i, "");
//
				if (email.split(opening).length > email.split(punctuation).length)
				{
					email = email + punctuation;
					punctuation = "";
				}

				var realUrl = "mailto:" + email;

				return '<a href="' + realUrl + '">' + email + '</a>' + punctuation;
			});
		}

		function getTmpDiv(doc)
		{
			var tmp = doc._bx_autolink_temp_div;
			if (!tmp)
				tmp = doc._bx_autolink_temp_div = doc.createElement("div");
			return tmp;
		}

		function parseNode(element)
		{
			var res;
			if (element && !ignorableParents[element.nodeName])
			{
				// Replaces the content of the text node by link
				if (element.nodeType === 3 && element.data.match(urlRegExp) && element.parentNode)
				{
					var
						parentNode = element.parentNode,
						tmpDiv = getTmpDiv(parentNode.ownerDocument);

					tmpDiv.innerHTML = "<span></span>" + convertUrlToLink(element.data);
					tmpDiv.removeChild(tmpDiv.firstChild);

					while (tmpDiv.firstChild)
						parentNode.insertBefore(tmpDiv.firstChild, element);

					parentNode.removeChild(element);
				}
				else if (element.nodeType === 3 && element.data.match(emailRegExp) && element.parentNode)
				{
					var
						parentNode = element.parentNode,
						tmpDiv = getTmpDiv(parentNode.ownerDocument);

					tmpDiv.innerHTML = "<span></span>" + convertEmailToLink(element.data);
					tmpDiv.removeChild(tmpDiv.firstChild);

					while (tmpDiv.firstChild)
						parentNode.insertBefore(tmpDiv.firstChild, element);

					parentNode.removeChild(element);
				}
				else if (element.nodeType === 1)
				{
					var
						childNodes = element.childNodes,
						i;

					for (i = 0; i < childNodes.length; i++)
						parseNode(childNodes[i]);

					res = element;
				}
			}
			return res;
		}

		if (!nativeAutoLink || (nativeAutoLink && nativeAutolinkCanBeDisabled))
		{
			BX.addCustomEvent(editor, "OnIframeNewWord", function()
			{
				try
				{
					editor.selection.ExecuteAndRestore(function(startContainer, endContainer)
					{
						autoLink(endContainer.parentNode);
					});
				}
				catch(e){}
			});

			BX.addCustomEvent(editor, "OnSubmit", function()
			{
				try
				{
					autoLink(editor.GetIframeDoc().body);
				}
				catch(e){}
			});
		}

		var
			links = editor.sandbox.GetDocument().getElementsByTagName("a"),
			getTextContent  = function(element)
			{
				var textContent = BX.util.trim(editor.util.GetTextContent(element));
				if (textContent.substr(0, 4) === "www.")
					textContent = "http://" + textContent;
				return textContent;
			};

		BX.addCustomEvent(editor, "OnIframeKeydown", function(e, keyCode, command, selectedNode)
		{
			if (links.length > 0 && selectedNode)
			{
				var link = BX.findParent(selectedNode, {tag: 'A'}, selectedNode.ownerDocument.body);
				if (link)
				{
					var textContent = getTextContent(link);
					setTimeout(function()
					{
						var newTextContent = getTextContent(link);
						if (newTextContent === textContent)
							return;

						// Only set href when new href looks like a valid url
						if (newTextContent.match(urlRegExp))
							link.setAttribute("href", newTextContent);
					}, 0);
				}
			}
		});
	};

	BXEditorIframeView.prototype.IsUserTypingNow = function(e)
	{
		return this.isFocused && this.isShown && this.isUserTyping;
	};

	BXEditorIframeView.prototype.CheckContentLastChild = function(element)
	{
		if (!element)
		{
			element = this.element;
		}

		var lastChild = element.lastChild;
		if (lastChild && (this.editor.util.IsEmptyNode(lastChild, true) && this.editor.util.IsBlockNode(lastChild.previousSibling) || this.editor.phpParser.IsSurrogate(lastChild)))
		{
			element.appendChild(BX.create('BR', {}, element.ownerDocument));
			element.appendChild(this.editor.util.GetInvisibleTextNode());
		}
	};

/**
 * Class _this takes care that the value of the composer and the textarea is always in sync
 */
	function BXEditorViewsSynchro(editor, textareaView, iframeView)
	{
		this.INTERVAL = 500;

		this.editor = editor;
		this.textareaView = textareaView;
		this.iframeView = iframeView;
		this.lastFocused = 'wysiwyg';

		this.InitEventHandlers();
	}

	/**
	 * Sync html from composer to textarea
	 * Takes care of placeholders
	 * @param {Boolean} bParseHtml Whether the html should be sanitized before inserting it into the textarea
	 */
	BXEditorViewsSynchro.prototype =
	{
		FromIframeToTextarea: function(bParseHtml, bFormat)
		{
			var value;
			if (this.editor.bbCode)
			{
				value = this.iframeView.GetValue(this.editor.bbParseContentMode, false);
				value = BX.util.trim(value);
				if (value !== this.lastIframeValue)
				{
					var bbCodes = this.editor.bbParser.Unparse(value);
					this.textareaView.SetValue(bbCodes, false, bFormat || this.editor.bbParseContentMode);
					this.editor.On("OnContentChanged", [bbCodes || '', value || '']);
					this.lastIframeValue = value;
				}
			}
			else
			{
				value = this.iframeView.GetValue();
				value = BX.util.trim(value);
				if (value !== this.lastIframeValue)
				{
					this.textareaView.SetValue(value, true, bFormat);
					this.editor.On("OnContentChanged", [this.textareaView.GetValue() || '', value || '']);
					this.lastIframeValue = value;
				}
			}
		},

		/**
		* Sync value of textarea to composer
		* Takes care of placeholders
		* @param {Boolean} bParseHtml Whether the html should be sanitized before inserting it into the composer
		*/
		FromTextareaToIframe: function(bParseHtml)
		{
			var value = this.textareaView.GetValue();
			if (value !== this.lastTextareaValue)
			{
				if (value)
				{
					if (this.editor.bbCode)
					{
						var htmlFromBbCode = this.editor.bbParser.Parse(value);
						// INVISIBLE_CURSOR
						htmlFromBbCode = htmlFromBbCode.replace(/\u2060/ig, '<span id="bx-cursor-node"> </span>');

						this.iframeView.SetValue(htmlFromBbCode, bParseHtml);
					}
					else
					{
						// INVISIBLE_CURSOR
						value = value.replace(/\u2060/ig, '<span id="bx-cursor-node"> </span>');

						this.iframeView.SetValue(value, bParseHtml);
					}
				}
				else
				{
					this.iframeView.Clear();
				}
				this.lastTextareaValue = value;
				this.editor.On("OnContentChanged", [value || '', this.iframeView.GetValue() || '']);
			}
		},

		FullSyncFromIframe: function()
		{
			this.lastIframeValue = false;
			this.FromIframeToTextarea(true, true);
			this.lastTextareaValue = false;
			this.FromTextareaToIframe(true);
		},

		Sync: function()
		{
			var bParseHtml = true;
			var view = this.editor.currentViewName;

			if (view === "split")
			{
				if (this.GetSplitMode() === "code")
				{
					this.FromTextareaToIframe(bParseHtml);
				}
				else // wysiwyg
				{
					this.FromIframeToTextarea(bParseHtml);
				}
			}
			else if (view === "code")
			{
				this.FromTextareaToIframe(bParseHtml);
			}
			else // wysiwyg
			{
				this.FromIframeToTextarea(bParseHtml);
			}
		},

		GetSplitMode: function()
		{
			var mode = false;
			if (this.editor.currentViewName == "split")
			{
				if (this.editor.iframeView.IsFocused())
				{
					mode = "wysiwyg";
				}
				else if(this.editor.textareaView.IsFocused())
				{
					mode = "code";
				}
				else
				{
					mode = this.lastFocused;
				}
			}
			return mode;
		},

		InitEventHandlers: function()
		{
			var _this = this;
			BX.addCustomEvent(this.editor, "OnTextareaFocus", function()
			{
				_this.lastFocused = 'code';
				_this.StartSync();
			});
			BX.addCustomEvent(this.editor, "OnIframeFocus", function()
			{
				_this.lastFocused = 'wysiwyg';
				_this.StartSync();
			});

			BX.addCustomEvent(this.editor, "OnTextareaBlur", BX.delegate(this.StopSync, this));
			BX.addCustomEvent(this.editor, "OnIframeBlur", BX.delegate(this.StopSync, this));

			//BX.addCustomEvent(this.editor, "OnIframeMouseDown", BX.proxy(this.OnIframeMousedown, this));
			//this.On('OnSetViewAfter');
		},

		StartSync: function(delay)
		{
			var _this = this;

			if (this.interval)
			{
				this.interval = clearTimeout(this.interval);
			}

			this.delay = delay || this.INTERVAL; // it can reduce or increase initial timeout
			function sync()
			{
				// set delay to normal value
				_this.delay = _this.INTERVAL;
				_this.Sync();
				_this.interval = setTimeout(sync, _this.delay);
			}
			this.interval = setTimeout(sync, _this.delay);
		},

		StopSync: function()
		{
			if (this.interval)
			{
				this.interval = clearTimeout(this.interval);
			}
		},

		IsSyncOn: function()
		{
			return !!this.interval;
		},

		OnIframeMousedown: function(e, target, bxTag)
		{
			//var caret = this.editor.iframeView.document.createTextNode(this.INVISIBLE_CURSOR);
			//this.editor.selection.InsertNode(caret);
//			target.setAttribute('data-svd', "svd");
//			var _this = this;
//			setTimeout(function(){
//				_this.textareaView.SelectText('data-svd="svd"');
//			}, 1000);
		},

		IsFocusedOnTextarea: function()
		{
			var view = this.editor.currentViewName;
			return view === "code" || view === "split" && this.GetSplitMode() === "code";
		}
	}

	// global interface
	top.BXEditorTextareaView = window.BXEditorTextareaView = BXEditorTextareaView;
	top.BXEditorIframeView = window.BXEditorIframeView = BXEditorIframeView;
	top.BXEditorViewsSynchro = window.BXEditorViewsSynchro = BXEditorViewsSynchro;
})();
/* End */
;
; /* Start:/bitrix/js/fileman/html_editor/html-parser.js*/
/**
 * Bitrix HTML Editor 3.0
 * Date: 24.04.13
 * Time: 4:23
 *
 * Parser class
 */


/**
 * HTML Sanitizer
 * Rewrites the HTML based on given rules
*/

(function()
{
	function BXEditorParser(editor)
	{
		this.editor = editor;
		this.specialParsers = {};

		// Rename unknown tags to this
		this.DEFAULT_NODE_NAME = "span",
		this.WHITE_SPACE_REG_EXP = /\s+/,
		this.defaultRules = {
			tags: {},
			classes: {}
		};
		this.convertedBxNodes = [];
		this.rules = {};
	}

	BXEditorParser.prototype = {
		/**
		 * Iterates over all childs of the element, recreates them, appends them into a document fragment
		 * which later replaces the entire body content
		 */
		Parse: function(content, rules, doc, cleanUp, parseBx)
		{
			if (!doc)
			{
				doc = document;
			}

			this.convertedBxNodes = [];

			var
				frag = doc.createDocumentFragment(),
				el = this.GetAsDomElement(content, doc),
				newNode, addInvisibleNodes,
				firstChild;

			this.SetParseBxMode(parseBx);

			while (el.firstChild)
			{
				firstChild = el.firstChild;
				el.removeChild(firstChild);
				newNode = this.Convert(firstChild, cleanUp, parseBx);

				if (newNode)
				{
					addInvisibleNodes = !parseBx && this.CheckBlockNode(newNode);

					if (addInvisibleNodes)
					{
						//frag.appendChild(this.editor.util.GetInvisibleTextNode());
					}

					frag.appendChild(newNode);

					if (addInvisibleNodes)
					{
						frag.appendChild(this.editor.util.GetInvisibleTextNode());
					}
				}
			}

			// Clear element contents
			el.innerHTML = "";

			// Insert new DOM tree
			el.appendChild(frag);

			content = this.editor.GetInnerHtml(el);

			content = this.RegexpContentParse(content, parseBx);

			return content;
		},

		SetParseBxMode: function(bParseBx)
		{
			this.bParseBx = !!bParseBx;
		},

		// here we can parse content as string, not as DOM
		CodeParse: function(content)
		{
			return content;
		},

		GetAsDomElement: function(html, doc)
		{
			if (!doc)
				doc = document;

			var el = doc.createElement("DIV");

			if (typeof(html) === "object" && html.nodeType)
			{
				el.appendChild(html);
			}
			else if (this.editor.util.CheckHTML5Support())
			{
				el.innerHTML = html;
			}
			else if (this.editor.util.CheckHTML5FullSupport())
			{
				el.style.display = "none";
				doc.body.appendChild(el);
				try {
					el.innerHTML = html;
				} catch(e) {}
				doc.body.removeChild(el);
			}

			return el;
		},

		Convert: function(oldNode, cleanUp, parseBx)
		{
			var
				bCleanNodeAfterPaste = false,
				oldNodeType = oldNode.nodeType,
				oldChilds = oldNode.childNodes,
				newNode,
				newChild,
				i, bxTag;


			if (oldNodeType == 1)
			{
				if (this.editor.pasteHandleMode && (parseBx || this.editor.bbParseContentMode))
				{
					if (oldNode.id == 'bx-cursor-node')
					{
						return oldNode.ownerDocument.createTextNode(this.editor.INVISIBLE_CURSOR);
					}

					bCleanNodeAfterPaste = !oldNode.getAttribute('data-bx-paste-flag');

					if (oldNode && oldNode.id)
					{
						bxTag = this.editor.GetBxTag(oldNode.id);
						if (bxTag.tag)
						{
							bCleanNodeAfterPaste = false;
						}
					}

					if (bCleanNodeAfterPaste)
					{
						oldNode = this.CleanNodeAfterPaste(oldNode);
						if (!oldNode)
						{
							return null;
						}
						oldChilds = oldNode.childNodes;
						oldNodeType = oldNode.nodeType;
					}
					oldNode.removeAttribute('data-bx-paste-flag');
				}
				else
				{
					if (oldNode.id == 'bx-cursor-node')
					{
						return oldNode;
					}
				}

				// Doublecheck nodetype
				if (oldNodeType == 1)
				{
					if (!oldNode.__bxparsed)
					{
						if (this.IsAnchor(oldNode) && !oldNode.getAttribute('data-bx-replace_with_children'))
						{
							newNode = oldNode.cloneNode(true);
							newNode.innerHTML = '';
							for (i = 0; i < oldChilds.length; i++)
							{
								newChild = this.Convert(oldChilds[i], cleanUp, parseBx);
								if (newChild)
								{
									newNode.appendChild(newChild);
								}
							}

							oldNode = this.editor.phpParser.GetSurrogateNode("anchor", BX.message('BXEdAnchor') + ": #" + newNode.name, null, {
								html: newNode.innerHTML,
								name: newNode.name
							});
						}
						else if(this.IsPrintBreak(oldNode))
						{
							oldNode = this.GetPrintBreakSurrogate(oldNode);
						}

						if (oldNode && oldNode.id)
						{
							bxTag = this.editor.GetBxTag(oldNode.id);
							if(bxTag.tag)
							{
								oldNode.__bxparsed = 1;
								// We've found bitrix-made node
								if (this.bParseBx)
								{
									newNode = oldNode.ownerDocument.createTextNode('~' + bxTag.id + '~');
									this.convertedBxNodes.push(bxTag);
								}
								else
								{
									newNode = oldNode.cloneNode(true);
								}
								return newNode;
							}
						}

						if (!newNode && oldNode.nodeType)
						{
							newNode = this.ConvertElement(oldNode, parseBx);
						}
					}
				}
			}
			else if (oldNodeType == 3)
			{
				newNode = this.HandleText(oldNode);
			}

			if (!newNode)
			{
				return null;
			}

			for (i = 0; i < oldChilds.length; i++)
			{
				newChild = this.Convert(oldChilds[i], cleanUp, parseBx);
				if (newChild)
				{
					newNode.appendChild(newChild);
				}
			}

			if (newNode.nodeType == 1)
			{
				// Cleanup style="" attribute for elements
				if (newNode.style && BX.util.trim(newNode.style.cssText) == '' && newNode.removeAttribute)
				{
					newNode.removeAttribute('style');
				}

				// Cleanup senseless <span> elements
				if (this.editor.config.cleanEmptySpans && cleanUp && newNode.childNodes.length <= 1 && newNode.nodeName.toLowerCase() === this.DEFAULT_NODE_NAME && !newNode.attributes.length)
				{
					return newNode.firstChild;
				}
			}

			return newNode;
		},

		ConvertElement: function(oldNode, parseBx)
		{
			var
				rule,
				newNode,
				new_rule,
				tagRules = this.editor.GetParseRules().tags,
				nodeName = oldNode.nodeName.toLowerCase(),
				scopeName = oldNode.scopeName;

			// We already parsed this element ignore it!
			if (oldNode.__bxparsed)
			{
				return null;
			}

			oldNode.__bxparsed = 1;

			if (oldNode.className === "bx-editor-temp")
			{
				return null;
			}

			if (scopeName && scopeName != "HTML")
			{
				nodeName = scopeName + ":" + nodeName;
			}

			/**
			 * Repair node
			 * IE is a bit bitchy when it comes to invalid nested markup which includes unclosed tags
			 * A <p> doesn't need to be closed according HTML4-5 spec, we simply replace it with a <div> to preserve its content and layout
			 */
			if (
				"outerHTML" in oldNode &&
					!this.editor.util.AutoCloseTagSupported() &&
					oldNode.nodeName === "P" &&
					oldNode.outerHTML.slice(-4).toLowerCase() !== "</p>")
			{
				nodeName = "div";
			}

			// Add "data-bx-no-border"="Y" for tables without borders
			if (nodeName == "table" && !this.bParseBx)
			{
				var border = parseInt(oldNode.getAttribute('border'), 10);
				if (!border)
				{
					oldNode.removeAttribute("border");
					oldNode.setAttribute("data-bx-no-border", "Y");
				}
			}

			if (nodeName in tagRules)
			{
				rule = tagRules[nodeName];
				if (!rule || rule.remove)
				{
					return null;
				}

				if (rule.clean_empty &&
					// Only empty node
					(oldNode.innerHTML === "" || oldNode.innerHTML === this.editor.INVISIBLE_SPACE)
					&&
					(!oldNode.className || oldNode.className == "")
					&&
					// We check lastCreatedId to prevent cleaning elements which just were created
					(!this.editor.lastCreatedId || this.editor.lastCreatedId != oldNode.getAttribute('data-bx-last-created-id'))
					)
				{
					return null;
				}

				rule = typeof(rule) === "string" ? {rename_tag: rule} : rule;

				// New rule can be applied throw the attribute 'data-bx-new-rule'
				new_rule = oldNode.getAttribute('data-bx-new-rule');
				if (new_rule)
				{
					rule[new_rule] = oldNode.getAttribute('data-bx-' + new_rule);
				}
			}
			else if (oldNode.firstChild)
			{
				rule = {rename_tag: this.DEFAULT_NODE_NAME};
			}
			else
			{
				// Remove empty unknown elements
				return null;
			}

			if (rule.replace_with_children)
			{
				newNode = oldNode.ownerDocument.createDocumentFragment();
			}
			else
			{
				newNode = oldNode.ownerDocument.createElement(rule.rename_tag || nodeName);
				this.HandleAttributes(oldNode, newNode, rule, parseBx);
			}

			if (new_rule)
			{
				rule[new_rule] = null;
				delete rule[new_rule];
			}

			oldNode = null;
			return newNode;
		},

		CleanNodeAfterPaste: function(oldNode)
		{
			var
				styleName, styleValue, name, i,
				nodeName = oldNode.nodeName,
				innerHtml = BX.util.trim(oldNode.innerHTML),
				whiteAttributes = {align: 1, alt: 1, bgcolor: 1, border: 1, cellpadding: 1, cellspacing: 1, color:1, colspan:1, height: 1, href: 1, rowspan: 1, size: 1, span: 1, src: 1, style: 1, target: 1, title: 1, type: 1, value: 1, width: 1},
				cleanEmpty = {"A": 1, "SPAN": 1, "B": 1, "STRONG": 1, "I": 1, "EM": 1, "U": 1, "DEL": 1, "S": 1, "STRIKE": 1, "H1": 1, "H2": 1, "H3": 1, "H4": 1, "H5": 1, "H6": 1},
				whiteCssList = {
					'background-color': 'transparent',
					'background-image': 1,
					'background-position': 1,
					'background-repeat': 1,
					'background': 1,
					'border-collapse': 1,
					'border-color': 1,
					'border-style': 1,
					'border-top': 1,
					'border-right': 1,
					'border-bottom': 1,
					'border-left': 1,
					'border-top-color': 1,
					'border-right-color': 1,
					'border-bottom-color': 1,
					'border-left-color': 1,
					'border-top-style': 1,
					'border-right-style': 1,
					'border-bottom-style': 1,
					'border-left-style': 1,
					'border-top-width': 1,
					'border-right-width': 1,
					'border-bottom-width': 1,
					'border-left-width': 1,
					'border-width': 1,
					'border': 1,
					'color': '#000000',
					//'font-size': 1,
					'font-style': 'normal',
					'font-weight': 'normal',
					'text-decoration': 'none',
					'height': 1,
					'width': 1
				};

			// Clean items with display: none
			if (oldNode.style.display == 'none' || oldNode.style.visibility == 'hidden')
			{
				return null;
			}

			// Clean empty nodes
			if (cleanEmpty[nodeName] && innerHtml == '')
			{
				return null;
			}

			// Clean anchors
			if (nodeName == 'A' && (innerHtml == '' || innerHtml == '&nbsp;'))
			{
				return null;
			}

			if (nodeName == 'A')
			{
				// Todo: clean block nodes from link
			}

			// Clean class
			oldNode.removeAttribute('class');
			oldNode.removeAttribute('id');

			// Clean attributes corresponding to white list from above
			i = 0;
			while (i < oldNode.attributes.length)
			{
				name = oldNode.attributes[i].name;
				if (!whiteAttributes[name])
				{
					oldNode.removeAttribute(name);
				}
				else
				{
					i++;
				}
			}

			// Clean pasted div's
			if (nodeName == 'DIV' || oldNode.style.display == 'block')
			{
				if (!oldNode.lastChild || (oldNode.lastChild && oldNode.lastChild.nodeName != 'BR'))
				{
					oldNode.appendChild(oldNode.ownerDocument.createElement("BR")).setAttribute('data-bx-paste-flag', 'Y');
				}
				oldNode.setAttribute('data-bx-new-rule', 'replace_with_children');
				oldNode.setAttribute('data-bx-replace_with_children', '1');
			}

			// Content pastet from google docs sometimes comes with unused <b style="font-weight: normal"> wrapping
			if (nodeName == 'B' && oldNode.style.fontWeight == 'normal')
			{
				oldNode.setAttribute('data-bx-new-rule', 'replace_with_children');
				oldNode.setAttribute('data-bx-replace_with_children', '1');
			}

			if (this.IsAnchor(oldNode) && (oldNode.name == '' || BX.util.trim(oldNode.name == '')))
			{
				oldNode.setAttribute('data-bx-new-rule', 'replace_with_children');
				oldNode.setAttribute('data-bx-replace_with_children', '1');
			}

			var styles, j;
			// Clean style
			if (oldNode.style && BX.util.trim(oldNode.style.cssText) != '')
			{
				i = 0;
				styles = [];
				while (i < oldNode.style.length)
				{
					styleName = oldNode.style[i];
					styleValue = oldNode.style.getPropertyValue(styleName);

					if (!whiteCssList[styleName] || styleValue == whiteCssList[styleName])
					{
						oldNode.style.removeProperty(styleName);
						continue;
					}

					// Clean colors like rgb(0,0,0)
					if (styleName.indexOf('color') !== -1)
					{
						styleValue = this.editor.util.RgbToHex(styleValue);
						if (styleValue == whiteCssList[styleName] || styleValue == 'transparent' || styleValue == 'black')
						{
							oldNode.style.removeProperty(styleName);
							continue;
						}
					}

					// Clean hidden borders, for example: border-top: medium none;
					if (styleName.indexOf('border') !== -1 && styleValue.indexOf('none') !== -1)
					{
						oldNode.style.removeProperty(styleName);
						continue;
					}

					styles.push({name: styleName, value: styleValue});
					i++;
				}

				oldNode.removeAttribute('style');
				if (styles.length > 0)
				{
					for (j = 0; j < styles.length; j++)
					{
						oldNode.style[styles[j].name] = styles[j].value;
					}
				}
			}
			else
			{
				oldNode.removeAttribute('style');
			}

			// Clear useless spans
			if (nodeName == 'SPAN' && oldNode.style.cssText == '')
			{
				oldNode.setAttribute('data-bx-new-rule', 'replace_with_children');
				oldNode.setAttribute('data-bx-replace_with_children', '1');
			}

			// Replace <p>&nbsp;</p> ==> <p> </p>, <span>&nbsp;</span> ==> <span> </span>
			if ((nodeName == 'P' || nodeName == 'SPAN' || nodeName == 'FONT') && BX.util.trim(oldNode.innerHTML) == "&nbsp;")
			{
				oldNode.innerHTML = ' ';
			}

			return oldNode;
		},

		HandleText: function(oldNode)
		{
			var data = oldNode.data;
			if (this.editor.pasteHandleMode && data.indexOf('EndFragment:') !== -1)
			{
				// Clean content inserted from OpenOffice in MacOs
				data = data.replace(/Version:\d\.\d(?:\s|\S)*?StartHTML:\d+(?:\s|\S)*?EndHTML:\d+(?:\s|\S)*?StartFragment:\d+(?:\s|\S)*?EndFragment:\d+(?:\s|\n|\t|\r)*/g, '');
			}

			return oldNode.ownerDocument.createTextNode(data);
		},

		HandleAttributes: function(oldNode, newNode, rule, parseBx)
		{
			var
				attributes = {}, // fresh new set of attributes to set on newNode
				setClass = rule.set_class, // classes to set
				addClass = rule.add_class, // add classes based on existing attributes
				addCss = rule.add_css, // add classes based on existing attributes
				setAttributes = rule.set_attributes, // attributes to set on the current node
				checkAttributes = rule.check_attributes, // check/convert values of attributes
				clearAttributes = rule.clear_attributes, // clean all unknown attributes
				allowedClasses = this.editor.GetParseRules().classes,
				i = 0, newName, skipAttributes = {},
				st,
				classes = [],
				newClasses = [],
				newUniqueClasses = [],
				oldClasses = [],
				classesLength,
				newClassesLength,
				currentClass,
				newClass,
				attribute,
				attributeName,
				newAttributeValue,
				handler;

			if (checkAttributes)
			{
				for (attributeName in checkAttributes)
				{
					handler = this.GetCheckAttributeHandler(checkAttributes[attributeName]);
					if (!handler)
						continue;

					newAttributeValue = handler(this.GetAttributeEx(oldNode, attributeName));
					if (typeof(newAttributeValue) === "string" && newAttributeValue !== '')
						attributes[attributeName] = newAttributeValue;
				}
			}

			var cleanAttribute = oldNode.getAttribute('data-bx-clean-attribute');
			if (cleanAttribute)
			{
				oldNode.removeAttribute(cleanAttribute);
				oldNode.removeAttribute('data-bx-clean-attribute');
			}

			if (!clearAttributes)
			{
				for (i = 0; i < oldNode.attributes.length; i++)
				{
					attribute = oldNode.attributes[i];
					if (parseBx)
					{
						if (attribute.name.substr(0, 15) == 'data-bx-app-ex-')
						{
							newName = attribute.name.substr(15);
							attributes[newName] = oldNode.getAttribute(attribute.name);
							skipAttributes[newName] = true;
						}

						if (skipAttributes[attribute.name])
						{
							continue;
						}
					}

					// clear bitrix attributes
					if (attribute.name.substr(0, 8) == 'data-bx-'
						&& attribute.name != 'data-bx-noindex'
						&& this.bParseBx)
					{
						continue;
					}
					attributes[attribute.name] = this.GetAttributeEx(oldNode, attribute.name);
				}
			}

			if (setClass)
				classes.push(setClass);

			if (addCss)
			{
				for (st in addCss)
				{
					if (addCss.hasOwnProperty(st))
						newNode.style[st] = addCss[st];
				}
			}

			/*
			// TODO:
			if (addClass)
			{
				var addClassMethods = {
					align_img: (function() {
						var mapping = {
							left: "wysiwyg-float-left",
							right: "wysiwyg-float-right"
						};
						return function(attributeValue) {
							return mapping[String(attributeValue).toLowerCase()];
						};
					})(),

					align_text: (function() {
						var mapping = {
							left: "wysiwyg-text-align-left",
							right: "wysiwyg-text-align-right",
							center: "wysiwyg-text-align-center",
							justify: "wysiwyg-text-align-justify"
						};
						return function(attributeValue) {
							return mapping[String(attributeValue).toLowerCase()];
						};
					})(),

					clear_br: (function() {
						var mapping = {
							left: "wysiwyg-clear-left",
							right: "wysiwyg-clear-right",
							both: "wysiwyg-clear-both",
							all: "wysiwyg-clear-both"
						};
						return function(attributeValue) {
							return mapping[String(attributeValue).toLowerCase()];
						};
					})(),

					size_font: (function() {
						var mapping = {
							"1": "wysiwyg-font-size-xx-small",
							"2": "wysiwyg-font-size-small",
							"3": "wysiwyg-font-size-medium",
							"4": "wysiwyg-font-size-large",
							"5": "wysiwyg-font-size-x-large",
							"6": "wysiwyg-font-size-xx-large",
							"7": "wysiwyg-font-size-xx-large",
							"-": "wysiwyg-font-size-smaller",
							"+": "wysiwyg-font-size-larger"
						};
						return function(attributeValue) {
							return mapping[String(attributeValue).charAt(0)];
						};
					})()
				};

				for (attributeName in addClass)
				{
					handler = addClassMethods[addClass[attributeName]];
					if (!handler)
						continue;
					newClass = handler(this.GetAttributeEx(oldNode, attributeName));
					if (typeof(newClass) === "string")
						classes.push(newClass);
				}
			}
			*/

			// add old classes last
			oldClasses = oldNode.getAttribute("class");
			if (oldClasses)
				classes = classes.concat(oldClasses.split(this.WHITE_SPACE_REG_EXP));

			classesLength = classes.length;
			for (; i<classesLength; i++)
			{
				currentClass = classes[i];
				if (allowedClasses[currentClass])
					newClasses.push(currentClass);
			}

			if (newUniqueClasses.length)
				attributes["class"] = newUniqueClasses.join(" ");

			// set attributes on newNode
			for (attributeName in attributes)
			{
				// Setting attributes can cause a js error in IE under certain circumstances
				// eg. on a <img> under https when it's new attribute value is non-https
				// TODO: Investigate this further and check for smarter handling
				try {
					newNode.setAttribute(attributeName, attributes[attributeName]);
				} catch(e) {}
			}

			// IE8 sometimes loses the width/height attributes when those are set before the "src"
			// so we make sure to set them again
			if (attributes.src)
			{
				if (typeof(attributes.width) !== "undefined")
					newNode.setAttribute("width", attributes.width);
				if (typeof(attributes.height) !== "undefined")
					newNode.setAttribute("height", attributes.height);
			}
		},

		GetAttributeEx: function(node, attributeName)
		{
			attributeName = attributeName.toLowerCase();
			var
				res,
				nodeName = node.nodeName;

			if (nodeName == "IMG" && attributeName == "src" && this.IsLoadedImage(node) === true)
			{
				res = node.getAttribute('src');
			}
			else if (!this.editor.util.CheckGetAttributeTruth() && "outerHTML" in node)
			{
				var
					outerHTML = node.outerHTML.toLowerCase(),
					hasAttribute = outerHTML.indexOf(" " + attributeName + "=") != -1;

				res = hasAttribute ? node.getAttribute(attributeName) : null;
			}
			else
			{
				res = node.getAttribute(attributeName);
			}

			return res;
		},

		IsLoadedImage: function(node)
		{
			try
			{
				return node.complete && !node.mozMatchesSelector(":-moz-broken");
			}
			catch(e)
			{
				if (node.complete && node.readyState === "complete")
					return true;
			}
			return false;
		},

		GetCheckAttributeHandler: function(attrName)
		{
			var methods = this.GetCheckAttributeHandlers();
			return methods[attrName];
		},

		GetCheckAttributeHandlers: function()
		{
			return {
				url: function(attributeValue)
				{
					return attributeValue;
//					if (!attributeValue || !attributeValue.match(/^https?:\/\//i))
//						return null;
//					return attributeValue.replace(/^https?:\/\//i, function(match){return match.toLowerCase();});
				},

				alt: function(attributeValue)
				{
					if (!attributeValue)
					{
						return "";
					}
					return attributeValue.replace(/[^ a-z0-9_\-]/gi, "");
				},

				numbers: function(attributeValue)
				{
					attributeValue = (attributeValue || "").replace(/\D/g, "");
					return attributeValue || null;
				}
			};
		},

		HandleBitrixNode: function(node)
		{
			return node;
		},

		RegexpContentParse: function(content, parseBx)
		{
			// parse color inside style attributes RGB ==> HEX
			// TODO: it will cause wrong replace if rgba will be not inside style attribute...
			if (content.indexOf('rgb') !== -1)
			{
				content = content.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)/ig, function(str, h1, h2, h3, h4)
				{
					function hex(x)
					{
						return ("0" + parseInt(x).toString(16)).slice(-2);
					}
					return "#" + hex(h1) + hex(h2) + hex(h3);
				});
			}

			if (parseBx && content.indexOf('data-bx-noindex') !== -1)
			{
				content = content.replace(/(<a[\s\S]*?)data\-bx\-noindex="Y"([\s\S]*?\/a>)/ig, function(s, s1, s2)
				{
					return '<!--noindex-->' + s1 + s2 + '<!--\/noindex-->';
				});
			}

			if (parseBx)
			{
				content = content.replace(/\uFEFF/ig, '');
			}
			else
			{
				content = content.replace(/\uFEFF+/ig, this.editor.INVISIBLE_SPACE);
			}

			if (parseBx && content.indexOf('#BXAPP') !== -1)
			{
				var _this = this;
				content = content.replace(/#BXAPP(\d+)#/g, function(str, ind)
				{
					ind = parseInt(ind, 10);
					return _this.editor.phpParser.AdvancedPhpGetFragmentByIndex(ind, true);
				});
			}

			return content;
		},

		IsAnchor: function(n)
		{
			return n.nodeName == 'A' && !n.href;
		},

		IsPrintBreak: function(n)
		{
			return n.style.pageBreakAfter == 'always';
		},

		GetPrintBreakSurrogate: function(node)
		{
			var
				doc = this.editor.GetIframeDoc(),
				id = this.editor.SetBxTag(false, {tag: 'printbreak', params: {innerHTML: BX.util.trim(node.innerHTML)}, name: BX.message('BXEdPrintBreakName'), title: BX.message('BXEdPrintBreakTitle')});

			return BX.create('IMG', {props: {src: this.editor.EMPTY_IMAGE_SRC, id: id,className: "bxhtmled-printbreak", title: BX.message('BXEdPrintBreakTitle')}}, doc);
		},

		CheckBlockNode: function(node)
		{
			return this.editor.phpParser.IsSurrogate(node) ||
				(node.nodeType == 1 &&
					(
						node.style.display == 'block' || node.style.display == 'inline-block' ||
						node.nodeName == 'BLOCKQUOTE' || node.nodeName == 'DIV'
					)
				);
		}
	};


	function BXEditorPhpParser(editor)
	{
		this.PHP_PATTERN = '#BXPHP_IND#';
		this.editor = editor;

		this.allowed = {
			php: this.editor.allowPhp || this.editor.lpa,
			javascript: true,
			style: true,
			htmlcomment: true,
			iframe: true,
			video: true,
			'object': true
		};

		//if((!this.arConfig["bWithoutPHP"] || this.limit_php_access) && this.arConfig["use_advanced_php_parser"] == 'Y')
		//{
		this.bUseAPP = true; // APP - AdvancedPHPParser
		this.APPConfig =
		{
			arTags_before : ['tbody','thead','tfoot','tr','td','th'],
			arTags_after : ['tbody','thead','tfoot','tr','td','th'],
			arTags :
			{
				'a' : ['href','title','class','style'],
				'img' : ['src','alt','class','style','width','height']
			}
		};
		//}
//		else
//		{
//			this.bUseAPP = false;
//		}

		this.arScripts = {}; // object which contains all php codes with indexes
		this.arJavascripts = {}; // object which contains all javascripts codes with indexes
		this.arHtmlComments = {}; // object which contains all html comments with indexes
		this.arIframes = {}; // object which contains all iframes with indexes
		this.arVideos = {}; // object which contains all iframes with emeded videos
		this.arStyles = {}; // object which contains all <style> tags with indexes
		this.arObjects = {}; // object which contains all <object> tags with indexes
		this.surrClass = 'bxhtmled-surrogate';

		this.surrogateTags = {
			component: 1,
			php: 1,
			javascript: 1,
			style: 1,
			htmlcomment: 1,
			anchor: 1,
			iframe: 1,
			video: 1,
			'object': 1
		};

		BX.addCustomEvent(this.editor, "OnIframeMouseDown", BX.proxy(this.OnSurrogateMousedown, this));
		//BX.addCustomEvent(this.editor, "OnIframeClick", BX.proxy(this.OnSurrogateClick, this));
		BX.addCustomEvent(this.editor, "OnIframeDblClick", BX.proxy(this.OnSurrogateDblClick, this));
		BX.addCustomEvent(this.editor, "OnIframeKeydown", BX.proxy(this.OnSurrogateKeydown, this));
		BX.addCustomEvent(this.editor, "OnIframeKeyup", BX.proxy(this.OnSurrogateKeyup, this));
		BX.addCustomEvent(this.editor, "OnAfterCommandExec", BX.proxy(this.RenewSurrogates, this));
	}
	//BX.extend(BXEditorPhpParser, BXEditorParser);

	BXEditorPhpParser.prototype = {
		ParsePhp: function(content)
		{
			var _this = this;
			//1. All fragments of the php code we replace by special str - #BXPHP_IND#
			if (this.IsAllowed('php'))
			{
				content = this.ReplacePhpBySymCode(content);
			}
			else
			{
				content = this.CleanPhp(content);
			}

			// Custom parse
			content = this.CustomContentParse(content);

			// Javascript
			content = this.ReplaceJavascriptBySymCode(content);
			// Html comments
			content = this.ReplaceHtmlCommentsBySymCode(content);
			// Iframe & Video
			content = this.ReplaceIframeBySymCode(content);
			// Style
			content = this.ReplaceStyleBySymCode(content);
			// Object && embed
			content = this.ReplaceObjectBySymCode(content);
			// <Break>
			content = this.ParseBreak(content);

			//2. We trying to resolve html tags with PHP code inside
			content = this.AdvancedPhpParse(content);

			//3. We replace all #BXPHP_IND# and other sym codes by visual custom elements
			content = this.ParseSymCode(content);

			// 4. LPA
			if (this.editor.lpa)
			{
				content = content.replace(/#PHP(\d+)#/g, function(str)
				{
					return  _this.GetSurrogateHTML("php_protected", BX.message('BXEdPhpCode') + " *", BX.message('BXEdPhpCodeProtected'), {value : str});
				});
			}

			return content;
		},

		// Example:
		// <?...?> => #BXPHP0#
		ReplacePhpBySymCode: function(content, cleanPhp)
		{
			var
				arScripts = [],
				p = 0, i,
				bSlashed,
				bInString, ch, posnext, ti, quote_ch, mm = 0;

			cleanPhp = cleanPhp === true;

			while((p = content.indexOf("<?", p)) >= 0)
			{
				mm = 0;
				i = p + 2;
				bSlashed = false;
				bInString = false;
				while(i < content.length - 1)
				{
					i++;
					ch = content.substr(i, 1);

					if(!bInString)
					{
						//if it's not comment
						if(ch == "/" && i + 1 < content.length)
						{
							//find end of php fragment php
							posnext = content.indexOf("?>", i);
							if(posnext == -1)
							{
								//if it's no close tag - so script is unfinished
								p = content.length;
								break;
							}
							posnext += 2;

							ti = 0;
							if(content.substr(i + 1, 1)=="*" && (ti = content.indexOf("*/", i + 2))>=0)
							{
								ti += 2;
							}
							else if(content.substr(i + 1, 1)=="/" && (ti = content.indexOf("\n", i + 2))>=0)
							{
								ti += 1;
							}

							if(ti>0)
							{
								//find begin - "i" and end - "ti" of comment
								// check: what is coming sooner: "END of COMMENT" or "END of SCRIPT"
								if(ti > posnext && content.substr(i + 1, 1) != "*")
								{
									//if script is finished - CUT THE SCRIPT
									arScripts.push([p, posnext, content.substr(p, posnext - p)]);
									p = posnext;
									break;
								}
								else
								{
									i = ti - 1; //End of comment come sooner
								}
							}
							continue;
						}
						if(ch == "?" && i + 1 < content.length && content.substr(i + 1, 1) == ">")
						{
							i = i + 2;
							arScripts.push([p, i, content.substr(p, i - p)]);
							p = i + 1;
							break;
						}
					}

					if(bInString && ch == "\\")
					{
						bSlashed = true;
						continue;
					}

					if(ch == "\"" || ch == "'")
					{
						if(bInString)
						{
							if(!bSlashed && quote_ch == ch)
								bInString = false;
						}
						else
						{
							bInString = true;
							quote_ch = ch;
						}
					}

					bSlashed = false;
				}

				if(i >= content.length)
					break;

				p = i;
			}

			this.arScripts = {};
			if(arScripts.length > 0)
			{
				var
					newstr = "",
					plast = 0,
					arScript;

				if (cleanPhp)
				{
					for(i = 0; i < arScripts.length; i++)
					{
						arScript = arScripts[i];
						newstr += content.substr(plast, arScript[0] - plast);
						plast = arScript[1];
					}
				}
				else
				{
					for(i = 0; i < arScripts.length; i++)
					{
						arScript = arScripts[i];
						newstr += content.substr(plast, arScript[0] - plast) + this.SavePhpCode(arScript[2], i);
						plast = arScript[1];
					}
				}

				content = newstr + content.substr(plast);
			}

			return content;
		},

		CleanPhp: function(content)
		{
			return this.ReplacePhpBySymCode(content, true);
		},

		// Example: <script>...</script> => #BXJAVASCRIPT_1#
		ReplaceJavascriptBySymCode: function(content)
		{
			this.arJavascripts = {};
			var
				_this = this,
				index = 0;

			content = content.replace(/<script[\s\S]*?\/script>/gi, function(s)
				{
					_this.arJavascripts[index] = s;
					var code = _this.GetPattern(index, false, 'javascript');
					index++;
					return code;
				}
			);
			return content;
		},

		// Example: <!-- --> => #BXHTMLCOMMENT_1#
		ReplaceHtmlCommentsBySymCode: function(content)
		{
			this.arHtmlComments = {};
			var
				_this = this,
				index = 0;

			content = content.replace(/(<!--noindex-->)(?:[\s|\n|\r|\t]*?)<a([\s\S]*?)\/a>(?:[\s|\n|\r|\t]*?)(<!--\/noindex-->)/ig, function(s, s1, s2, s3)
				{
					return '<a data-bx-noindex="Y"' + s2 + '/a>';
				}
			);

			content = content.replace(/<!--[\s\S]*?-->/ig, function(s)
				{
					_this.arHtmlComments[index] = s;
					return _this.GetPattern(index++, false, 'html_comment');
				}
			);
			return content;
		},

		// Example: <iframe src="...."></iframe> => #BXIFRAME_0#
		// Also looking for embeded video
		ReplaceIframeBySymCode: function(content)
		{
			this.arIframes = {};
			var
				_this = this,
				index = 0;
			content = content.replace(/<iframe([\s\S]*?)\/iframe>/gi, function(s, s1)
				{
					var video = _this.CheckForVideo(s1);
					if (video)
					{
						_this.arVideos[index] = {
							html: s,
							provider: video.provider || false,
							src:  video.src || false
						};
						return _this.GetPattern(index++, false, 'video');
					}
					else
					{
						_this.arIframes[index] = s;
						return _this.GetPattern(index++, false, 'iframe');
					}
				}
			);
			return content;
		},

		// Example: <style type="css/text"></style> => #BXSTYLE_0#
		ReplaceStyleBySymCode: function(content)
		{
			this.arStyles = {};
			var
				_this = this,
				index = 0;

			content = content.replace(/<style[\s\S]*?\/style>/gi, function(s)
				{
					_this.arStyles[index] = s;
					return _this.GetPattern(index++, false, 'style');
				}
			);
			return content;
		},

		ReplaceObjectBySymCode: function(content)
		{
			this.arObjects = {};
			var
				_this = this,
				index = 0;

			content = content.replace(/<object[\s\S]*?\/object>/gi, function(s)
				{
					_this.arObjects[index] = s;
					return _this.GetPattern(index++, false, 'object');
				}
			);

			content = content.replace(/<embed[\s\S]*?(?:\/embed)?>/gi, function(s)
				{
					_this.arObjects[index] = s;
					return _this.GetPattern(index++, false, 'object');
				}
			);
			return content;
		},

		CheckForVideo: function(str)
		{
			var videoRe = /(?:src)\s*=\s*("|')([\s\S]*?((?:youtube.com)|(?:youtu.be)|(?:rutube.ru)|(?:vimeo.com))[\s\S]*?)(\1)/ig;

			var res = videoRe.exec(str);
			if (res)
			{
				return {
					src: res[2],
					provider: this.GetVideoProviderName(res[3])
				};
			}
			else
			{
				return false;
			}
		},

		GetVideoProviderName: function(url)
		{
			var name = '';
			switch (url)
			{
				case 'youtube.com':
				case 'youtu.be':
					name = 'YouTube';
					break;
				case 'rutube.ru':
					name = 'Rutube';
					break;
				case 'vimeo.com':
					name = 'Vimeo';
					break;
			}
			return name;
		},

		SavePhpCode: function(code, index)
		{
			this.arScripts[index] = code;
			return this.GetPhpPattern(index, false);
		},

		GetPhpPattern: function(ind, bRegexp)
		{
			if (bRegexp)
				return new RegExp('#BXPHP_' + ind + '#', 'ig');
			else
				return '#BXPHP_' + ind + '#';
		},

		GetPattern: function(ind, bRegexp, entity)
		{
			var code;

			switch (entity)
			{
				case 'php':
					code = '#BXPHP_';
					break;
				case 'javascript':
					code = '#BXJAVASCRIPT_';
					break;
				case 'html_comment':
					code = '#BXHTMLCOMMENT_';
					break;
				case 'iframe':
					code = '#BXIFRAME_';
					break;
				case 'style':
					code = '#BXSTYLE_';
					break;
				case 'video':
					code = '#BXVIDEO_';
					break;
				case 'object':
					code = '#BXOBJECT_';
					break;
				default:
					return '';
			}

			return bRegexp ? new RegExp(code + ind + '#', 'ig') : code + ind + '#';
		},

		// Example:
		// #BXPHP0# => <img ... />
		ParseSymCode: function(content)
		{
			var _this = this;

			content = content.replace(/#BX(PHP|JAVASCRIPT|HTMLCOMMENT|IFRAME|STYLE|VIDEO|OBJECT)_(\d+)#/g, function(str, type, ind)
			{
				var res = '';
				if (_this.IsAllowed(type.toLowerCase()))
				{
					switch (type)
					{
						case 'PHP':
							res = _this.GetPhpCodeHTML(_this.arScripts[ind]);
							break;
						case 'JAVASCRIPT':
							res = _this.GetJavascriptCodeHTML(_this.arJavascripts[ind]);
							break;
						case 'HTMLCOMMENT':
							res = _this.GetHtmlCommentHTML(_this.arHtmlComments[ind]);
							break;
						case 'IFRAME':
							res = _this.GetIframeHTML(_this.arIframes[ind]);
							break;
						case 'STYLE':
							res = _this.GetStyleHTML(_this.arStyles[ind]);
							break;
						case 'VIDEO':
							res = _this.GetVideoHTML(_this.arVideos[ind]);
							break;
						case 'OBJECT':
							res = _this.GetObjectHTML(_this.arObjects[ind]);
							break;
					}
				}
				return res;
			});

			return content;
		},

		GetPhpCodeHTML: function(code)
		{
			var
				result = '',
				component = this.editor.components.IsComponent(code);

			if (component !== false) // It's Bitrix Component
			{
				var
					cData = this.editor.components.GetComponentData(component.name),
					name = cData.title || component.name,
					title = (cData.params && cData.params.DESCRIPTION) ? cData.params.DESCRIPTION : title;

				if (cData.className)
				{
					component.className = cData.className || '';
				}
				result = this.GetSurrogateHTML('component', name, title, component);
			}
			else // ordinary PHP code
			{
				if (this.editor.allowPhp)
				{
					result = this.GetSurrogateHTML("php", BX.message('BXEdPhpCode'), BX.message('BXEdPhpCode') + ": " + this.GetShortTitle(code, 200), {value : code});
				}
				else
				{
					// TODO: add warning for here (access denied or smth )
					result = '';
				}
			}

			return result;
		},

		GetJavascriptCodeHTML: function(code)
		{
			return this.GetSurrogateHTML("javascript", "Javascript", "Javascript: " + this.GetShortTitle(code, 200), {value : code});
		},

		GetHtmlCommentHTML: function(code)
		{
			return this.GetSurrogateHTML("htmlcomment", BX.message('BXEdHtmlComment'), BX.message('BXEdHtmlComment') + ": " + this.GetShortTitle(code), {value : code});
		},

		GetIframeHTML: function(code)
		{
			return this.GetSurrogateHTML("iframe", BX.message('BXEdIframe'), BX.message('BXEdIframe') + ": " + this.GetShortTitle(code), {value : code});
		},

		GetStyleHTML: function(code)
		{
			return this.GetSurrogateHTML("style", BX.message('BXEdStyle'), BX.message('BXEdStyle') + ": " + this.GetShortTitle(code), {value : code});
		},

		GetVideoHTML: function(videoParams)
		{
			var
				tag = "video",
				params = videoParams.params || this.FetchVideoIframeParams(videoParams.html, videoParams.provider);

			params.value = videoParams.html;

			var
				id = this.editor.SetBxTag(false, {tag: tag, name: params.title, params: params}),
				surrogateId = this.editor.SetBxTag(false, {tag: "surrogate_dd", params: {origParams: params, origId: id}});

			this.editor.SetBxTag({id: id},
				{
					tag: tag,
					name: params.title,
					params: params,
					title: params.title,
					surrogateId: surrogateId
				}
			);

			var result = '<span id="' + id + '" title="' + params.title + '"  class="' + this.surrClass + ' bxhtmled-video-surrogate' + '" ' +
				'style="min-width:' + params.width + 'px; max-width:' + params.width + 'px; min-height:' + params.height + 'px; max-height:' + params.height + 'px"' +
				'>' +
				'<img title="' + params.title + '" id="'+ surrogateId +'" class="bxhtmled-surrogate-dd" src="' + this.editor.util.GetEmptyImage() + '"/>' +
				'<span class="bxhtmled-surrogate-inner"><span class="bxhtmled-video-icon"></span><span class="bxhtmled-comp-lable" spellcheck=false>' + params.title + '</span></span>' +
				'</span>';

			return result;
		},

		GetObjectHTML: function(code)
		{
			return this.GetSurrogateHTML("object", BX.message('BXEdObjectEmbed'),  BX.message('BXEdObjectEmbed') + ": " + this.GetShortTitle(code), {value : code});
		},

		FetchVideoIframeParams: function(html, provider)
		{
			var
				attrRe = /((?:title)|(?:width)|(?:height))\s*=\s*("|')([\s\S]*?)(\2)/ig,
				res = {
					width: 180,
					height: 100,
					title: provider ? BX.message('BXEdVideoTitleProvider').replace('#PROVIDER_NAME#', provider) : BX.message('BXEdVideoTitle'),
					origTitle : ''
				};

			html.replace(attrRe, function(s, attrName, q, attrValue)
			{
				attrName = attrName.toLowerCase();
				if (attrName == 'width' || attrName == 'height')
				{
					attrValue = parseInt(attrValue, 10);
					if (attrValue && !isNaN(attrValue))
					{
						res[attrName] = attrValue;
					}
				}
				else if (attrName == 'title')// title
				{
					//var title = BX.util.htmlspecialcharsback(attrValue);
					res.origTitle = BX.util.htmlspecialcharsback(attrValue);
					res.title += ': ' + attrValue;
				}
				return s;
			});

			return res;
		},

		GetSurrogateHTML: function(tag, name, title, params)
		{
			if (title)
			{
				title = BX.util.htmlspecialchars(title);
				title = title.replace('"', '\"');
			}

			if (!params)
			{
				params = {};
			}

			var
				id = this.editor.SetBxTag(false, {tag: tag, name: name, params: params}),
				surrogateId = this.editor.SetBxTag(false, {tag: "surrogate_dd", params: {origParams: params, origId: id}});

			this.editor.SetBxTag({id: id}, {tag: tag, name: name, params: params, title: title, surrogateId: surrogateId});

			if (!this.surrogateTags.tag)
			{
				this.surrogateTags.tag = 1;
			}

			var result = '<span id="' + id + '" title="' + (title || name) + '"  class="' + this.surrClass + (params.className ? ' ' + params.className : '') + '">' +
				this.GetSurrogateInner(surrogateId, title, name) +
				'</span>';

			return result;
		},

		GetSurrogateNode: function(tag, name, title, params)
		{
			var
				doc = this.editor.GetIframeDoc(),
				id = this.editor.SetBxTag(false, {tag: tag, name: name, params: params, title: title}),
				surrogateId = this.editor.SetBxTag(false, {tag: "surrogate_dd", params: {origParams: params, origId: id}});

			if (!params)
				params = {};

			this.editor.SetBxTag({id: id}, {
				tag: tag,
				name: name,
				params: params,
				title: title,
				surrogateId: surrogateId
			});

			if (!this.surrogateTags.tag)
			{
				this.surrogateTags.tag = 1;
			}

			return BX.create('SPAN', {props: {
				id: id,
				title: title || name,
				className: this.surrClass + (params.className ? ' ' + params.className : '')
			},
				html: this.GetSurrogateInner(surrogateId, title, name)
			}, doc);
		},

		GetSurrogateInner: function(surrogateId, title, name)
		{
			return '<img title="' + (title || name) + '" id="'+ surrogateId +'" class="bxhtmled-surrogate-dd" src="' + this.editor.util.GetEmptyImage() + '"/>' +
				'<span class="bxhtmled-surrogate-inner"><span class="bxhtmled-right-side-item-icon"></span><span class="bxhtmled-comp-lable" unselectable="on" spellcheck=false>' + BX.util.htmlspecialchars(name) + '</span></span>';
		},

		GetShortTitle: function(str, trim)
		{
			//trim = trim || 100;
			if (str.length > 100)
				str = str.substr(0, 100) + '...';
			return str;
		},

		_GetUnParsedContent: function(content)
		{
			var _this = this;
			content = content.replace(/#BX(PHP|JAVASCRIPT|HTMLCOMMENT|IFRAME|STYLE|VIDEO|OBJECT)_(\d+)#/g, function(str, type, ind)
			{
				var res;
				switch (type)
				{
					case 'PHP':
						res = _this.arScripts[ind];
						break;
					case 'JAVASCRIPT':
						res = _this.arJavascripts[ind];
						break;
					case 'HTMLCOMMENT':
						res = _this.arHtmlComments[ind];
						break;
					case 'IFRAME':
						res = _this.arIframes[ind];
						break;
					case 'STYLE':
						res = _this.arStyles[ind];
						break;
					case 'VIDEO':
						res = _this.arVideos[ind].html;
						break;
					case 'OBJECT':
						res = _this.arObjects[ind].html;
						break;
				}
				return res;
			});

			return content;
		},

		IsSurrogate: function(node)
		{
			return node && BX.hasClass(node, this.surrClass);
		},

		TrimPhpBrackets: function(str)
		{
			if (str.substr(0, 2) != "<?")
				return str;

			if(str.substr(0, 5).toLowerCase()=="<?php")
				str = str.substr(5);
			else
				str = str.substr(2);

			str = str.substr(0, str.length-2);
			return str;
		},

		TrimQuotes: function(str, qoute)
		{
			var f_ch, l_ch;
			str = str.trim();
			if (qoute == undefined)
			{
				f_ch = str.substr(0, 1);
				l_ch = str.substr(0, 1);
				if ((f_ch == '"' && l_ch == '"') || (f_ch == '\'' && l_ch == '\''))
					str = str.substring(1, str.length - 1);
			}
			else
			{
				if (!qoute.length)
					return str;
				f_ch = str.substr(0, 1);
				l_ch = str.substr(0, 1);
				qoute = qoute.substr(0, 1);
				if (f_ch == qoute && l_ch == qoute)
					str = str.substring(1, str.length - 1);
			}
			return str;
		},

		CleanCode: function(str)
		{
			var
				bSlashed = false,
				bInString = false,
				new_str = "",
				i=-1, ch, ti, quote_ch;

			while(i < str.length - 1)
			{
				i++;
				ch = str.substr(i, 1);
				if(!bInString)
				{
					if(ch == "/" && i + 1 < str.length)
					{
						ti = 0;
						if(str.substr(i+1, 1) == "*" && ((ti = str.indexOf("*/", i + 2)) >= 0))
							ti += 2;
						else if(str.substr(i + 1, 1) == "/" && ((ti = str.indexOf("\n", i + 2)) >= 0))
							ti += 1;

						if(ti > 0)
						{
							if(i > ti)
								alert('iti=' + i + '=' + ti);
							i = ti;
						}

						continue;
					}

					if(ch == " " || ch == "\r" || ch == "\n" || ch == "\t")
						continue;
				}

				if(bInString && ch == "\\")
				{
					bSlashed = true;
					new_str += ch;
					continue;
				}

				if(ch == "\"" || ch == "'")
				{
					if(bInString)
					{
						if(!bSlashed && quote_ch == ch)
							bInString = false;
					}
					else
					{
						bInString = true;
						quote_ch = ch;
					}
				}
				bSlashed = false;
				new_str += ch;
			}
			return new_str;
		},

		ParseFunction: function(str)
		{
			var
				pos = str.indexOf("("),
				lastPos = str.lastIndexOf(")");

			if(pos >= 0 && lastPos >= 0 && pos<lastPos)
				return {name:str.substr(0, pos),params:str.substring(pos+1,lastPos)};

			return false;
		},

		ParseParameters: function(str)
		{
			str = this.CleanCode(str);
			var
				prevAr = this.GetParams(str),
				tq, j, l = prevAr.length;

			for (j = 0; j < l; j++)
			{
				if (prevAr[j].substr(0, 6).toLowerCase()=='array(')
				{
					prevAr[j] = this.GetArray(prevAr[j]);
				}
				else
				{
					tq = this.TrimQuotes(prevAr[j]);
					if (this.IsNum(tq) || prevAr[j] != tq)
						prevAr[j] = tq;
					else
						prevAr[j] = this.WrapPhpBrackets(prevAr[j]);
				}
			}
			return prevAr;
		},

		GetArray: function(str)
		{
			var resAr = {};
			if (str.substr(0, 6).toLowerCase() != 'array(')
				return str;

			str = str.substring(6, str.length-1);
			var
				tempAr = this.GetParams(str),
				prop_name, prop_val, p,
				y;

			for (y = 0; y < tempAr.length; y++)
			{
				if (tempAr[y].substr(0, 6).toLowerCase()=='array(')
				{
					resAr[y] = this.GetArray(tempAr[y]);
					continue;
				}

				p = tempAr[y].indexOf("=>");
				if (p == -1)
				{
					if (tempAr[y] == this.TrimQuotes(tempAr[y]))
						resAr[y] = this.WrapPhpBrackets(tempAr[y]);
					else
						resAr[y] = this.TrimQuotes(tempAr[y]);
				}
				else
				{
					prop_name = this.TrimQuotes(tempAr[y].substr(0, p));
					prop_val = tempAr[y].substr(p + 2);
					if (prop_val == this.TrimQuotes(prop_val))
						prop_val = this.WrapPhpBrackets(prop_val);
					else
						prop_val = this.TrimQuotes(prop_val);

					if (prop_val.substr(0, 6).toLowerCase()=='array(')
						prop_val = this.GetArray(prop_val);

					resAr[prop_name] = prop_val;
				}
			}
			return resAr;
		},

		WrapPhpBrackets: function(str)
		{
			str = str.trim();
			var
				f_ch = str.substr(0, 1),
				l_ch = str.substr(0, 1);

			if ((f_ch == '"' && l_ch == '"') || (f_ch == '\'' && l_ch == '\''))
				return str;

			return "={" + str + "}";
		},

		GetParams: function(params)
		{
			var
				arParams = [],
				sk = 0, ch, sl, q1 = 1,q2 = 1, i,
				param_tmp = "";

			for(i = 0; i < params.length; i++)
			{
				ch = params.substr(i, 1);
				if (ch == "\"" && q2 == 1 && !sl)
				{
					q1 *= -1;
				}
				else if (ch == "'" && q1 == 1 && !sl)
				{
					q2 *=-1;
				}
				else if(ch == "\\" && !sl)
				{
					sl = true;
					param_tmp += ch;
					continue;
				}

				if (sl)
					sl = false;

				if (q2 == -1 || q1 == -1)
				{
					param_tmp += ch;
					continue;
				}

				if(ch == "(")
				{
					sk++;
				}
				else if(ch == ")")
				{
					sk--;
				}
				else if(ch == "," && sk == 0)
				{
					arParams.push(param_tmp);
					param_tmp = "";
					continue;
				}

				if(sk < 0)
					break;

				param_tmp += ch;
			}
			if(param_tmp != "")
				arParams.push(param_tmp);

			return arParams;
		},

		IsNum: function(val)
		{
			var _val = val;
			val = parseFloat(_val);
			if (isNaN(val))
				val = parseInt(_val);
			if (!isNaN(val))
				return _val == val;
			return false;
		},

		ParseBxNodes: function(content)
		{
			var
				i,
				//skipBxNodeIds = [],
				bxNodes = this.editor.parser.convertedBxNodes,
				l = bxNodes.length;

			for(i = 0; i < l; i++)
			{
				if (bxNodes[i].tag == 'surrogate_dd')
				{
					content = content.replace('~' + bxNodes[i].params.origId + '~', '');
				}
			}

			this._skipNodeIndex = {}; //_skipNodeIndex - used in Chrome to prevent double parsing of surrogates
			this._skipNodeList = [];
			var _this = this;

			content = content.replace(/~(bxid\d{1,9})~/ig, function(s, bxid)
			{
				if (!_this._skipNodeIndex[bxid])
				{
					var bxTag = _this.editor.GetBxTag(bxid);
					if (bxTag && bxTag.tag)
					{
						var node = _this.GetBxNode(bxTag.tag);
						if (node)
						{
							return node.Parse(bxTag.params);
						}
					}
				}
				return '';
			});

			return content;
		},

		// Describe all available surrogates here
		GetBxNodeList: function()
		{
			var _this = this;
			this.arBxNodes = {
				component: {
					Parse: function(params)
					{
						return _this.editor.components.GetSource(params);
					}
				},
				component_icon: {
					Parse: function(params)
					{
						return _this.editor.components.GetOnDropHtml(params);
					}
				},
				surrogate_dd: {
					Parse: function(params)
					{
						if (BX.browser.IsFirefox() || !params || !params.origId)
						{
							return '';
						}

						var bxTag = _this.editor.GetBxTag(params.origId);
						if (bxTag)
						{
							_this._skipNodeIndex[params.origId] = true;
							_this._skipNodeList.push(params.origId);

							var origNode = _this.GetBxNode(bxTag.tag);
							if (origNode)
							{
								return origNode.Parse(bxTag.params);
							}
						}

						return '#parse surrogate_dd#';
					}
				},
				php: {
					Parse: function(params)
					{
						return _this._GetUnParsedContent(params.value);
					}
				},
				php_protected: {
					Parse: function(params)
					{
						return params.value;
					}
				},
				javascript: {
					Parse: function(params)
					{
						return _this._GetUnParsedContent(params.value);
					}
				},
				htmlcomment: {
					Parse: function(params)
					{
						return _this._GetUnParsedContent(params.value);
					}
				},
				iframe: {
					Parse: function(params)
					{
						return _this._GetUnParsedContent(params.value);
					}
				},
				style: {
					Parse: function(params)
					{
						return _this._GetUnParsedContent(params.value);
					}
				},
				video: {
					Parse: function(params)
					{
						return _this._GetUnParsedContent(params.value);
					}
				},
				object: {
					Parse: function(params)
					{
						return _this._GetUnParsedContent(params.value);
					}
				},
				anchor: {
					Parse: function(params)
					{
						// TODO: copy other attributes
						return '<a name="' + params.name + '">' + params.html + '</a>';
					}
				},
				pagebreak: {
					Parse: function(params)
					{
						return '<BREAK />';
					}
				},
				printbreak: {
					Parse: function(params)
					{
						return '<div style="page-break-after: always">' + params.innerHTML + '</div>';
					}
				}
			};

			this.editor.On("OnGetBxNodeList");

			return this.arBxNodes;
		},

		AddBxNode: function(key, node)
		{
			if (this.arBxNodes == undefined)
			{
				var _this = this;
				BX.addCustomEvent(this.editor, "OnGetBxNodeList", function(){
					_this.arBxNodes[key] = node;
				});
			}
			else
			{
				this.arBxNodes[key] = node;
			}
		},

		GetBxNode: function(tag)
		{
			if (!this.arBxNodes)
			{
				this.arBxNodes = this.GetBxNodeList();
			}

			return this.arBxNodes[tag] || null;
		},

		OnSurrogateMousedown: function(e, target, bxTag)
		{
			var _this = this;

			// User clicked to surrogate icon
			if (bxTag.tag == 'surrogate_dd')
			{
				BX.bind(target, 'dragstart', function(e){_this.OnSurrogateDragStart(e, this)});
				BX.bind(target, 'dragend', function(e){_this.OnSurrogateDragEnd(e, this, bxTag)});
			}
			else
			{
				setTimeout(function()
				{
					var node = _this.CheckParentSurrogate(_this.editor.selection.GetSelectedNode());
					if(node)
					{
						_this.editor.selection.SetAfter(node);
						if (!node.nextSibling || node.nextSibling.nodeType != 3)
						{
							var invisText = _this.editor.util.GetInvisibleTextNode();
							_this.editor.selection.InsertNode(invisText);
							_this.editor.selection.SetAfter(invisText);
						}
					}
				}, 0);
			}
		},

		OnSurrogateDragEnd: function(e, target, bxTag)
		{
			var
				doc = this.editor.GetIframeDoc(),
				i, surr, surBxTag,
				usedSurrs = {},
				surrs = doc.querySelectorAll('.bxhtmled-surrogate'),
				surrs_dd = doc.querySelectorAll('.bxhtmled-surrogate-dd'),
				l = surrs.length;

			for (i = 0; i < surrs_dd.length; i++)
			{
				if (surrs_dd[i] && surrs_dd[i].id == bxTag.id)
				{
					BX.remove(surrs_dd[i]);
				}
			}

			for (i = 0; i < l; i++)
			{
				surr = surrs[i];
				if (usedSurrs[surr.id])
				{
					BX.remove(surr);
				}
				else
				{
					usedSurrs[surr.id] = true;
					surBxTag = this.editor.GetBxTag(surr.id);
					surr.innerHTML = this.GetSurrogateInner(surBxTag.surrogateId, surBxTag.title, surBxTag.name);
				}
			}
		},

		OnSurrogateDragStart: function(e, target)
		{
			// We need to append it to body to prevent loading picture in Firefox
			if (BX.browser.IsFirefox())
			{
				this.editor.GetIframeDoc().body.appendChild(target);
			}
		},

		CheckParentSurrogate: function(n)
		{
			if (!n)
			{
				return false;
			}

			if (this.IsSurrogate(n))
			{
				return n;
			}

			var
				_this = this,
				iter = 0,
				parentSur = BX.findParent(n, function(node)
				{
					return (iter++ > 4) || _this.IsSurrogate(node);
				}, this.editor.GetIframeDoc().body);

			return this.IsSurrogate(parentSur) ? parentSur : false;
		},

		CheckSurrogateDd: function(n)
		{
			return n && n.nodeType == 1 && this.editor.GetBxTag(n).tag == 'surrogate_dd';
		},

		OnSurrogateClick: function(e, target)
		{
			var bxTag = this.editor.GetBxTag(target);
			// User clicked to component icon
			if (bxTag && bxTag.tag == 'surrogate_dd')
			{
				var origTag = this.editor.GetBxTag(bxTag.params.origId);
				this.editor.On("OnSurrogateClick", [bxTag, origTag, target, e]);
			}
		},

		OnSurrogateDblClick: function(e, target)
		{
			var bxTag = this.editor.GetBxTag(target);
			// User clicked to component icon

			if (bxTag && bxTag.tag == 'surrogate_dd')
			{
				var origTag = this.editor.GetBxTag(bxTag.params.origId);
				this.editor.On("OnSurrogateDblClick", [bxTag, origTag, target, e]);
			}
		},

		OnSurrogateKeyup: function(e, keyCode, command, target)
		{
			var
				sur, bxTag,
				range = this.editor.selection.GetRange();

			if (range)
			{
				// Collapsed selection
				if (range.collapsed)
				{
					if (keyCode === this.editor.KEY_CODES['backspace'] && range.startContainer.nodeName !== 'BODY')
					{
						sur = this.editor.util.CheckSurrogateNode(range.startContainer);
						// It's surrogate node
						bxTag = this.editor.GetBxTag(sur);
						if (sur && bxTag && this.surrogateTags[bxTag.tag])
						{
							this.RemoveSurrogate(sur, bxTag);
						}
					}
				}
				else
				{
				}
			}
		},

		OnSurrogateKeydown: function(e, keyCode, command, target)
		{
			var
				sur,
				codes = this.editor.KEY_CODES,
				range = this.editor.selection.GetRange(),
				invisText,
				bxTag, surNode,
				node = target;

			if (!range.collapsed)
			{
				if (keyCode === codes['backspace'] || keyCode === codes['delete'])
				{
					var
						i,
						nodes = range.getNodes([3]);

					for (i = 0; i < nodes.length; i++)
					{
						sur = this.editor.util.CheckSurrogateNode(nodes[i]);
						if (sur)
						{
							bxTag = this.editor.GetBxTag(sur);
							if (this.surrogateTags[bxTag.tag])
							{
								this.RemoveSurrogate(sur, bxTag);
							}
						}
					}
				}
			}

			if (keyCode === codes['delete'])
			{
				if (range.collapsed)
				{
					invisText = this.editor.util.GetInvisibleTextNode();
					this.editor.selection.InsertNode(invisText);
					this.editor.selection.SetAfter(invisText);
					var nodeNextToCarret = invisText.nextSibling;
					if (nodeNextToCarret)
					{
						if (nodeNextToCarret && nodeNextToCarret.nodeName == 'BR')
						{
							nodeNextToCarret = nodeNextToCarret.nextSibling;
						}
						if (nodeNextToCarret && nodeNextToCarret.nodeType == 3 && (nodeNextToCarret.nodeValue == '\n' || this.editor.util.IsEmptyNode(nodeNextToCarret)))
						{
							nodeNextToCarret = nodeNextToCarret.nextSibling;
						}

						if (nodeNextToCarret)
						{
							BX.remove(invisText);
							bxTag = this.editor.GetBxTag(nodeNextToCarret);

							if (this.surrogateTags[bxTag.tag])
							{
								this.RemoveSurrogate(nodeNextToCarret, bxTag);
								return BX.PreventDefault(e);
							}
						}
					}
				}
			}

			if (range.startContainer == range.endContainer && range.startContainer.nodeName !== 'BODY')
			{
				node = range.startContainer;
				surNode = this.editor.util.CheckSurrogateNode(node);

				if (surNode)
				{
					bxTag = this.editor.GetBxTag(surNode.id);
					if (keyCode === codes['backspace'] || keyCode === codes['delete'])
					{
						this.RemoveSurrogate(surNode, bxTag);
						BX.PreventDefault(e);
					}
					else if (keyCode === codes['left'] || keyCode === codes['up'])
					{
						var prevToSur = surNode.previousSibling;
						if (prevToSur && prevToSur.nodeType == 3 && this.editor.util.IsEmptyNode(prevToSur))
							this.editor.selection._MoveCursorBeforeNode(prevToSur);
						else
							this.editor.selection._MoveCursorBeforeNode(surNode);

						return BX.PreventDefault(e);
					}
					else if (keyCode === codes['right'] || keyCode === codes['down'])
					{
						var nextToSur = surNode.nextSibling;
						if (nextToSur && nextToSur.nodeType == 3 && this.editor.util.IsEmptyNode(nextToSur))
							this.editor.selection._MoveCursorAfterNode(nextToSur);
						else
							this.editor.selection._MoveCursorAfterNode(surNode);

						return BX.PreventDefault(e);
					}
					else if (keyCode === codes.shift || keyCode === codes.ctrl || keyCode === codes.alt || keyCode === codes.cmd || keyCode === codes.cmdRight)
					{
						return BX.PreventDefault(e);
					}
					else
					{
						this.editor.selection.SetAfter(surNode);
					}
				}
			}
		},

		RemoveSurrogate: function(node, bxTag)
		{
			this.editor.undoManager.Transact();
			BX.remove(node);
			this.editor.On("OnSurrogateRemove", [node, bxTag]);
		},

		CheckHiddenSurrogateDrag: function()
		{
			var dd, i, doc = this.editor.GetIframeDoc();
			for (i = 0; i < this.hiddenDd.length; i++)
			{
				dd = doc.getElementById(this.hiddenDd[i]);
				if (dd)
				{
					dd.style.visibility = '';
				}
			}
			this.hiddenDd = [];
		},

		GetAllSurrogates: function(bGetAll)
		{
			bGetAll = bGetAll === true;
			var
				doc = this.editor.GetIframeDoc(),
				res = [], i, surr, bxTag,
				surrs = doc.querySelectorAll(".bxhtmled-surrogate");

			for (i = 0; i < surrs.length; i++)
			{
				surr = surrs[i];
				bxTag = this.editor.GetBxTag(surr.id);
				if (bxTag.tag || bGetAll)
				{
					res.push({
						node : surr,
						bxTag : bxTag
					});
				}
			}

			return res;
		},

		RenewSurrogates: function()
		{
			var
				bCheck = true,
				i, idInd = {}, id,
				surrs = this.GetAllSurrogates(true);

			for (i = 0; i < surrs.length; i++)
			{
				if (!surrs[i].bxTag.tag)
				{
					BX.remove(surrs[i].node);
					continue;
				}

				id = surrs[i].bxTag.surrogateId;
				if (!idInd[id] || !bCheck)
				{
					idInd[id] = id;
					surrs[i].node.innerHTML = this.GetSurrogateInner(surrs[i].bxTag.surrogateId, surrs[i].bxTag.title, surrs[i].bxTag.name);
				}
				else
				{
					BX.remove(surrs[i].node);
				}
			}
		},

		RedrawSurrogates: function()
		{
			var i, surrs = this.GetAllSurrogates();

			for (i = 0; i < surrs.length; i++)
			{
				if (surrs[i].node)
				{
					BX.addClass(surrs[i].node, 'bxhtmled-surrogate-tmp');
				}
			}

			setTimeout(function(){
				for (i = 0; i < surrs.length; i++)
				{
					if (surrs[i].node)
					{
						BX.removeClass(surrs[i].node, 'bxhtmled-surrogate-tmp');
					}
				}
			}, 0);
		},

		IsAllowed: function(id)
		{
			return this.allowed[id];
		},


		AdvancedPhpParse: function(content)
		{
			if (this.bUseAPP)
			{
				this.arAPPFragments = [];
				//content = this.AdvancedPhpParseBetweenTableTags(content);
				content = this.AdvancedPhpParseInAttributes(content);
			}
			return content;
		},

		AdvancedPhpParseBetweenTableTags: function(str)
		{
			var _this = this;
			function replacePHP_before(str, b1, b2, b3, b4)
			{
				_this.arAPPFragments.push(JS_addslashes(b1));
				return b2 + b3 + ' data-bx-php-before=\"#BXAPP' + (_this.arAPPFragments.length - 1) + '#\" ' + b4;
			};

			function replacePHP_after(str, b1, b2, b3, b4)
			{
				_this.arAPPFragments.push(JS_addslashes(b4));
				return b1+'>'+b3+'<'+b2+' style="display:none;" data-bx-php-after=\"#BXAPP'+(_this.arAPPFragments.length-1)+'#\"></'+b2+'>';
			};

			var
				arTags_before = _this.APPConfig.arTags_before,
				arTags_after = _this.APPConfig.arTags_after,
				tagName,
				i,
				re;

			// PHP fragments before tags
			for (i = 0; i < arTags_before.length; i++)
			{
				tagName = arTags_before[i];
				if (_this.limit_php_access)
					re = new RegExp('#(PHP(?:\\d{4}))#(\\s*)(<'+tagName+'[^>]*?)(>)',"ig");
				else
					re = new RegExp('<\\?(.*?)\\?>(\\s*)(<'+tagName+'[^>]*?)(>)',"ig");
				str = str.replace(re, replacePHP_before);
			}
			// PHP fragments after tags
			for (i = 0,l = arTags_after.length; i<l; i++)
			{
				tagName = arTags_after[i];
				if (_this.limit_php_access)
					re = new RegExp('(</('+tagName+')[^>]*?)>(\\s*)#(PHP(?:\\d{4}))#',"ig");
				else
					re = new RegExp('(</('+tagName+')[^>]*?)>(\\s*)<\\?(.*?)\\?>',"ig");
				str = str.replace(re, replacePHP_after);
			}
			return str;
		},

		AdvancedPhpParseInAttributes: function(str)
		{
			var
				_this = this,
				arTags = this.APPConfig.arTags,
				tagName, atrName, i, re;

			function replacePhpInAttributes(str, b1, b2, b3, b4, b5, b6)
			{
				if (b4.indexOf('#BXPHP_') === -1)
				{
					return str;
				}

				_this.arAPPFragments.push(b4);
				var appInd = _this.arAPPFragments.length - 1;
				var atrValue = _this.AdvancedPhpGetFragmentByIndex(appInd, true);

				return b1 + b2 + '="' + atrValue + '"' + ' data-bx-app-ex-' + b2 + '=\"#BXAPP' + appInd + '#\"' + b5;
			}

			for (tagName in arTags)
			{
				if (arTags.hasOwnProperty(tagName))
				{
					for (i = 0; i < arTags[tagName].length; i++)
					{
						atrName = arTags[tagName][i];
						re = new RegExp('(<' + tagName + '(?:[^>](?:\\?>)*?)*?)(' + atrName + ')\\s*=\\s*((?:"|\')?)([\\s\\S]*?)\\3((?:[^>](?:\\?>)*?)*?>)', "ig");
						str = str.replace(re, replacePhpInAttributes);
					}
				}
			}

			return str;
		},

		AdvancedPhpUnParse: function(content)
		{
			return content;
		},

		AdvancedPhpGetFragmentByCode: function(code, handleSiteTemplate)
		{
			var appInd = code.substr(6); // #BXAPP***#
			appInd = parseInt(appInd.substr(0, appInd.length - 1), 10);
			return this.AdvancedPhpGetFragmentByIndex(appInd, handleSiteTemplate);
		},

		AdvancedPhpGetFragmentByIndex: function(appInd, handleSiteTemplate)
		{
			var
				_this = this,
				appStr = this.arAPPFragments[appInd];

			appStr = appStr.replace(/#BXPHP_(\d+)#/g, function(str, ind)
			{
				var res = _this.arScripts[parseInt(ind, 10)];

				if (handleSiteTemplate)
				{
					var stp = _this.GetSiteTemplatePath();
					if(stp)
					{
						res = res.replace(/<\?=\s*SITE_TEMPLATE_PATH;?\s*\?>/i, stp);
						res = res.replace(/<\?\s*echo\s*SITE_TEMPLATE_PATH;?\s*\?>/i, stp);
					}
				}
				return res;
			});

			return appStr;
		},

		ParseBreak: function(content)
		{
			var _this = this;
			content = content.replace(/<break\s*\/*>/gi, function(s)
				{
					return _this.GetSurrogateHTML("pagebreak", BX.message('BXEdPageBreakSur'), BX.message('BXEdPageBreakSurTitle'));
				}
			);
			return content;
		},

		GetSiteTemplatePath: function()
		{
			return this.editor.GetTemplateParams().SITE_TEMPLATE_PATH;
		},

		CustomContentParse: function(content)
		{
			for (var i = 0; i < this.customParsers; i++)
			{
				if (typeof this.customParsers[i] == 'function')
				{
					content = this.customParsers[i](content);
				}
			}

			return content;
		},

		AddCustomParser: function(parser)
		{
			this.customParsers.push(parser);
		}
	};

	function BXEditorBbCodeParser(editor)
	{
		this.editor = editor;
		this.parseAlign = true;
	}

	BXEditorBbCodeParser.prototype = {
		Unparse: function(content)  // HTML - > Bbcode
		{
			var el = this.editor.parser.GetAsDomElement(content, this.editor.GetIframeDoc());
			el.setAttribute('data-bx-parent-node', 'Y');

			content = this.GetNodeHtml(el, true);
			content = content.replace(/#BR#/ig, "\n");
			content = content.replace(/&nbsp;/ig, " ");
			content = content.replace(/\uFEFF/ig, '');
			return content;
		},

		Parse: function(content) // // BBCode -> HTML
		{
			var _this = this, i, l;

			content = content.replace(/</ig, "&lt;");
			content = content.replace(/>/ig, "&gt;");

			// [CODE] == > #BX_CODE1#
			var arCodes = [];
			content = content.replace(/\[code\]((?:\s|\S)*?)\[\/code\]/ig, function(str, code)
			{
				arCodes.push('<pre class="bxhtmled-code">' + code + '</pre>');
				return '#BX_CODE' + (arCodes.length - 1) + '#';
			});

			var parserName, specialParser;
			for (parserName in this.editor.parser.specialParsers)
			{
				if (this.editor.parser.specialParsers.hasOwnProperty(parserName))
				{
					specialParser = this.editor.parser.specialParsers[parserName];
					if (specialParser && specialParser.Parse)
					{
						content = specialParser.Parse(parserName, content, this.editor);
					}
				}
			}

			// * * * Handle Smiles  * * *
			if (this.editor.sortedSmiles)
			{
				var
					arUrls = [],
					arTags = [],
					smile;

				content = content.replace(/\[(?:\s|\S)*?\]/ig, function(str)
				{
					arTags.push(str);
					return '#BX_TMP_TAG' + (arTags.length - 1) + '#';
				});

				content = content.replace(/(?:https?|ftp):\/\//gi, function(str)
				{
					arUrls.push(str);
					return '#BX_TMP_URL' + (arUrls.length - 1) + '#';
				});


				l = this.editor.sortedSmiles.length;
				for (i = 0; i < l; i++)
				{
					smile = this.editor.sortedSmiles[i];
					if (smile.path && smile.code)
					{
						content = content.replace(
							new RegExp(BX.util.preg_quote(smile.code), 'ig'),
							'<img id="' + _this.editor.SetBxTag(false, {tag: "smile", params: smile}) + '" src="' + smile.path + '" title="' + (smile.name || smile.code) + '"/>'
						);
					}
				}

				// Set urls back
				if (arUrls.length > 0)
				{
					content = content.replace(/#BX_TMP_URL(\d+)#/ig, function(s, num){return arUrls[num] || s;});
				}

				// Set tags back
				if (arTags.length > 0)
				{
					content = content.replace(/#BX_TMP_TAG(\d+)#/ig, function(s, num){return arTags[num] || s;});
				}
			}

			// * * * Handle Smiles  END * * *

			// Quote
			content = content.replace(/\n?\[quote\]/ig, '<blockquote class="bxhtmled-quote">');
			content = content.replace(/\[\/quote\]\n?/ig, '</blockquote>');

			// Table
			content = content.replace(/[\r\n\s\t]?\[table\][\r\n\s\t]*?\[tr\]/ig, '<table border="1">[TR]');
			content = content.replace(/\[tr\][\r\n\s\t]*?\[td\]/ig, '[TR][TD]');
			content = content.replace(/\[tr\][\r\n\s\t]*?\[th\]/ig, '[TR][TH]');
			content = content.replace(/\[\/td\][\r\n\s\t]*?\[td\]/ig, '[/TD][TD]');
			content = content.replace(/\[\/tr\][\r\n\s\t]*?\[tr\]/ig, '[/TR][TR]');
			content = content.replace(/\[\/td\][\r\n\s\t]*?\[\/tr\]/ig, '[/TD][/TR]');
			content = content.replace(/\[\/th\][\r\n\s\t]*?\[\/tr\]/ig, '[/TH][/TR]');
			content = content.replace(/\[\/tr\][\r\n\s\t]*?\[\/table\][\r\n\s\t]?/ig, '[/TR][/TABLE]');

			// List
			content = content.replace(/[\r\n\s\t]*?\[\/list\]/ig, '[/LIST]');
			content = content.replace(/[\r\n\s\t]*?\[\*\]?/ig, '[*]');

			var
				arSimpleTags = [
					'b','u', 'i', ['s', 'del'], // B, U, I, S
					'table', 'tr', 'td', 'th'//, // Table
				],
				bbTag, tag;

			l = arSimpleTags.length;

			for (i = 0; i < l; i++)
			{
				if (typeof arSimpleTags[i] == 'object')
				{
					bbTag = arSimpleTags[i][0];
					tag = arSimpleTags[i][1];
				}
				else
				{
					bbTag = tag = arSimpleTags[i];
				}

				content = content.replace(new RegExp('\\[(\\/?)' + bbTag + '\\]', 'ig'), "<$1" + tag + ">");
			}

			// Link
			content = content.replace(/\[url\]((?:\s|\S)*?)\[\/url\]/ig, "<a href=\"$1\">$1</a>");
			content = content.replace(/\[url\s*=\s*((?:\s|\S)*?)\]((?:\s|\S)*?)\[\/url\]/ig, "<a href=\"$1\">$2</a>");

			// Img
			content = content.replace(/\[img((?:\s|\S)*?)\]((?:\s|\S)*?)\[\/img\]/ig,
				function(str, params, src)
				{
					params = _this.FetchImageParams(params);
					var size = "";
					if (params.width)
						size += 'width:' + params.width + 'px;';
					if (params.height)
						size += 'height:' + params.height + 'px;';
					if (size !== '')
						size = 'style="' + size + '"';
					return '<img  src="' + src + '"' + size + '/>';
				}
			);

			// Font color
			i = 0;
			while (content.toLowerCase().indexOf('[color=') != -1 && content.toLowerCase().indexOf('[/color]') != -1 && i++ < 20)
			{
				content = content.replace(/\[color=((?:\s|\S)*?)\]((?:\s|\S)*?)\[\/color\]/ig, "<span style=\"color:$1\">$2</span>");
			}

			// List
			i = 0;
			while (content.toLowerCase().indexOf('[list=') != -1 && content.toLowerCase().indexOf('[/list]') != -1 && i++ < 20)
			{
				content = content.replace(/\[list=1\]((?:\s|\S)*?)\[\/list\]/ig, "<ol>$1</ol>");
			}

			i = 0;
			while (content.toLowerCase().indexOf('[list') != -1 && content.toLowerCase().indexOf('[/list]') != -1 && i++ < 20)
			{
				content = content.replace(/\[list\]((?:\s|\S)*?)\[\/list\]/ig, "<ul>$1</ul>");
			}
			content = content.replace(/\[\*\]/ig, "<li>");

			// Font
			i = 0;
			while (content.toLowerCase().indexOf('[font=') != -1 && content.toLowerCase().indexOf('[/font]') != -1 && i++ < 20)
			{
				content = content.replace(/\[font=((?:\s|\S)*?)\]((?:\s|\S)*?)\[\/font\]/ig, "<span style=\"font-family: $1\">$2</span>");
			}

			// Font size
			i = 0;
			while (content.toLowerCase().indexOf('[size=') != -1 && content.toLowerCase().indexOf('[/size]') != -1 && i++ < 20)
			{
				content = content.replace(/\[size=((?:\s|\S)*?)\]((?:\s|\S)*?)\[\/size\]/ig, "<span style=\"font-size: $1\">$2</span>");
			}

			if (this.parseAlign)
			{
				content = content.replace(/\[(center|left|right|justify)\]/ig, "<div style=\"text-align: $1;\" align=\"$1;\">");
				content = content.replace(/\[\/(center|left|right|justify)\]/ig, "</div>");
			}

			// VIDEO
			if (content.toLowerCase().indexOf('[/video]') != -1)
			{
				content = content.replace(/\[video((?:\s|\S)*?)\]((?:\s|\S)*?)\[\/video\]/ig, function(s, params, src)
				{
					return _this.GetVideoSourse(src, _this.FetchVideoParams(params.trim(params)), s);
				});
			}

			// Replace \n => <br/>
			content = content.replace(/\n/ig, "<br />");

			// Replace encoded "[", "]" by [ and ]
			content = content.replace(/&#91;/ig, "[");
			content = content.replace(/&#93;/ig, "]");

			// Replace back CODE content without modifications
			// #BX_CODE1# ==> <pre>...</pre>
			if (arCodes.length > 0)
			{
				content = content.replace(/#BX_CODE(\d+)#/ig, function(s, num){return arCodes[num] || s;});
			}

			return content;
		},

		GetNodeHtml: function(node, onlyChild)
		{
			var
				oNode = {
					node: node
				},
				res = '';

			if (!onlyChild)
			{
				if(node.nodeType == 3)
				{
					var text = BX.util.htmlspecialchars(node.nodeValue);
					if (!text.match(/[^\n]+/ig) && node.previousSibling && node.nextSibling
						&& this.editor.util.IsBlockNode(node.previousSibling)
						&& this.editor.util.IsBlockNode(node.nextSibling))
					{
						return "\n";
					}

					if (node.parentNode && !node.parentNode.getAttribute('data-bx-parent-node') &&
						(node.parentNode.nodeName == 'P' || node.parentNode.nodeName == 'DIV'))
					{
						text = text.replace(/\n/ig, " ");
					}

					text = text.replace(/\[/ig, "&#91;");
					text = text.replace(/\]/ig, "&#93;");
					return text;
				}

				if (node.nodeType == 1 && node.nodeName == 'P')
				{
					var html = BX.util.trim(node.innerHTML);
					html = html.replace(/[\n\r\s]/ig, "").toLowerCase();
					if(html == '<br>')
					{
						node.innerHTML = '';
					}
				}

				var bbRes = this.UnParseNodeBB(oNode);

				if (bbRes !== false)
				{
					return bbRes;
				}

				if (oNode.bbOnlyChild)
					onlyChild = true;

				// Left part
				if (!onlyChild)
				{
					if (oNode.breakLineBefore)
					{
						res += "\n";
					}
					if(node.nodeType == 1 && !oNode.hide)
					{
						res += "[" + oNode.bbTag;
						if (oNode.bbValue)
						{
							res += '=' + oNode.bbValue;
						}
						res += "]";
					}
				}
			}

			if (oNode.checkNodeAgain)
			{
				res += this.GetNodeHtml(node);
			}
			else
			{
				var
					i, child,
					innerContent = '';

				// Handle childs
				for (i = 0; i < node.childNodes.length; i++)
				{
					child = node.childNodes[i];
					innerContent += this.GetNodeHtml(child);
				}
				res += innerContent;
			}

			// Right part
			if (!onlyChild)
			{
				if (oNode.breakLineAfter)
					res += "\n";

				if (innerContent == '' && this.IsPairNode(oNode.bbTag)
					&& node.nodeName !== 'P'
					&& node.nodeName !== 'TD'
					&& node.nodeName !== 'TR'
					&& node.nodeName !== 'TH')
				{
					return '';
				}

				if(node.nodeType == 1 && (node.childNodes.length > 0 || this.IsPairNode(oNode.bbTag)) && !oNode.hide && !oNode.hideRight)
				{
					res += "[/" + oNode.bbTag + "]";
				}

				// mantis: #54244
				if (oNode.breakLineAfterEnd || node.nodeType == 1 && this.editor.util.IsBlockNode(node) && this.editor.util.IsBlockNode(node.nextSibling))
				{
					res += "\n";
				}
			}

			return res;
		},

		UnParseNodeBB: function (oNode) // WYSIWYG -> BBCode
		{
			var
				bxTag,
				tableTags = ['TABLE', 'TD', 'TR', 'TH', 'TBODY', 'TFOOT', 'THEAD', 'CAPTION', 'COL', 'COLGROUP'],
				isTableTag = false,
				isAlign = false,
				nodeName = oNode.node.nodeName.toUpperCase();

			oNode.checkNodeAgain = false;
			if (nodeName == "BR")
			{
				return "#BR#";
			}

			if (oNode.node && oNode.node.id)
			{
				bxTag = this.editor.GetBxTag(oNode.node.id);

				if (bxTag.tag)
				{
					var parser = this.editor.parser.specialParsers[bxTag.tag];
					if (parser && parser.UnParse)
					{
						return parser.UnParse(bxTag, oNode, this.editor);
					}
					else if (bxTag.tag == 'video')
					{
						return bxTag.params.value;
					}
					else if (bxTag.tag == 'smile')
					{
						return bxTag.params.code;
					}
					else
					{
						return '';
					}
				}
			}

			if (nodeName == "IFRAME" && oNode.node.src)
			{
				var
					src = oNode.node.src.replace(/https?:\/\//ig, '//'),
					video = this.editor.phpParser.CheckForVideo('src="' + src + '"');
				if (video)
				{
					var
						width = parseInt(oNode.node.width),
						height = parseInt(oNode.node.height);

					return '[VIDEO TYPE=' + video.provider.toUpperCase() +
						' WIDTH=' + width +
						' HEIGHT=' + height + ']' +
						src +
						'[/VIDEO]';
				}
			}

			//[CODE] Handle code tag
			if (nodeName == "PRE" && BX.hasClass(oNode.node, 'bxhtmled-code'))
			{
				return "[CODE]" + this.GetCodeContent(oNode.node) + "[/CODE]";
			}

			// Image
			if (nodeName == "IMG")
			{
				var size = '';

				if (oNode.node.style.width)
					size += ' WIDTH=' + parseInt(oNode.node.style.width);
				else if (oNode.node.width)
					size += ' WIDTH=' + parseInt(oNode.node.width);

				if (oNode.node.style.height)
					size += ' HEIGHT=' + parseInt(oNode.node.style.height);
				else if (oNode.node.height)
					size += ' HEIGHT=' + parseInt(oNode.node.height);

				return "[IMG" + size + "]" + oNode.node.src + "[/IMG]";
			}

			oNode.hide = false;
			oNode.bbTag = nodeName;
			isTableTag = BX.util.in_array(nodeName, tableTags);
			isAlign = this.parseAlign && (oNode.node.style.textAlign || oNode.node.align) && !isTableTag;

			if(nodeName == 'STRONG' || nodeName == 'B')
			{
				oNode.bbTag = 'B';
			}
			else if(nodeName == 'EM' || nodeName == 'I')
			{
				oNode.bbTag = 'I';
			}
			else if(nodeName == 'DEL' || nodeName == 'S')
			{
				oNode.bbTag = 'S';
			}
			// List
			else if((nodeName == 'OL' || nodeName == 'UL'))
			{
				oNode.bbTag = 'LIST';
				oNode.breakLineAfter = true;
				oNode.bbValue = nodeName == 'OL' ? '1' : '';
			}
			else if(nodeName == 'LI')
			{
				oNode.bbTag = '*';
				oNode.breakLineBefore = true;
				oNode.hideRight = true;
			}
			else if(nodeName == 'A')
			{
				oNode.bbTag = 'URL';
				oNode.bbValue = oNode.node.href;
				oNode.bbValue = oNode.bbValue.replace(/\[/ig, "&#91;").replace(/\]/ig, "&#93;");
				if (oNode.bbValue === '')
				{
					oNode.bbOnlyChild = true;
				}
			}
			// Color
			else if(oNode.node.style.color && !isTableTag)
			{
				oNode.bbTag = 'COLOR';
				oNode.bbValue = this.editor.util.RgbToHex(oNode.node.style.color);
				oNode.node.style.color = '';
				if (oNode.node.style.cssText != '')
				{
					oNode.checkNodeAgain = true;
				}
			}
			// Font family
			else if(oNode.node.style.fontFamily && !isTableTag)
			{
				oNode.bbTag = 'FONT';
				oNode.bbValue = oNode.node.style.fontFamily;
				oNode.node.style.fontFamily = '';
				if (oNode.node.style.cssText != '')
				{
					oNode.checkNodeAgain = true;
				}
			}
			// Font size
			else if(oNode.node.style.fontSize && !isTableTag)
			{
				oNode.bbTag = 'SIZE';
				oNode.bbValue = oNode.node.style.fontSize;
				oNode.node.style.fontSize = '';
				if (oNode.node.style.cssText != '')
				{
					oNode.checkNodeAgain = true;
				}
			}
			else if(nodeName == 'BLOCKQUOTE' && oNode.node.className == 'bxhtmled-quote' && !oNode.node.getAttribute('data-bx-skip-check'))
			{
				oNode.bbTag = 'QUOTE';
				oNode.breakLineBefore = true;
				oNode.breakLineAfterEnd = true;

				if (isAlign)
				{
					oNode.checkNodeAgain = true;
					oNode.node.setAttribute('data-bx-skip-check', 'Y');
				}
			}
			else if(isAlign)
			{
				var align = oNode.node.style.textAlign || oNode.node.align;
				if (BX.util.in_array(align, ['left', 'right', 'center', 'justify']))
				{
					oNode.hide = false;
					oNode.bbTag = align.toUpperCase();
				}
				else
				{
					oNode.hide = !BX.util.in_array(nodeName, this.editor.BBCODE_TAGS);
				}
			}


			else if(!BX.util.in_array(nodeName, this.editor.BBCODE_TAGS)) //'p', 'u', 'div', 'table', 'tr', 'img', 'td', 'a'
			{
				oNode.hide = true;
			}

			return false;
		},

		IsPairNode: function(text)
		{
			text = text.toUpperCase();
			return !(text.substr(0, 1) == 'H' || text == 'BR' || text == 'IMG' || text == 'INPUT');
		},

		GetCodeContent: function(node) // WYSIWYG -> BBCode
		{
			if (!node || this.editor.util.IsEmptyNode(node))
				return '';

			var
				i,
				res = '';

			for (i = 0; i < node.childNodes.length; i++)
			{
				if (node.childNodes[i].nodeType == 3)
					res += node.childNodes[i].data;
				else if (node.childNodes[i].nodeType == 1 && node.childNodes[i].nodeName == "BR")
					res += "#BR#";
				else
					res += this.GetCodeContent(node.childNodes[i]);
			}

			if (BX.browser.IsIE())
				res = res.replace(/\r/ig, "#BR#");
			else
				res = res.replace(/\n/ig, "#BR#");

			res = res.replace(/\[/ig, "&#91;");
			res = res.replace(/\]/ig, "&#93;");

			return res;
		},

		GetVideoSourse: function(src, params, source)
		{
			return this.editor.phpParser.GetVideoHTML({
				params: {
					width: params.width,
					height: params.height,
					title: BX.message.BXEdVideoTitle,
					origTitle: '',
					provider: params.type
				},
				html: source
			});
		},

		FetchVideoParams: function(str)
		{
			str = BX.util.trim(str);
			var
				atr = str.split(' '),
				i, name, val, atr_,
				res = {
					width: 180,
					height: 100,
					type: false
				};

			for (i = 0; i < atr.length; i++)
			{
				atr_ = atr[i].split('=');
				name = atr_[0].toLowerCase();
				val = atr_[1];
				if (name == 'width' || name == 'height')
				{
					val = parseInt(val, 10);
					if (val && !isNaN(val))
					{
						res[name] = Math.max(val, 100);
					}
				}
				else if (name == 'type')
				{
					val = val.toUpperCase();
					if (val == 'YOUTUBE' || val == 'RUTUBE' || val == 'VIMEO')
					{
						res[name] = val;
					}
				}
			}

			return res;
		},


		FetchImageParams: function(str)
		{
			str = BX.util.trim(str);
			var
				atr = str.split(' '),
				i, name, val, atr_,
				res = {};

			for (i = 0; i < atr.length; i++)
			{
				atr_ = atr[i].split('=');
				name = atr_[0].toLowerCase();
				val = atr_[1];
				if (name == 'width' || name == 'height')
				{
					val = parseInt(val, 10);
					if (val && !isNaN(val))
					{
						res[name] = val;
					}
				}
			}

			return res;
		}
	};

	function BXCodeFormatter(editor)
	{
		this.editor = editor;

		var
			ownLine = ['area', 'hr', 'i?frame', 'link', 'meta', 'noscript', 'style', 'table', 'tbody', 'thead', 'tfoot'],
			contOwnLine = ['li', 'dt', 'dd', 'h[1-6]', 'option', 'script'];

		this.reBefore = new RegExp('^<(/?' + ownLine.join('|/?') + '|' + contOwnLine.join('|') + ')[ >]', 'i');
		this.reAfter = new RegExp('^<(br|/?' + ownLine.join('|/?') + '|/' + contOwnLine.join('|/') + ')[ >]');

		var newLevel = ['blockquote', 'div', 'dl', 'fieldset', 'form', 'frameset', 'map', 'ol', 'p', 'pre', 'select', 'td', 'th', 'tr', 'ul'];
		this.reLevel = new RegExp('^</?(' + newLevel.join('|') + ')[ >]');

		this.lastCode = null;
		this.lastResult = null;
	}

	BXCodeFormatter.prototype = {
		Format: function(code)
		{
			if (code != this.lastCode)
			{
				this.lastCode = code;
				this.lastResult = this.DoFormat(code);
			}
			return this.lastResult;
		},

		DoFormat: function(code)
		{
			code += ' ';
			this.level = 0;

			var
				i, t,
				point = 0,
				start = null,
				end = null,
				tag = '',
				result = '',
				cont = '';

			for (i = 0; i < code.length; i++)
			{
				point = i;
				//if no more tags ==> exit
				if (code.substr(i).indexOf('<') == -1)
				{
					result += code.substr(i);

					result = result.replace(/\n\s*\n/g, '\n');  //blank lines
					result = result.replace(/^[\s\n]*/, ''); //leading space
					result = result.replace(/[\s\n]*$/, ''); //trailing space

					if (result.indexOf('<!--noindex-->') !== -1)
					{
						result = result.replace(/(<!--noindex-->)(?:[\s|\n|\r|\t]*?)(<a[\s\S]*?\/a>)(?:[\s|\n|\r|\t]*?)(<!--\/noindex-->)/ig, "$1$2$3");
					}

					return result;
				}

				while (point < code.length && code.charAt(point) !== '<')
				{
					point++;
				}

				if (i != point)
				{
					cont = code.substr(i, point - i);
					if (cont.match(/^\s+$/))
					{
						cont = cont.replace(/\s+/g, ' ');
						result += cont;
					}
					else
					{
						if (result.charAt(result.length - 1) == '\n')
						{
							result += this.GetTabs();
						}
						else if (cont.charAt(0) == '\n')
						{
							result += '\n' + this.GetTabs();
							cont = cont.replace(/^\s+/, '');
						}
						cont = cont.replace(/\n/g, ' ');
						cont = cont.replace(/\n+/g, '');
						cont = cont.replace(/\s+/g, ' ');
						result += cont;
					}

					if (cont.match(/\n/))
					{
						result += '\n' + this.GetTabs();
					}
				}
				start = point;

				//find the end of the tag
				while (point < code.length && code.charAt(point) != '>')
				{
					point++;
				}

				tag = code.substr(start, point - start);
				i = point;

				//if this is a special tag, deal with it
				if (tag.substr(1, 3) === '!--')
				{
					if (!tag.match(/--$/))
					{
						while (code.substr(point, 3) !== '-->')
						{
							point++;
						}
						point += 2;
						tag = code.substr(start, point - start);
						i = point;
					}
					if (result.charAt(result.length - 1) !== '\n')
					{
						result += '\n';
					}

					result += this.GetTabs();
					result += tag + '>\n';
				}
				else if (tag[1] === '!')
				{
					result = this.PutTag(tag + '>', result);
				}
				else if (tag[1] == '?')
				{
					result += tag + '>\n';
				}
				else if (t = tag.match(/^<(script|style)/i))
				{
					t[1] = t[1].toLowerCase();
					result = this.PutTag(this.CleanTag(tag), result);
					//end = String(code.substr(i + 1)).indexOf('</' + t[1]);
					end = String(code.substr(i + 1)).toLowerCase().indexOf('</' + t[1]);

					if (end)
					{
						cont = code.substr(i + 1, end);
						i += end;
						result += cont;
					}
				}
				else
				{
					result = this.PutTag(this.CleanTag(tag), result);
				}
			}

			return code;
		},

		GetTabs: function()
		{
			var s = '', j;
			for (j = 0; j < this.level; j++)
			{
				s += '\t';
			}
			return s;
		},

		CleanTag: function(tag)
		{
			var
				m,
				partRe = /\s*([^= ]+)(?:=((['"']).*?\3|[^ ]+))?/,
				result = '',
				suffix = '';

			tag = tag.replace(/\n/g, ' '); //remove newlines
			tag = tag.replace(/[\s]{2,}/g, ' '); //collapse whitespace
			tag = tag.replace(/^\s+|\s+$/g, ' '); //collapse whitespace

			if (tag.match(/\/$/))
			{
				suffix = '/';
				tag = tag.replace(/\/+$/, '');
			}

			while (m = partRe.exec(tag))
			{
				if (m[2])
					result += m[1] + '=' + m[2];
				else if (m[1])
					result += m[1];
				result += ' ';

				tag = tag.substr(m[0].length);
			}

			return result.replace(/\s*$/, '') + suffix + '>';
		},

		PutTag: function(tag, res)
		{
			var nl = tag.match(this.reLevel);

			if (tag.match(this.reBefore) || nl)
			{
				res = res.replace(/\s*$/, '');
				res += "\n";
			}

			if (nl && tag.charAt(1) == '/')
			{
				this.level--;
			}

			if (res.charAt(res.length-1) == '\n')
			{
				res += this.GetTabs();
			}

			if (nl && '/' != tag.charAt(1))
			{
				this.level++;
			}

			res += tag;
			if (tag.match(this.reAfter) || tag.match(this.reLevel))
			{
				res = res.replace(/ *$/, '');
				res += "\n";
			}

			return res;
		}
	};

	function __run()
	{
		window.BXHtmlEditor.BXCodeFormatter = BXCodeFormatter;
		window.BXHtmlEditor.BXEditorParser = BXEditorParser;
		window.BXHtmlEditor.BXEditorPhpParser = BXEditorPhpParser;
		window.BXHtmlEditor.BXEditorBbCodeParser = BXEditorBbCodeParser;
	}

	if (window.BXHtmlEditor)
	{
		__run();
	}
	else
	{
		BX.addCustomEvent(window, "OnBXHtmlEditorInit", __run);
	}
})();
/* End */
;
; /* Start:/bitrix/js/fileman/html_editor/html-base-controls.js*/
/**
 * Bitrix HTML Editor 3.0
 * Date: 24.04.13
 * Time: 4:23
 *
 * Taskbarmanager
 * Taskbar
 * Context Menu
 * Search/Replace
 */
;(function() {
	function TaskbarManager(editor, init)
	{
		this.editor = editor;
		this.bShown = false;
		this.closedWidth = 20;
		this.MIN_CLOSED_WIDTH = 120;
		this.width = this.editor.config.taskbarWidth || 250;
		this.taskbars = {};
		this.freezeOnclickHandler = false;

		if (init)
		{
			this.Init();
		}
	}

	TaskbarManager.prototype = {
		Init: function()
		{
			this.pCont = this.editor.dom.taskbarCont;
			this.pCont.setAttribute('data-bx-type', 'taskbarmanager');

			this.pResizer = BX('bx-html-editor-tskbr-res-' + this.editor.id);
			this.pResizer.setAttribute('data-bx-type', 'taskbarflip');
			this.pTopCont = BX('bx-html-editor-tskbr-top-' + this.editor.id);

			BX.bind(this.pResizer, 'mousedown', BX.proxy(this.StartResize, this));
			BX.bind(this.pCont, 'click', BX.proxy(this.OnClick, this));

			// Search
			this.pSearchCont = BX('bxhed-tskbr-search-cnt-' + this.editor.id);
			this.pSearchAli = BX('bxhed-tskbr-search-ali-' + this.editor.id);
			this.pSearchInput = BX('bxhed-tskbr-search-inp-' + this.editor.id);
			this.pSearchNothingNotice = BX('bxhed-tskbr-search-nothing-' + this.editor.id);
			BX.bind(this.pSearchInput, 'keyup', BX.proxy(this.TaskbarSearch, this));
		},

		OnClick: function(e)
		{
			if (!e)
				e = window.event;

			if (this.freezeOnclickHandler)
				return;

			var
				_this = this,
				target = e.target || e.srcElement,
				type = (target && target.getAttribute) ? target.getAttribute('data-bx-type') : null;

			if (!type)
			{
				target = BX.findParent(target, function(node)
				{
					return node == _this.pCont || (node.getAttribute && node.getAttribute('data-bx-type'));
				}, this.pCont);
				type = (target && target.getAttribute) ? target.getAttribute('data-bx-type') : null;
			}

			if (type == 'taskbarflip' || (!this.bShown && (type == 'taskbarmanager' || !type)))
			{
				if (this.bShown)
				{
					this.Hide();
				}
				else
				{
					this.Show();
				}
			}
			else if(type == 'taskbargroup_title')
			{
				BX.onCustomEvent(this, 'taskbargroupTitleClick', [target]);
			}
			else if(type == 'taskbarelement')
			{
				BX.onCustomEvent(this, 'taskbarelementClick', [target]);
			}
			else if(type == 'taskbar_title_but')
			{
				BX.onCustomEvent(this, 'taskbarTitleClick', [target]);
			}
			else if(type == 'taskbar_top_menu')
			{
				BX.onCustomEvent(this, 'taskbarMenuClick', [target]);
			}
			else if(type == 'taskbar_search_cancel')
			{
				this.pSearchInput.value = '';
				this.TaskbarSearch();
			}
		},

		Show: function(saveValue)
		{
			if (!this.bShown)
			{
				this.bShown = true;
				this.pCont.className = 'bxhtmled-taskbar-cnt bxhtmled-taskbar-shown';
			}
			this.pCont.style.width = this.GetWidth(true) + 'px';
			this.editor.ResizeSceleton();

			if (saveValue !== false)
			{
				this.editor.SaveOption('taskbar_shown', 1);
			}
		},

		Hide: function(saveValue)
		{
			if (this.bShown)
			{
				this.bShown = false;
				this.pCont.className = 'bxhtmled-taskbar-cnt bxhtmled-taskbar-hidden';
			}
			this.pCont.style.width = this.GetWidth() + 'px';
			this.editor.ResizeSceleton();

			if (saveValue !== false)
			{
				this.editor.SaveOption('taskbar_shown', 0);
			}
		},

		GetWidth: function(bCheck, maxWidth)
		{
			var width;
			if (this.bShown)
			{
				width = bCheck ? Math.max(this.width, this.closedWidth + this.MIN_CLOSED_WIDTH) : this.width;
				if(maxWidth && width > maxWidth)
				{
					width = this.width = Math.round(maxWidth);
				}
			}
			else
			{
				width = this.closedWidth;
			}

			return width;
		},

		AddTaskbar: function(oTaskbar)
		{
			this.taskbars[oTaskbar.id] = oTaskbar;
			this.pCont.appendChild(oTaskbar.GetCont());
			this.pTopCont.appendChild(oTaskbar.GetTitleCont());
		},

		ShowTaskbar: function(taskbarId)
		{
			this.pSearchInput.value = '';
			for(var id in this.taskbars)
			{
				if (this.taskbars.hasOwnProperty(id))
				{
					if (id == taskbarId)
					{
						this.taskbars[id].Activate();
						this.pSearchInput.placeholder = this.taskbars[id].searchPlaceholder;
					}
					else
					{
						this.taskbars[id].Deactivate();
					}

					this.activeTaskbarId = taskbarId;
					this.taskbars[id].ClearSearchResult();
				}
			}
		},

		GetActiveTaskbar: function()
		{
			return this.taskbars[this.activeTaskbarId];
		},

		StartResize: function(e)
		{
			if(!e)
				e = window.event;

			var target = e.target || e.srcElement;
			if (target.getAttribute('data-bx-tsk-split-but') == 'Y')
				return true;

			this.freezeOnclickHandler = true;

			var
				width = this.GetWidth(),
				overlay = this.editor.dom.resizerOverlay,
				dX = 0, newWidth,
				windowScroll = BX.GetWindowScrollPos(),
				startX = e.clientX + windowScroll.scrollLeft,
				_this = this;

			overlay.style.display = 'block';

			function moveResizer(e, bFinish)
			{
				if(!e)
					e = window.event;

				var x = e.clientX + windowScroll.scrollLeft;

				if(startX == x)
					return;

				dX = startX - x;
				newWidth = width + dX;

				if (bFinish)
				{
					_this.width = Math.max(newWidth, _this.closedWidth + _this.MIN_CLOSED_WIDTH);
					if (isNaN(_this.width))
					{
						_this.width = _this.closedWidth + _this.MIN_CLOSED_WIDTH;
					}
				}
				else
				{
					_this.width = newWidth;
				}

				if (newWidth > _this.closedWidth + (bFinish ? 20 : 0))
				{
					_this.Show();
				}
				else
				{
					_this.Hide();
				}
			}

			function finishResizing(e)
			{
				moveResizer(e, true);
				BX.unbind(document, 'mousemove', moveResizer);
				BX.unbind(document, 'mouseup', finishResizing);
				overlay.style.display = 'none';
				setTimeout(function(){_this.freezeOnclickHandler = false;}, 10);
				BX.PreventDefault(e);

				_this.editor.SaveOption('taskbar_width', _this.GetWidth(true));
			}

			BX.bind(document, 'mousemove', moveResizer);
			BX.bind(document, 'mouseup', finishResizing);
		},

		Resize: function(w, h)
		{
			var topHeight = parseInt(this.pTopCont.offsetHeight, 10);
			for(var id in this.taskbars)
			{
				if (this.taskbars.hasOwnProperty(id) && this.taskbars[id].pTreeCont)
				{
					this.taskbars[id].pTreeCont.style.height = (h - topHeight - 42) + 'px';
				}
			}

			this.pSearchCont.style.width = w + 'px';
			if (!BX.browser.IsDoctype())
			{
				this.pSearchAli.style.width = (w - 20) + 'px';
			}

			var _this = this;
			if (this.resizeTimeout)
			{
				this.resizeTimeout = clearTimeout(this.resizeTimeout);
			}

			this.resizeTimeout = setTimeout(function()
			{
				if (parseInt(_this.pTopCont.offsetHeight, 10) !== topHeight)
				{
					_this.Resize(w, h);
				}
			}, 100);
		},

		TaskbarSearch: function(e)
		{
			var
				taskbar = this.GetActiveTaskbar(),
				value = this.pSearchInput.value;

			if (e && e.keyCode == this.editor.KEY_CODES['escape'])
			{
				value = this.pSearchInput.value = '';
			}

			if (value.length < 2)
			{
				taskbar.ClearSearchResult();
			}
			else
			{
				taskbar.Search(value);
			}
		}
	};


	/*
	 *
	 *
	 * */
	function Taskbar(editor)
	{
		this.editor = editor;
		this.manager = this.editor.taskbarManager;
		this.searchIndex = [];
		this._searchResult = [];
		this._searchResultSect = [];

		BX.addCustomEvent(this.manager, 'taskbargroupTitleClick', BX.proxy(this.OnGroupTitleClick, this));
		BX.addCustomEvent(this.manager, 'taskbarelementClick', BX.proxy(this.OnElementClick, this));
		BX.addCustomEvent(this.manager, 'taskbarTitleClick', BX.proxy(this.OnTitleClick, this));
		BX.addCustomEvent(this.manager, 'taskbarMenuClick', BX.proxy(this.OnMenuClick, this));
	}

	Taskbar.prototype = {
		GetCont: function()
		{
			return this.pTreeCont;
		},

		GetTitleCont: function()
		{
			return this.pTitleCont;
		},

		BuildSceleton: function()
		{
			// Build title & menu
			this.pTitleCont = BX.create("span", {props: {className: "bxhtmled-split-btn"},html: '<span class="bxhtmled-split-btn-l"><span class="bxhtmled-split-btn-bg">' + this.title + '</span></span><span class="bxhtmled-split-btn-r"><span data-bx-type="taskbar_top_menu" data-bx-taskbar="' + this.id + '" class="bxhtmled-split-btn-bg"></span></span>'});
			this.pTitleCont.setAttribute('data-bx-type', 'taskbar_title_but');
			this.pTitleCont.setAttribute('data-bx-taskbar', this.id);

			this.pTreeCont = BX.create("DIV", {props: {className: "bxhtmled-taskbar-tree-cont"}});
			this.pTreeInnerCont = this.pTreeCont.appendChild(BX.create("DIV", {props: {className: "bxhtmled-taskbar-tree-inner-cont"}}));
		},

		BuildTree: function(sections, elements)
		{
			BX.cleanNode(this.pTreeCont);
			this.treeSectionIndex = {};
			this.BuildTreeSections(sections);
			this.BuildTreeElements(elements);
		},

		BuildTreeSections: function(sections)
		{
			this.sections = [];
			for (var i = 0; i < sections.length; i++)
			{
				this.BuildSection(sections[i]);
			}
		},

		GetSectionsTreeInfo: function()
		{
			return this.sections;
		},

		BuildSection: function(section)
		{
			var
				parentCont = this.GetSectionContByPath(section.path),
				pGroup = BX.create("DIV", {props: {className: "bxhtmled-tskbr-sect-outer"}}),
				pGroupTitle = pGroup.appendChild(BX.create("DIV", {props: {className: "bxhtmled-tskbr-sect"}})),
				icon = pGroupTitle.appendChild(BX.create("SPAN", {props: {className: "bxhtmled-tskbr-sect-icon"}})),
				title = pGroupTitle.appendChild(BX.create("SPAN", {props: {className: "bxhtmled-tskbr-sect-title"}, text: section.title || section.name})),
				childCont = pGroup.appendChild(BX.create("DIV", {props: {className: "bxhtmled-tskb-child"}})),
				elementsCont = pGroup.appendChild(BX.create("DIV", {props: {className: "bxhtmled-tskb-child-elements"}}));

			var key = section.path == '' ? section.name : section.path + ',' + section.name;
			var depth = section.path == '' ? 0 : 1; // Todo....

			var sect = {
				key: key,
				children: [],
				section: section
			}

			this.treeSectionIndex[key] = {
				icon: icon,
				outerCont: pGroup,
				cont: pGroupTitle,
				childCont: childCont,
				elementsCont: elementsCont,
				sect: sect
			};

			this.GetSectionByPath(section.path).push(sect);

			if (depth > 0)
			{
				BX.addClass(pGroupTitle, "bxhtmled-tskbr-sect-" + depth);
				BX.addClass(icon, "bxhtmled-tskbr-sect-icon-" + depth);
			}

			pGroupTitle.setAttribute('data-bx-type', 'taskbargroup_title');
			pGroupTitle.setAttribute('data-bx-taskbar', this.id);

			pGroup.setAttribute('data-bx-type', 'taskbargroup');
			pGroup.setAttribute('data-bx-path', key);
			pGroup.setAttribute('data-bx-taskbar', this.id);

			parentCont.appendChild(pGroup);
		},

		BuildTreeElements: function(elements)
		{
			this.elements = elements;
			for (var i in elements)
			{
				if (elements.hasOwnProperty(i))
				{
					this.BuildElement(elements[i]);
				}
			}
		},

		BuildElement: function(element)
		{
			var
				_this = this,
				parentCont = this.GetSectionContByPath(element.key || element.path, true),
				pElement = BX.create("DIV", {props: {className: "bxhtmled-tskbr-element"}, html: '<span class="bxhtmled-tskbr-element-icon"></span><span class="bxhtmled-tskbr-element-text">' + element.title + '</span>'});

			var dd = pElement.appendChild(BX.create("IMG", {props: {
				src: this.editor.util.GetEmptyImage(),
				className: "bxhtmled-drag"
			}}));

			this.HandleElementEx(pElement, dd, element);

			this.searchIndex.push({
				content: (element.title + ' ' + element.name).toLowerCase(),
				element: pElement
			});

			dd.onmousedown = function (e)
			{
				if (!e)
				{
					e = window.event;
				}

				var
					target = e.target || e.srcElement,
					bxTag = _this.editor.GetBxTag(target);

				return _this.OnElementMouseDownEx(e, target, bxTag);
			};

			dd.ondblclick = function(e)
			{
				var
					target = e.target || e.srcElement,
					bxTag = _this.editor.GetBxTag(target);

				return _this.OnElementDoubleClick(e, target, bxTag);
			};

			dd.ondragend = function (e)
			{
				if (!e)
				{
					e = window.event;
				}
				_this.OnDragEndHandler(e, this);
			};

			pElement.setAttribute('data-bx-type', 'taskbarelement');

			parentCont.appendChild(pElement);
		},

		HandleElementEx: function(dd)
		{

		},

		GetSectionContByPath: function(path, bElement)
		{
			if (path == '' || !this.treeSectionIndex[path])
			{
				return this.pTreeCont;
			}
			else
			{
				return bElement ? this.treeSectionIndex[path].elementsCont : this.treeSectionIndex[path].childCont;
			}
		},

		GetSectionByPath: function(path)
		{
			if (path == '' || !this.treeSectionIndex[path])
			{
				return this.sections;
			}
			else
			{
				return this.treeSectionIndex[path].sect.children;
			}
		},

		// Open or close
		ToggleGroup: function(cont, bOpen)
		{
			// TODO: animation
			var path = cont.getAttribute('data-bx-path');
			if (path)
			{
				var group = this.treeSectionIndex[path];
				if (!group)
				{
					return;
				}

				if (bOpen !== undefined)
				{
					group.opened = !bOpen;
				}

				if (group.opened)
				{
					BX.removeClass(group.cont, 'bxhtmled-tskbr-sect-open');
					BX.removeClass(group.icon, 'bxhtmled-tskbr-sect-icon-open');
					BX.removeClass(group.outerCont, 'bxhtmled-tskbr-sect-outer-open');
					group.childCont.style.display = 'none';
					group.elementsCont.style.display = 'none';
					group.opened = false;
				}
				else
				{
					BX.addClass(group.cont, 'bxhtmled-tskbr-sect-open');
					BX.addClass(group.icon, 'bxhtmled-tskbr-sect-icon-open');
					BX.addClass(group.outerCont, 'bxhtmled-tskbr-sect-outer-open');
					group.childCont.style.display = 'block';
					group.elementsCont.style.display = group.elementsCont.childNodes.length > 0 ? 'block' : 'none';
					group.opened = true;
				}
			}
		},

		OnDragEndHandler: function(e, node)
		{
			var _this = this;
			this.editor.skipPasteHandler = true;
			setTimeout(function()
			{
				var dd = _this.editor.GetIframeElement(node.id);
				if (dd && dd.parentNode)
				{
					var sur = _this.editor.util.CheckSurrogateNode(dd.parentNode);
					if (sur)
					{
						_this.editor.util.InsertAfter(dd, sur);
					}
				}
				_this.editor.synchro.FullSyncFromIframe();
				_this.editor.skipPasteHandler = false;
			}, 10);
		},

		OnElementMouseDownEx: function(e)
		{
			return true;
		},

		OnElementClick: function(e)
		{
			this.OnElementClickEx();
			return true;
		},

		OnElementClickEx: function()
		{
			return true;
		},

		OnElementDoubleClick: function(e, target, bxTag)
		{
			if (target)
			{
				var dd = target.cloneNode(true);
				this.editor.Focus();
				this.editor.selection.InsertNode(dd);
				this.editor.synchro.FullSyncFromIframe();
			}
		},

		OnGroupTitleClick: function(pElement)
		{
			if (pElement && pElement.getAttribute('data-bx-taskbar') == this.id)
			{
				return this.ToggleGroup(pElement.parentNode);
			}
			return true;
		},

		OnTitleClick: function(pElement)
		{
			if (pElement && pElement.getAttribute('data-bx-taskbar') == this.id)
			{
				return this.manager.ShowTaskbar(this.id);
			}
			return true;
		},

		OnMenuClick: function(pElement)
		{
			if (pElement && pElement.getAttribute('data-bx-taskbar') == this.id)
				return this.ShowMenu(pElement);
			return true;
		},

		Activate: function()
		{
			this.pTreeCont.style.display = 'block';
			this.bActive = true;
			return true;
		},

		Deactivate: function()
		{
			this.pTreeCont.style.display = 'none';
			this.bActive = false;
			return true;
		},

		IsActive: function()
		{
			return !!this.bActive;
		},

		ShowMenu: function(pElement)
		{
			var arItems = this.GetMenuItems();
			BX.PopupMenu.destroy(this.uniqueId + "_menu");
			BX.PopupMenu.show(this.uniqueId + "_menu", pElement, arItems, {
					overlay: {opacity: 0.1},
					events: {
						onPopupClose: function(){BX.removeClass(this.bindElement, "bxec-add-more-over");}
					},
					offsetLeft: 1,
					zIndex: 3005
				}
			);
			return true;
		},

		GetMenuItems: function()
		{
			return [];
		},

		Search: function(value)
		{
			this.ClearSearchResult();
			var
				bFoundItems = false,
				pSect, el,
				i, l = this.searchIndex.length;

			value = BX.util.trim(value.toLowerCase());

			BX.addClass(this.pTreeCont, 'bxhtmled-taskbar-tree-cont-search');
			BX.addClass(this.manager.pSearchCont, 'bxhtmled-search-cont-res');

			for(i = 0; i < l; i++)
			{
				el = this.searchIndex[i];
				if (el.content.indexOf(value) !== -1) // Show element
				{
					bFoundItems = true;
					BX.addClass(el.element, 'bxhtmled-tskbr-search-res');
					this._searchResult.push(el.element);

					pSect = BX.findParent(el.element, function(node)
					{
						return node.getAttribute && node.getAttribute('data-bx-type') == 'taskbargroup';
					}, this.pTreeCont);

					while (pSect)
					{
						BX.addClass(pSect, 'bxhtmled-tskbr-search-res');
						this.ToggleGroup(pSect, true);
						this._searchResultSect.push(pSect);

						pSect = BX.findParent(pSect, function(node)
						{
							return node.getAttribute && node.getAttribute('data-bx-type') == 'taskbargroup';
						}, this.pTreeCont);
					}
				}
			}

			if (!bFoundItems)
			{
				this.manager.pSearchNothingNotice.style.display = 'block';
			}
		},

		ClearSearchResult: function()
		{
			BX.removeClass(this.pTreeCont, 'bxhtmled-taskbar-tree-cont-search');
			BX.removeClass(this.manager.pSearchCont, 'bxhtmled-search-cont-res');
			this.manager.pSearchNothingNotice.style.display = 'none';
			var i;
			if (this._searchResult)
			{
				for(i = 0; i < this._searchResult.length; i++)
				{
					BX.removeClass(this._searchResult[i], 'bxhtmled-tskbr-search-res');
				}
				this._searchResult = [];
			}
			if (this._searchResultSect)
			{
				for(i = 0; i < this._searchResultSect.length; i++)
				{
					BX.removeClass(this._searchResultSect[i], 'bxhtmled-tskbr-search-res');
					this.ToggleGroup(this._searchResultSect[i], false);
				}
				this._searchResultSect = [];
			}
		},

		GetId: function()
		{
			return this.id;
		}
	};

	function ComponentsControl(editor)
	{
		// Call parrent constructor
		ComponentsControl.superclass.constructor.apply(this, arguments);

		this.id = 'components';
		this.title = BX.message('ComponentsTitle');
		this.templateId = this.editor.templateId;
		this.uniqueId = 'taskbar_' + this.editor.id + '_' + this.id;
		this.searchPlaceholder = BX.message('BXEdCompSearchPlaceHolder');

		this.Init();
	}

	BX.extend(ComponentsControl, Taskbar);

	ComponentsControl.prototype.Init = function()
	{
		this.BuildSceleton();
		// Build structure
		var list = this.editor.components.GetList();
		this.BuildTree(list.groups, list.items);
	};

	ComponentsControl.prototype.HandleElementEx = function(wrap, dd, params)
	{
		this.editor.SetBxTag(dd, {tag: "component_icon", params: params});
		if (params.complex == "Y")
		{
			params.className = 'bxhtmled-surrogate-green';
			BX.addClass(wrap, 'bxhtmled-tskbr-element-green');
			wrap.title = BX.message('BXEdComplexComp');
		}
	};

	ComponentsControl.prototype.OnElementMouseDownEx = function(e, target, bxTag)
	{
		if (!bxTag || bxTag.tag !== 'component_icon')
		{
			return false;
		}

		this.editor.components.LoadParamsList({
			name: bxTag.params.name
		});
	};

	ComponentsControl.prototype.GetMenuItems = function()
	{
		var _this = this;
		return [
			{
				text : BX.message('RefreshTaskbar'),
				title : BX.message('RefreshTaskbar'),
				className : "",
				onclick: function()
				{
					_this.editor.componentsTaskbar.ClearSearchResult();
					_this.editor.components.ReloadList();
					BX.PopupMenu.destroy(_this.uniqueId + "_menu");
				}
			}
		];
	};

	// Editor dialog
	function Dialog(editor, params)
	{
		this.editor = editor;
		this.id = params.id;
		this.params = params;
		this.className = "bxhtmled-dialog" + (params.className ? ' ' + params.className : '');
		this.zIndex = params.zIndex || 3008;
		this.firstFocus = false;
		this.Init();
	}

	Dialog.prototype = {
		Init: function()
		{
			var
				_this = this,
				config = {
					title : this.params.title || this.params.name || '',
					width: this.params.width || 600,
					resizable: false
				};

			if (this.params.resizable)
			{
				config.resizable = true;
				config.min_width = this.params.min_width || 400;
				config.min_height = this.params.min_height || 250;
				config.resize_id = this.params.resize_id || this.params.id + '_res';
			}

			this.oDialog = new BX.CDialog(config);
			config.height = this.params.height || false;

			BX.addCustomEvent(this.oDialog, 'onWindowResize', BX.proxy(this.OnResize, this));
			BX.addCustomEvent(this.oDialog, 'onWindowResizeFinished', BX.proxy(this.OnResizeFinished, this));
			BX.addClass(this.oDialog.PARTS.CONTENT, this.className);

			// Clear dialog height for auto resizing
			if (!config.height)
			{
				this.oDialog.PARTS.CONTENT_DATA.style.height = null;
			}

			// Buttons
			this.oDialog.SetButtons([
				new BX.CWindowButton(
					{
						title: BX.message('DialogSave'),
						className: 'adm-btn-save',
						action: function()
						{
							BX.onCustomEvent(_this, "OnDialogSave");
							_this.oDialog.Close();
						}
					}),
				this.oDialog.btnCancel
			]);

			BX.addCustomEvent(this.oDialog, 'onWindowUnRegister', function()
			{
				BX.unbind(window, "keydown", BX.proxy(_this.OnKeyDown, _this));
				_this.dialogShownTimeout = setTimeout(function(){_this.editor.dialogShown = false;}, 300);
			});
		},

		Show: function()
		{
			var _this = this;
			this.editor.dialogShown = true;
			if (this.dialogShownTimeout)
			{
				this.dialogShownTimeout = clearTimeout(this.dialogShownTimeout);
			}
			this.oDialog.Show();
			this.oDialog.DIV.style.zIndex = this.zIndex;
			this.oDialog.OVERLAY.style.zIndex = this.zIndex - 2;
			var top = parseInt(this.oDialog.DIV.style.top) - 180;
			this.oDialog.DIV.style.top = (top > 50 ? top : 50) + 'px';
			BX.bind(window, "keydown", BX.proxy(this.OnKeyDown, this));

			setTimeout(function()
				{
					// Hack for Opera
					if (BX.browser.IsOpera())
						_this.oDialog.Move(1, 1);

					_this.oDialog.__resizeOverlay();

					if (_this.firstFocus)
						BX.focus(_this.firstFocus);
				},
				100
			);
		},

		BuildTabControl: function(pCont, arTabs)
		{
			var
				i,
				pTabsWrap = BX.create('DIV', {props: {className: 'bxhtmled-dlg-tabs-wrap'}}),
				pContWrap = BX.create('DIV', {props: {className: 'bxhtmled-dlg-cont-wrap'}});

			for (i = 0; i < arTabs.length; i++)
			{
				arTabs[i].tab = pTabsWrap.appendChild(BX.create('SPAN', {props: {className: 'bxhtmled-dlg-tab' + (i == 0 ? ' bxhtmled-dlg-tab-active' : '')}, attrs: {'data-bx-dlg-tab-ind': i.toString()}, text: arTabs[i].name}));
				arTabs[i].cont = pContWrap.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-dlg-cont'}, style: {'display' : i == 0 ? '' : 'none'}}));
			}

			BX.bind(pTabsWrap, 'click', function(e)
			{
				var
					ind,
					target = e.target || e.srcElement;

				if (target && target.getAttribute)
				{
					ind = parseInt(target.getAttribute('data-bx-dlg-tab-ind'));
					if (!isNaN(ind))
					{
						for (i = 0; i < arTabs.length; i++)
						{
							if (i == ind)
							{
								arTabs[i].cont.style.display = '';
								BX.addClass(arTabs[i].tab, 'bxhtmled-dlg-tab-active');
							}
							else
							{
								arTabs[i].cont.style.display = 'none';
								BX.removeClass(arTabs[i].tab, 'bxhtmled-dlg-tab-active');
							}
						}
					}
				}
			});

			pCont.appendChild(pTabsWrap);
			pCont.appendChild(pContWrap);

			return {
				cont: pCont,
				tabsWrap : pTabsWrap,
				contWrap : pContWrap,
				tabs: arTabs
			};
		},

		OnKeyDown: function(e)
		{
			if (e.keyCode == 13 && this.closeByEnter !== false)
			{
				var target = e.target || e.srcElement;
				if (target && target.nodeName !== 'TEXTAREA')
				{
					this.oDialog.PARAMS.buttons[0].emulate();
				}
			}
		},

		SetContent: function(html)
		{
			return this.oDialog.SetContent(html);
		},

		SetTitle: function(title)
		{
			return this.oDialog.SetTitle(title);
		},

		OnResize: function()
		{
		},

		OnResizeFinished: function()
		{
		},

		GetContentSize: function()
		{
			return {
				width : this.oDialog.PARTS.CONTENT_DATA.offsetWidth,
				height : this.oDialog.PARTS.CONTENT_DATA.offsetHeight
			};
		},

		Save: function()
		{
			if (this.savedRange)
			{
				this.editor.selection.SetBookmark(this.savedRange);
			}

			if (this.action && this.editor.action.IsSupported(this.action))
			{
				this.editor.action.Exec(this.action, this.GetValues());
			}
		},

		Close: function()
		{
			if (this.IsOpen())
			{
				this.oDialog.Close();
			}
		},

		IsOpen: function()
		{
			return this.oDialog.isOpen;
		},

		DisableKeyCheck: function()
		{
			this.closeByEnter = false;
			BX.WindowManager.disableKeyCheck();
		},

		EnableKeyCheck: function()
		{
			var _this = this;
			setTimeout(function()
			{
				_this.closeByEnter = true;
				BX.WindowManager.enableKeyCheck();
			}, 200);
		},

		AddTableRow: function (tbl, firstCell)
		{
			var r, c1, c2;

			r = tbl.insertRow(-1);
			c1 = r.insertCell(-1);
			c1.className = 'bxhtmled-left-c';

			if (firstCell && firstCell.label)
			{
				c1.appendChild(BX.create('LABEL', {props: {className: firstCell.required ? 'bxhtmled-req' : ''}, text: firstCell.label})).setAttribute('for', firstCell.id);
			}

			c2 = r.insertCell(-1);
			c2.className = 'bxhtmled-right-c';
			return {row: r, leftCell: c1, rightCell: c2};
		},

		SetValues: BX.DoNothing,
		GetValues: BX.DoNothing
	};

	function ContextMenu(editor)
	{
		this.editor = editor;
		this.lastMenuId = null;
		BX.addCustomEvent(this.editor, 'OnIframeContextMenu', BX.delegate(this.Show, this));
		this.Init();
	}

	ContextMenu.prototype = {
		Init: function()
		{
			var
			_this = this,
			defaultItem = {
				text: BX.message('ContMenuDefProps'),
				onclick: function()
				{
					_this.editor.selection.SetBookmark(_this.savedRange);
					_this.editor.GetDialog('Default').Show(false, _this.savedRange);
					_this.Hide();
				}
			};

			// Remove format ?
			// Replace Node by children ?

			//this.tagsList = [];
			this.items = {
				// Surrogates
				'php' : [
					{
						text: BX.message('BXEdContMenuPhpCode'),
						onclick: function()
						{
							var items = _this.GetTargetItem();
							if (items && items.php)
							{
								_this.editor.GetDialog('Source').Show(items.php.bxTag);
							}
							_this.Hide();
						}
					}
				],
				'anchor' : [
					{
						text: BX.message('BXEdEditAnchor'),
						onclick: function()
						{
							var items = _this.GetTargetItem();
							if (items && items.anchor)
							{
								_this.editor.GetDialog('Anchor').Show(items.anchor.bxTag);
							}
							_this.Hide();
						}
					}
				],
				'javascript' : [
					{
						text: BX.message('BXEdContMenuJavascript'),
						onclick: function()
						{
							var items = _this.GetTargetItem();
							if (items && items.javascript)
							{
								_this.editor.GetDialog('Source').Show(items.javascript.bxTag);
							}
							_this.Hide();
						}
					}
				],
				'htmlcomment' : [
					{
						text: BX.message('BXEdContMenuHtmlComment'),
						onclick: function()
						{
							var items = _this.GetTargetItem();
							if (items && items.htmlcomment)
							{
								_this.editor.GetDialog('Source').Show(items.htmlcomment.bxTag);
							}
							_this.Hide();
						}
					}
				],
				'iframe' : [
					{
						text: BX.message('BXEdContMenuIframe'),
						onclick: function()
						{
							var items = _this.GetTargetItem();
							if (items && items.iframe)
							{
								_this.editor.GetDialog('Source').Show(items.iframe.bxTag);
							}
							_this.Hide();
						}
					}
				],
				'style' : [
					{
						text: BX.message('BXEdContMenuStyle'),
						onclick: function()
						{
							var items = _this.GetTargetItem();
							if (items && items.style)
							{
								_this.editor.GetDialog('Source').Show(items.style.bxTag);
							}
							_this.Hide();
						}
					}
				],
				'object' : [
					{
						text: BX.message('BXEdContMenuObject'),
						onclick: function()
						{
							var items = _this.GetTargetItem();
							if (items && items.object)
							{
								_this.editor.GetDialog('Source').Show(items.object.bxTag);
							}
							_this.Hide();
						}
					}
				],
				'component' : [
					{
						text: BX.message('BXEdContMenuComponent'),
						onclick: function()
						{
							var items = _this.GetTargetItem();
							if (items && items.component)
							{
								// Show dialog
								_this.editor.components.ShowPropertiesDialog(items.component.bxTag.params, _this.editor.GetBxTag(items.component.bxTag.surrogateId));
							}
							_this.Hide();
						}
					},
					{
						text: BX.message('BXEdContMenuComponentRemove'),
						onclick: function()
						{
							var items = _this.GetTargetItem();
							if (items && items.component)
							{
								BX.remove(items.component.element);
							}
							_this.Hide();
						}
					}
				],
				'printbreak' : [
					{
						text: BX.message('NodeRemove'),
						onclick: function(e)
						{
							var node = _this.GetTargetItem('printbreak');
							if (node && node.element)
							{
								_this.editor.selection.RemoveNode(node.element);
							}
							_this.Hide();
						}
					}
				],
				'video': [
					{
						text: BX.message('BXEdVideoProps'),
						bbMode: true,
						onclick: function()
						{
							var node = _this.GetTargetItem('video');
							if (node)
							{
								_this.editor.GetDialog('Video').Show(node.bxTag);
							}
							_this.Hide();
						}
					},
					{
						text: BX.message('BXEdVideoDel'),
						bbMode: true,
						onclick: function(e)
						{
							var node = _this.GetTargetItem('video');
							if (node && node.element)
							{
								_this.editor.selection.RemoveNode(node.element);
							}
							_this.Hide();
						}
					}
				],
				'smile' : [],

				// Nodes
				'A' : [
					{
						text: BX.message('ContMenuLinkEdit'),
						bbMode: true,
						onclick: function()
						{
							var node = _this.GetTargetItem('A');
							if (node)
							{
								_this.editor.GetDialog('Link').Show([node], this.savedRange);
							}
							_this.Hide();
						}
					},
					{
						text: BX.message('ContMenuLinkDel'),
						bbMode: true,
						onclick: function()
						{
							var link = _this.GetTargetItem('A');
							if (link && _this.editor.action.IsSupported('removeLink'))
							{
								_this.editor.action.Exec('removeLink', [link]);
							}
							_this.Hide();
						}
					}
				],
				'IMG': [
					{
						text: BX.message('ContMenuImgEdit'),
						bbMode: true,
						onclick: function()
						{
							var node = _this.GetTargetItem('IMG');
							if (node)
							{
								_this.editor.GetDialog('Image').Show([node], this.savedRange);
							}
							_this.Hide();
						}
					},
					{
						text: BX.message('ContMenuImgDel'),
						bbMode: true,
						onclick: function()
						{
							var node = _this.GetTargetItem('IMG');
							if (node)
							{
								_this.editor.selection.RemoveNode(node);
							}
							_this.Hide();
						}
					}
				],
				'DIV': [
					{
						text: BX.message('ContMenuCleanDiv'),
						title: BX.message('ContMenuCleanDiv_Title'),
						onclick: function()
						{
							var node = _this.GetTargetItem('DIV');
							if (node)
							{
								_this.editor.On('OnHtmlContentChangedByControl');
								_this.editor.util.ReplaceWithOwnChildren(node);
								_this.editor.synchro.FullSyncFromIframe();
							}
							_this.Hide();
						}
					},
					defaultItem
				],
				'TABLE': [
//					{
//						text: BX.message('BXEdTableInsCell'),
//						onclick: function()
//						{
//							_this.Hide();
//						}
//					},
//					{
//						text: BX.message('BXEdTableInsRow'),
//						onclick: function()
//						{
//							_this.Hide();
//						}
//					},
//					{
//						text: BX.message('BXEdTableInsColumn'),
//						onclick: function()
//						{
//							_this.Hide();
//						}
//					},
					{
						text: BX.message('BXEdTableTableProps'),
						onclick: function()
						{
							var node = _this.GetTargetItem('TABLE');
							if (node)
							{
								_this.editor.GetDialog('Table').Show([node], this.savedRange);
							}
							_this.Hide();
						}
					},
					{
						text: BX.message('BXEdTableDeleteTable'),
						bbMode: true,
						onclick: function()
						{
							var node = _this.GetTargetItem('TABLE');
							if (node)
							{
								_this.editor.selection.RemoveNode(node);
							}
							_this.Hide();
						}
					}
				],
				// ...
				'DEFAULT': [defaultItem]
			};
		},

		Show: function(e, target)
		{
			this.savedRange = this.editor.selection.GetBookmark();

			if (this.lastMenuId)
			{
				this.Hide();
			}

			this.editor.contextMenuShown = true;
			if (this.contextMenuShownTimeout)
			{
				this.contextMenuShownTimeout = clearTimeout(this.contextMenuShownTimeout);
			}
			this.nodes = [];
			this.tagIndex = {};
			this.lastMenuId = 'bx_context_menu_' + Math.round(Math.random() * 1000000000);
			var
				bxTag,
				i, j,
				arItems = [],
				maxIter = 20, iter = 0,
				element = target,
				label;

			this.targetItems = {};
			while (true)
			{
				if (element.nodeName && element.nodeName.toUpperCase() != 'BODY')
				{
					if (element.nodeType != 3)
					{
						bxTag = this.editor.GetBxTag(element);

						if (bxTag && bxTag.tag == 'surrogate_dd')
						{
							var origTag = this.editor.GetBxTag(bxTag.params.origId);
							element = this.editor.GetIframeElement(origTag.id);
							this.targetItems[origTag.tag] = {element: element, bxTag: origTag};
							this.nodes = [element];
							this.tagIndex[origTag.tag] = 0;
							iter = 0;
							element = element.parentNode;
							continue;
						}
						else if (bxTag && bxTag.tag && this.items[bxTag.tag])
						{
							this.nodes = [element];
							this.targetItems[bxTag.tag] = {element: element, bxTag: bxTag.tag};
							this.nodes = [element];
							this.tagIndex[bxTag.tag] = 0;
							iter = 0;
							element = element.parentNode;
							continue;
						}

						label = element.nodeName;
						this.targetItems[label] = element;
						this.nodes.push(element);
						this.tagIndex[label] = this.nodes.length - 1;
					}
					iter++;
				}

				if (!element ||
					element.nodeName && element.nodeName.toUpperCase() == 'BODY' ||
					iter >= maxIter)
				{
					break;
				}

				element = element.parentNode;
			}

			for (i in this.items)
			{
				if (this.items.hasOwnProperty(i) && this.tagIndex[i] != undefined)
				{
					if (arItems.length > 0)
					{
						arItems.push({separator : true});
					}

					for (j = 0; j < this.items[i].length; j++)
					{
						if (this.editor.bbCode && !this.items[i][j].bbMode)
						{
							continue;
						}
						this.items[i][j].title = this.items[i][j].title || this.items[i][j].text;
						arItems.push(this.items[i][j]);
					}
				}
			}

			if (arItems.length == 0)
			{
				var def = this.items['DEFAULT'];
				if (!this.editor.bbCode || def.bbMode)
				{
					for (j = 0; j < def.length; j++)
					{
						def[j].title = def[j].title || def[j].text;
						arItems.push(def[j]);
					}
				}
			}


			var
				x = e.clientX,
				y = e.clientY;

			if (!this.dummyTarget)
			{
				this.dummyTarget = this.editor.dom.iframeCont.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-dummy-target'}}));
			}

			this.dummyTarget.style.left = x + 'px';
			this.dummyTarget.style.top = y + 'px';


			// TODO: !!!!
//			bindElement.OPENER = new BX.COpener({
//				DIV: bindElement,
//				MENU: menu,
//				TYPE: 'click',
//				ACTIVE_CLASS: (typeof params.active_class != 'undefined') ? params.active_class : 'adm-btn-active',
//				CLOSE_ON_CLICK: (typeof params.close_on_click != 'undefined') ? !!params.close_on_click : true
//			});

			if (arItems.length > 0)
			{
				BX.PopupMenu.show(this.lastMenuId, this.dummyTarget, arItems, {
						events: {
							onPopupClose: BX.proxy(this.Hide, this)
						},
						offsetLeft: 1,
						zIndex: 2005
					}
				);

				this.isOpened = true;
				BX.addCustomEvent(this.editor, 'OnIframeClick', BX.proxy(this.Hide, this));
				BX.addCustomEvent(this.editor, 'OnIframeKeyup', BX.proxy(this.CheckEscapeClose, this));
				return BX.PreventDefault(e);
			}
		},

		Hide: function()
		{
			if (this.lastMenuId)
			{
				var _this = this;
				this.contextMenuShownTimeout = setTimeout(function(){_this.editor.contextMenuShown = false;}, 300);
				BX.PopupMenu.destroy(this.lastMenuId);
				this.lastMenuId = null;
				this.isOpened = false;

				BX.removeCustomEvent(this.editor, 'OnIframeClick', BX.proxy(this.Hide, this));
				BX.removeCustomEvent(this.editor, 'OnIframeKeyup', BX.proxy(this.CheckEscapeClose, this));
			}
		},

		CheckEscapeClose: function(e, keyCode)
		{
			if (keyCode == this.editor.KEY_CODES['escape'])
				this.Hide();
		},

		GetTargetItem: function(tag)
		{
			return tag ? (this.targetItems[tag] || null) : this.targetItems;
		}
	};

	function Toolbar(editor, topControls)
	{
		this.editor = editor;
		this.pCont = editor.dom.toolbar;
		this.controls = {};
		this.bCompact = false;
		this.topControls = topControls;
		this.showMoreButton = false;
		this.shown = true;
		this.height = 34;
		this.Init();
	}

	Toolbar.prototype = {
		Init: function()
		{
			this.BuildControls();
			// Init Event handlers
			BX.addCustomEvent(this.editor, "OnIframeFocus", BX.delegate(this.EnableWysiwygButtons, this));
			BX.addCustomEvent(this.editor, "OnTextareaFocus", BX.delegate(this.DisableWysiwygButtons, this));
		},

		BuildControls: function()
		{
			BX.cleanNode(this.pCont);
			var
				i,
				wrap, moreCont, cont,
				map = this.GetControlsMap(),
				wraps = {
					left: this.pCont.appendChild(BX.create('span', {props: {className: 'bxhtmled-top-bar-left-wrap'}, style: {display: 'none'}})),
					main: this.pCont.appendChild(BX.create('span', {props: {className: 'bxhtmled-top-bar-wrap'}, style: {display: 'none'}})),
					right: this.pCont.appendChild(BX.create('span', {props: {className: 'bxhtmled-top-bar-right-wrap'}, style: {display: 'none'}})),
					hidden: this.pCont.appendChild(BX.create('span', {props: {className: 'bxhtmled-top-bar-hidden-wrap'}}))
				};

			this.hiddenWrap = wraps.hidden;

			for (i = 0; i < map.length; i++)
			{
				if(map[i].hidden)
				{
					map[i].wrap = 'hidden';
					this.showMoreButton = true;
				}
				wrap = wraps[(map[i].wrap || 'main')];

				if (!wrap)
				{
					// We trying to find wrap as dom element by Id
					wrap = BX(map[i].wrap, true);
					if (wrap)
					{
						wraps[map[i].wrap] = wrap;
					}
					else
					{
						wrap = wraps['main'];
					}
				}

				if (wrap.style.display == 'none')
					wrap.style.display = '';

				if (map[i].separator)
				{
					wrap.appendChild(this.GetSeparator()); // Show separator
				}
				else if(this.topControls[map[i].id])
				{
					if (!this.controls[map[i].id])
					{
						this.controls[map[i].id] = new this.topControls[map[i].id](this.editor, wrap);
					}
					else
					{
						cont = this.controls[map[i].id].GetPopupBindCont ? this.controls[map[i].id].GetPopupBindCont() : this.controls[map[i].id].GetCont();

						if (this.controls[map[i].id].CheckBeforeShow && !this.controls[map[i].id].CheckBeforeShow())
							continue;

						if (this.controls.More && ((this.bCompact && !map[i].compact) || map[i].hidden))
						{
							if (!moreCont)
							{
								moreCont = this.controls.More.GetPopupCont();
							}
							moreCont.appendChild(cont);
						}
						else
						{
							wrap.appendChild(cont);
						}
					}
				}
			}

			for (i in wraps)
			{
				if (wraps.hasOwnProperty(i) && i !== 'main' && i !== 'left' && i !== 'right' && i !== 'hidden' && wraps[i].getAttribute('data-bx-check-command') !== 'N')
				{
					wraps[i].setAttribute('data-bx-check-command', 'N');
					BX.bind(wraps[i], "click", BX.proxy(function(e)
					{
						this.editor.CheckCommand(e.target || e.srcElement);
					}, this));
				}
			}
		},

		GetControlsMap: function()
		{
			var res = this.editor.config.controlsMap;
			if (!res)
			{
				res = [
					//{id: 'SearchButton', wrap: 'left', compact: true},
					{id: 'ChangeView', wrap: 'left', compact: true, sort: 10},
					{id: 'Undo', compact: false, sort: 20},
					{id: 'Redo', compact: false, sort: 30},
					{id: 'StyleSelector', compact: true, sort: 40},
					{id: 'FontSelector', compact: false, sort: 50},
					{id: 'FontSize', compact: false, sort: 60},
					{separator: true, compact: false, sort: 70},
					{id: 'Bold', compact: true, sort: 80},
					{id: 'Italic', compact: true, sort: 90},
					{id: 'Underline', compact: true, sort: 100},
					{id: 'Strikeout', compact: true, sort: 110},
					{id: 'RemoveFormat', compact: true, sort: 120},
					{id: 'Color', compact: true, sort: 130},
					{separator: true, compact: false, sort: 140},
					{id: 'OrderedList', compact: true, sort: 150},
					{id: 'UnorderedList', compact: true, sort: 160},
					{id: 'IndentButton', compact: true, sort: 170},
					{id: 'OutdentButton', compact: true, sort: 180},
					{id: 'AlignList',compact: true, sort: 190},
					{separator: true, compact: false, sort: 200},
					{id: 'InsertLink', compact: true, sort: 210},
					{id: 'InsertImage', compact: true, sort: 220},
					{id: 'InsertVideo', compact: true, sort: 230},
					{id: 'InsertAnchor', compact: false, sort: 240},
					{id: 'InsertTable', compact: false, sort: 250},
					{id: 'InsertChar', compact: false, hidden: true, sort: 260},
					{id: 'PrintBreak', compact: false, hidden: true, sort: 270},
					{id: 'PageBreak', compact: false, hidden: true, sort: 275},
					{id: 'Spellcheck', compact: false, hidden: true, sort: 280},
	//				{id: 'PageBreak', compact: false, hidden: true, sort: 280},
	//				{id: 'InsertHr', compact: false, hidden: true, sort: 290},
					{id: 'Sub', compact: false, hidden: true, sort: 310},
					{id: 'Sup', compact: false, hidden: true, sort: 320},
					{id: 'TemplateSelector', compact: false, sort: 330},
					{id: 'Fullscreen', compact: true, sort: 340},

					{id: 'More', compact: true, sort: 400},
					{id: 'Settings',  wrap: 'right', compact: true, sort: 500}
				];
			}

			this.editor.On("GetControlsMap", [res]);
			res = res.sort(function(a, b){return a.sort - b.sort});
			return res;
		},

		GetSeparator: function()
		{
			return BX.create('span', {props: {className: 'bxhtmled-top-bar-separator'}});
		},

		AddButton: function()
		{
		},

		GetHeight: function()
		{
			var res = 0;
			if (this.shown)
			{
				if (!this.height)
					this.height = parseInt(this.editor.dom.toolbarCont.offsetHeight);

				res = this.height;
			}
			return res;
		},

		DisableWysiwygButtons: function(bDisable)
		{
			bDisable = bDisable !== false;
			for (var i in this.controls)
			{
				if (this.controls.hasOwnProperty(i) && typeof this.controls[i].Disable == 'function' && this.controls[i].disabledForTextarea !== false)
					this.controls[i].Disable(bDisable);
			}
		},

		EnableWysiwygButtons: function()
		{
			this.DisableWysiwygButtons(false);
		},

		AdaptControls: function(width)
		{
			var bCompact = width < this.editor.NORMAL_WIDTH;

			if (this.controls.More)
			{
				if (bCompact || this.showMoreButton)
				{
					this.controls.More.GetCont().style.display = '';
				}
				else
				{
					this.controls.More.GetCont().style.display = 'none';
				}
				this.controls.More.Close();
			}

			if (!bCompact && this.showMoreButton)
			{
				var moreCont = this.controls.More.GetPopupCont();
				while (this.hiddenWrap.firstChild)
				{
					moreCont.appendChild(this.hiddenWrap.firstChild);
				}
			}

			if (this.bCompact != bCompact)
			{
				this.bCompact = bCompact;
				this.BuildControls();
			}
		},

		Hide: function()
		{
			this.shown = false;
			this.editor.dom.toolbarCont.style.display = 'none';
			this.editor.ResizeSceleton();
		},

		Show: function()
		{
			this.shown = true;
			this.editor.dom.toolbarCont.style.display = '';
			this.editor.ResizeSceleton();
		},

		IsShown: function()
		{
			return this.shown;
		}
	};

	function NodeNavi(editor)
	{
		this.editor = editor;
		this.bShown = false;
		this.pCont = editor.dom.navCont;
		this.controls = {};
		this.height = 28;
		this.Init();
	}

	NodeNavi.prototype = {
		Init: function()
		{
			BX.addCustomEvent(this.editor, "OnIframeMouseDown", BX.proxy(this.OnIframeMousedown, this));
			BX.addCustomEvent(this.editor, "OnIframeKeyup", BX.proxy(this.OnIframeKeyup, this));
			BX.addCustomEvent(this.editor, "OnTextareaFocus", BX.delegate(this.Disable, this));
			BX.addCustomEvent(this.editor, "OnHtmlContentChangedByControl", BX.delegate(this.OnIframeKeyup, this));
			BX.bind(this.pCont, 'click', BX.delegate(this.ShowMenu, this));

			var _this = this;

			this.items = {
				// Surrogates
				'php' : function(node, bxTag)
				{
					_this.editor.GetDialog('Source').Show(bxTag);
				},
				'anchor' : function(node, bxTag)
				{
					_this.editor.GetDialog('Anchor').Show(bxTag);
				},
				'javascript' : function(node, bxTag)
				{
					_this.editor.GetDialog('Source').Show(bxTag);
				},
				'htmlcomment' : function(node, bxTag)
				{
					_this.editor.GetDialog('Source').Show(bxTag);
				},
				'iframe' : function(node, bxTag)
				{
					_this.editor.GetDialog('Source').Show(bxTag);
				},
				'style' : function(node, bxTag)
				{
					_this.editor.GetDialog('Source').Show(bxTag);
				},
				'video' : function(node, bxTag)
				{
					_this.editor.GetDialog('Video').Show(bxTag);
				},
				'component' : function(node, bxTag)
				{
					_this.editor.components.ShowPropertiesDialog(bxTag.params, _this.editor.GetBxTag(bxTag.surrogateId));
				},
				'printbreak' : false,

				// Nodes
				'A' : function(node)
				{
					_this.editor.GetDialog('Link').Show([node]);
				},
				'IMG' : function(node)
				{
					_this.editor.GetDialog('Image').Show([node]);
				},
				'TABLE' : function(node)
				{
					_this.editor.GetDialog('Table').Show([node]);
				},
				'DEFAULT' : function(node)
				{
					_this.editor.GetDialog('Default').Show([node]);
				}
			};
		},

		Show: function(bShow)
		{
			this.bShown = bShow = bShow !== false;
			this.pCont.style.display = bShow ? 'block' : 'none';
		},

		GetHeight: function()
		{
			if (!this.bShown)
				return 0;

			if (!this.height)
				this.height = parseInt(this.pCont.offsetHeight);

			return this.height;
		},

		OnIframeMousedown: function(e, target, bxTag)
		{
			this.BuildNavi(target);
		},

		OnIframeKeyup: function(e, keyCode, target)
		{
			this.BuildNavi(target);
		},

		BuildNavi: function(node)
		{
			BX.cleanNode(this.pCont);
			if (!node)
			{
				node = this.editor.GetIframeDoc().body;
			}
			this.nodeIndex = [];
			var itemCont, label, bxTag;
			while (node)
			{
				if (node.nodeType != 3)
				{
					bxTag = this.editor.GetBxTag(node);
					if (bxTag.tag)
					{
						if (bxTag.tag == "surrogate_dd")
						{
							node = node.parentNode;
							continue;
						}

						BX.cleanNode(this.pCont);
						this.nodeIndex = [];

						label = bxTag.name || bxTag.tag;
					}
					else
					{
						label = node.nodeName;
					}

					itemCont = BX.create("SPAN", {props: {className: "bxhtmled-nav-item"}, text: label});
					itemCont.setAttribute('data-bx-node-ind', this.nodeIndex.length.toString());

					this.nodeIndex.push({node: node, bxTag: bxTag.tag});

					if (this.pCont.firstChild)
					{
						this.pCont.insertBefore(itemCont, this.pCont.firstChild);
					}
					else
					{
						this.pCont.appendChild(itemCont);
					}
				}
				if (node.nodeName && node.nodeName.toUpperCase() == 'BODY')
				{
					break;
				}

				node = node.parentNode;
			}
		},

		ShowMenu: function(e)
		{
			if (!this.nodeIndex)
			{
				return;
			}

			var
				_this = this,
				nodeIndex,
				origNode,
				target;

			if (e.target)
			{
				target = e.target;
			}
			else if (e.srcElement)
			{
				target = e.srcElement;
			}
			if (target.nodeType == 3)
			{
				target = target.parentNode;
			}

			if (target)
			{
				nodeIndex = target.getAttribute('data-bx-node-ind');
				if (!this.nodeIndex[nodeIndex])
				{
					target = BX.findParent(target, function(node)
					{
						return node == _this.pCont || (node.getAttribute && node.getAttribute('data-bx-node-ind') >= 0);
					}, this.pCont);
					nodeIndex = target.getAttribute('data-bx-node-ind')
				}

				if (this.nodeIndex[nodeIndex])
				{
					var id = 'bx_node_nav_' + Math.round(Math.random() * 1000000000);
					origNode = this.nodeIndex[nodeIndex].node;

					var arItems = [];
					if (origNode.nodeName && origNode.nodeName.toUpperCase() != 'BODY')
					{
						if (!this.nodeIndex[nodeIndex].bxTag || !this.editor.phpParser.surrogateTags[this.nodeIndex[nodeIndex].bxTag])
						{
							arItems.push({
								text : BX.message('NodeSelect'),
								title : BX.message('NodeSelect'),
								className : "",
								onclick: function()
								{
									_this.editor.action.Exec('selectNode', origNode);
									this.popupWindow.close();
									this.popupWindow.destroy();
								}
							});
						}

						arItems.push({
							text : BX.message('NodeRemove'),
							title : BX.message('NodeRemove'),
							className : "",
							onclick: function()
							{
								if (origNode && origNode.parentNode)
								{
									_this.BuildNavi(origNode.parentNode);
									_this.editor.selection.RemoveNode(origNode);
								}
								this.popupWindow.close();
								this.popupWindow.destroy();
							}
						});

						var showProps = !(this.nodeIndex[nodeIndex] && this.nodeIndex[nodeIndex].bxTag && this.items[this.nodeIndex[nodeIndex].bxTag] == false);
						if (showProps)
						{
							arItems.push({
								text : BX.message('NodeProps'),
								title : BX.message('NodeProps'),
								className : "",
								onclick: function()
								{
									_this.ShowNodeProperties(origNode);
									this.popupWindow.close();
									this.popupWindow.destroy();
								}
							});
						}
					}
					else
					{
						arItems = [
							{
								text : BX.message('NodeSelectBody'),
								title : BX.message('NodeSelectBody'),
								className : "",
								onclick: function()
								{
									_this.editor.iframeView.CheckContentLastChild();
									_this.editor.action.Exec('selectNode', origNode);
									_this.editor.Focus();
									this.popupWindow.close();
									this.popupWindow.destroy();
								}
							},
							{
								text : BX.message('NodeRemoveBodyContent'),
								title : BX.message('NodeRemoveBodyContent'),
								className : "",
								onclick: function()
								{
									_this.BuildNavi(origNode);
									_this.editor.On('OnHtmlContentChangedByControl');
									_this.editor.iframeView.Clear();
									_this.editor.util.Refresh(origNode);
									_this.editor.synchro.FullSyncFromIframe();
									_this.editor.Focus();

									this.popupWindow.close();
									this.popupWindow.destroy();
								}
							}
						];
					}


					BX.PopupMenu.show(id + "_menu", target, arItems, {
							overlay: {opacity: 1},
							events: {
								onPopupClose: function()
								{
									//BX.removeClass(this.bindElement, "bxec-add-more-over");
								}
							},
							offsetLeft: 1
						}
					);
				}
			}
		},

		ShowNodeProperties: function(node)
		{
			var bxTag, key;
			if (node.nodeName && node.nodeType == 1)
			{
				bxTag = this.editor.GetBxTag(node);
				key = bxTag.tag ? bxTag.tag : node.nodeName;

				if (this.items[key] && typeof this.items[key] == 'function')
				{
					this.items[key](node, bxTag);
				}
				else
				{
					this.items['DEFAULT'](node, bxTag);
				}
			}
		},

		// TODO: hide it ??
		Disable: function()
		{
			this.BuildNavi(false);
		},

		Enable: function()
		{
		}
	};

	function Overlay(editor, params)
	{
		this.editor = editor;
		this.id = 'bxeditor_overlay' + this.editor.id;
		this.zIndex = params && params.zIndex ? params.zIndex : 3001;
	}

	Overlay.prototype =
	{
		Create: function ()
		{
			this.bCreated = true;
			this.bShown = false;
			var ws = BX.GetWindowScrollSize();
			this.pWnd = document.body.appendChild(BX.create("DIV", {props: {id: this.id, className: "bxhtmled-overlay"}, style: {zIndex: this.zIndex, width: ws.scrollWidth + "px", height: ws.scrollHeight + "px"}}));
			this.pWnd.ondrag = BX.False;
			this.pWnd.onselectstart = BX.False;
		},

		Show: function(arParams)
		{
			if (!this.bCreated)
				this.Create();
			this.bShown = true;
			if (this.shownTimeout)
			{
				this.shownTimeout = clearTimeout(this.shownTimeout);
			}
			var ws = BX.GetWindowScrollSize();
			this.pWnd.style.display = 'block';
			this.pWnd.style.width = ws.scrollWidth + "px";
			this.pWnd.style.height = ws.scrollHeight + "px";

			if (!arParams)
			{
				arParams = {};
			}

			this.pWnd.style.zIndex = arParams.zIndex || this.zIndex;

			BX.bind(window, "resize", BX.proxy(this.Resize, this));
			return this.pWnd;
		},

		Hide: function ()
		{
			if (!this.bShown)
			{
				return;
			}
			var _this = this;
			_this.shownTimeout = setTimeout(function(){_this.bShown = false;}, 300);
			this.pWnd.style.display = 'none';
			BX.unbind(window, "resize", BX.proxy(this.Resize, this));
			this.pWnd.onclick = null;
		},

		Resize: function ()
		{
			if (this.bCreated)
			{
				var ws = BX.GetWindowScrollSize();
				this.pWnd.style.width = ws.scrollWidth + "px";
				this.pWnd.style.height = ws.scrollHeight + "px";
			}
		}
	}

	function Button(editor)
	{
		this.editor = editor;
		this.className = 'bxhtmled-top-bar-btn';
		this.activeClassName = 'bxhtmled-top-bar-btn-active';
		this.disabledClassName = 'bxhtmled-top-bar-btn-disabled';
		this.checkableAction = true;
		this.disabledForTextarea = true;
	}

	Button.prototype = {
		Create: function ()
		{
			this.pCont = BX.create("SPAN", {props: {className: this.className, title: this.title || ''}, html: '<i></i>'});
			BX.bind(this.pCont, "click", BX.delegate(this.OnClick, this));
			BX.bind(this.pCont, "mousedown", BX.delegate(this.OnMouseDown, this));
			BX.bind(this.pCont, "dblclick", function(e){return BX.PreventDefault(e);});

			if (this.action)
			{
				this.pCont.setAttribute('data-bx-type', 'action');
				this.pCont.setAttribute('data-bx-action', this.action);
				if (this.value)
					this.pCont.setAttribute('data-bx-value', this.value);

				if (this.checkableAction)
				{
					this.editor.RegisterCheckableAction(this.action, {
						action: this.action,
						control: this,
						value: this.value
					});
				}
			}
		},

		GetCont: function()
		{
			return this.pCont;
		},

		Check: function (bFlag)
		{
			if(bFlag == this.checked || this.disabled)
				return;

			this.checked = bFlag;
			if(this.checked)
			{
				BX.addClass(this.pCont, this.activeClassName);
			}
			else
			{
				BX.removeClass(this.pCont, this.activeClassName);
			}
		},

		Disable: function(bFlag)
		{
			if(bFlag != this.disabled)
			{
				this.disabled = !!bFlag;
				if(bFlag)
				{
					if (this.action)
					{
						this.pCont.setAttribute('data-bx-type', '');
					}
					BX.addClass(this.pCont, this.disabledClassName);
				}
				else
				{
					if (this.action)
					{
						this.pCont.setAttribute('data-bx-type', 'action');
					}
					BX.removeClass(this.pCont, this.disabledClassName);
				}
			}
		},

		OnClick: BX.DoNothing,
		OnMouseUp: function()
		{
			if(!this.checked)
			{
				BX.removeClass(this.pCont, this.activeClassName);
			}
			BX.unbind(document, 'mouseup', BX.proxy(this.OnMouseUp, this));
			BX.removeCustomEvent(this.editor, "OnIframeMouseUp", BX.proxy(this.OnMouseUp, this));
		},

		OnMouseDown: function()
		{
			if (!this.disabled)
			{
				if (this.disabledForTextarea || !this.editor.synchro.IsFocusedOnTextarea())
				{
					this.savedRange = this.editor.selection.SaveBookmark();
				}
				BX.addClass(this.pCont, this.activeClassName);
				BX.bind(document, 'mouseup', BX.proxy(this.OnMouseUp, this));
				BX.addCustomEvent(this.editor, "OnIframeMouseUp", BX.proxy(this.OnMouseUp, this));
			}
		},

		GetValue: function()
		{
			return !!this.checked;
		},

		SetValue: function(value)
		{
			this.Check(value);
		}
	}

	// List
	function DropDown(editor)
	{
		this.editor = editor;
		this.className = 'bxhtmled-top-bar-btn';
		this.activeClassName = 'bxhtmled-top-bar-btn-active';
		this.activeListClassName = 'bxhtmled-top-bar-btn-active';
		this.arValues = [];
		this.checkableAction = true;
		this.disabledForTextarea = true;
		this.posOffset = {top: 6, left: -4};
		this.zIndex = 3005;
	}

	DropDown.prototype = {
		Create: function ()
		{
			this.pCont = BX.create("SPAN", {props: {className: this.className}, html: '<i></i>'});
			this.pValuesCont = BX.create("DIV", {props: {className: "bxhtmled-popup bxhtmled-dropdown-cont"}, html: '<div class="bxhtmled-popup-corner"></div>'});
			if (this.title)
			{
				this.pCont.title = this.title;
			}

			if(this.zIndex)
			{
				this.pValuesCont.style.zIndex = this.zIndex;
			}

			this.valueIndex = {};
			this.pValuesContWrap = this.pValuesCont.appendChild(BX.create("DIV"));
			var but, value, _this = this;
			for (var i = 0; i < this.arValues.length; i++)
			{
				value = this.arValues[i];
				but = this.pValuesContWrap.appendChild(BX.create("SPAN", {props: {title: value.title, className: value.className}, html: '<i></i>'}));
				but.setAttribute('data-bx-dropdown-value', value.id);
				this.valueIndex[value.id] = i;

				if (value.action)
				{
					but.setAttribute('data-bx-type', 'action');
					but.setAttribute('data-bx-action', value.action);
					if (value.value)
					{
						but.setAttribute('data-bx-value', value.value);
					}
				}

				BX.bind(but, 'mousedown', function(e)
				{
					_this.SelectItem(this.getAttribute('data-bx-dropdown-value'));
					_this.editor.CheckCommand(this);
					_this.Close();
				});

				this.arValues[i].listCont = but;
			}

			if (this.action && this.checkableAction)
			{
				this.editor.RegisterCheckableAction(this.action, {
					action: this.action,
					control: this
				});
			}

			BX.bind(this.pCont, 'click', BX.proxy(this.OnClick, this));
			BX.bind(this.pCont, "mousedown", BX.delegate(this.OnMouseDown, this));
		},

		GetCont: function()
		{
			return this.pCont;
		},

		GetPopupBindCont: function()
		{
			return this.pCont;
		},

		Disable: function(bFlag)
		{
			if(bFlag != this.disabled)
			{
				this.disabled = !!bFlag;
				if(bFlag)
				{
					BX.addClass(this.pCont, 'bxhtmled-top-bar-btn-disabled');
				}
				else
				{
					BX.removeClass(this.pCont, 'bxhtmled-top-bar-btn-disabled');
				}
			}
		},

		OnKeyDown: function(e)
		{
			if(e.keyCode == 27)
			{
				this.Close();
			}
		},

		OnClick: function()
		{
			if(!this.disabled)
			{
				if (this.bOpened)
				{
					this.Close();
				}
				else
				{
					this.Open();
				}
			}
		},

		OnMouseUp: function()
		{
			this.editor.selection.RestoreBookmark();
			if(!this.checked)
			{
				BX.removeClass(this.pCont, this.activeClassName);
			}
			BX.unbind(document, 'mouseup', BX.proxy(this.OnMouseUp, this));
			BX.removeCustomEvent(this.editor, "OnIframeMouseUp", BX.proxy(this.OnMouseUp, this));
		},

		OnMouseDown: function()
		{
			if (!this.disabled)
			{
				if (this.disabledForTextarea || !this.editor.synchro.IsFocusedOnTextarea())
				{
					this.savedRange = this.editor.selection.SaveBookmark();
				}

				BX.addClass(this.pCont, this.activeClassName);
				BX.bind(document, 'mouseup', BX.proxy(this.OnMouseUp, this));
				BX.addCustomEvent(this.editor, "OnIframeMouseUp", BX.proxy(this.OnMouseUp, this));
			}
		},

		Close: function ()
		{
			var _this = this;
			this.popupShownTimeout = setTimeout(function(){_this.editor.popupShown = false;}, 300);
			BX.removeClass(this.pCont, this.activeClassName);
			this.pValuesCont.style.display = 'none';
			this.editor.overlay.Hide();

			BX.unbind(window, "keydown", BX.proxy(this.OnKeyDown, this));
			BX.unbind(document, 'mousedown', BX.proxy(this.CheckClose, this));

			BX.onCustomEvent(this, "OnPopupClose");

			this.bOpened = false;
		},

		CheckClose: function(e)
		{
			if (!this.bOpened)
			{
				return BX.unbind(document, 'mousedown', BX.proxy(this.CheckClose, this));
			}

			var pEl;
			if (e.target)
				pEl = e.target;
			else if (e.srcElement)
				pEl = e.srcElement;
			if (pEl.nodeType == 3)
				pEl = pEl.parentNode;

			if (!BX.findParent(pEl, {className: 'bxhtmled-popup'}))
			{
				this.Close();
			}
		},

		Open: function ()
		{
			this.editor.popupShown = true;
			if (this.popupShownTimeout)
			{
				this.popupShownTimeout = clearTimeout(this.popupShownTimeout);
			}
			document.body.appendChild(this.pValuesCont);
			this.pValuesCont.style.display = 'block';
			BX.addClass(this.pCont, this.activeClassName);
			var
				pOverlay = this.editor.overlay.Show({zIndex: this.zIndex - 1}),
				bindCont = this.GetPopupBindCont(),
				pos = BX.pos(bindCont),
				left = Math.round(pos.left - this.pValuesCont.offsetWidth / 2 + bindCont.offsetWidth / 2 + this.posOffset.left),
				top = Math.round(pos.bottom + this.posOffset.top),
				_this = this;

			BX.bind(window, "keydown", BX.proxy(this.OnKeyDown, this));
			pOverlay.onclick = function(){_this.Close()};

			this.pValuesCont.style.top = top + 'px';
			this.pValuesCont.style.left = left + 'px';
			this.bOpened = true;

			setTimeout(function()
			{
				BX.bind(document, 'mousedown', BX.proxy(_this.CheckClose, _this));
			},100);
		},

		SelectItem: function(id, val)
		{
			if (!val)
				val = this.arValues[this.valueIndex[id]];

			if (this.lastActiveItem)
				BX.removeClass(this.lastActiveItem, this.activeListClassName);

			if (val)
			{
				// Select value in list as active
				if (val.listCont)
				{
					this.lastActiveItem = val.listCont;
					BX.addClass(val.listCont, this.activeListClassName);
				}

				this.pCont.className = val.className;
				this.pCont.title = BX.util.htmlspecialchars(val.title || val.name || '');
			}
			else
			{
				this.pCont.className = this.className;
				this.pCont.title = this.title;
			}

			if (this.disabled)
			{
				this.disabled = false;
				this.Disable(true);
			}

			return val;
		},

		SetValue: function()
		{
		},

		GetValue: function()
		{
		}
	};

	function DropDownList(editor)
	{
		// Call parrent constructor
		DropDownList.superclass.constructor.apply(this, arguments);
		this.className = 'bxhtmled-top-bar-select';
		this.itemClassName = 'bxhtmled-dd-list-item';
		this.activeListClassName = 'bxhtmled-dd-list-item-active';
		this.disabledForTextarea = true;
	}
	BX.extend(DropDownList, DropDown);

	DropDownList.prototype.Create = function ()
	{
		this.pCont = BX.create("SPAN", {props: {className: this.className, title: this.title}, attrs: {unselectable: 'on'}, text: ''});
		if (this.width)
			this.pCont.style.width = this.width + 'px';

		this.pValuesCont = BX.create("DIV", {props: {className: "bxhtmled-popup bxhtmled-dropdown-list-cont"}, html: '<div class="bxhtmled-popup-corner"></div>'});
		this.pValuesContWrap = this.pValuesCont.appendChild(BX.create("DIV", {props: {className: "bxhtmled-dd-list-wrap"}}));
		this.valueIndex = {};

		if(this.zIndex)
		{
			this.pValuesCont.style.zIndex = this.zIndex;
		}

		var but, value, _this = this, itemClass, i, html;
		for (i = 0; i < this.arValues.length; i++)
		{
			value = this.arValues[i];
			itemClass = this.itemClassName;
			if (value.className)
				itemClass += ' ' + value.className;

			html = value.tagName ? ('<' + value.tagName + '>' + value.name + '</' + value.tagName + '>') : value.name;
			but = this.pValuesContWrap.appendChild(BX.create("SPAN", {props: {title: value.title || value.name, className: itemClass}, html: html, style: value.style}));

			but.setAttribute('data-bx-dropdown-value', value.id);
			this.valueIndex[value.id] = i;

			if (value.defaultValue)
				this.SelectItem(null, value);

			if (value.action)
			{
				but.setAttribute('data-bx-type', 'action');
				but.setAttribute('data-bx-action', value.action);
				if (value.value)
					but.setAttribute('data-bx-value', value.value);
			}

			BX.bind(but, 'mousedown', function(e)
			{
				if (!e)
					e = window.event;
				_this.SelectItem(this.getAttribute('data-bx-dropdown-value'));
				_this.editor.CheckCommand(this);
			});

			this.arValues[i].listCont = but;
		}

		if (this.action && this.checkableAction)
		{
			this.editor.RegisterCheckableAction(this.action, {
				action: this.action,
				control: this
			});
		}

		BX.bind(this.pCont, 'click', BX.proxy(this.OnClick, this));
	};

	DropDownList.prototype.SelectItem = function (valDropdown, val, bClose)
	{
		bClose = bClose !== false;
		if (!val)
		{
			val = this.arValues[this.valueIndex[valDropdown]];
		}

		if (this.lastActiveItem)
		{
			BX.removeClass(this.lastActiveItem, this.activeListClassName);
		}

		if (val)
		{
			this.pCont.innerHTML = BX.util.htmlspecialchars((val.topName || val.name || val.id));
			this.pCont.title = this.title + ': ' + BX.util.htmlspecialchars(val.title || val.name);


			// Select value in list as active
			if (val.listCont)
			{
				this.lastActiveItem = val.listCont;
				BX.addClass(val.listCont, this.activeListClassName);
			}
		}

		if (this.bOpened && bClose)
		{
			this.Close();
		}
	};

	DropDownList.prototype.SetValue = function(active, state)
	{
	};

	DropDownList.prototype.SetWidth = function(width)
	{
		width = parseInt(width, 10);
		if (width)
		{
			this.width = width;
			this.pCont.style.width = width + 'px';
		}
	};

	DropDownList.prototype.Disable = function(bFlag)
	{
		if(bFlag != this.disabled)
		{
			this.disabled = !!bFlag;
			if(bFlag)
			{
				BX.addClass(this.pCont, 'bxhtmled-top-bar-select-disabled');
			}
			else
			{
				BX.removeClass(this.pCont, 'bxhtmled-top-bar-select-disabled');
			}
		}
	};

	// Combobox with multiple choice of values
	function ComboBox(editor, params)
	{
		this.values = [];
		this.pInput = params.input;
		this.editor = editor;
		this.value = params.value || '';
		this.defaultValue = params.defaultValue || '';
		this.posOffset = {top: 8, left: -4};
		this.zIndex = 3010;
		this.itemClassName = 'bxhtmled-dd-list-item';
		this.itemClassNameActive = 'bxhtmled-dd-list-item-active';
	}

	ComboBox.prototype = {
		Init: function()
		{
			BX.bind(this.pInput, 'focus', BX.proxy(this.Focus, this));
			BX.bind(this.pInput, 'click', BX.proxy(this.Focus, this));
			BX.bind(this.pInput, 'blur', BX.proxy(this.Blur, this));
			BX.bind(this.pInput, 'keyup', BX.proxy(this.KeyUp, this));

			this.visibleItemsLength = this.values.length;
			this.currentItem = false;
		},

		UpdateValues: function(values)
		{
			this.bCreated = false;
			this.values = values;
			this.visibleItemsLength = this.values.length;
			this.currentItem = false;
			if (this.bOpened)
			{
				this.ClosePopup();
			}
		},

		Create: function()
		{
			this.pValuesCont = BX.create("DIV", {props: {className: "bxhtmled-popup bxhtmled-combo-cont"}, html: '<div class="bxhtmled-popup-corner"></div>'});
			this.pValuesCont.style.zIndex = this.zIndex;

			if (this.pValuesContWrap)
			{
				BX.cleanNode(this.pValuesContWrap);
				this.pValuesCont.appendChild(this.pValuesContWrap);
			}
			else
			{
				this.pValuesContWrap = this.pValuesCont.appendChild(BX.create("DIV", {props: {className: "bxhtmled-dd-list-wrap"}}));

				BX.bind(this.pValuesContWrap, 'mousedown', function(e)
				{
					var target = e.target || e.srcElement;
					if (!target.getAttribute('data-bx-dropdown-value'))
					{
						target = BX.findParent(target, function(n)
						{
							return n.getAttribute && n.getAttribute('data-bx-dropdown-value');
						}, _this.pValuesContWrap);
					}

					if (target)
					{
						_this.currentItem = parseInt(target.getAttribute('data-bx-dropdown-value'), 10);
						_this.SetValueFromList();
					}

					_this.ClosePopup();
				});
			}
			this.valueIndex = {};

			var but, value, _this = this, itemClass, i, html;
			for (i = 0; i < this.values.length; i++)
			{
				value = this.values[i];
				itemClass = this.itemClassName || '';
				this.values[i].TITLE = this.values[i].TITLE || this.values[i].NAME;
				if (this.values[i].VALUE)
				{
					this.values[i].TITLE += ' (' + this.values[i].VALUE + ')';
				}
				else
				{
					this.values[i].VALUE = this.values[i].NAME;
				}

				but = this.pValuesContWrap.appendChild(BX.create("SPAN", {props: {className: itemClass}, html: value.TITLE}));
				but.setAttribute('data-bx-dropdown-value', i);
				this.values[i].cont = but;
			}

			this.bCreated = true;
		},

		KeyUp: function(e)
		{
			var keyCode = e.keyCode;
			if (keyCode == this.editor.KEY_CODES['down'])
			{
				this.SelectItem(1);
			}
			else if (keyCode == this.editor.KEY_CODES['up'])
			{
				this.SelectItem(-1);
			}
			else if (keyCode == this.editor.KEY_CODES['escape'])
			{
				if (this.bOpened)
				{
					this.ClosePopup();
					return BX.PreventDefault(e);
				}
			}
			else if (keyCode == this.editor.KEY_CODES['enter'])
			{
				if (this.bOpened)
				{
					this.SetValueFromList();
					this.ClosePopup();
					return BX.PreventDefault(e);
				}
			}
			else
			{
				this.FilterValue();
			}
		},

		FilterValue: function()
		{
			// Range
			var
				i, val,
				splitedVals = this.GetSplitedValues(),
				caretPos = this.GetCaretPos(this.pInput);

			for (i = 0; i < splitedVals.length; i++)
			{
				val = splitedVals[i];
				if (caretPos >= val.start && caretPos <= val.end)
				{
					break;
				}
			}

			// Filter values && highlight values
			this.FilterAndHighlight(val.value);
		},

		GetSplitedValues: function()
		{
			var
				arVals, i, gStart, gEnd, val,
				res = [],
				str = this.pInput.value;

			if (str.indexOf(',') === -1 || this.bMultiple === false)
			{
				res.push(
					{
						start: 0,
						end: str.length,
						value: BX.util.trim(str)
					}
				);
			}
			else
			{
				arVals = str.split(',');
				gStart = 0;
				gEnd = 0;
				for (i = 0; i < arVals.length; i++)
				{
					val = arVals[i];
					gEnd += val.length + i;
					res.push(
						{
							start: gStart,
							end: gEnd,
							value: BX.util.trim(val)
						}
					);
					gStart = gEnd;
				}
			}

			return res;
		},

		FilterAndHighlight: function(needle)
		{
			needle = BX.util.trim(needle);
			var val, i, showPopup = false, pos;

			this.visibleItemsLength = 0;
			for (i = 0; i < this.values.length; i++)
			{
				val = this.values[i];
				if (needle === '')
				{
					showPopup = true;
					val.cont.style.display = '';
					this.visibleItemsLength++;
				}
				else
				{
					pos = val.TITLE.indexOf(needle);
					if (pos !== -1 || needle == '')
					{
						val.cont.innerHTML = BX.util.htmlspecialchars(val.TITLE.substr(0, pos)) + '<b>' + BX.util.htmlspecialchars(needle) + '</b>' + BX.util.htmlspecialchars(val.TITLE.substr(pos + needle.length));
						showPopup = true;
						val.cont.style.display = '';
						val.cont.setAttribute('data-bx-dropdown-value', this.visibleItemsLength);
						this.visibleItemsLength++;
					}
					else
					{
						val.cont.innerHTML = BX.util.htmlspecialchars(val.TITLE);
						val.cont.style.display = 'none';
					}
				}
			}

			this.currentItem = false;

			if (showPopup && !this.bOpened)
			{
				this.ShowPopup();
			}
			else if (!showPopup && this.bOpened)
			{
				this.ClosePopup();
			}
		},

		GetCaretPos: function(input)
		{
			var caretPos = 0;

			// IE Support
			if (document.selection)
			{
				BX.focus(input);
				var oSel = document.selection.createRange();
				oSel.moveStart ('character', - input.value.length);
				// The caret position is selection length
				caretPos = oSel.text.length;
			}
			else if (input.selectionStart || input.selectionStart == '0')
			{
				caretPos = input.selectionStart;
			}
			return (caretPos);
		},

		SetValue: function(value)
		{
			this.pInput.value = value;
		},

		SetValueFromList: function()
		{
			var ind = 0, val, i;
			for (i = 0; i < this.values.length; i++)
			{
				val = this.values[i];
				if (val.cont.style.display != 'none')
				{
					if (ind == this.currentItem)
					{
						BX.addClass(val.cont, this.itemClassNameActive);
						break;
					}
					ind++;
				}
			}

			var
				splVal,
				splitedVals = this.GetSplitedValues(),
				caretPos = this.GetCaretPos(this.pInput);

			for (i = 0; i < splitedVals.length; i++)
			{
				splVal = splitedVals[i];
				if (caretPos >= splVal.start && caretPos <= splVal.end)
				{
					break;
				}
			}

			var
				curValue = this.pInput.value,
				before = curValue.substr(0, splVal.start),
				after = curValue.substr(splVal.end);

			before = before.replace(/^[\s\r\n\,]+/g, '').replace(/[\s\r\n\,]+$/g, '');
			after = after.replace(/^[\s\r\n\,]+/g, '').replace(/[\s\r\n\,]+$/g, '');

			this.pInput.value = before +
				(before == '' ? '' : ', ') +
				val.VALUE +
				(after == '' ? '' : ', ') +
				after;

			this.FilterAndHighlight('');
		},

		SelectItem: function(delta)
		{
			var ind, val, i, len;
			if (this.currentItem === false)
			{
				this.currentItem = 0;
			}
			else if(delta !== undefined)
			{
				this.currentItem += delta;

				if (this.currentItem > this.visibleItemsLength - 1)
				{
					this.currentItem = 0;
				}
				else if(this.currentItem < 0)
				{
					this.currentItem = this.visibleItemsLength - 1;
				}
			}

			var selected = this.pValuesContWrap.querySelectorAll("." + this.itemClassNameActive);
			if (selected)
			{
				for (i = 0; i < selected.length; i++)
				{
					BX.removeClass(selected[i], this.itemClassNameActive);
				}
			}

			ind = 0;
			len = this.values.length;
			for (i = 0; i < this.values.length; i++)
			{
				val = this.values[i];
				if (val.cont.style.display != 'none')
				{
					if (ind == this.currentItem)
					{
						BX.addClass(val.cont, this.itemClassNameActive);
						break;
					}
					ind++;
				}
			}
		},

		Focus: function(e)
		{
			if (this.values.length > 0 && !this.bFocused)
			{
				BX.focus(this.pInput);
				this.bFocused = true;
				if (this.value == this.defaultValue)
				{
					this.value = '';
				}

				this.ShowPopup();
			}
		},

		Blur: function()
		{
			if (this.values.length > 0 && this.bFocused)
			{
				this.bFocused = false;
				this.ClosePopup();
			}
		},

		ShowPopup: function()
		{
			if (!this.bCreated)
			{
				this.Create();
			}

			this.editor.popupShown = true;
			if (this.popupShownTimeout)
			{
				this.popupShownTimeout = clearTimeout(this.popupShownTimeout);
			}

			document.body.appendChild(this.pValuesCont);
			this.pValuesCont.style.display = 'block';

			var
				i,
				pos = BX.pos(this.pInput),
				left = pos.left + this.posOffset.left,
				top = pos.bottom + this.posOffset.top;

			this.pValuesCont.style.top = top + 'px';
			this.pValuesCont.style.left = left + 'px';
			this.bOpened = true;

			var selected = this.pValuesContWrap.querySelectorAll("." + this.itemClassNameActive);
			if (selected)
			{
				for (i = 0; i < selected.length; i++)
				{
					BX.removeClass(selected[i], this.itemClassNameActive);
				}
			}

			BX.onCustomEvent(this, "OnComboPopupOpen");
		},

		ClosePopup: function()
		{
			var _this = this;
			this.popupShownTimeout = setTimeout(function(){_this.editor.popupShown = false;}, 300);
			this.pValuesCont.style.display = 'none';
			this.editor.overlay.Hide();

			this.bOpened = false;
			BX.onCustomEvent(this, "OnComboPopupClose");
		},

		OnChange: function()
		{
		},

		CheckClose: function(e)
		{
			if (!this.bOpened)
			{
				return BX.unbind(document, 'mousedown', BX.proxy(this.CheckClose, this));
			}

			var pEl;
			if (e.target)
				pEl = e.target;
			else if (e.srcElement)
				pEl = e.srcElement;
			if (pEl.nodeType == 3)
				pEl = pEl.parentNode;

			if (!BX.findParent(pEl, {className: 'bxhtmled-popup'}))
				this.Close();
		}
	};

	function ClassSelector(editor, params)
	{
		// Call parrent constructor
		ClassSelector.superclass.constructor.apply(this, arguments);
		this.filterTag = params.filterTag || '';
		this.lastTemplateId = this.editor.GetTemplateId();
		this.values = this.GetClasses();
		this.Init();
	};
	BX.extend(ClassSelector, ComboBox);

	ClassSelector.prototype.OnChange = function()
	{
		if (this.lastTemplateId != this.editor.GetTemplateId())
		{
			this.lastTemplateId = this.editor.GetTemplateId();
			this.values = this.GetClasses();
			this.bCreated = false;
		}
	};

	ClassSelector.prototype.GetClasses = function()
	{
		var classes = this.editor.GetCurrentCssClasses(this.filterTag);
		this.values = [];
		if (classes && classes.length > 0)
		{
			for (var i = 0; i < classes.length; i++)
			{
				this.values.push(
					{
						NAME: classes[i].className
					}
				);
			}
		}
		return this.values;
	};

	function __run()
	{
		window.BXHtmlEditor.TaskbarManager = TaskbarManager;
		window.BXHtmlEditor.Taskbar = Taskbar;
		window.BXHtmlEditor.ComponentsControl = ComponentsControl;
		window.BXHtmlEditor.ContextMenu = ContextMenu;
		window.BXHtmlEditor.Dialog = Dialog;
		window.BXHtmlEditor.Toolbar = Toolbar;
		window.BXHtmlEditor.NodeNavigator = NodeNavi;
		window.BXHtmlEditor.Button = Button;
		window.BXHtmlEditor.DropDown = DropDown;
		window.BXHtmlEditor.DropDownList = DropDownList;
		window.BXHtmlEditor.ComboBox = ComboBox;
		window.BXHtmlEditor.ClassSelector = ClassSelector;
		window.BXHtmlEditor.Overlay = Overlay;

		BX.onCustomEvent(window.BXHtmlEditor, 'OnEditorBaseControlsDefined');
	}

	if (window.BXHtmlEditor)
	{
		__run();
	}
	else
	{
		BX.addCustomEvent(window, "OnBXHtmlEditorInit", __run);
	}
})();

/* End */
;
; /* Start:/bitrix/js/fileman/html_editor/html-controls.js*/
/**
 * Bitrix HTML Editor 3.0
 * Date: 24.04.13
 * Time: 4:23
 *
 */
;(function() {
function __run()
{
	var
		Button = window.BXHtmlEditor.Button,
		Dialog = window.BXHtmlEditor.Dialog;

	function ColorPicker(editor, wrap)
	{
		this.editor = editor;
		this.className = 'bxhtmled-top-bar-btn bxhtmled-top-bar-color';
		this.activeClassName = 'bxhtmled-top-bar-btn-active';
		this.disabledClassName = 'bxhtmled-top-bar-btn-disabled';
		this.bCreated = false;
		this.zIndex = 3006;
		this.disabledForTextarea = true;
		this.posOffset = {top: 6, left: 0};
		this.id = 'color';
		this.title = BX.message('BXEdForeColor');
		this.actionColor = 'foreColor';
		this.actionBg = 'backgroundColor';
		this.showBgMode = !this.editor.bbCode;
		this.disabledForTextarea = !editor.bbCode;
		this.Create();

		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}

	ColorPicker.prototype = {
		Create: function ()
		{
			this.pCont = BX.create("SPAN", {props: {className: this.className, title: this.title || ''}});
			this.pContLetter = this.pCont.appendChild(BX.create("SPAN", {props: {className: 'bxhtmled-top-bar-btn-text'}, html: 'A'}));
			this.pContStrip = this.pCont.appendChild(BX.create("SPAN", {props: {className: 'bxhtmled-top-bar-color-strip'}}));
			this.currentAction = this.actionColor;
			BX.bind(this.pCont, "click", BX.delegate(this.OnClick, this));
			BX.bind(this.pCont, "mousedown", BX.delegate(this.OnMouseDown, this));

			this.editor.RegisterCheckableAction(this.actionColor, {
				action: this.actionColor,
				control: this,
				value: this.value
			});

			this.editor.RegisterCheckableAction(this.actionBg, {
				action: this.actionBg,
				control: this,
				value: this.value
			});
		},

		GetCont: function()
		{
			return this.pCont;
		},

		Check: function (bFlag)
		{
			if(bFlag != this.checked && !this.disabled)
			{
				this.checked = bFlag;
				if(this.checked)
				{
					BX.addClass(this.pCont, 'bxhtmled-top-bar-btn-active');
				}
				else
				{
					BX.removeClass(this.pCont, 'bxhtmled-top-bar-btn-active');
				}
			}
		},

		Disable: function (bFlag)
		{
			if(bFlag != this.disabled)
			{
				this.disabled = !!bFlag;
				if(bFlag)
				{
					BX.addClass(this.pCont, 'bxhtmled-top-bar-btn-disabled');
				}
				else
				{
					BX.removeClass(this.pCont, 'bxhtmled-top-bar-btn-disabled');
				}
			}
		},

		GetValue: function()
		{
			return !!this.checked;
		},

		SetValue: function(active, state, action)
		{
			if (state && state[0])
			{
				var color = action == this.actionColor ? state[0].style.color : state[0].style.backgroundColor;
				this.SelectColor(color, action);
			}
			else
			{
				this.SelectColor(null, action);
			}
		},

		OnClick: function()
		{
			if(this.disabled)
			{
				return false;
			}
			if (this.bOpened)
			{
				return this.Close();
			}
			this.Open();
		},

		OnMouseUp: function()
		{
			this.editor.selection.RestoreBookmark();

			if(!this.checked)
			{
				BX.removeClass(this.pCont, this.activeClassName);
			}
			BX.unbind(document, 'mouseup', BX.proxy(this.OnMouseUp, this));
			BX.removeCustomEvent(this.editor, "OnIframeMouseUp", BX.proxy(this.OnMouseUp, this));
		},

		OnMouseDown: function()
		{
			if (!this.disabled)
			{
				if (this.disabledForTextarea || !this.editor.synchro.IsFocusedOnTextarea())
				{
					this.editor.selection.SaveBookmark();
				}

				BX.addClass(this.pCont, this.activeClassName);
				BX.bind(document, 'mouseup', BX.proxy(this.OnMouseUp, this));
				BX.addCustomEvent(this.editor, "OnIframeMouseUp", BX.proxy(this.OnMouseUp, this));
			}
		},

		Close: function ()
		{
			var _this = this;
			this.popupShownTimeout = setTimeout(function(){_this.editor.popupShown = false;}, 300);
			this.pValuesCont.style.display = 'none';
			BX.removeClass(this.pCont, this.activeClassName);
			this.editor.overlay.Hide();
			BX.unbind(window, "keydown", BX.proxy(this.OnKeyDown, this));
			BX.unbind(document, 'mousedown', BX.proxy(this.CheckClose, this));
			this.bOpened = false;
		},

		CheckClose: function(e)
		{
			if (!this.bOpened)
			{
				return BX.unbind(document, 'mousedown', BX.proxy(this.CheckClose, this));
			}

			var pEl;
			if (e.target)
				pEl = e.target;
			else if (e.srcElement)
				pEl = e.srcElement;
			if (pEl.nodeType == 3)
				pEl = pEl.parentNode;

			if (!BX.findParent(pEl, {className: 'lhe-colpick-cont'}))
			{
				this.Close();
			}
		},

		Open: function ()
		{
			this.editor.popupShown = true;
			if (this.popupShownTimeout)
			{
				this.popupShownTimeout = clearTimeout(this.popupShownTimeout);
			}
			var _this = this;
			if (!this.bCreated)
			{
				this.pValuesCont = document.body.appendChild(BX.create("DIV", {props: {className: "bxhtmled-popup  bxhtmled-color-cont"}, style: {zIndex: this.zIndex}, html: '<div class="bxhtmled-popup-corner"></div>'}));

				if (this.showBgMode)
				{
					this.pTextColorLink = this.pValuesCont.appendChild(BX.create("SPAN", {props: {className: "bxhtmled-color-link bxhtmled-color-link-active"}, text: BX.message('BXEdForeColor')}));
					this.pTextColorLink.setAttribute('data-bx-type', 'changeColorAction');
					this.pTextColorLink.setAttribute('data-bx-value', this.actionColor);
					this.pBgColorLink = this.pValuesCont.appendChild(BX.create("SPAN", {props: {className: "bxhtmled-color-link"}, text: BX.message('BXEdBackColor')}));
					this.pBgColorLink.setAttribute('data-bx-type', 'changeColorAction');
					this.pBgColorLink.setAttribute('data-bx-value', this.actionBg);
				}

				this.pValuesContWrap = this.pValuesCont.appendChild(BX.create("DIV", {props: {className: "bxhtmled-color-wrap"}}));

				BX.bind(this.pValuesCont, 'mousedown', function(e)
				{
					var target = e.target || e.srcElement, type;

					if (target != _this.pValuesCont)
					{
						type = (target && target.getAttribute) ? target.getAttribute('data-bx-type') : null;
						if (!type)
						{
							target = BX.findParent(target, function(n)
							{
								return n == _this.pValuesCont || (n.getAttribute && n.getAttribute('data-bx-type'));
							}, _this.pValuesCont);
							type = (target && target.getAttribute) ? target.getAttribute('data-bx-type') : null;
						}

						if (type == 'changeColorAction')
						{
							if (_this.showBgMode)
							{
								_this.SetMode(target.getAttribute('data-bx-value'));
								BX.PreventDefault(e);
							}
						}
						else if (target && type)
						{
							target.setAttribute('data-bx-action', _this.currentAction);
							_this.editor.CheckCommand(target);
							_this.SelectColor(target.getAttribute('data-bx-value'));
						}
					}
				});

				var arColors = [
					'#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF', '#EBEBEB', '#E1E1E1', '#D7D7D7', '#CCCCCC', '#C2C2C2', '#B7B7B7', '#ACACAC', '#A0A0A0', '#959595',
					'#EE1D24', '#FFF100', '#00A650', '#00AEEF', '#2F3192', '#ED008C', '#898989', '#7D7D7D', '#707070', '#626262', '#555555', '#464646', '#363636', '#262626', '#111111', '#000000',
					'#F7977A', '#FBAD82', '#FDC68C', '#FFF799', '#C6DF9C', '#A4D49D', '#81CA9D', '#7BCDC9', '#6CCFF7', '#7CA6D8', '#8293CA', '#8881BE', '#A286BD', '#BC8CBF', '#F49BC1', '#F5999D',
					'#F16C4D', '#F68E54', '#FBAF5A', '#FFF467', '#ACD372', '#7DC473', '#39B778', '#16BCB4', '#00BFF3', '#438CCB', '#5573B7', '#5E5CA7', '#855FA8', '#A763A9', '#EF6EA8', '#F16D7E',
					'#EE1D24', '#F16522', '#F7941D', '#FFF100', '#8FC63D', '#37B44A', '#00A650', '#00A99E', '#00AEEF', '#0072BC', '#0054A5', '#2F3192', '#652C91', '#91278F', '#ED008C', '#EE105A',
					'#9D0A0F', '#A1410D', '#A36209', '#ABA000', '#588528', '#197B30', '#007236', '#00736A', '#0076A4', '#004A80', '#003370', '#1D1363', '#450E61', '#62055F', '#9E005C', '#9D0039',
					'#790000', '#7B3000', '#7C4900', '#827A00', '#3E6617', '#045F20', '#005824', '#005951', '#005B7E', '#003562', '#002056', '#0C004B', '#30004A', '#4B0048', '#7A0045', '#7A0026'
				];

				var
					row, cell, colorCell,
					tbl = BX.create("TABLE", {props:{className: 'bxhtmled-color-tbl'}}),
					i, l = arColors.length;

				this.pDefValueRow = tbl.insertRow(-1);
				cell = this.pDefValueRow.insertCell(-1);
				cell.colSpan = 8;
				var defBut = cell.appendChild(BX.create("SPAN", {props:{className: 'bxhtmled-color-def-but'}}));
				defBut.innerHTML = BX.message('BXEdDefaultColor');
				defBut.setAttribute('data-bx-type', 'action');
				defBut.setAttribute('data-bx-action', this.action);
				defBut.setAttribute('data-bx-value', '');

				colorCell = this.pDefValueRow.insertCell(-1);
				colorCell.colSpan = 8;
				colorCell.className = 'bxhtmled-color-inp-cell';
				colorCell.style.backgroundColor = arColors[38];

				for(i = 0; i < l; i++)
				{
					if (Math.round(i / 16) == i / 16) // new row
					{
						row = tbl.insertRow(-1);
					}

					cell = row.insertCell(-1);
					cell.innerHTML = '&nbsp;';
					cell.className = 'bxhtmled-color-col-cell';
					cell.style.backgroundColor = arColors[i];
					cell.id = 'bx_color_id__' + i;

					cell.setAttribute('data-bx-type', 'action');
					cell.setAttribute('data-bx-action', this.action);
					cell.setAttribute('data-bx-value', arColors[i]);

					cell.onmouseover = function (e)
					{
						this.className = 'bxhtmled-color-col-cell bxhtmled-color-col-cell-over';
						colorCell.style.backgroundColor = arColors[this.id.substring('bx_color_id__'.length)];
					};
					cell.onmouseout = function (e){this.className = 'bxhtmled-color-col-cell';};
					cell.onclick = function (e)
					{
						_this.Select(arColors[this.id.substring('bx_color_id__'.length)]);
					};
				}

				this.pValuesContWrap.appendChild(tbl);
				this.bCreated = true;
			}
			document.body.appendChild(this.pValuesCont);

			this.pDefValueRow.style.display = _this.editor.synchro.IsFocusedOnTextarea() ? 'none' : '';

			this.pValuesCont.style.display = 'block';
			var
				pOverlay = this.editor.overlay.Show(),
				pos = BX.pos(this.pCont),
				left = pos.left - this.pValuesCont.offsetWidth / 2 + this.pCont.offsetWidth / 2 + this.posOffset.left,
				top = pos.bottom + this.posOffset.top;

			BX.bind(window, "keydown", BX.proxy(this.OnKeyDown, this));
			BX.addClass(this.pCont, this.activeClassName);
			pOverlay.onclick = function(){_this.Close()};

			this.pValuesCont.style.left = left + 'px';
			this.pValuesCont.style.top = top + 'px';

			this.bOpened = true;

			setTimeout(function()
			{
				BX.bind(document, 'mousedown', BX.proxy(_this.CheckClose, _this));
			},100);
		},

		SetMode: function(action)
		{
			this.currentAction = action;
			var cnActiv = 'bxhtmled-color-link-active';

			if (action == this.actionColor)
			{
				BX.addClass(this.pTextColorLink, cnActiv);
				BX.removeClass(this.pBgColorLink, cnActiv);
			}
			else
			{
				BX.addClass(this.pBgColorLink, cnActiv);
				BX.removeClass(this.pTextColorLink, cnActiv);
			}
		},

		SelectColor: function(color, action)
		{
			if (!action)
			{
				action = this.currentAction;
			}

			if (action == this.actionColor)
			{
				this.pContLetter.style.color = color || '#000';
				this.pContStrip.style.backgroundColor = color || '#000';
			}
			else
			{
				this.pContLetter.style.backgroundColor = color || 'transparent';
			}
		}
	};
	// Buttons and controls of editor

	// Search and replace
	function SearchButton(editor, wrap)
	{
		// Call parrent constructor
		SearchButton.superclass.constructor.apply(this, arguments);
		this.id = 'search';
		this.title = BX.message('ButtonSearch');
		this.className += ' bxhtmled-button-search';
		this.Create();

		this.bInited = false;

		if (wrap)
			wrap.appendChild(this.GetCont());
	}
	BX.extend(SearchButton, Button);
	SearchButton.prototype.OnClick = function()
	{
		if (this.disabled)
			return;

		if (!this.bInited)
		{
			var _this = this;
			this.pSearchCont = BX('bx-html-editor-search-cnt-' + this.editor.id);
			this.pSearchWrap = this.pSearchCont.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-search-cnt-search'}}));
			this.pReplaceWrap = this.pSearchCont.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-search-cnt-replace'}}));
			this.pSearchInput = this.pSearchWrap.appendChild(BX.create('INPUT', {props: {className: 'bxhtmled-top-search-inp', type: 'text'}}));
			//this.pSearchBut = this.pSearchWrap.appendChild(BX.create('INPUT', {props: {type: 'button', value: 'Search'}}));
			this.pShowReplace = this.pSearchWrap.appendChild(BX.create('INPUT', {props: {type: 'checkbox', value: 'Y'}}));
			this.pReplaceInput = this.pReplaceWrap.appendChild(BX.create('INPUT', {props: {type: 'text'}}));

			BX.bind(this.pShowReplace, 'click', function(){_this.ShowReplace(!!this.checked);})

			this.animation = null;
			this.animationStartHeight = 0;
			this.animationEndHeight = 0;

			this.height0 = 0;
			this.height1 = 37;
			this.height2 = 66;

			this.bInited = true;
			this.bReplaceOpened = false;
		}

		if (!this.bOpened)
			this.OpenPanel();
		else
			this.ClosePanel();
	};

	SearchButton.prototype.SetPanelHeight = function(height, opacity)
	{
		this.pSearchCont.style.height = height + 'px';
		this.pSearchCont.style.opacity = opacity / 100;

		this.editor.SetAreaContSize(this.origAreaWidth, this.origAreaHeight - height, {areaContTop: this.editor.toolbar.GetHeight() + height});
	};

	SearchButton.prototype.OpenPanel = function(bShowReplace)
	{
		this.pSearchCont.style.display = 'block';

		if (this.animation)
			this.animation.stop();

		if (bShowReplace)
		{
			this.animationStartHeight = this.height1;
			this.animationEndHeight = this.height2;
		}
		else
		{
			this.origAreaHeight = parseInt(this.editor.dom.areaCont.style.height, 10);
			this.origAreaWidth = parseInt(this.editor.dom.areaCont.style.width, 10);

			this.pShowReplace.checked = false;
			this.pSearchCont.style.opacity = 0;
			this.animationStartHeight = this.height0;
			this.animationEndHeight = this.height1;
		}

		var _this = this;
		this.animation = new BX.easing({
			duration : 300,
			start : {height: this.animationStartHeight, opacity : bShowReplace ? 100 : 0},
			finish : {height: this.animationEndHeight, opacity : 100},
			transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),

			step : function(state)
			{
				_this.SetPanelHeight(state.height, state.opacity);
			},

			complete : BX.proxy(function()
			{
				this.animation = null;
			}, this)
		});

		this.animation.animate();
		this.bOpened = true;
	};

	SearchButton.prototype.ClosePanel = function(bShownReplace)
	{
		if (this.animation)
			this.animation.stop();

		this.pSearchCont.style.opacity = 1;
		if (bShownReplace)
		{
			this.animationStartHeight = this.height2;
			this.animationEndHeight = this.height1;
		}
		else
		{
			this.animationStartHeight = this.bReplaceOpened ? this.height2 : this.height1;
			this.animationEndHeight = this.height0;
		}

		var _this = this;
		this.animation = new BX.easing({
			duration : 200,
			start : {height: this.animationStartHeight, opacity : bShownReplace ? 100 : 0},
			finish : {height: this.animationEndHeight, opacity : 100},
			transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),

			step : function(state)
			{
				_this.SetPanelHeight(state.height, state.opacity);
			},

			complete : BX.proxy(function()
			{
				if (!bShownReplace)
					this.pSearchCont.style.display = 'none';
				this.animation = null;
			}, this)
		});

		this.animation.animate();
		if (!bShownReplace)
			this.bOpened = false;
	};

	SearchButton.prototype.ShowReplace = function(bShow)
	{
		if (bShow)
		{
			this.OpenPanel(true);
			this.bReplaceOpened = true;
		}
		else
		{
			this.ClosePanel(true);
			this.bReplaceOpened = false;
		}
	};

	// Change ViewMode
	function ChangeView(editor, wrap)
	{
		// Call parrent constructor
		ChangeView.superclass.constructor.apply(this, arguments);
		this.id = 'change_view';
		this.title = BX.message('ButtonViewMode');
		this._className = this.className;
		this.activeClassName = 'bxhtmled-top-bar-btn-active bxhtmled-top-bar-dd-active';
		this.topClassName = 'bxhtmled-top-bar-dd';

		this.arValues = [
			{
				id: 'view_wysiwyg',
				title: BX.message('ViewWysiwyg'),
				className: this.className + ' bxhtmled-button-viewmode-wysiwyg',
				action: 'changeView',
				value: 'wysiwyg'
			},
			{
				id: 'view_code',
				title: BX.message('ViewCode'),
				className: this.className + ' bxhtmled-button-viewmode-code',
				action: 'changeView',
				value: 'code'
			}
		];

		if (!editor.bbCode)
		{
			this.arValues.push({
				id: 'view_split_hor',
				title: BX.message('ViewSplitHor'),
				className: this.className + ' bxhtmled-button-viewmode-split-hor',
				action: 'splitMode',
				value: '0'
			});
			this.arValues.push({
				id: 'view_split_ver',
				title: BX.message('ViewSplitVer'),
				className: this.className + ' bxhtmled-button-viewmode-split-ver',
				action: 'splitMode',
				value: '1'
			});
		}

		this.className += ' bxhtmled-top-bar-dd';
		this.disabledForTextarea = false;
		this.Create();

		if (wrap)
			wrap.appendChild(this.GetCont());

		var _this = this;
		BX.addCustomEvent(this.editor, 'OnSetViewAfter', function()
		{
			var currentValueId = 'view_' + _this.editor.currentViewName;
			if (_this.editor.currentViewName == 'split')
			{
				currentValueId += '_' + (_this.editor.GetSplitMode() ? 'ver' : 'hor');
			}
			if (currentValueId !== _this.currentValueId)
			{
				_this.SelectItem(currentValueId);
			}
		});
	}
	BX.extend(ChangeView, window.BXHtmlEditor.DropDown);

	ChangeView.prototype.Open = function()
	{
		var shift = this.editor.IsExpanded();
		if (!shift)
		{
			var pos = BX.pos(this.editor.dom.cont);
			if (pos.left < 45)
				shift = true;
		}

		this.posOffset.left = shift ? 40 : -4;

		ChangeView.superclass.Open.apply(this, arguments);
		this.pValuesCont.firstChild.style.left = shift ? '20px' : '';
	};

	ChangeView.prototype.SelectItem = function(id, val)
	{
		val = ChangeView.superclass.SelectItem.apply(this, [id, val]);
		if (val)
		{
			this.pCont.className = this.topClassName + ' ' + val.className;
		}
		else
		{
			this.pCont.className = this.topClassName + ' ' + this.className;
		}
		this.currentValueId = id;
	};

	function BbCodeButton(editor, wrap)
	{
		// Call parrent constructor
		BbCodeButton.superclass.constructor.apply(this, arguments);
		this.id = 'bbcode';
		this.title = BX.message('BXEdBbCode');
		this.className += ' bxhtmled-button-bbcode';
		this.disabledForTextarea = false;

		this.Create();

		var _this = this;
		BX.addCustomEvent(this.editor, 'OnSetViewAfter', function()
		{
			_this.Check(_this.editor.GetViewMode() == 'code');
		});

		if (wrap)
			wrap.appendChild(this.GetCont());
	}
	BX.extend(BbCodeButton, Button);

	BbCodeButton.prototype.OnClick = function()
	{
		if(this.disabled)
			return;

		if (this.editor.GetViewMode() == 'wysiwyg')
		{
			this.editor.SetView('code', true);
			this.Check(true);
		}
		else
		{
			this.editor.SetView('wysiwyg', true);
			this.Check(false);
		}
	};


	function UndoButton(editor, wrap)
	{
		// Call parrent constructor
		UndoButton.superclass.constructor.apply(this, arguments);
		this.id = 'undo';
		this.title = BX.message('Undo');
		this.className += ' bxhtmled-button-undo';
		this.action = 'doUndo';

		this.Create();

		if (wrap)
			wrap.appendChild(this.GetCont());

		var _this = this;
		this.Disable(true);
		this._disabled = true;
		BX.addCustomEvent(this.editor, "OnEnableUndo", function(bFlag)
		{
			_this._disabled = !bFlag;
			_this.Disable(!bFlag);
		});
	}
	BX.extend(UndoButton, Button);
	UndoButton.prototype.Disable = function(bFlag)
	{
		bFlag = bFlag || this._disabled;
		if(bFlag != this.disabled)
		{
			this.disabled = !!bFlag;
			if(bFlag)
				BX.addClass(this.pCont, 'bxhtmled-top-bar-btn-disabled');
			else
				BX.removeClass(this.pCont, 'bxhtmled-top-bar-btn-disabled');
		}
	};


	function RedoButton(editor, wrap)
	{
		// Call parrent constructor
		RedoButton.superclass.constructor.apply(this, arguments);
		this.id = 'redo';
		this.title = BX.message('Redo');
		this.className += ' bxhtmled-button-redo';
		this.action = 'doRedo';

		this.Create();

		if (wrap)
			wrap.appendChild(this.GetCont());

		var _this = this;
		this.Disable(true);
		this._disabled = true;
		BX.addCustomEvent(this.editor, "OnEnableRedo", function(bFlag)
		{
			_this._disabled = !bFlag;
			_this.Disable(!bFlag);
		});
	}
	BX.extend(RedoButton, Button);
	RedoButton.prototype.Disable = function(bFlag)
	{
		bFlag = bFlag || this._disabled;
		if(bFlag != this.disabled)
		{
			this.disabled = !!bFlag;
			if(bFlag)
				BX.addClass(this.pCont, 'bxhtmled-top-bar-btn-disabled');
			else
				BX.removeClass(this.pCont, 'bxhtmled-top-bar-btn-disabled');
		}
	};

	function StyleSelectorList(editor, wrap)
	{
		// Call parrent constructor
		StyleSelectorList.superclass.constructor.apply(this, arguments);
		this.id = 'style_selector';
		this.title = BX.message('StyleSelectorTitle');
		this.className += ' ';
		this.action = 'formatStyle';

		var styleList = this.editor.GetStyleList();
		this.arValues = [
			{
				id: '',
				name: BX.message('StyleNormal'),
				topName: BX.message('StyleSelectorName'),
				title: BX.message('StyleNormal'),
				tagName: false,
				action: 'formatStyle',
				value: '',
				defaultValue: true
			}
		];
		var i, name, cn, style, val;

		for (i in styleList)
		{
			if (styleList.hasOwnProperty(i))
			{
				val = styleList[i].value;
				name = styleList[i].name;
				cn = styleList[i].className || 'bxhtmled-style-' + val.toLowerCase().replace(' ', '-');
				style = styleList[i].arStyle || {};

				this.arValues.push(
					{
						id: val,
						name: name,
						title: name,
						className: cn,
						style: style,
						tagName: styleList[i].tagName || false,
						action: 'formatStyle',
						value: val,
						defaultValue: !!styleList[i].defaultValue
					}
				);
			}
		}

		this.Create();

		if (wrap)
			wrap.appendChild(this.GetCont());
	}
	BX.extend(StyleSelectorList, window.BXHtmlEditor.DropDownList);

	StyleSelectorList.prototype.SetValue = function (active, state)
	{
		if (active)
		{
			var nodeName = state.nodeName.toUpperCase();
			this.SelectItem(nodeName, false, false);
		}
		else
		{
			this.SelectItem('', false, false);
		}
	};

	function FontSelectorList(editor, wrap)
	{
		// Call parrent constructor
		FontSelectorList.superclass.constructor.apply(this, arguments);
		this.id = 'font_selector';
		this.title = BX.message('FontSelectorTitle');
		this.action = 'fontFamily';
		this.zIndex = 3008;
		var fontList = this.editor.GetFontFamilyList();
		this.disabledForTextarea = !editor.bbCode;
		this.arValues = [
			{
				id: '',
				name: BX.message('NoFontTitle'),
				topName: BX.message('FontSelectorTitle'),
				title: BX.message('NoFontTitle'),
				className: '',
				style: '',
				action: 'fontFamily',
				value: '',
				defaultValue: true
			}
		];

		var i, name, val, style;
		for (i in fontList)
		{
			if (fontList.hasOwnProperty(i))
			{
				val = fontList[i].value;
				if (typeof val != 'object')
					val = [val];

				name = fontList[i].name;
				style = fontList[i].arStyle || {fontFamily: val.join(',')};
				this.arValues.push(
					{
						id: name,
						name: name,
						title: name,
						className: fontList[i].className || '',
						style: fontList[i].arStyle || {fontFamily: val.join(',')},
						action: 'fontFamily',
						value: val.join(',')
					}
				);
			}
		}

		this.Create();

		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(FontSelectorList, window.BXHtmlEditor.DropDownList);

	FontSelectorList.prototype.SetValue = function(active, state)
	{
		if (active)
		{
			var
				i, j, arFonts, valueId,
				l = this.arValues.length,
				node = state[0],
				value = BX.util.trim(BX.style(node, 'fontFamily'));

			if (value !== '' && BX.type.isString(value))
			{
				arFonts = value.split(',');
				for (i in arFonts)
				{
					valueId = false;
					if (arFonts.hasOwnProperty(i))
					{
						for (j = 0; j < l; j++)
						{
							arFonts[i] = arFonts[i].replace(/'|"/ig, '');
							if (this.arValues[j].value.indexOf(arFonts[i]) !== -1)
							{
								valueId = this.arValues[j].id;
								break;
							}
						}
						if (valueId !== false)
						{
							break;
						}
					}
				}
				this.SelectItem(valueId, false, false);
			}
			else
			{
				this.SelectItem('', false, false);
			}
		}
		else
		{
			this.SelectItem('', false, false);
		}
	};

	function FontSizeButton(editor, wrap)
	{
		// Call parrent constructor
		FontSizeButton.superclass.constructor.apply(this, arguments);
		this.id = 'font_size';
		this.title = BX.message('FontSizeTitle');
		this.className += ' bxhtmled-button-fontsize';
		this.activeClassName = 'bxhtmled-top-bar-btn-active bxhtmled-button-fontsize-active';
		this.disabledClassName = 'bxhtmled-top-bar-btn-disabled bxhtmled-button-fontsize-disabled';
		this.action = 'fontSize';
		this.zIndex = 3007;
		this.disabledForTextarea = !editor.bbCode;

		var fontSize = [6,7,8,9,10,11,12,13,14,15,16,18,20,22,24,26,28,36,48,72];
		this.arValues = [{
			id: 'font-size-0',
			className: 'bxhtmled-top-bar-btn bxhtmled-button-remove-fontsize',
			action: this.action,
			value: '<i></i>'
		}];

		var i, val;
		for (i in fontSize)
		{
			if (fontSize.hasOwnProperty(i))
			{
				val = fontSize[i];
				this.arValues.push(
					{
						id: 'font-size-' + val,
						action: this.action,
						value: val
					}
				);
			}
		}

		this.Create();

		if (wrap)
			wrap.appendChild(this.pCont_);

		BX.addCustomEvent(this, "OnPopupClose", BX.proxy(this.OnPopupClose, this));
	}
	BX.extend(FontSizeButton, window.BXHtmlEditor.DropDown);

	FontSizeButton.prototype.Create = function ()
	{
		this.pCont_ = BX.create("SPAN", {props: {className: 'bxhtmled-button-fontsize-wrap', title: this.title}});
		this.pCont = this.pButCont = this.pCont_.appendChild(BX.create("SPAN", {props: {className: this.className}, html: '<i></i>'}));
		this.pListCont = this.pCont_.appendChild(BX.create("SPAN", {props: {className: 'bxhtmled-top-bar-select', title: this.title}, attrs: {unselectable: 'on'}, text: '', style: {display: 'none'}}));

		this.pValuesCont = BX.create("DIV", {props: {className: "bxhtmled-popup bxhtmled-dropdown-cont"}, html: '<div class="bxhtmled-popup-corner"></div>'});
		this.pValuesCont.style.zIndex = this.zIndex;

		this.pValuesContWrap = this.pValuesCont.appendChild(BX.create("DIV", {props: {className: "bxhtmled-dropdown-cont bxhtmled-font-size-popup"}}));
		this.valueIndex = {};
		var but, value, _this = this, i, itemClass = 'bxhtmled-dd-list-item';

		for (i = 0; i < this.arValues.length; i++)
		{
			value = this.arValues[i];
			but = this.pValuesContWrap.appendChild(BX.create("SPAN", {props: {className: value.className || itemClass}, html: value.value, style: value.style || {}}));

			but.setAttribute('data-bx-dropdown-value', value.id);
			this.valueIndex[value.id] = i;

			if (value.action)
			{
				but.setAttribute('data-bx-type', 'action');
				but.setAttribute('data-bx-action', value.action);
				if (value.value)
					but.setAttribute('data-bx-value', value.value);
			}

			BX.bind(but, 'mousedown', function(e)
			{
				_this.SelectItem(this.getAttribute('data-bx-dropdown-value'));
				_this.editor.CheckCommand(this);
				_this.Close();
			});
		}

		this.editor.RegisterCheckableAction(this.action, {
			action: this.action,
			control: this
		});

		BX.bind(this.pCont_, 'click', BX.proxy(this.OnClick, this));
		BX.bind(this.pCont, "mousedown", BX.delegate(this.OnMouseDown, this));
	};

	FontSizeButton.prototype.SetValue = function(active, state)
	{
		if (state && state[0])
		{
			var element = state[0];
			var value = element.style.fontSize;
			this.SelectItem(false, {value: parseInt(value, 10), title: value});
		}
		else
		{
			this.SelectItem(false, {value: 0});
		}
	};

	FontSizeButton.prototype.SelectItem = function(valDropdown, val)
	{
		if (!val)
			val = this.arValues[this.valueIndex[valDropdown]];

		if (val.value)
		{
			this.pListCont.innerHTML = val.value;
			this.pListCont.title = this.title + ': ' + (val.title || val.value);
			this.pListCont.style.display = '';
			this.pButCont.style.display = 'none';
		}
		else
		{
			this.pListCont.title = this.title;
			this.pButCont.style.display = '';
			this.pListCont.style.display = 'none';
		}
	};

	FontSizeButton.prototype.GetPopupBindCont = function()
	{
		return this.pCont_;
	};

	FontSizeButton.prototype.Open = function()
	{
		FontSizeButton.superclass.Open.apply(this, arguments);

		// Show or hide first value of the list
		this.pValuesContWrap.firstChild.style.display = this.editor.bbCode && this.editor.synchro.IsFocusedOnTextarea() ? 'none' : '';

		BX.addClass(this.pListCont, 'bxhtmled-top-bar-btn-active');
	};

	FontSizeButton.prototype.Close = function()
	{
		FontSizeButton.superclass.Close.apply(this, arguments);
		BX.removeClass(this.pListCont, 'bxhtmled-top-bar-btn-active');
	};

	FontSizeButton.prototype.OnPopupClose = function()
	{
		var more = this.editor.toolbar.controls.More;
		setTimeout(function()
		{
			if (more && more.bOpened)
			{
				more.CheckOverlay();
			}
		}, 100);
	};

	function BoldButton(editor, wrap)
	{
		// Call parrent constructor
		BoldButton.superclass.constructor.apply(this, arguments);
		this.id = 'bold';
		this.title = BX.message('Bold');
		this.className += ' bxhtmled-button-bold';
		this.action = 'bold';
		this.disabledForTextarea = !editor.bbCode;
		this.Create();

		if (wrap)
			wrap.appendChild(this.GetCont());
	}
	BX.extend(BoldButton, Button);

	function ItalicButton(editor, wrap)
	{
		// Call parrent constructor
		ItalicButton.superclass.constructor.apply(this, arguments);
		this.id = 'italic';
		this.title = BX.message('Italic');
		this.className += ' bxhtmled-button-italic';
		this.action = 'italic';
		this.disabledForTextarea = !editor.bbCode;
		this.Create();

		if (wrap)
			wrap.appendChild(this.GetCont());
	}
	BX.extend(ItalicButton, Button);

	function UnderlineButton(editor, wrap)
	{
		// Call parrent constructor
		UnderlineButton.superclass.constructor.apply(this, arguments);
		this.id = 'underline';
		this.title = BX.message('Underline');
		this.className += ' bxhtmled-button-underline';
		this.action = 'underline';
		this.disabledForTextarea = !editor.bbCode;
		this.Create();

		if (wrap)
			wrap.appendChild(this.GetCont());
	}
	BX.extend(UnderlineButton, Button);

	function StrikeoutButton(editor, wrap)
	{
		// Call parrent constructor
		StrikeoutButton.superclass.constructor.apply(this, arguments);
		this.id = 'strike';
		this.title = BX.message('Strike');
		this.className += ' bxhtmled-button-strike';
		this.action = 'strikeout';
		this.disabledForTextarea = !editor.bbCode;
		this.Create();

		if (wrap)
			wrap.appendChild(this.GetCont());
	}
	BX.extend(StrikeoutButton, Button);


	function RemoveFormatButton(editor, wrap)
	{
		// Call parrent constructor
		RemoveFormatButton.superclass.constructor.apply(this, arguments);
		this.id = 'remove_format';
		this.title = BX.message('RemoveFormat');
		this.className += ' bxhtmled-button-remove-format';
		this.action = 'removeFormat';
		this.checkableAction = false;
		this.Create();

		if (wrap)
			wrap.appendChild(this.GetCont());
	}
	BX.extend(RemoveFormatButton, Button);

	function TemplateSelectorList(editor, wrap)
	{
		// Call parrent constructor
		TemplateSelectorList.superclass.constructor.apply(this, arguments);
		this.id = 'template_selector';
		this.title = BX.message('TemplateSelectorTitle');
		this.className += ' ';
		this.width = 85;
		this.zIndex = 3007;
		this.arValues = [];
		var
			templateId = this.editor.GetTemplateId(),
			templates = this.editor.config.templates,
			i, template;

		for (i in templates)
		{
			if (templates.hasOwnProperty(i))
			{
				template = templates[i];
				this.arValues.push(
					{
						id: template.value,
						name: template.name,
						title: template.name,
						className: 'bxhtmled-button-viewmode-wysiwyg',
						action: 'changeTemplate',
						value: template.value,
						defaultValue: template.value == templateId
					}
				);
			}
		}

		this.Create();

		if (wrap)
			wrap.appendChild(this.GetCont());

		this.SelectItem(templateId);
	}
	BX.extend(TemplateSelectorList, window.BXHtmlEditor.DropDownList);

	function OrderedListButton(editor, wrap)
	{
		// Call parrent constructor
		OrderedListButton.superclass.constructor.apply(this, arguments);
		this.id = 'ordered-list';
		this.title = BX.message('OrderedList');
		this.className += ' bxhtmled-button-ordered-list';
		this.action = 'insertOrderedList';
		this.disabledForTextarea = !editor.bbCode;
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(OrderedListButton, Button);

	OrderedListButton.prototype.OnClick = function()
	{
		if(!this.disabled)
		{
			if (!this.editor.bbCode || !this.editor.synchro.IsFocusedOnTextarea())
			{
				OrderedListButton.superclass.OnClick.apply(this, arguments);
			}
			else // bbcode in textarea - always new link
			{
				this.editor.GetDialog('InsertList').Show({type: 'ol'});
			}
		}
	};

	function UnorderedListButton(editor, wrap)
	{
		// Call parrent constructor
		UnorderedListButton.superclass.constructor.apply(this, arguments);
		this.id = 'unordered-list';
		this.title = BX.message('UnorderedList');
		this.className += ' bxhtmled-button-unordered-list';
		this.action = 'insertUnorderedList';
		this.disabledForTextarea = !editor.bbCode;
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(UnorderedListButton, Button);

	UnorderedListButton.prototype.OnClick = function()
	{
		if(!this.disabled)
		{
			if (!this.editor.bbCode || !this.editor.synchro.IsFocusedOnTextarea())
			{
				OrderedListButton.superclass.OnClick.apply(this, arguments);
			}
			else // bbcode in textarea - always new link
			{
				this.editor.GetDialog('InsertList').Show({type: 'ul'});
			}
		}
	};


	function IndentButton(editor, wrap)
	{
		// Call parrent constructor
		IndentButton.superclass.constructor.apply(this, arguments);
		this.id = 'indent';
		this.title = BX.message('Indent');
		this.className += ' bxhtmled-button-indent';
		this.action = 'indent';
		this.checkableAction = false;
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(IndentButton, Button);

	function OutdentButton(editor, wrap)
	{
		// Call parrent constructor
		OutdentButton.superclass.constructor.apply(this, arguments);
		this.id = 'outdent';
		this.title = BX.message('Outdent');
		this.className += ' bxhtmled-button-outdent';
		this.action = 'outdent';
		this.checkableAction = false;
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(OutdentButton, Button);

	function AlignList(editor, wrap)
	{
		// Call parrent constructor
		AlignList.superclass.constructor.apply(this, arguments);
		this.id = 'align-list';
		this.title = BX.message('BXEdTextAlign');
		this.posOffset.left = 0;
		this.action = 'align';
		var cn = this.className;
		this.className += ' bxhtmled-button-align-left';
		this.disabledForTextarea = !editor.bbCode;

		this.arValues = [
			{
				id: 'align_left',
				title: BX.message('AlignLeft'),
				className: cn + ' bxhtmled-button-align-left',
				action: 'align',
				value: 'left'
			},
			{
				id: 'align_center',
				title: BX.message('AlignCenter'),
				className: cn + ' bxhtmled-button-align-center',
				action: 'align',
				value: 'center'
			},
			{
				id: 'align_right',
				title: BX.message('AlignRight'),
				className: cn + ' bxhtmled-button-align-right',
				action: 'align',
				value: 'right'
			},
			{
				id: 'align_justify',
				title: BX.message('AlignJustify'),
				className: cn + ' bxhtmled-button-align-justify',
				action: 'align',
				value: 'justify'
			}
		];

		this.Create();

		if (wrap)
			wrap.appendChild(this.GetCont());
	}
	BX.extend(AlignList, window.BXHtmlEditor.DropDown);
	AlignList.prototype.SetValue = function(active, state)
	{
		if (this.disabled)
		{
			this.SelectItem(null);
		}
		else
		{
			if (state && state.value)
			{
				this.SelectItem('align_' + state.value);
			}
			else
			{
				this.SelectItem(null);
			}
		}
	};

	function InsertLinkButton(editor, wrap)
	{
		// Call parrent constructor
		InsertLinkButton.superclass.constructor.apply(this, arguments);
		this.id = 'insert-link';
		this.title = BX.message('InsertLink');
		this.className += ' bxhtmled-button-link';
		this.posOffset = {top: 6, left: 0};
		this.disabledForTextarea = !editor.bbCode;

		this.arValues = [
			{
				id: 'edit_link',
				title: BX.message('EditLink'),
				className: this.className + ' bxhtmled-button-link'
			},
			{
				id: 'remove_link',
				title: BX.message('RemoveLink'),
				className: this.className + ' bxhtmled-button-remove-link',
				action: 'removeLink'
			}
		];

		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(InsertLinkButton, window.BXHtmlEditor.DropDown);

	InsertLinkButton.prototype.OnClick = function()
	{
		if(this.disabled)
			return;

		if (!this.editor.bbCode || !this.editor.synchro.IsFocusedOnTextarea())
		{
			var
				i, link, lastLink, linksCount = 0,
				nodes = this.editor.action.CheckState('formatInline', {}, "a");

			if (nodes)
			{
				// Selection contains links
				for (i = 0; i < nodes.length; i++)
				{
					link = nodes[i];
					if (link)
					{
						lastLink = link;
						linksCount++;
					}

					if (linksCount > 1)
					{
						break;
					}
				}
			}

			// Link exists: show drop down with two buttons - edit or remove
			if (linksCount === 1 && lastLink)
			{
				if (this.bOpened)
				{
					this.Close();
				}
				else
				{
					this.Open();
				}
			}
			else // No link: show dialog to add new one
			{
				this.editor.GetDialog('Link').Show(nodes, this.savedRange);
			}
		}
		else // bbcode in textarea - always new link
		{
			this.editor.GetDialog('Link').Show(false, false);
		}
	};

	InsertLinkButton.prototype.SelectItem = function(id)
	{
		if (id == 'edit_link')
		{
			this.editor.GetDialog('Link').Show(false, this.savedRange);
		}
	};

	function InsertImageButton(editor, wrap)
	{
		// Call parrent constructor
		InsertImageButton.superclass.constructor.apply(this, arguments);
		this.id = 'image';
		this.title = BX.message('InsertImage');
		this.className += ' bxhtmled-button-image';
		this.disabledForTextarea = !editor.bbCode;
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(InsertImageButton, Button);

	InsertImageButton.prototype.OnClick = function()
	{
		if(!this.disabled)
		{
			this.editor.GetDialog('Image').Show(false, this.savedRange);
		}
	};

	function InsertVideoButton(editor, wrap)
	{
		// Call parrent constructor
		InsertVideoButton.superclass.constructor.apply(this, arguments);
		this.id = 'video';
		this.title = BX.message('BXEdInsertVideo');
		this.className += ' bxhtmled-button-video';
		this.disabledForTextarea = !editor.bbCode;
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(InsertVideoButton, Button);

	InsertVideoButton.prototype.OnClick = function()
	{
		if (!this.disabled)
		{
			this.editor.GetDialog('Video').Show(false, this.savedRange);
		}
	};

	function InsertAnchorButton(editor, wrap)
	{
		// Call parrent constructor
		InsertAnchorButton.superclass.constructor.apply(this, arguments);
		this.id = 'insert-anchor';
		this.title = BX.message('BXEdAnchor');
		this.className += ' bxhtmled-button-anchor';
		this.action = 'insertAnchor';
		this.Create();

		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(InsertAnchorButton, Button);

	InsertAnchorButton.prototype.OnClick = function(e)
	{
		var _this = this;
		if (this.disabled)
			return;

		if (!this.pPopup)
		{
			this.pPopup = new BX.PopupWindow(this.id + '-popup', this.GetCont(),
				{
					zIndex: 3005,
					lightShadow : true,
					offsetTop: 4,
					overlay: {opacity: 1},
					offsetLeft: -128,
					autoHide: true,
					closeByEsc: true,
					className: 'bxhtmled-popup',
					content : ''
				});

			this.pPopupCont = BX(this.id + '-popup');
			this.pPopupCont.className = 'bxhtmled-popup';
			this.pPopupCont.innerHTML = '<div class="bxhtmled-popup-corner"></div>';
			this.pPopupContWrap = this.pPopupCont.appendChild(BX.create("DIV"));
			this.pPopupContInput = this.pPopupContWrap.appendChild(BX.create("INPUT", {props: {type: 'text', placeholder: BX.message('BXEdAnchorName') + '...', title: BX.message('BXEdAnchorInsertTitle')}, style: {width: '150px'}}));
			this.pPopupContBut = this.pPopupContWrap.appendChild(BX.create("INPUT", {props: {type: 'button', value: BX.message('BXEdInsert')}, style: {marginLeft: '6px'}}));

			BX.bind(this.pPopupContInput, 'keyup', BX.proxy(this.OnKeyUp, this));
			BX.bind(this.pPopupContBut, 'click', BX.proxy(this.Save, this));


			BX.addCustomEvent(this.pPopup, "onPopupClose", function()
			{
				_this.pPopup.destroy();
				_this.pPopup = null;
			});
		}

		this.pPopupContInput.value = '';
		this.pPopup.show();
		BX.focus(this.pPopupContInput);
	};

	InsertAnchorButton.prototype.Save = function()
	{
		var name = BX.util.trim(this.pPopupContInput.value);
		if (name !== '')
		{
			name = name.replace(/[^ a-z0-9_\-]/gi, "");
			if (this.savedRange)
			{
				this.editor.selection.SetBookmark(this.savedRange);
			}

			var
				node = this.editor.phpParser.GetSurrogateNode("anchor",
					BX.message('BXEdAnchor') + ": #" + name,
					null,
					{
						html: '',
						name: name
					}
				);

			this.editor.selection.InsertNode(node);
			var sur = this.editor.util.CheckSurrogateNode(node.parentNode);
			if (sur)
			{
				this.editor.util.InsertAfter(node, sur);
			}
			this.editor.selection.SetInvisibleTextAfterNode(node);
			this.editor.synchro.StartSync(100);

			if (this.editor.toolbar.controls.More)
			{
				this.editor.toolbar.controls.More.Close();
			}
		}
		this.pPopup.close();
	};
	InsertAnchorButton.prototype.OnKeyUp = function(e)
	{
		if (e.keyCode === this.editor.KEY_CODES['enter'])
		{
			this.Save();
		}
	};


	function InsertTableButton(editor, wrap)
	{
		// Call parrent constructor
		InsertTableButton.superclass.constructor.apply(this, arguments);
		this.id = 'insert-table';
		this.title = BX.message('BXEdTable');
		this.className += ' bxhtmled-button-table';
		this.itemClassName = 'bxhtmled-dd-list-item';
		this.action = 'insertTable';
		this.disabledForTextarea = !editor.bbCode;

		this.PATTERN_ROWS = 10;
		this.PATTERN_COLS = 10;
		this.zIndex = 3007;
		this.posOffset = {top: 6, left: 0};
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
		BX.addCustomEvent(this, "OnPopupClose", BX.proxy(this.OnPopupClose, this));
	}
	BX.extend(InsertTableButton, window.BXHtmlEditor.DropDown);

	InsertTableButton.prototype.Create = function()
	{
		this.pCont = BX.create("SPAN", {props: {className: this.className, title: this.title}, html: '<i></i>'});
		this.pValuesCont = BX.create("DIV", {props: {className: "bxhtmled-popup bxhtmled-dropdown-cont"}, html: '<div class="bxhtmled-popup-corner"></div>'});
		this.pValuesCont.style.zIndex = this.zIndex;
		this.valueIndex = {};
		this.pPatternWrap = this.pValuesCont.appendChild(BX.create("DIV")); //
		this.pValuesContWrap = this.pValuesCont.appendChild(BX.create("DIV"));
		var
			_this = this,
			i, row, cell,
			lastNode, overPattern = false,
			l = this.PATTERN_ROWS * this.PATTERN_COLS,
			but;

		// Selectable table
		this.pPatternTbl = this.pPatternWrap.appendChild(BX.create("TABLE", {props: {className: "bxhtmled-pattern-tbl"}}));

		function markPatternTable(row, cell)
		{
			var r, c, pCell;
			for(r = 0; r < _this.PATTERN_ROWS; r++)
			{
				for(c = 0; c < _this.PATTERN_COLS; c++)
				{
					pCell = _this.pPatternTbl.rows[r].cells[c];
					pCell.className = (r <= row && c <= cell) ? 'bxhtmled-td-selected' : '';
				}
			}
		}

		BX.bind(this.pPatternTbl, "mousemove", function(e)
		{
			var node = e.target || e.srcElement;
			if (lastNode !== node)
			{
				lastNode = node;
				if (node.nodeName == "TD")
				{
					overPattern = true;
					markPatternTable(node.parentNode.rowIndex, node.cellIndex);
				}
				else if (node.nodeName == "TABLE")
				{
					overPattern = false;
					markPatternTable(-1, -1);
				}
			}
		});

		BX.bind(this.pPatternWrap, "mouseout", function(e)
		{
			overPattern = false;
			setTimeout(function()
			{
				if (!overPattern)
				{
					markPatternTable(-1, -1);
				}
			}, 300);
		});

		BX.bind(this.pPatternTbl, "click", function(e)
		{
			var node = e.target || e.srcElement;
			if (node.nodeName == "TD")
			{
				if (_this.editor.action.IsSupported(_this.action))
				{
					if (_this.savedRange)
					{
						_this.editor.selection.SetBookmark(_this.savedRange);
					}

					_this.editor.action.Exec(
						_this.action,
						{
							rows: node.parentNode.rowIndex + 1,
							cols: node.cellIndex + 1,
							border: 1,
							cellPadding: 1,
							cellSpacing: 1
						});
				}

				if (_this.editor.toolbar.controls.More)
				{
					_this.editor.toolbar.controls.More.Close();
				}
				_this.Close();
			}
		});

		for(i = 0; i < l; i++)
		{
			if (i % this.PATTERN_COLS == 0) // new row
			{
				row = this.pPatternTbl.insertRow(-1);
			}

			cell = row.insertCell(-1);
			cell.innerHTML = '&nbsp;';
			cell.title = (cell.cellIndex + 1) + 'x' + (row.rowIndex + 1);
		}

		but = this.pValuesContWrap.appendChild(BX.create("SPAN", {props: {title: BX.message('BXEdInsertTableTitle'), className: this.itemClassName}, html: BX.message('BXEdInsertTable')}));

		BX.bind(but, 'mousedown', function(e)
		{
			_this.editor.GetDialog('Table').Show(false, _this.savedRange);
			if (_this.editor.toolbar.controls.More)
			{
				_this.editor.toolbar.controls.More.Close();
			}
			_this.Close();
		});

		BX.bind(this.pCont, 'click', BX.proxy(this.OnClick, this));
		BX.bind(this.pCont, "mousedown", BX.delegate(this.OnMouseDown, this));
	};

	InsertTableButton.prototype.OnPopupClose = function()
	{
		var more = this.editor.toolbar.controls.More;
		setTimeout(function()
		{
			if (more && more.bOpened)
			{
				more.CheckOverlay();
			}
		}, 100);
	};

	function InsertCharButton(editor, wrap)
	{
		// Call parrent constructor
		InsertCharButton.superclass.constructor.apply(this, arguments);
		this.id = 'specialchar';
		this.title = BX.message('BXEdSpecialchar');
		this.className += ' bxhtmled-button-specialchar';
		this.itemClassName = 'bxhtmled-dd-list-item';
		this.CELLS_COUNT = 10;

		this.posOffset = {top: 6, left: 0};
		this.zIndex = 3007;
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}

		BX.addCustomEvent(this, "OnPopupClose", BX.proxy(this.OnPopupClose, this));
	}
	BX.extend(InsertCharButton, window.BXHtmlEditor.DropDown);

	InsertCharButton.prototype.Create = function()
	{
		this.pCont = BX.create("SPAN", {props: {className: this.className, title: this.title}, html: '<i></i>'});
		this.pValuesCont = BX.create("DIV", {props: {className: "bxhtmled-popup bxhtmled-dropdown-cont"}, html: '<div class="bxhtmled-popup-corner"></div>'});
		this.pValuesCont.style.zIndex = this.zIndex;
		this.valueIndex = {};
		this.pPatternWrap = this.pValuesCont.appendChild(BX.create("DIV")); //
		this.pValuesContWrap = this.pValuesCont.appendChild(BX.create("DIV"));
		var
			lastUsedChars = this.editor.GetLastSpecialchars(),
			_this = this,
			i, row, cell,
			l = lastUsedChars.length,
			but;

		this.pLastChars = this.pPatternWrap.appendChild(BX.create("TABLE", {props: {className: "bxhtmled-last-chars"}}));

		for(i = 0; i < l; i++)
		{
			if (i % this.CELLS_COUNT == 0) // new row
			{
				row = this.pLastChars.insertRow(-1);
			}
			cell = row.insertCell(-1);
		}

		BX.bind(this.pLastChars, 'click', function(e)
		{
			var
				ent,
				target = e.target || e.srcElement;
			if (target.nodeType == 3)
			{
				target = target.parentNode;
			}
			if (target && target.getAttribute && target.getAttribute('data-bx-specialchar') &&
				_this.editor.action.IsSupported('insertHTML'))
			{
				if (_this.savedRange)
				{
					_this.editor.selection.SetBookmark(_this.savedRange);
				}
				ent = target.getAttribute('data-bx-specialchar');
				_this.editor.On('OnSpecialcharInserted', [ent]);
				_this.editor.action.Exec('insertHTML', ent);
			}
			if (_this.editor.toolbar.controls.More)
			{
				_this.editor.toolbar.controls.More.Close();
			}
			_this.Close();
		});

		but = this.pValuesContWrap.appendChild(BX.create("SPAN", {props: {title: BX.message('BXEdSpecialcharMoreTitle'), className: this.itemClassName}, html: BX.message('BXEdSpecialcharMore')}));

		BX.bind(but, 'mousedown', function()
		{
			_this.editor.GetDialog('Specialchar').Show(_this.savedRange);
			if (_this.editor.toolbar.controls.More)
			{
				_this.editor.toolbar.controls.More.Close();
			}
			_this.Close();
		});

		BX.bind(this.pCont, 'click', BX.proxy(this.OnClick, this));
		BX.bind(this.pCont, "mousedown", BX.delegate(this.OnMouseDown, this));
	};

	InsertCharButton.prototype.OnClick = function()
	{
		if (this.disabled)
			return;

		var
			lastUsedChars = this.editor.GetLastSpecialchars(),
			i, r = -1, c = -1, cell,
			l = lastUsedChars.length;

		for(i = 0; i < l; i++)
		{
			if (i % this.CELLS_COUNT == 0) // new row
			{
				r++;
				c = -1;
			}
			c++;

			cell = this.pLastChars.rows[r].cells[c];
			if (cell)
			{
				cell.innerHTML = lastUsedChars[i];
				cell.setAttribute('data-bx-specialchar', lastUsedChars[i]);
				cell.title = BX.message('BXEdSpecialchar') + ': ' + lastUsedChars[i].substr(1, lastUsedChars[i].length - 2);
			}
		}

		InsertCharButton.superclass.OnClick.apply(this, arguments);
	};

	InsertCharButton.prototype.OnPopupClose = function()
	{
		var more = this.editor.toolbar.controls.More;
		setTimeout(function()
		{
			if (more && more.bOpened)
			{
				more.CheckOverlay();
			}
		}, 100);
	};

	function PrintBreakButton(editor, wrap)
	{
		// Call parrent constructor
		PrintBreakButton.superclass.constructor.apply(this, arguments);
		this.id = 'print_break';
		this.title = BX.message('BXEdPrintBreak');
		this.className += ' bxhtmled-button-print-break';
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(PrintBreakButton, Button);

	PrintBreakButton.prototype.OnClick = function()
	{
		if (this.disabled)
			return;

		if (this.editor.action.IsSupported('insertHTML'))
		{
			if (this.savedRange)
			{
				this.editor.selection.SetBookmark(this.savedRange);
			}

			var
				doc = this.editor.GetIframeDoc(),
				id = this.editor.SetBxTag(false, {tag: 'printbreak', params: {innerHTML: '<span style="display: none">&nbsp;</span>'}, name: BX.message('BXEdPrintBreakName'), title: BX.message('BXEdPrintBreakTitle')}),
				node = BX.create('IMG', {props: {src: this.editor.EMPTY_IMAGE_SRC, id: id,className: "bxhtmled-printbreak", title: BX.message('BXEdPrintBreakTitle')}}, doc);

			this.editor.selection.InsertNode(node);
			var sur = this.editor.util.CheckSurrogateNode(node.parentNode);
			if (sur)
			{
				this.editor.util.InsertAfter(node, sur);
			}
			this.editor.selection.SetAfter(node);
			this.editor.Focus();
			this.editor.synchro.StartSync(100);
		}

		if (this.editor.toolbar.controls.More)
		{
			this.editor.toolbar.controls.More.Close();
		}
	};

	function PageBreakButton(editor, wrap)
	{
		// Call parrent constructor
		PageBreakButton.superclass.constructor.apply(this, arguments);
		this.id = 'page_break';
		this.title = BX.message('BXEdPageBreak');
		this.className += ' bxhtmled-button-page-break';
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(PageBreakButton, Button);

	PageBreakButton.prototype.OnClick = function()
	{
		if (this.savedRange)
			this.editor.selection.SetBookmark(this.savedRange);

		var
			node = this.editor.phpParser.GetSurrogateNode("pagebreak",
				BX.message('BXEdPageBreakSur'),
				BX.message('BXEdPageBreakSurTitle')
			);

		this.editor.selection.InsertNode(node);
		var sur = this.editor.util.CheckSurrogateNode(node.parentNode);
		if (sur)
		{
			this.editor.util.InsertAfter(node, sur);
		}

		this.editor.selection.SelectNode(node);

		this.NormilizeBreakElement(node);

		this.editor.selection.SetInvisibleTextAfterNode(node);
		this.editor.synchro.StartSync(100);

		if (this.editor.toolbar.controls.More)
		{
			this.editor.toolbar.controls.More.Close();
		}
	};

	PageBreakButton.prototype.NormilizeBreakElement = function(breakNode)
	{
		if (breakNode.parentNode && breakNode.parentNode.nodeName !== 'BODY')
		{
			var
				next = this.editor.util.GetNextNotEmptySibling(breakNode),
				prev = this.editor.util.GetPreviousNotEmptySibling(breakNode);

			if (!next || !prev)
			{
				if (!next)
					this.editor.util.InsertAfter(breakNode, breakNode.parentNode);

				if (!prev)
					breakNode.parentNode.parentNode.insertBefore(breakNode, breakNode.parentNode);

				return this.NormilizeBreakElement(breakNode);
			}

			// TODO: split break's parent nodes using SplitNodeAt
			//this.util.IsSplitPoint
			//this.editor.util.SplitNodeAt(par, range.endContainer, range.endOffset);
//			var node = breakNode;
//			while(node.parentNode)
//			{
//				var parent = node.parentNode;
//				if (parent.nodeName == 'BODY')
//				{
//					break;
//				}
//				node = parent;
//			}
		}
	};

	function InsertHrButton(editor, wrap)
	{
		// Call parrent constructor
		InsertHrButton.superclass.constructor.apply(this, arguments);
		this.id = 'hr';
		this.title = BX.message('BXEdInsertHr');
		this.className += ' bxhtmled-button-hr';
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(InsertHrButton, Button);

	function SpellcheckButton(editor, wrap)
	{
		// Call parrent constructor
		SpellcheckButton.superclass.constructor.apply(this, arguments);
		this.id = 'spellcheck';
		this.title = BX.message('BXEdSpellcheck');
		this.className += ' bxhtmled-button-spell';
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(SpellcheckButton, Button);

	SpellcheckButton.prototype.OnClick = function()
	{
		if (this.disabled)
			return;

		if (this.editor.config.usePspell !== "Y")
		{
			alert(BX.message('BXEdNoPspellWarning'))
		}
		else
		{
			var _this = this;
			if (!window.BXHtmlEditor.Spellchecker)
				return BX.loadScript(this.editor.config.spellcheck_path, BX.proxy(this.OnClick, this));

			if (!this.editor.Spellchecker)
			{
				this.editor.Spellchecker = new window.BXHtmlEditor.Spellchecker(this.editor);
			}

			this.editor.GetDialog('Spell').Show(this.savedRange);
			this.editor.Spellchecker.CheckDocument();
		}
	};

	function SettingsButton(editor, wrap)
	{
		// Call parrent constructor
		SettingsButton.superclass.constructor.apply(this, arguments);
		this.id = 'settings';
		this.title = BX.message('BXEdSettings');
		this.className += ' bxhtmled-button-settings';
		this.disabledForTextarea = false;
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(SettingsButton, Button);
	SettingsButton.prototype.OnClick = function()
	{
		this.editor.GetDialog('Settings').Show();
	};


	function SubButton(editor, wrap)
	{
		// Call parrent constructor
		SubButton.superclass.constructor.apply(this, arguments);
		this.id = 'sub';
		this.title = BX.message('BXEdSub');
		this.className += ' bxhtmled-button-sub';
		this.action = 'sub';
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(SubButton, Button);

	function SupButton(editor, wrap)
	{
		// Call parrent constructor
		SupButton.superclass.constructor.apply(this, arguments);
		this.id = 'sup';
		this.title = BX.message('BXEdSup');
		this.className += ' bxhtmled-button-sup';
		this.action = 'sup';
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(SupButton, Button);

	function FullscreenButton(editor, wrap)
	{
		// Call parrent constructor
		FullscreenButton.superclass.constructor.apply(this, arguments);
		this.id = 'fullscreen';
		this.title = BX.message('BXEdFullscreen');
		this.className += ' bxhtmled-button-fullscreen';
		this.action = 'fullscreen';
		this.disabledForTextarea = false;
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(FullscreenButton, Button);

	FullscreenButton.prototype.Check = function(bFlag)
	{
		this.GetCont().title = bFlag ? BX.message('BXEdFullscreenBack') : BX.message('BXEdFullscreen');
		// Call parrent Check()
		FullscreenButton.superclass.Check.apply(this, arguments);
	};

	function SmileButton(editor, wrap)
	{
		// Call parrent constructor
		SmileButton.superclass.constructor.apply(this, arguments);
		this.id = 'smile';
		this.title = BX.message('BXEdSmile');
		this.className += ' bxhtmled-button-smile';
		//this.action = 'smile';
		this.checkableAction = false;
		this.zIndex = 3007;
		this.posOffset = {top: 6, left: 0};
		this.smiles = editor.config.smiles || [];
		this.disabledForTextarea = !editor.bbCode;

		this.Create();
		if (wrap && this.smiles.length > 0)
		{
			wrap.appendChild(this.GetCont());
		}
		BX.addCustomEvent(this, "OnPopupClose", BX.proxy(this.OnPopupClose, this));
	}
	BX.extend(SmileButton, window.BXHtmlEditor.DropDown);

	SmileButton.prototype.CheckBeforeShow = function()
	{
		return this.editor.config.smiles && this.editor.config.smiles.length > 0;
	};

	SmileButton.prototype.Create = function()
	{
		this.pCont = BX.create("SPAN", {props: {className: this.className, title: this.title}, html: '<i></i>'});
		this.pValuesCont = BX.create("DIV", {props: {className: "bxhtmled-popup bxhtmled-dropdown-cont bxhtmled-smile-cont"}, html: '<div class="bxhtmled-popup-corner"></div>'});
		this.pValuesCont.style.zIndex = this.zIndex;
		this.valueIndex = {};

		var _this = this, i, smileImg;
		for(i = 0; i < this.smiles.length; i++)
		{
			smileImg = BX.create("IMG", {props:
				{
					className: 'bxhtmled-smile-img',
					src: this.smiles[i].path,
					title: this.smiles[i].name || this.smiles[i].code
				}
			});

			if (this.smiles[i].width)
			{
				smileImg.style.width = this.smiles[i].width;
			}
			if (this.smiles[i].height)
			{
				smileImg.style.height = this.smiles[i].height;
			}

			smileImg.setAttribute('data-bx-type', 'action');
			smileImg.setAttribute('data-bx-action', 'insertSmile');
			smileImg.setAttribute('data-bx-value', this.smiles[i].code);

			BX.bind(smileImg, 'error', function(){BX.remove(this)});
			this.pValuesCont.appendChild(smileImg);
		}

		BX.bind(this.pCont, 'click', BX.proxy(this.OnClick, this));
		BX.bind(this.pCont, "mousedown", BX.delegate(this.OnMouseDown, this));

		BX.bind(this.pValuesCont, 'mousedown', function(e)
		{
			_this.editor.CheckCommand(e.target || e.srcElement);
			_this.Close();
		});
	};

	InsertTableButton.prototype.OnPopupClose = function()
	{
		var more = this.editor.toolbar.controls.More;
		setTimeout(function()
		{
			if (more && more.bOpened)
			{
				more.CheckOverlay();
			}
		}, 100);
	};


	function QuoteButton(editor, wrap)
	{
		// Call parrent constructor
		QuoteButton.superclass.constructor.apply(this, arguments);
		this.id = 'quote';
		this.title = BX.message('BXEdQuote');
		this.className += ' bxhtmled-button-quote';
		this.action = 'quote';
		this.disabledForTextarea = !editor.bbCode;
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(QuoteButton, Button);

	QuoteButton.prototype.OnMouseDown = function()
	{
		this.editor.action.actions.quote.setExternalSelection(false);
		this.editor.action.actions.quote.setRange(false);
		var range = this.editor.selection.GetRange(this.editor.selection.GetSelection(document));

		if (!this.editor.synchro.IsFocusedOnTextarea())
		{
			this.savedRange = this.editor.selection.SaveBookmark();
			this.editor.action.actions.quote.setRange(this.savedRange);
		}

		if ((this.editor.synchro.IsFocusedOnTextarea() || this.savedRange.collapsed) && range && !range.collapsed)
		{
			var tmpDiv = BX.create('DIV', {html: range.toHtml()}, this.editor.GetIframeDoc());
			this.editor.action.actions.quote.setExternalSelection(this.editor.util.GetTextContentEx(tmpDiv));
			BX.remove(tmpDiv);
		}

		QuoteButton.superclass.OnMouseDown.apply(this, arguments);
	};

	function CodeButton(editor, wrap)
	{
		// Call parrent constructor
		CodeButton.superclass.constructor.apply(this, arguments);
		this.id = 'code';
		this.title = BX.message('BXEdCode');
		this.className += ' bxhtmled-button-code';
		this.action = 'code';
		this.disabledForTextarea = !editor.bbCode;
		this.lastStatus = null;

		this.allowedControls = ['SearchButton','ChangeView','Undo','Redo','RemoveFormat','TemplateSelector','InsertChar','Settings','Fullscreen','Spellcheck','Code','More','BbCode'];
		this.Create();
		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}
	}
	BX.extend(CodeButton, Button);

	CodeButton.prototype.SetValue = function(value, actionState, action)
	{
		if (this.lastStatus !== value)
		{
			var tlbr = this.editor.toolbar;
			for (var i in tlbr.controls)
			{
				if (tlbr.controls.hasOwnProperty(i) && typeof tlbr.controls[i].Disable == 'function' && !BX.util.in_array(i, this.allowedControls))
				{
					tlbr.controls[i].Disable(value);
				}
			}
		}
		this.lastStatus = value;
		this.Check(value);
	}


	function MoreButton(editor, wrap)
	{
		// Call parrent constructor
		MoreButton.superclass.constructor.apply(this, arguments);
		this.id = 'more';
		this.title = BX.message('BXEdMore');
		this.className += ' bxhtmled-button-more';
		this.Create();
		this.posOffset.left = -8;
		BX.addClass(this.pValuesContWrap, 'bxhtmled-more-cnt');

		if (wrap)
		{
			wrap.appendChild(this.GetCont());
		}

		var _this = this;
		BX.bind(this.pValuesContWrap, "click", function(e)
		{
			var
				target = e.target || e.srcElement,
				bxType = (target && target.getAttribute) ? target.getAttribute('data-bx-type') : false;
			_this.editor.CheckCommand(target);
		});
	}
	BX.extend(MoreButton, window.BXHtmlEditor.DropDown);

	MoreButton.prototype.Open = function()
	{
		this.pValuesCont.style.width = '';
		MoreButton.superclass.Open.apply(this, arguments);

		var
			bindCont = this.GetPopupBindCont(),
			pos = BX.pos(bindCont),
			left = Math.round(pos.left - this.pValuesCont.offsetWidth / 2 + bindCont.offsetWidth / 2 + this.posOffset.left);

		this.pValuesCont.style.width = this.pValuesCont.offsetWidth + 'px';
		this.pValuesCont.style.left = left + 'px';
	};

	MoreButton.prototype.GetPopupCont = function()
	{
		return this.pValuesContWrap;
	};

	MoreButton.prototype.CheckClose = function(e)
	{
		if (!this.bOpened)
		{
			return BX.unbind(document, 'mousedown', BX.proxy(this.CheckClose, this));
		}

		var pEl;
		if (e.target)
			pEl = e.target;
		else if (e.srcElement)
			pEl = e.srcElement;
		if (pEl.nodeType == 3)
			pEl = pEl.parentNode;

		if (pEl.style.zIndex > this.zIndex)
		{
			this.CheckOverlay();
		}
		else if (!BX.findParent(pEl, {className: 'bxhtmled-popup'}))
		{
			this.Close();
		}
	};

	MoreButton.prototype.CheckOverlay = function()
	{
		var _this = this;
		this.editor.overlay.Show({zIndex: this.zIndex - 1}).onclick = function(){_this.Close()};
	};

	// Todo: Keyboard switcher
//	if (e.keyCode == 84)
//	{
//		textarea.value = textarea.value.substring(0, selectionStart)+BX.correctText(resultText, {replace_way: 'AUTO', mixed:true})+textarea.value.substring(selectionEnd, textarea.value.length);
//		textarea.selectionStart = selectionStart;
//		textarea.selectionEnd = selectionEnd;
//	}

	/* ~~~~ Editor dialogs ~~~~*/
	// Image
	function ImageDialog(editor, params)
	{
		params = {
			id: 'bx_image',
			width: 700,
			resizable: false,
			className: 'bxhtmled-img-dialog'
		};

		this.id = 'image';
		this.action = 'insertImage';
		this.loremIpsum = BX.message('BXEdLoremIpsum') + "\n" + BX.message('BXEdLoremIpsum');

		// Call parrent constructor
		ImageDialog.superclass.constructor.apply(this, [editor, params]);

		this.SetContent(this.Build());
		BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(ImageDialog, Dialog);

	ImageDialog.prototype.Build = function()
	{
		function addRow(tbl, c1Par, bAdditional)
		{
			var r, c1, c2;

			r = tbl.insertRow(-1);
			if (bAdditional)
			{
				r.className = 'bxhtmled-add-row';
			}

			c1 = r.insertCell(-1);
			c1.className = 'bxhtmled-left-c';

			if (c1Par && c1Par.label)
			{
				c1.appendChild(BX.create('LABEL', {props: {className: c1Par.required ? 'bxhtmled-req' : ''},text: c1Par.label})).setAttribute('for', c1Par.id);
			}

			c2 = r.insertCell(-1);
			c2.className = 'bxhtmled-right-c';
			return {row: r, leftCell: c1, rightCell: c2};
		}

		var
			_this = this,
			r, c;

		this.pCont = BX.create('DIV', {props: {className: 'bxhtmled-img-dialog-cnt'}});
		var pTableWrap = BX.create('TABLE', {props: {className: 'bxhtmled-dialog-tbl bxhtmled-img-dialog-tbl'}});

		// Preview row
		r = pTableWrap.insertRow(-1);
		r.className = 'bxhtmled-img-preview-row';
		c = BX.adjust(r.insertCell(-1), {props: {colSpan: 2, className: 'bxhtmled-img-prev-c'}});
		this.pPreview = c.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-img-preview' + (this.editor.bbCode ? ' bxhtmled-img-preview-bb' : ''), id: this.id + '-preview'}, html: this.editor.bbCode ? '' : this.loremIpsum}));
		this.pPreviewRow = r;

		// Src
		r = addRow(pTableWrap, {label: BX.message('BXEdImgSrc') + ':', id: this.id + '-src', required: true});
		this.pSrc = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-src', className: 'bxhtmled-80-input'}}));
		this.pSrc.placeholder = BX.message('BXEdImgSrcRequired');
		BX.bind(this.pSrc, 'blur', BX.proxy(this.SrcOnChange, this));
		BX.bind(this.pSrc, 'change', BX.proxy(this.SrcOnChange, this));
		BX.bind(this.pSrc, 'keyup', BX.proxy(this.SrcOnChange, this));
		this.firstFocus = this.pSrc;

		if (!this.editor.bbCode)
		{
			var butMl = BX('bx-open-file-medialib-but-' + this.editor.id);
			if (butMl)
			{
				r.rightCell.appendChild(butMl);
			}
			else
			{
				var butFd = BX('bx_open_file_medialib_button_' + this.editor.id);
				if (butFd)
				{
					r.rightCell.appendChild(butFd);
					BX.bind(butFd, 'click', window['BxOpenFileBrowserImgFile' + this.editor.id]);
				}
				else
				{
					var butMl_1 = BX('bx_ml_bx_open_file_medialib_button_' + this.editor.id);
					if (butMl_1)
					{
						r.rightCell.appendChild(butMl_1);
						//BX.bind(butFd, 'click', window['BxOpenFileBrowserImgFile' + this.editor.id]);
					}
				}

			}
		}
		else
		{
			butMl = BX('bx-open-file-medialib-but-' + this.editor.id);
			butFd = BX('bx_open_file_medialib_button_' + this.editor.id);

			if (butMl)
			{
				butMl.style.display = 'none';
			}
			if (butFd)
			{
				butFd.style.display = 'none';
			}
		}

		// Size
		r = addRow(pTableWrap, {label: BX.message('BXEdImgSize') + ':', id: this.id + '-size'});
		r.rightCell.appendChild(this.GetSizeControl());
		BX.addClass(r.leftCell,'bxhtmled-left-c-top');
		r.leftCell.style.paddingTop = '12px';
		this.pSizeRow = r.row;

		if (!this.editor.bbCode)
		{
			// Title
			r = addRow(pTableWrap, {label: BX.message('BXEdImgTitle') + ':', id: this.id + '-title'});
			this.pTitle = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-title', className: 'bxhtmled-90-input'}}));
		}

		// *** Additional params ***
		r = pTableWrap.insertRow(-1);
		var addTitleCell = r.insertCell(-1);
		BX.adjust(addTitleCell, {props: {className: 'bxhtmled-title-cell bxhtmled-title-cell-foldable', colSpan: 2}, text: BX.message('BXEdLinkAdditionalTitle')});
		addTitleCell.onclick = function()
		{
			_this.ShowRows(['align', 'style', 'alt', 'link'], true, !_this.bAdditional);
			_this.bAdditional = !_this.bAdditional;
		};

		if (!this.editor.bbCode)
		{
			// Align
			r = addRow(pTableWrap, {label: BX.message('BXEdImgAlign') + ':', id: this.id + '-align'});
			this.pAlign = r.rightCell.appendChild(BX.create('SELECT', {props: {id: this.id + '-align'}}));
			this.pAlign.options.add(new Option(BX.message('BXEdImgAlignNone'), '', true, true));
			this.pAlign.options.add(new Option(BX.message('BXEdImgAlignTop'), 'top', true, true));
			this.pAlign.options.add(new Option(BX.message('BXEdImgAlignLeft'), 'left', true, true));
			this.pAlign.options.add(new Option(BX.message('BXEdImgAlignRight'), 'right', true, true));
			this.pAlign.options.add(new Option(BX.message('BXEdImgAlignBottom'), 'bottom', true, true));
			this.pAlign.options.add(new Option(BX.message('BXEdImgAlignMiddle'), 'middle', true, true));
			BX.bind(this.pAlign, 'change', BX.delegate(this.ShowPreview, this));
			this.pAlignRow = r.row;
		}

		// Alt
		if (!this.editor.bbCode)
		{
			r = addRow(pTableWrap, {label: BX.message('BXEdImgAlt') + ':', id: this.id + '-alt'});
			this.pAlt = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-alt', className: 'bxhtmled-90-input'}}));
			this.pAltRow = r.row;
		}

		// Style
		if (!this.editor.bbCode)
		{
			r = addRow(pTableWrap, {label: BX.message('BXEdCssClass') + ':', id: this.id + '-style'}, true);
			this.pClass = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-style'}}));
			this.pStyleRow = r.row;
		}

		// Link on image
		r = addRow(pTableWrap, {label: BX.message('BXEdImgLinkOnImage') + ':', id: this.id + '-link'});
		this.pLink = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-link', className: 'bxhtmled-80-input'}}));
		this.pEditLinkBut = r.rightCell.appendChild(BX.create('SPAN', {props: {className: 'bxhtmled-top-bar-btn bxhtmled-button-link', title: BX.message('EditLink')}, html: '<i></i>'}));
		BX.bind(this.pEditLinkBut, 'click', function()
		{
			if (BX.util.trim(_this.pSrc.value) == '')
			{
				BX.focus(_this.pSrc);
			}
			else
			{
				var parLinkHref = _this.pLink.value;
				_this.pLink.value = 'bx-temp-link-href';
				_this.Save();
				_this.oDialog.Close();

				var
					i,
					link,
					links = _this.editor.GetIframeDoc().getElementsByTagName('A');
				for (i = 0; i < links.length; i++)
				{
					var href = links[i].getAttribute('href');
					if (href == 'bx-temp-link-href')
					{
						link = links[i];
						link.setAttribute('href', parLinkHref);

						_this.editor.selection.SelectNode(link);
						_this.editor.GetDialog('Link').Show([link]);
						break;
					}
				}
			}
		});
		this.pCont.appendChild(pTableWrap);
		this.pLinkRow = r.row;

		if (!this.editor.bbCode)
		{
			window['OnFileDialogImgSelect' + this.editor.id] = function(filename, path, site)
			{
				var url;
				if (typeof filename == 'object') // Using medialibrary
				{
					url = filename.src;
					if (_this.pTitle && _this.pTitle.value == '')
						_this.pTitle.value = filename.description || filename.name;
					if (_this.pAlt && _this.pAlt.value == '')
						_this.pAlt.value = filename.description || filename.name;
				}
				else // Using file dialog
				{
					url = (path == '/' ? '' : path) + '/' + filename;
				}

				_this.pSrc.value = url;
				BX.focus(_this.pSrc);
				_this.pSrc.select();
				_this.SrcOnChange();
			};
		}

		this.rows = {
			preview : {
				cont: this.pPreviewRow,
				height: 200
			},
			size: {
				cont: this.pSizeRow,
				height: 68
			},
			align: {
				cont: this.pAlignRow,
				height: 36
			},
			style: {
				cont: this.pStyleRow,
				height: 36
			},
			alt: {
				cont: this.pAltRow,
				height: 36
			},
			link: {
				cont: this.pLinkRow,
				height: 36
			}
		};

		return this.pCont;
	};

	ImageDialog.prototype.GetSizeControl = function()
	{
		var
			lastWidth,
			lastHeight,
			_this = this,
			setPercTimeout,
			i,
			percVals = [100, 90, 80, 70, 60, 50, 40, 30, 20],
			cont = BX.create('DIV'),
			percWrap = cont.appendChild(BX.create('SPAN', {props: {className: 'bxhtmled-size-perc'}}));

		this.percVals = percVals;
		this.pPercWrap = percWrap;
		this.pSizeCont = cont;

		this.oSize = {};
		BX.bind(percWrap, 'click', function(e)
		{
			var node = e.target || e.srcElement;
			if (node)
			{
				var perc = parseInt(node.getAttribute('data-bx-size-val'), 10);
				if (perc)
				{
					_this.SetPercentSize(perc, true);
				}
			}
		});

		function sizeControlChecker(e)
		{
			var
				level = 0, res,
				node = e.target || e.srcElement;
			if (node !== percWrap)
			{
				node = BX.findParent(node, function(n)
				{
					level++;
					return n == percWrap || level > 3;
				}, percWrap);
			}

			if (node !== percWrap)
			{
				_this.SetPercentSize(_this.savedPerc, false);
				if (_this.sizeControlChecker)
				{
					BX.unbind(document, 'mousemove', sizeControlChecker);
					_this.sizeControlChecker = false;
				}
			}
		}

		BX.bind(percWrap, 'mouseover', function(e)
		{
			var
				perc,
				node = e.target || e.srcElement;

			if (!_this.sizeControlChecker)
			{
				BX.bind(document, 'mousemove', sizeControlChecker);
				_this.sizeControlChecker = true;
			}

			perc = parseInt(node.getAttribute('data-bx-size-val'), 10);
			_this.overPerc = perc > 0;
			if (_this.overPerc)
			{
				_this.SetPercentSize(perc, false);
			}
			else
			{
				if (setPercTimeout)
				{
					clearTimeout(setPercTimeout);
				}
				setPercTimeout = setTimeout(function()
				{
					if (!_this.overPerc)
					{
						_this.SetPercentSize(_this.savedPerc, false);
						if (_this.sizeControlChecker)
						{
							BX.unbind(document, 'mousemove', sizeControlChecker);
							_this.sizeControlChecker = false;
						}
					}
				}, 200);
			}
		});

		BX.bind(percWrap, 'mouseout', function(e)
		{
			var
				perc,
				node = e.target || e.srcElement;

			if (setPercTimeout)
			{
				clearTimeout(setPercTimeout);
			}
			setPercTimeout = setTimeout(function()
			{
				if (!_this.overPerc)
				{
					_this.SetPercentSize(_this.savedPerc, false);
					if (_this.sizeControlChecker)
					{
						BX.unbind(document, 'mousemove', sizeControlChecker);
						_this.sizeControlChecker = false;
					}
				}
			}, 200);
		});

		function widthOnchange()
		{
			var w = parseInt(_this.pWidth.value);
			if (!isNaN(w) && lastWidth != w)
			{
				if (!_this.sizeRatio && _this.originalWidth && _this.originalHeight)
				{
					_this.sizeRatio = _this.originalWidth / _this.originalHeight;
				}
				if (_this.sizeRatio)
				{
					_this.pHeight.value = Math.round(w / _this.sizeRatio);
					lastWidth = w;
					_this.ShowPreview();
				}
			}
		}

		function heightOnchange()
		{
			var h = parseInt(_this.pHeight.value);
			if (!isNaN(h) && lastHeight != h)
			{
				if (!_this.sizeRatio && _this.originalWidth && _this.originalHeight)
				{
					_this.sizeRatio = _this.originalWidth / _this.originalHeight;
				}
				if (_this.sizeRatio)
				{
					_this.pWidth.value = parseInt(h * _this.sizeRatio);
					lastHeight = h;
					_this.ShowPreview();
				}
			}
		}
		// Second row: width, height
		cont.appendChild(BX.create('LABEL', {text: BX.message('BXEdImgWidth') + ': '})).setAttribute('for', this.id + '-width');
		this.pWidth = cont.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-width'}, style:{width: '40px', marginBottom: '4px'}}));
		cont.appendChild(BX.create('LABEL', {style: {marginLeft: '20px'}, text: BX.message('BXEdImgHeight') + ': '})).setAttribute('for', this.id + '-height');
		this.pHeight = cont.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-height'}, style:{width: '40px', marginBottom: '4px'}}));
		// "No dimentions" checkbox
		this.pNoSize = cont.appendChild(BX.create('INPUT', {props: {type: 'checkbox', id: this.id + '-no-size', className: 'bxhtmled-img-no-size-ch'}}));
		cont.appendChild(BX.create('LABEL', {props: {className: 'bxhtmled-img-no-size-lbl'}, text: BX.message('BXEdImgNoSize')})).setAttribute('for', this.id + '-no-size');
		BX.bind(this.pNoSize, 'click', BX.proxy(this.NoSizeCheck, this));

		BX.bind(this.pWidth, 'blur', widthOnchange);
		BX.bind(this.pWidth, 'change', widthOnchange);
		BX.bind(this.pWidth, 'keyup', widthOnchange);
		BX.bind(this.pHeight, 'blur', heightOnchange);
		BX.bind(this.pHeight, 'change', heightOnchange);
		BX.bind(this.pHeight, 'keyup', heightOnchange);

		for (i = 0; i < percVals.length; i++)
		{
			percWrap.appendChild(BX.create('SPAN', {props: {className: 'bxhtmled-size-perc-i'}, attrs: {'data-bx-size-val': percVals[i]}, html: percVals[i] + '%'}));
		}

		return cont;
	};

	ImageDialog.prototype.NoSizeCheck = function()
	{
		if (this.pNoSize.checked)
		{
			BX.addClass(this.pSizeCont, 'bxhtmled-img-no-size-cont');
			this.pSizeRow.cells[0].style.height = this.pSizeRow.cells[1].style.height = '';
		}
		else
		{
			BX.removeClass(this.pSizeCont, 'bxhtmled-img-no-size-cont');
		}
		this.ShowPreview();
	};

	ImageDialog.prototype.SetPercentSize = function(perc, bSet)
	{
		var
			n, i,
			activeCn = 'bxhtmled-size-perc-i-active';

		if (bSet)
		{
			for (i = 0; i < this.pPercWrap.childNodes.length; i++)
			{
				n = this.pPercWrap.childNodes[i];
				if (perc && n.getAttribute('data-bx-size-val') == perc)
				{
					BX.addClass(n, activeCn);
				}
				else
				{
					BX.removeClass(n, activeCn);
				}
			}
		}

		if (perc !== false)
		{
			perc = perc / 100;
			this.pWidth.value = Math.round(this.originalWidth * perc) || '';
			this.pHeight.value = Math.round(this.originalHeight * perc) || '';
		}
		else if (this.savedWidth && this.savedHeight)
		{
			this.pWidth.value = this.savedWidth;
			this.pHeight.value = this.savedHeight;
		}

		this.ShowPreview();

		if (bSet)
		{
			this.savedWidth = this.pWidth.value;
			this.savedHeight = this.pHeight.value;
			this.savedPerc = perc !== false ? (perc || 1) * 100 : false;
		}
	};

	ImageDialog.prototype.SrcOnChange = function(updateSize)
	{
		var
			i,
			resPerc, perc, perc1, perc2,
			_this = this,
			src = this.pSrc.value;

		updateSize = updateSize !== false;

		if (this.lastSrc !== src)
		{
			this.lastSrc = src;
			if (!this.pInvisCont)
			{
				this.pInvisCont = this.pCont.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-invis-cnt'}}));
			}
			else
			{
				BX.cleanNode(this.pInvisCont);
			}
			this.dummyImg = this.pInvisCont.appendChild(BX.create('IMG'));

			BX.bind(this.dummyImg, 'load', function()
			{
				setTimeout(function(){
					_this.originalWidth = _this.dummyImg.offsetWidth;
					_this.originalHeight = _this.dummyImg.offsetHeight;

					if (updateSize)
					{
						_this.pWidth.value = _this.originalWidth;
						_this.pHeight.value = _this.originalHeight;
						resPerc = 100;
					}
					else
					{
						resPerc = false;
						perc1 = Math.round(10000 * parseInt(_this.pWidth.value) / parseInt(_this.originalWidth)) / 100;
						perc2 = Math.round(10000* parseInt(_this.pHeight.value) / parseInt(_this.originalHeight)) / 100;

						// difference max 0.1%
						if (Math.abs(perc1 - perc2) <= 0.1)
						{
							perc = (perc1 + perc2) / 2;
							// inaccuracy 0.1% for calculating percent size
							for (i = 0; i < _this.percVals.length; i++)
							{
								if (Math.abs(_this.percVals[i] - perc) <= 0.1)
								{
									resPerc = _this.percVals[i];
									break;
								}
							}
						}
					}

					_this.sizeRatio = _this.originalWidth / _this.originalHeight;
					_this.SetPercentSize(resPerc, true);
					if (_this.bEmptySrcRowsHidden)
					{
						_this.ShowRows((_this.bAdditional ? ['preview', 'size', 'align', 'style', 'alt'] : ['preview', 'size']), true, true);
						_this.bEmptySrcRowsHidden = false;
					}

					_this.ShowPreview();
				}, 100);
			});

			BX.bind(this.dummyImg, 'error', function()
			{
				_this.pWidth.value = '';
				_this.pHeight.value = '';
			});

			this.dummyImg.src = src;
		}
	};

	ImageDialog.prototype.ShowPreview = function()
	{
		if (!this.pPreviewImg)
		{
			this.pPreviewImg = BX.create('IMG');
			if (this.pAlign)
			{
				this.pPreview.insertBefore(this.pPreviewImg, this.pPreview.firstChild);
			}
			else
			{
				this.pPreview.appendChild(this.pPreviewImg);
			}
		}

		if (this.pPreviewImg.src != this.pSrc.value)
		{
			this.pPreviewImg.src = this.pSrc.value;
		}

		// Size
		if (this.pNoSize.checked)
		{
			this.pPreviewImg.style.width = '';
			this.pPreviewImg.style.height = '';
		}
		else
		{
			this.pPreviewImg.style.width = this.pWidth.value + 'px';
			this.pPreviewImg.style.height = this.pHeight.value + 'px';
		}


		// Align
		if (this.pAlign)
		{
			var align = this.pAlign.value;
			if (align != this.pPreviewImg.align)
			{
				if (align == '')
				{
					this.pPreviewImg.removeAttribute('align');
				}
				else
				{
					this.pPreviewImg.align = align;
				}
			}
		}
	};

	ImageDialog.prototype.SetValues = function(params)
	{
		if (!params)
		{
			params = {};
		}

		var i, row, rows = ['preview', 'size', 'align', 'style', 'alt'];
		this.lastSrc = '';
		this.bEmptySrcRowsHidden = this.bNewImage;
		if (this.bNewImage)
		{
			for (i = 0; i < rows.length; i++)
			{
				row = this.rows[rows[i]];
				if (row && row.cont)
				{
					row.cont.style.display = 'none';
					this.SetRowHeight(row.cont, 0, 0);
				}
			}
		}
		else
		{
			for (i = 0; i < rows.length; i++)
			{
				row = this.rows[rows[i]];
				if (row && row.cont)
				{
					row.cont.style.display = '';
					this.SetRowHeight(row.cont, row.height, 100);
				}
			}
		}

		this.pSrc.value = params.src || '';

		if (this.pTitle)
			this.pTitle.value = params.title || '';

		if (this.pAlt)
			this.pAlt.value = params.alt || '';

		this.savedWidth = this.pWidth.value = params.width || '';
		this.savedHeight = this.pHeight.value = params.height || '';

		if (this.pAlign)
			this.pAlign.value = params.align || '';

		if (this.pClass)
			this.pClass.value = params.className || '';

		this.pLink.value = params.link || '';

		this.pNoSize.checked = params.noWidth && params.noHeight;
		this.NoSizeCheck();

		this.ShowRows(['align', 'style', 'alt', 'link'], false, false);
		this.bAdditional = false;
		this.SrcOnChange(!params.width || !params.height);

		if (this.pClass)
		{
			if (!this.oClass)
			{
				this.oClass = new window.BXHtmlEditor.ClassSelector(this.editor,
					{
						id: this.id + '-class-selector',
						input: this.pClass,
						filterTag: 'IMG',
						value: this.pClass.value
					}
				);

				var _this = this;
				BX.addCustomEvent(this.oClass, "OnComboPopupClose", function()
				{
					_this.closeByEnter = true;
				});
				BX.addCustomEvent(this.oClass, "OnComboPopupOpen", function()
				{
					_this.closeByEnter = false;
				});
			}
			else
			{
				this.oClass.OnChange();
			}
		}
	};
	ImageDialog.prototype.GetValues = function()
	{
		var res = {
			src: this.pSrc.value,
			width: this.pNoSize.checked ? '' : this.pWidth.value,
			height: this.pNoSize.checked ? '' : this.pHeight.value,
			link: this.pLink.value || '',
			image: this.image || false
		};

		if (this.pTitle)
			res.title = this.pTitle.value;
		if (this.pAlt)
			res.alt = this.pAlt.value;
		if (this.pAlign)
			res.align = this.pAlign.value;
		if (this.pClass)
			res.className = this.pClass.value || '';

		return res;
	};

	ImageDialog.prototype.Show = function(nodes, savedRange)
	{
		var
			range,
			value = {}, bxTag,
			i, img = false;

		this.savedRange = savedRange;

		if (!this.editor.bbCode || !this.editor.synchro.IsFocusedOnTextarea())
		{
			if (!this.editor.iframeView.IsFocused())
			{
				this.editor.iframeView.Focus();
			}

			if (this.savedRange)
			{
				this.editor.selection.SetBookmark(this.savedRange);
			}

			if (!nodes)
			{
				range = this.editor.selection.GetRange();
				nodes = range.getNodes([1]);
			}
		}

		if (nodes)
		{
			for (i = 0; i < nodes.length; i++)
			{
				img = nodes[i];
				bxTag = this.editor.GetBxTag(img);
				if (bxTag.tag || !img.nodeName || img.nodeName != 'IMG')
				{
					img = false;
				}
				else
				{
					break;
				}
			}
		}
		this.bNewImage = !img;

		this.image = img;
		if (img)
		{
			value.src = img.getAttribute('src');

			// Width
			if (img.style.width)
			{
				value.width = img.style.width;
			}
			if (!value.width && img.getAttribute('width'))
			{
				value.width = img.getAttribute('width');
			}
			if (!value.width)
			{
				value.width = img.offsetWidth;
				value.noWidth = true;
			}

			// Height
			if (img.style.height)
			{
				value.height = img.style.height;
			}
			if (!value.height && img.getAttribute('height'))
			{
				value.height = img.getAttribute('height');
			}
			if (!value.height)
			{
				value.height = img.offsetHeight;
				value.noHeight = true;
			}

			var cleanAttribute = img.getAttribute('data-bx-clean-attribute');
			if (cleanAttribute)
			{
				img.removeAttribute(cleanAttribute);
				img.removeAttribute('data-bx-clean-attribute');
			}

			value.alt = img.alt || '';
			value.title = img.title || '';
			value.title = img.title || '';
			value.className = img.className;
			value.align = img.align || '';

			var parentLink = img.parentNode.nodeName == 'A' ? img.parentNode : null;
			if (parentLink && parentLink.href)
			{
				value.link = parentLink.getAttribute('href');
			}
		}

		this.SetValues(value);
		this.SetTitle(BX.message('InsertImage'));

		// Call parrent Dialog.Show()
		ImageDialog.superclass.Show.apply(this, arguments);
	};

	ImageDialog.prototype.SetPanelHeight = function(height, opacity)
	{
		this.pSearchCont.style.height = height + 'px';
		this.pSearchCont.style.opacity = opacity / 100;

		this.editor.SetAreaContSize(this.origAreaWidth, this.origAreaHeight - height, {areaContTop: this.editor.toolbar.GetHeight() + height});
	};

	ImageDialog.prototype.ShowRows = function(rows, animate, show)
	{
		var
			_this = this,
			startHeight,
			endHeight,
			startOpacity,
			endOpacity,
			i, row;

		if (animate)
		{
			for (i = 0; i < rows.length; i++)
			{
				row = this.rows[rows[i]];
				if (row && row.cont)
				{
					if (row.animation)
						row.animation.stop();

					row.cont.style.display = '';
					if (show)
					{
						startHeight = 0;
						endHeight = row.height;
						startOpacity = 0;
						endOpacity = 100;
					}
					else
					{
						startHeight = row.height;
						endHeight = 0;
						startOpacity = 100;
						endOpacity = 0;
					}

					row.animation = new BX.easing({
						_row: row,
						duration : 300,
						start : {height: startHeight, opacity : startOpacity},
						finish : {height: endHeight, opacity : endOpacity},
						transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),
						step : function(state)
						{
							_this.SetRowHeight(this._row.cont, state.height, state.opacity);
						},
						complete : function()
						{
							this._row.animation = null;
						}
					});

					row.animation.animate();
				}
			}
		}
		else
		{
			for (i = 0; i < rows.length; i++)
			{
				row = this.rows[rows[i]];
				if (row && row.cont)
				{
					if (show)
					{
						row.cont.style.display = '';
						this.SetRowHeight(row.cont, row.height, 100);
					}
					else
					{
						row.cont.style.display = 'none';
						this.SetRowHeight(row.cont, 0, 0);
					}
				}
			}
		}
	};

	ImageDialog.prototype.SetRowHeight = function(tr, height, opacity)
	{
		if (tr && tr.cells)
		{
			if (height == 0 || opacity == 0)
			{
				tr.style.display = 'none';
			}
			else
			{
				tr.style.display = '';
			}

			tr.style.opacity = opacity / 100;
			for (var i = 0; i < tr.cells.length; i++)
			{
				tr.cells[i].style.height = height + 'px';
			}
		}
	};

	/*
	SearchButton.prototype.ClosePanel = function(bShownReplace)
	{
		if (this.animation)
			this.animation.stop();

		this.pSearchCont.style.opacity = 1;
		if (bShownReplace)
		{
			this.animationStartHeight = this.height2;
			this.animationEndHeight = this.height1;
		}
		else
		{
			this.animationStartHeight = this.bReplaceOpened ? this.height2 : this.height1;
			this.animationEndHeight = this.height0;
		}

		var _this = this;
		this.animation = new BX.easing({
			duration : 200,
			start : {height: this.animationStartHeight, opacity : bShownReplace ? 100 : 0},
			finish : {height: this.animationEndHeight, opacity : 100},
			transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),

			step : function(state)
			{
				_this.SetPanelHeight(state.height, state.opacity);
			},

			complete : BX.proxy(function()
			{
				if (!bShownReplace)
					this.pSearchCont.style.display = 'none';
				this.animation = null;
			}, this)
		});

		this.animation.animate();
		if (!bShownReplace)
			this.bOpened = false;
	};

*/

	// Link
	function LinkDialog(editor, params)
	{
		params = {
			id: 'bx_link',
			width: 600,
			resizable: false,
			className: 'bxhtmled-link-dialog'
		};

		// Call parrent constructor
		LinkDialog.superclass.constructor.apply(this, [editor, params]);

		this.id = 'link' + this.editor.id;
		this.action = 'createLink';

		this.SetContent(this.Build());
		this.ChangeType();

		BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(LinkDialog, Dialog);

	LinkDialog.prototype.Build = function()
	{
		function addRow(tbl, c1Par, bAdditional)
		{
			var r, c1, c2;
			r = tbl.insertRow(-1);
			if (bAdditional)
			{
				r.className = 'bxhtmled-add-row';
			}

			c1 = r.insertCell(-1);
			c1.className = 'bxhtmled-left-c';

			if (c1Par && c1Par.label)
			{
				c1.appendChild(BX.create('LABEL', {text: c1Par.label})).setAttribute('for', c1Par.id);
			}

			c2 = r.insertCell(-1);
			c2.className = 'bxhtmled-right-c';
			return {row: r, leftCell: c1, rightCell: c2};
		}

		var
			r,
			cont = BX.create('DIV');

		var pTableWrap = BX.create('TABLE', {props: {className: 'bxhtmled-dialog-tbl bxhtmled-dialog-tbl-collapsed'}});

		if (!this.editor.bbCode)
		{
			// Link type
			r = addRow(pTableWrap, {label: BX.message('BXEdLinkType') + ':', id: this.id + '-type'});
			this.pType = r.rightCell.appendChild(BX.create('SELECT', {props: {id: this.id + '-type'}}));
			this.pType.options.add(new Option(BX.message('BXEdLinkTypeInner'), 'internal', true, true));
			this.pType.options.add(new Option(BX.message('BXEdLinkTypeOuter'), 'external', false, false));
			this.pType.options.add(new Option(BX.message('BXEdLinkTypeAnchor'), 'anchor', false, false));
			this.pType.options.add(new Option(BX.message('BXEdLinkTypeEmail'), 'email', false, false));
			BX.bind(this.pType, 'change', BX.delegate(this.ChangeType, this));
		}

		// Link text
		r = addRow(pTableWrap, {label: BX.message('BXEdLinkText') + ':', id: this.id + '-text'});
		this.pText = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-text', placeholder: BX.message('BXEdLinkTextPh')}}));
		this.pTextCont = r.row;
		// Link html (for dificult cases (html without text nodes))
		r = addRow(pTableWrap, {label: BX.message('BXEdLinkInnerHtml') + ':', id: this.id + '-innerhtml'});
		this.pInnerHtml = r.rightCell.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-ld-html-wrap'}}));
		this.pInnerHtmlCont = r.row;
		this.firstFocus = this.pText;

		// Link href
		// 1. Internal
		r = addRow(pTableWrap, {label: BX.message('BXEdLinkHref') + ':', id: this.id + '-href'});
		this.pHrefIn = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-href', placeholder: BX.message('BXEdLinkHrefPh')}}));

		if (!this.editor.bbCode)
		{
			this.pHrefIn.style.minWidth = '80%';
			this.pFileDialogBut = r.rightCell.appendChild(BX.create('INPUT', {props: {className: 'bxhtmled-link-dialog-fdbut', type: 'button', id: this.id + '-href-fd', value: '...'}}));
			BX.bind(this.pFileDialogBut, 'click', BX.delegate(this.OpenFileDialog, this));
		}
		this.pHrefIntCont = r.row;

		// 2. External
		r = addRow(pTableWrap, {label: BX.message('BXEdLinkHref') + ':', id: this.id + '-href-ext'});
		this.pHrefType = r.rightCell.appendChild(BX.create('SELECT', {props: {id: this.id + '-href-type'}}));
		this.pHrefType.options.add(new Option('http://', 'http://', false, false));
		this.pHrefType.options.add(new Option('https://', 'https://', false, false));
		this.pHrefType.options.add(new Option('ftp://', 'ftp://', false, false));
		this.pHrefType.options.add(new Option('', '', false, false));
		this.pHrefExt = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-href-ext', placeholder: BX.message('BXEdLinkHrefExtPh')}, style: {minWidth: '250px'}}));
		this.pHrefExtCont = r.row;

		// 3. Anchor
		r = addRow(pTableWrap, {label: BX.message('BXEdLinkHrefAnch') + ':', id: this.id + '-href-anch'});
		this.pHrefAnchor = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-href-anchor', placeholder: BX.message('BXEdLinkSelectAnchor')}}));
		this.pHrefAnchCont = r.row;

		// 4. E-mail
		r = addRow(pTableWrap, {label: BX.message('BXEdLinkHrefEmail') + ':', id: this.id + '-href-email'});
		var emailType = BX.browser.IsIE() || BX.browser.IsIE9() ? 'text' : 'email';
		this.pHrefEmail = r.rightCell.appendChild(BX.create('INPUT', {props: {type: emailType, id: this.id + '-href-email'}}));
		this.pHrefEmailCont = r.row;

		if (!this.editor.bbCode)
		{
			// *** Additional params ***
			r = pTableWrap.insertRow(-1);
			var addTitleCell = r.insertCell(-1);
			BX.adjust(addTitleCell, {props: {className: 'bxhtmled-title-cell bxhtmled-title-cell-foldable', colSpan: 2}, text: BX.message('BXEdLinkAdditionalTitle')});
			addTitleCell.onclick = function()
			{
				BX.toggleClass(pTableWrap, 'bxhtmled-dialog-tbl-collapsed');
			};

			// Use statistics
			r = addRow(pTableWrap, false, true);
			this.pStatCont = r.row;
			this.pStat = r.leftCell.appendChild(BX.create('INPUT', {props: {type: 'checkbox', id: this.id + '-stat'}}));
			r.rightCell.appendChild(BX.create('LABEL', {text: BX.message('BXEdLinkStat')})).setAttribute('for', this.id + '-stat');
			var
				wrap,
				statInfoCont = r.rightCell.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-stat-wrap'}}));
			wrap = statInfoCont.appendChild(BX.create('DIV', {html: '<label for="event1">' + BX.message('BXEdLinkStatEv1') + ':</label> '}));
			this.pStatEvent1 = wrap.appendChild(BX.create('INPUT', {props: {type: 'text',  id: "event1"}, style: {minWidth: '50px'}}));
			wrap = statInfoCont.appendChild(BX.create('DIV', {html: '<label for="event2">' + BX.message('BXEdLinkStatEv2') + ':</label> '}));
			this.pStatEvent2 = wrap.appendChild(BX.create('INPUT', {props: {type: 'text',  id: "event2"}, style: {minWidth: '50px'}}));
			wrap = statInfoCont.appendChild(BX.create('DIV', {html: '<label for="event3">' + BX.message('BXEdLinkStatEv3') + ':</label> '}));
			this.pStatEvent3 = wrap.appendChild(BX.create('INPUT', {props: {type: 'text',  id: "event3"}, style: {minWidth: '50px'}}));
			BX.addClass(r.leftCell,'bxhtmled-left-c-top');
			BX.bind(this.pStat, 'click', BX.delegate(this.CheckShowStatParams, this));

			// Link title
			r = addRow(pTableWrap, {label: BX.message('BXEdLinkTitle') + ':', id: this.id + '-title'}, true);
			this.pTitle = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-title'}}));

			// Link class selector
			r = addRow(pTableWrap, {label: BX.message('BXEdCssClass') + ':', id: this.id + '-style'}, true);
			this.pClass = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-style'}}));

			// Link target
			r = addRow(pTableWrap, {label: BX.message('BXEdLinkTarget') + ':', id: this.id + '-target'}, true);
			this.pTarget = r.rightCell.appendChild(BX.create('SELECT', {props: {id: this.id + '-target'}}));
			this.pTarget.options.add(new Option(BX.message('BXEdLinkTargetBlank'), '_blank', false, false));
			this.pTarget.options.add(new Option(BX.message('BXEdLinkTargetParent'), '_parent', false, false));
			this.pTarget.options.add(new Option(BX.message('BXEdLinkTargetSelf'), '_self', true, true));
			this.pTarget.options.add(new Option(BX.message('BXEdLinkTargetTop'), '_top', false, false));

			// Nofollow noindex
			r = addRow(pTableWrap, false, true);
			this.pNoindex = r.leftCell.appendChild(BX.create('INPUT', {props: {type: 'checkbox', id: this.id + '-noindex'}}));
			r.rightCell.appendChild(BX.create('LABEL', {text: BX.message('BXEdLinkNoindex')})).setAttribute('for', this.id + '-noindex');
			BX.bind(this.pNoindex, 'click', BX.delegate(this.CheckNoindex, this));

			// Link id
			r = addRow(pTableWrap, {label: BX.message('BXEdLinkId') + ':', id: this.id + '-id'}, true);
			this.pId = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-id'}}));

			// Link rel
			r = addRow(pTableWrap, {label: BX.message('BXEdLinkRel') + ':', id: this.id + '-rel'}, true);
			this.pRel = r.rightCell.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-rel'}}));

			// *** Additional params END ***
		}

		cont.appendChild(pTableWrap);
		return cont;
	};

	LinkDialog.prototype.OpenFileDialog = function()
	{
		var run = window['BxOpenFileBrowserWindFile' + this.editor.id];
		if (run && typeof run == 'function')
		{
			var _this = this;
			window['OnFileDialogSelect' + this.editor.id] = function(filename, path, site)
			{
				_this.pHrefIn.value = (path == '/' ? '' : path) + '/' + filename;
				_this.pHrefIn.focus();
				_this.pHrefIn.select();

				// Clean function
				window['OnFileDialogSelect' + _this.editor.id] = null;
			};
			run();
		}
	};

	LinkDialog.prototype.ChangeType = function()
	{
		var type = this.pType ? this.pType.value : 'internal';

		this.pHrefIntCont.style.display = 'none';
		this.pHrefExtCont.style.display = 'none';
		this.pHrefAnchCont.style.display = 'none';
		this.pHrefEmailCont.style.display = 'none';

		if (this.pStatCont)
			this.pStatCont.style.display = 'none';

		if (type == 'internal')
		{
			this.pHrefIntCont.style.display = '';
		}
		else if (type == 'external')
		{
			if (this.pStatCont)
				this.pStatCont.style.display = '';
			this.pHrefExtCont.style.display = '';
		}
		else if (type == 'anchor')
		{
			this.pHrefAnchCont.style.display = '';
		}
		else if (type == 'email')
		{
			this.pHrefEmailCont.style.display = '';
		}
	};

	LinkDialog.prototype.CheckShowStatParams = function()
	{
		if (this.pStat.checked)
		{
			BX.removeClass(this.pStatCont, 'bxhtmled-link-stat-hide');
		}
		else
		{
			BX.addClass(this.pStatCont, 'bxhtmled-link-stat-hide');
		}
	};

	LinkDialog.prototype.CheckNoindex = function()
	{
		if (this.pNoindex.checked)
		{
			this.pRel.value = 'nofollow';
			this.pRel.disabled = true;
		}
		else
		{
			this.pRel.value = this.pRel.value == 'nofollow' ? '' : this.pRel.value;
			this.pRel.disabled = false;
		}
	};

	LinkDialog.prototype.SetValues = function(values)
	{
		this.pHrefAnchor.value = '';

		if (!this.editor.bbCode)
		{
			this.pStatEvent1.value =
			this.pStatEvent2.value =
			this.pStatEvent3.value = '';
			this.pStat.checked = false;
		}

		if (!values)
		{
			values = {};
		}
		else
		{
			// 1. Detect type
			var href = values.href || '';
			if (href != '')
			{
				if(href.substring(0, 'mailto:'.length).toLowerCase() == 'mailto:') // email
				{
					values.type = 'email';
					this.pHrefEmail.value = href.substring('mailto:'.length);
				}
				else if(href.substr(0, 1) == '#') // anchor
				{
					values.type = 'anchor';
					this.pHrefAnchor.value = href;
				}
				else if (href.indexOf("://") !== -1 || href.substr(0, 'www.'.length) == 'www.' || href.indexOf("&goto=") !== -1)
				{
					values.type = 'external';

					// Fix link in statistic
					if(href.substr(0, '/bitrix/redirect.php'.length) == '/bitrix/redirect.php')
					{
						this.pStat.checked = true;
						this.CheckShowStatParams();
						var sParams = href.substring('/bitrix/redirect.php'.length);
						function __ExtrParam(p, s)
						{
							var pos = s.indexOf(p + '=');
							if (pos < 0)
							{
								return '';
							}

							var pos2 = s.indexOf('&', pos + p.length+1);
							if (pos2 < 0)
							{
								s = s.substring(pos + p.length + 1);
							}
							else
							{
								s = s.substr(pos+p.length+1, pos2 - pos - 1 - p.length);
							}
							return unescape(s);
						};

						this.pStatEvent1.value = __ExtrParam('event1', sParams);
						this.pStatEvent2.value = __ExtrParam('event2', sParams);
						this.pStatEvent3.value = __ExtrParam('event3', sParams);

						href = __ExtrParam('goto', sParams);
					}

					if (href.substr(0, 'www.'.length) == 'www.')
						href = "http://" + href;
					var prot = href.substr(0, href.indexOf("://") + 3);
					this.pHrefType.value = prot;
					if (this.pHrefType.value != prot)
						this.pHrefType.value = '';
					this.pHrefExt.value = href.substring(href.indexOf("://") + 3);
				}
				else // link to page on server
				{
					values.type = 'internal';
					this.pHrefIn.value = href || '';
				}
			}

			if (!values.type)
			{
				if (values.text && values.text.match(this.editor.autolinkEmailRegExp))
				{
					this.pHrefEmail.value = values.text;
					values.type = 'email';
				}
				else
				{
					values.type = 'internal';
					this.pHrefIn.value = href || '';
				}
			}

			if (this.pType)
			{
				this.pType.value = values.type;
			}

			this.pInnerHtmlCont.style.display = 'none';
			this.pTextCont.style.display = 'none';
			// Text
			if (values.bTextContent) // Simple text
			{
				this.pText.value = values.text || '';
				this.pTextCont.style.display = '';
			}
			else //
			{
				if (!values.text && values.innerHtml)
				{
					this.pInnerHtml.innerHTML = values.innerHtml;
					this.pInnerHtmlCont.style.display = '';
				}
				else
				{
					this.pText.value = values.text || '';
					this.pTextCont.style.display = '';
				}
				this._originalText = values.text;
			}
		}

		if (!this.editor.bbCode)
		{
			this.pTitle.value = values.title || '';
			this.pTarget.value = values.target || '_self';
			this.pClass.value = values.className || '';
			this.pId.value = values.id || '';
			this.pRel.value = values.rel || '';
			this.pNoindex.checked = values.noindex;
		}

		this.ChangeType();

		if (!this.editor.bbCode)
		{
			this.CheckShowStatParams();
			this.CheckNoindex();

			if (!this.oClass)
			{
				this.oClass = new window.BXHtmlEditor.ClassSelector(this.editor,
					{
						id: this.id + '-class-selector',
						input: this.pClass,
						filterTag: 'A',
						value: this.pClass.value
					}
				);

				var _this = this;
				BX.addCustomEvent(this.oClass, "OnComboPopupClose", function()
				{
					_this.closeByEnter = true;
				});
				BX.addCustomEvent(this.oClass, "OnComboPopupOpen", function()
				{
					_this.closeByEnter = false;
				});
			}
			else
			{
				this.oClass.OnChange();
			}
		}
	};

	LinkDialog.prototype.GetValues = function()
	{
		var
			type = this.pType ? this.pType.value : 'internal',
			value = {
				text: this.pText.value
			};

		if (!this.editor.bbCode)
		{
			value.className = '';
			value.title = this.pTitle.value;
			value.id = this.pId.value;
			value.rel = this.pRel.value;
			value.noindex = !!this.pNoindex.checked;
		}

		if (type == 'internal')
		{
			value.href = this.pHrefIn.value;
		}
		else if (type == 'external')
		{
			value.href = this.pHrefExt.value;
			if (this.pHrefType.value && value.href.indexOf('://') == -1)
			{
				value.href = this.pHrefType.value + value.href;
			}

			if(this.pStat && this.pStat.checked)
			{
				value.href = '/bitrix/redirect.php?event1=' + escape(this.pStatEvent1.value) + '&event2=' + escape(this.pStatEvent2.value) + '&event3=' + escape(this.pStatEvent3.value) + '&goto=' + escape(value.href);
			}
		}
		else if (type == 'anchor')
		{
			value.href = this.pHrefAnchor.value;
		}
		else if (type == 'email')
		{
			value.href = 'mailto:' + this.pHrefEmail.value;
		}

		if (this.pTarget && this.pTarget.value !== '_self')
		{
			value.target = this.pTarget.value;
		}

		if (this.pClass && this.pClass.value)
		{
			value.className = this.pClass.value;
		}

		return value;
	};

	LinkDialog.prototype.Show = function(nodes, savedRange)
	{
		var
			values = {},
			i, l, link, lastLink, linksCount = 0;

		this.savedRange = savedRange;

		if (!this.editor.bbCode || !this.editor.synchro.IsFocusedOnTextarea())
		{
			if (!nodes)
			{
				nodes = this.editor.action.CheckState('formatInline', {}, "a");
			}

			if (nodes)
			{
				// Selection contains links
				for (i = 0; i < nodes.length; i++)
				{
					link = nodes[i];
					if (link)
					{
						lastLink = link;
						linksCount++;
					}

					if (linksCount > 1)
					{
						break;
					}
				}

				// One link
				if (linksCount === 1 && lastLink)
				{
					// 1. Link contains only text
					if (!lastLink.querySelector("*"))
					{
						values.text = this.editor.util.GetTextContent(lastLink);
						values.bTextContent = true;
					}
					// Link contains
					else
					{
						values.text = this.editor.util.GetTextContent(lastLink);
						if (BX.util.trim(values.text) == '')
						{
							values.innerHtml = lastLink.innerHTML;
						}
						values.bTextContent = false;
					}

					var cleanAttribute = lastLink.getAttribute('data-bx-clean-attribute');
					if (cleanAttribute)
					{
						lastLink.removeAttribute(cleanAttribute);
						lastLink.removeAttribute('data-bx-clean-attribute');
					}

					values.noindex = lastLink.getAttribute('data-bx-noindex') == "Y";
					values.href = lastLink.getAttribute('href');
					values.title = lastLink.title;
					values.id = lastLink.id;
					values.rel = lastLink.getAttribute('rel');
					values.target = lastLink.target;
					values.className = lastLink.className;
				}
			}
			else
			{
				var text = BX.util.trim(this.editor.selection.GetText());
				if (text && text != this.editor.INVISIBLE_SPACE)
				{
					values.text = text;
				}
			}

			this.bNewLink = nodes && linksCount > 0;
			var anchors = [], bxTag;
			var surrs = this.editor.sandbox.GetDocument().querySelectorAll('.bxhtmled-surrogate');
			l = surrs.length;
			for (i = 0; i < l; i++)
			{
				bxTag = this.editor.GetBxTag(surrs[i]);
				if (bxTag.tag == 'anchor')
				{
					anchors.push({
						NAME: '#' + bxTag.params.name,
						DESCRIPTION: BX.message('BXEdLinkHrefAnch') + ': #' + bxTag.params.name,
						CLASS_NAME: 'bxhtmled-inp-popup-item'
					});
				}
			}

			if (anchors.length > 0)
			{
				this.oHrefAnchor = new BXInputPopup({
					id: this.id + '-href-anchor-cntrl' + Math.round(Math.random() * 1000000000),
					values: anchors,
					input: this.pHrefAnchor,
					className: 'bxhtmled-inp-popup'
				});

				BX.addCustomEvent(this.oHrefAnchor, "onInputPopupShow", function(anchorPopup)
				{
					if (anchorPopup && anchorPopup.oPopup &&  anchorPopup.oPopup.popupContainer)
					{
						anchorPopup.oPopup.popupContainer.style.zIndex = 3010;
					}
				});
			}
		}
		else
		{
			values.text = this.editor.textareaView.GetTextSelection();
		}

		this.SetValues(values);
		this.SetTitle(BX.message('InsertLink'));

		// Call parrent Dialog.Show()
		LinkDialog.superclass.Show.apply(this, arguments);
	};

	// Video dialog
	function VideoDialog(editor, params)
	{
		params = {
			id: 'bx_video',
			width: 600,
			className: 'bxhtmled-video-dialog'
		};

		this.sizes = [
			{key:'560x315', width: 560, height: 315},
			{key:'640x360', width: 640, height: 360},
			{key:'853x480', width: 853, height: 480},
			{key:'1280x720', width: 1280, height: 720}
		];

		// Call parrent constructor
		VideoDialog.superclass.constructor.apply(this, [editor, params]);
		this.id = 'video_' + this.editor.id;
		this.waitCounter = false;
		this.SetContent(this.Build());

		BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(VideoDialog, Dialog);

	VideoDialog.prototype.Build = function()
	{
		this.pCont = BX.create('DIV', {props: {className: 'bxhtmled-video-dialog-cnt bxhtmled-video-cnt  bxhtmled-video-empty'}});
		var
			_this = this,
			r, c,
			pTableWrap = BX.create('TABLE', {props: {className: 'bxhtmled-dialog-tbl bxhtmled-video-dialog-tbl'}});

		// Source
		r = this.AddTableRow(pTableWrap, {label: BX.message('BXEdVideoSource') + ':', id: this.id + '-source'});
		this.pSource = r.rightCell.appendChild(BX.create('INPUT', {props: {id: this.id + '-source', type: 'text', className: 'bxhtmled-90-input', placeholder: BX.message('BXEdVideoSourcePlaceholder')}}));
		BX.bind(this.pSource, 'change', BX.delegate(this.VideoSourceChanged, this));
		BX.bind(this.pSource, 'mouseup', BX.delegate(this.VideoSourceChanged, this));
		BX.bind(this.pSource, 'keyup', BX.delegate(this.VideoSourceChanged, this));

		r = pTableWrap.insertRow(-1);
		c = BX.adjust(r.insertCell(-1), {props:{className: 'bxhtmled-video-params-wrap'}, attrs: {colSpan: 2}});
		var pParTbl = c.appendChild(BX.create('TABLE', {props: {className: 'bxhtmled-dialog-tbl bxhtmled-video-dialog-tbl'}}));

		// Title
		r = this.AddTableRow(pParTbl, {label: BX.message('BXEdVideoInfoTitle') + ':', id: this.id + '-title'});
		this.pTitle = r.rightCell.appendChild(BX.create('INPUT', {props: {id: this.id + '-title', type: 'text', className: 'bxhtmled-90-input', disabled: !!this.editor.bbCode}}));
		BX.addClass(r.row, 'bxhtmled-video-ext-row');

		// Size
		r = this.AddTableRow(pParTbl, {label: BX.message('BXEdVideoSize') + ':', id: this.id + '-size'});
		this.pSize = r.rightCell.appendChild(BX.create('SELECT', {props: {id: this.id + '-size'}}));
		BX.addClass(r.row, 'bxhtmled-video-ext-row');

		this.pUserSizeCnt = r.rightCell.appendChild(BX.create('SPAN', {props: {className: 'bxhtmled-user-size'}, style: {display: 'none'}}));
		this.pUserSizeCnt.appendChild(BX.create('LABEL', {props: {className: 'bxhtmled-width-lbl'}, text: BX.message('BXEdImgWidth') + ': ', attrs: {'for': this.id + '-width'}}));
		this.pWidth = this.pUserSizeCnt.appendChild(BX.create('INPUT', {props: {id: this.id + '-width', type: 'text'}}));
		this.pUserSizeCnt.appendChild(BX.create('LABEL', {props: {className: 'bxhtmled-width-lbl'}, text: BX.message('BXEdImgHeight') + ': ', attrs: {'for': this.id + '-height'}}));
		this.pHeight = this.pUserSizeCnt.appendChild(BX.create('INPUT', {props: {id: this.id + '-height', type: 'text'}}));
		BX.bind(this.pSize, 'change', function()
		{
			_this.pUserSizeCnt.style.display = _this.pSize.value == '' ? '' : 'none'
		});

		// Preview
		this.pPreviewCont = pParTbl.insertRow(-1);
		c = BX.adjust(this.pPreviewCont.insertCell(-1), {props:{title: BX.message('BXEdVideoPreview')},attrs: {colSpan: 2}});
		this.pPreview = c.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-video-preview-cnt'}}));
		BX.addClass(this.pPreviewCont, 'bxhtmled-video-ext-row');

		this.pCont.appendChild(pTableWrap);
		return this.pCont;
	};

	VideoDialog.prototype.VideoSourceChanged = function()
	{
		var value = BX.util.trim(this.pSource.value);

		if (value !== this.lastSourceValue)
		{
			this.lastSourceValue = value;

			if (this.editor.bbCode && this.bEdit && value.toLowerCase().indexOf('[/video]') !== -1)
				return;

			this.AnalyzeVideoSource(value);
		}
	};

	VideoDialog.prototype.AnalyzeVideoSource = function(value)
	{
		var _this = this;
		if (value.match(/<iframe([\s\S]*?)\/iframe>/gi))
		{
			var video = this.editor.phpParser.CheckForVideo(value);
			if (video)
			{
				var videoData = this.editor.phpParser.FetchVideoIframeParams(value, video.provider) || {};
				this.ShowVideoParams({
					html: value,
					provider: video.provider || false,
					title: videoData.origTitle || '',
					width: videoData.width || false,
					height: videoData.height || false
				});
			}
		}
		else
		{
			this.StartWaiting();
			this.editor.Request({
				getData: this.editor.GetReqData('video_oembed',
					{
						video_source: value
					}
				),
				handler: function(res)
				{
					if (res.result)
					{
						_this.StopWaiting();
						_this.ShowVideoParams(res.data);
					}
					else
					{
						_this.StopWaiting();
						if (res.error !== '')
						{
							_this.ShowVideoParams(false);
						}
					}
				}
			});
		}
	};

	VideoDialog.prototype.StartWaiting = function()
	{
		var
			dot = '',
			_this = this;

		this.waitCounter = (this.waitCounter === false || this.waitCounter > 3) ? 0 : this.waitCounter;

		if (_this.waitCounter == 1)
			dot = '.';
		else if (_this.waitCounter == 2)
			dot = '..';
		else if (_this.waitCounter == 3)
			dot = '...';

		_this.SetTitle(BX.message('BXEdVideoTitle') + dot);

		this.StopWaiting(false);
		this.waitingTimeout = setTimeout(
			function(){
				_this.waitCounter++;
				_this.StartWaiting();
			}, 250
		);
	};

	VideoDialog.prototype.StopWaiting = function(title)
	{
		if (this.waitingTimeout)
		{
			clearTimeout(this.waitingTimeout);
			this.waitingTimeout = null;
		}

		if (title !== false)
		{
			this.waitCounter = false;
			this.SetTitle(title || BX.message('BXEdVideoTitle'));
		}
	};

	VideoDialog.prototype.ShowVideoParams = function(data)
	{
		this.data = data;
		if (data === false || typeof data != 'object')
		{
			BX.addClass(this.pCont, 'bxhtmled-video-empty');
		}
		else
		{
			BX.removeClass(this.pCont, 'bxhtmled-video-empty');
			if (data.provider)
			{
				this.SetTitle(BX.message('BXEdVideoTitleProvider').replace('#PROVIDER_NAME#', BX.util.htmlspecialchars(data.provider)));
			}

			// Title
			this.pTitle.value = data.title || '';

			// Size
			this.SetSize(data.width, data.height);

			// Preview
			if (data.html)
			{
				var
					w = Math.min(data.width, 560),
					h = Math.min(data.height, 315),
					previewHtml = data.html;

				previewHtml = this.UpdateHtml(previewHtml, w, h);
				this.pPreview.innerHTML = previewHtml;
				this.pPreviewCont.style.display = '';
			}
			else
			{
				this.pPreviewCont.style.display = 'none';
			}
		}
	};

	VideoDialog.prototype.SetSize = function(width, height)
	{
		var key = width + 'x' + height;
		if (!this.sizeIndex[key])
		{
			this.ClearSizeControl([{
				key: key,
				width: width, height: height,
				title: BX.message('BXEdVideoSizeAuto') + ' (' + width + ' x ' + height + ')'
			}].concat(this.sizes));
		}
		this.pSize.value = key;
	};

	VideoDialog.prototype.ClearSizeControl = function(sizes)
	{
		sizes = sizes || this.sizes;
		this.pSize.options.length = 0;
		this.sizeIndex = {};
		for (var i = 0; i < sizes.length; i++)
		{
			this.sizeIndex[sizes[i].key] = true;
			this.pSize.options.add(new Option(sizes[i].title || (sizes[i].width + ' x ' + sizes[i].height), sizes[i].key, false, false));
		}
		this.pSize.options.add(new Option(BX.message('BXEdVideoSizeCustom'), '', false, false));
	};

	VideoDialog.prototype.UpdateHtml = function(html, width, height, title)
	{
		var bTitle = false;

		if (title)
		{
			title = BX.util.htmlspecialchars(title);
		}

		html = html.replace(/((?:title)|(?:width)|(?:height))\s*=\s*("|')([\s\S]*?)(\2)/ig, function(s, attrName, q, attrValue)
		{
			attrName = attrName.toLowerCase();
			if (attrName == 'width' && width)
			{
				return attrName + '="' + width + '"';
			}
			else if(attrName == 'height' && height)
			{
				return attrName + '="' + height + '"';
			}
			else if (attrName == 'title' && title)// title
			{
				bTitle = true;
				return attrName + '="' + title + '"';
			}
			return '';
		});

		if (!bTitle && title)
		{
			html = html.replace(/<iframe\s*/i, function(s)
			{
				return s + ' title="' + title + '" ';
			});
		}

		return html;
	};

	VideoDialog.prototype.Show = function(bxTag, savedRange)
	{
		this.savedRange = savedRange;
		if (this.savedRange)
		{
			this.editor.selection.SetBookmark(this.savedRange);
		}

		this.SetTitle(BX.message('BXEdVideoTitle'));
		this.ClearSizeControl();

		this.bEdit = bxTag && bxTag.tag == 'video';
		this.bxTag = bxTag;
		if (this.bEdit)
		{
			this.pSource.value = this.lastSourceValue = bxTag.params.value;
			if (!this.editor.bbCode)
				this.AnalyzeVideoSource(bxTag.params.value);
		}
		else
		{
			this.ShowVideoParams(false);
			this.pSource.value = '';
		}

		// Call parrent Dialog.Show()
		VideoDialog.superclass.Show.apply(this, arguments);
	};

	VideoDialog.prototype.Save = function()
	{
		var
			_this = this,
			title = this.pTitle.value,
			width = parseInt(this.pWidth.value) || 100,
			height = parseInt(this.pHeight.value) || 100;

		if (this.pSize.value !== '')
		{
			var sz = this.pSize.value.split('x');
			if (sz && sz.length == 2)
			{
				width = parseInt(sz[0]);
				height = parseInt(sz[1]);
			}
		}

		if (this.data && this.data.html)
			this.data.html = this.UpdateHtml(this.data.html, width, height, title);

		if (this.bEdit)
		{
			if (this.bxTag && this.editor.bbCode && !this.data)
			{
				this.bxTag.params.value = this.pSource.value;
			}
			else if (this.data && this.editor.action.IsSupported('insertHTML'))
			{
				var node = this.editor.GetIframeDoc().getElementById(this.bxTag.id);
				if (node)
				{
					this.editor.selection.SelectNode(node);
					BX.remove(node);
				}
				this.editor.action.Exec('insertHTML', this.data.html);
			}
		}
		else
		{
			if (this.data && this.editor.action.IsSupported('insertHTML'))
			{
				if (this.savedRange)
				{
					this.editor.selection.SetBookmark(this.savedRange);
				}

				this.editor.action.Exec('insertHTML', this.data.html);
			}
		}

		setTimeout(function()
		{
			_this.editor.synchro.FullSyncFromIframe();
		}, 50);
	};


	// Source dialog (php, javascript, html-comment, iframe, style, etc.)
	function SourceDialog(editor, params)
	{
		params = {
			id: 'bx_source',
			height: 400,
			width: 700,
			resizable: true,
			className: 'bxhtmled-source-dialog'
		};

		// Call parrent constructor
		SourceDialog.superclass.constructor.apply(this, [editor, params]);
		this.id = 'source_' + this.editor.id;
		this.SetContent(this.Build());

		BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(SourceDialog, Dialog);

	SourceDialog.prototype.Build = function()
	{
		this.pValue = BX.create('TEXTAREA', {props: {className: 'bxhtmled-source-value', id: this.id + '-value'}});
		return this.pValue;
	};

	SourceDialog.prototype.OnResize = function()
	{
		var
			w = this.oDialog.PARTS.CONTENT_DATA.offsetWidth,
			h = this.oDialog.PARTS.CONTENT_DATA.offsetHeight;

		this.pValue.style.width = (w - 30) + 'px';
		this.pValue.style.height = (h - 30) + 'px';
	};

	SourceDialog.prototype.OnResizeFinished = function()
	{
	};

	SourceDialog.prototype.Save = function()
	{
		this.bxTag.params.value = this.pValue.value;
		this.editor.SetBxTag(false, this.bxTag);
		var _this = this;
		setTimeout(function()
		{
			_this.editor.synchro.FullSyncFromIframe();
		}, 50);
	};

	SourceDialog.prototype.Show = function(bxTag)
	{
		this.bxTag = bxTag;
		if (bxTag && bxTag.tag)
		{
			this.SetTitle(bxTag.name);
			this.pValue.value = bxTag.params.value;
			// Call parrent Dialog.Show()
			SourceDialog.superclass.Show.apply(this, arguments);
			this.OnResize();
			BX.focus(this.pValue);
		}
	};

	// Anchor dialog
	function AnchorDialog(editor, params)
	{
		params = {
			id: 'bx_anchor',
			width: 300,
			resizable: false,
			className: 'bxhtmled-anchor-dialog'
		};

		// Call parrent constructor
		AnchorDialog.superclass.constructor.apply(this, [editor, params]);
		this.id = 'anchor_' + this.editor.id;
		this.SetContent(this.Build());

		BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(AnchorDialog, Dialog);

	AnchorDialog.prototype.Build = function()
	{
		var cont = BX.create('DIV');
		cont.appendChild(BX.create('LABEL', {text: BX.message('BXEdAnchorName') + ': '})).setAttribute('for', this.id + '-value');
		this.pValue = cont.appendChild(BX.create('INPUT', {props: {className: '', id: this.id + '-value'}}));
		return cont;
	};

	AnchorDialog.prototype.Save = function()
	{
		this.bxTag.params.name = BX.util.trim(this.pValue.value.replace(/[^ a-z0-9_\-]/gi, ""));
		this.editor.SetBxTag(false, this.bxTag);
		var _this = this;
		setTimeout(function()
		{
			_this.editor.synchro.FullSyncFromIframe();
		}, 50);
	};

	AnchorDialog.prototype.Show = function(bxTag)
	{
		this.bxTag = bxTag;
		if (bxTag && bxTag.tag)
		{
			this.SetTitle(BX.message('BXEdAnchor'));
			this.pValue.value = bxTag.params.name;
			// Call parrent Dialog.Show()
			AnchorDialog.superclass.Show.apply(this, arguments);
			BX.focus(this.pValue);
			this.pValue.select();
		}
	};


	// Table dialog
	function TableDialog(editor, params)
	{
		params = {
			id: 'bx_table',
			width: editor.bbCode ? 300 : 600,
			resizable: false,
			className: 'bxhtmled-table-dialog'
		};

		// Call parrent constructor
		LinkDialog.superclass.constructor.apply(this, [editor, params]);

		this.id = 'table' + this.editor.id;
		this.action = 'insertTable';

		this.SetContent(this.Build());

		BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(TableDialog, Dialog);

	TableDialog.prototype.Build = function()
	{
		var
			pInnerTable,
			r, c,
			cont = BX.create('DIV');

		var pTableWrap = BX.create('TABLE', {props: {className: 'bxhtmled-dialog-tbl bxhtmled-dialog-tbl-hide-additional'}});
		r = pTableWrap.insertRow(-1); // 1 row
		c = BX.adjust(r.insertCell(-1), {attrs: {colSpan: 4}}); // First row

		pInnerTable = c.appendChild(BX.create('TABLE', {props: {className: 'bxhtmled-dialog-tbl'}}));
		r = pInnerTable.insertRow(-1); // 1.1 row

		// Rows
		c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-lbl-cell'}});
		c.appendChild(BX.create('LABEL', {text: BX.message('BXEdTableRows') + ':', attrs: {'for': this.id + '-rows'}}));
		c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-val-cell'}});
		this.pRows = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-rows'}}));

		// Width
		if (!this.editor.bbCode)
		{
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-lbl-cell'}});
			c.appendChild(BX.create('LABEL', {text: BX.message('BXEdTableWidth') + ':', attrs: {'for': this.id + '-width'}}));

			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-val-cell'}});
			this.pWidth = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-width'}}));
		}

		r = pInnerTable.insertRow(-1); // 1.2  row
		// Cols
		c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-lbl-cell'}});
		c.appendChild(BX.create('LABEL', {text: BX.message('BXEdTableCols') + ':', attrs: {'for': this.id + '-cols'}}));
		c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-val-cell'}});
		this.pCols = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-cols'}}));

		// Height
		if (!this.editor.bbCode)
		{
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-lbl-cell'}});
			c.appendChild(BX.create('LABEL', {text: BX.message('BXEdTableHeight') + ':', attrs: {'for': this.id + '-height'}}));
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-val-cell'}});
			this.pHeight = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-height'}}));
		}

		if (!this.editor.bbCode)
		{
			// *** Additional params ***
			r = pTableWrap.insertRow(-1);
			var addTitleCell = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-title-cell bxhtmled-title-cell-foldable', colSpan: 4}, text: BX.message('BXEdLinkAdditionalTitle')});
			BX.bind(addTitleCell, "click", function()
			{
				BX.toggleClass(pTableWrap, 'bxhtmled-dialog-tbl-hide-additional');
			});

			var pTbody = pTableWrap.appendChild(BX.create('TBODY', {props: {className: 'bxhtmled-additional-tbody'}}));

			r = pTbody.insertRow(-1); // 3rd row
			// Header cells
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-lbl-cell'}});
			c.appendChild(BX.create('LABEL', {text: BX.message('BXEdTableHeads') + ':', attrs: {'for': this.id + '-th'}}));
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-val-cell'}});

			this.pHeaders = c.appendChild(BX.create('SELECT', {props: {id: this.id + '-th'}, style: {width: '130px'}}));
			this.pHeaders.options.add(new Option(BX.message('BXEdThNone'), '', true, true));
			this.pHeaders.options.add(new Option(BX.message('BXEdThTop'), 'top', false, false));
			this.pHeaders.options.add(new Option(BX.message('BXEdThLeft'), 'left', false, false));
			this.pHeaders.options.add(BX.adjust(new Option(BX.message('BXEdThTopLeft'), 'topleft', false, false), {props: {title: BX.message('BXEdThTopLeftTitle')}}));

			// CellSpacing
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-lbl-cell'}});
			c.appendChild(BX.create('LABEL', {text: BX.message('BXEdTableCellSpacing') + ':', attrs: {'for': this.id + '-cell-spacing'}}));
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-val-cell'}});
			this.pCellSpacing = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-cell-spacing'}}));

			r = pTbody.insertRow(-1); // 4th row
			// Border
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-lbl-cell'}});
			c.appendChild(BX.create('LABEL', {text: BX.message('BXEdTableBorder') + ':', attrs: {'for': this.id + '-border'}}));
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-val-cell'}});
			this.pBorder = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-border'}}));

			// CellPadding
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-lbl-cell'}});
			c.appendChild(BX.create('LABEL', {text: BX.message('BXEdTableCellPadding') + ':', attrs: {'for': this.id + '-cell-padding'}}));
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-val-cell'}});
			this.pCellPadding = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-cell-padding'}}));

			r = pTbody.insertRow(-1); // 5th row
			c = BX.adjust(r.insertCell(-1), {attrs: {colSpan: 4}});

			pInnerTable = c.appendChild(BX.create('TABLE', {props: {className: 'bxhtmled-dialog-inner-tbl'}}));

			// Table align
			r = pInnerTable.insertRow(-1); // 5.0 align row
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-inner-lbl-cell'}});
			c.appendChild(BX.create('LABEL', {text: BX.message('BXEdTableAlign') + ':', attrs: {'for': this.id + '-align'}}));
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-inner-val-cell'}});
			this.pAlign = c.appendChild(BX.create('SELECT', {props: {id: this.id + '-align'}, style: {width: '130px'}}));
			this.pAlign.options.add(new Option(BX.message('BXEdTableAlignLeft'), 'left', true, true));
			this.pAlign.options.add(new Option(BX.message('BXEdTableAlignCenter'), 'center', false, false));
			this.pAlign.options.add(new Option(BX.message('BXEdTableAlignRight'), 'right', false, false));

			r = pInnerTable.insertRow(-1); // 5.1 th row
			// Table caption
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-inner-lbl-cell'}});
			c.appendChild(BX.create('LABEL', {text: BX.message('BXEdTableCaption') + ':', attrs: {'for': this.id + '-caption'}}));
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-inner-val-cell'}});
			this.pCaption = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-caption'}}));

			r = pInnerTable.insertRow(-1); // 5.2 th row
			// CSS class selector
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-inner-lbl-cell'}});
			c.appendChild(BX.create('LABEL', {text: BX.message('BXEdCssClass') + ':', attrs: {'for': this.id + '-class'}}));
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-inner-val-cell'}});
			this.pClass = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-class'}}));

			r = pInnerTable.insertRow(-1); // 5.3 th row
			// Id
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-inner-lbl-cell'}});
			c.appendChild(BX.create('LABEL', {text: BX.message('BXEdTableId') + ':', attrs: {'for': this.id + '-id'}}));
			c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-inner-val-cell'}});
			this.pId = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-id'}}));
			// *** Additional params END ***
		}

		cont.appendChild(pTableWrap);
		return cont;
	};

	TableDialog.prototype.SetValues = function(values)
	{
		this.pRows.value = values.rows || 3;
		this.pCols.value = values.cols || 4;

		if (!this.editor.bbCode)
		{
			this.pWidth.value = values.width || '';
			this.pHeight.value = values.height || '';
			this.pId.value = values.id || '';
			this.pCaption.value = values.caption || '';
			this.pCellPadding.value = values.cellPadding || 0;
			this.pCellSpacing.value = values.cellSpacing || 0;
			this.pBorder.value = values.border || '';
			this.pClass.value = values.className || '';
			this.pHeaders.value = values.headers || '';
			this.pRows.disabled = this.pCols.disabled = !!this.currentTable;
			this.pAlign.value = values.align || 'left';

			if (!this.oClass)
			{
				this.oClass = new window.BXHtmlEditor.ClassSelector(this.editor,
					{
						id: this.id + '-class-selector',
						input: this.pClass,
						filterTag: 'TABLE',
						value: this.pClass.value
					}
				);

				var _this = this;
				BX.addCustomEvent(this.oClass, "OnComboPopupClose", function()
				{
					_this.closeByEnter = true;
				});
				BX.addCustomEvent(this.oClass, "OnComboPopupOpen", function()
				{
					_this.closeByEnter = false;
				});
			}
			else
			{
				this.oClass.OnChange();
			}

		}
	};

	TableDialog.prototype.GetValues = function()
	{
		var res = {
			table: this.currentTable || false,
			rows: parseInt(this.pRows.value) || 1,
			cols: parseInt(this.pCols.value) || 1
		};

		if (!this.editor.bbCode)
		{
			res.width = BX.util.trim(this.pWidth.value);
			res.height = BX.util.trim(this.pHeight.value);
			res.id = BX.util.trim(this.pId.value);
			res.caption = BX.util.trim(this.pCaption.value);
			res.cellPadding = parseInt(this.pCellPadding.value) || '';
			res.cellSpacing = parseInt(this.pCellSpacing.value) || '';
			res.border = parseInt(this.pBorder.value) || '';
			res.headers = this.pHeaders.value;
			res.className = this.pClass.value;
			res.align = this.pAlign.value;
		}

		return res;
	};

	TableDialog.prototype.Show = function(nodes, savedRange)
	{
		var
			table,
			value = {};

		this.savedRange = savedRange;
		if (this.savedRange)
		{
			this.editor.selection.SetBookmark(this.savedRange);
		}

		if (!nodes)
		{
			nodes = this.editor.action.CheckState('insertTable');
		}

		if (nodes && nodes.nodeName)
		{
			table = nodes;
		}
		else if ((nodes && nodes[0] && nodes[0].nodeName))
		{
			table = nodes[0];
		}

		this.currentTable = false;
		if (table)
		{
			this.currentTable = table;
			value.rows = table.rows.length;
			value.cols = table.rows[0].cells.length;

			// Width
			if (table.style.width)
			{
				value.width = table.style.width;
			}
			if (!value.width && table.width)
			{
				value.width = table.width;
			}

			// Height
			if (table.style.height)
			{
				value.height = table.style.height;
			}
			if (!value.height && table.height)
			{
				value.height = table.height;
			}

			value.cellPadding = table.getAttribute('cellPadding') || '';
			value.cellSpacing = table.getAttribute('cellSpacing') || '';
			value.border = table.getAttribute('border') || 0;
			value.id = table.getAttribute('id') || '';
			var pCaption = BX.findChild(table, {tag: 'CAPTION'}, false);
			value.caption = pCaption ? BX.util.htmlspecialcharsback(pCaption.innerHTML) : '';
			value.className = table.className || '';

			// Determine headers
			var r, c, pCell, bTop = true, bLeft = true;
			for(r = 0; r < table.rows.length; r++)
			{
				for(c = 0; c < table.rows[r].cells.length; c++)
				{
					pCell = table.rows[r].cells[c];
					if (r == 0)
					{
						bTop = pCell.nodeName == 'TH' && bTop;
					}

					if (c == 0)
					{
						bLeft = pCell.nodeName == 'TH' && bLeft;
					}
				}
			}

			if (!bTop && !bLeft)
			{
				value.headers = '';
			}
			else if(bTop && bLeft)
			{
				value.headers = 'topleft';
			}
			else if(bTop)
			{
				value.headers = 'top';
			}
			else
			{
				value.headers = 'left';
			}

			// Align
			value.align = table.getAttribute('align');
		}

		this.SetValues(value);
		this.SetTitle(BX.message('BXEdTable'));
		// Call parrent Dialog.Show()
		TableDialog.superclass.Show.apply(this, arguments);
	};
	// Table dialog END


	// Setting dialog
	function SettingsDialog(editor, params)
	{
		params = {
			id: 'bx_settings',
			width: 400,
			resizable: false
		};

		this.id = 'settings';

		// Call parrent constructor
		DefaultDialog.superclass.constructor.apply(this, [editor, params]);

		this.SetContent(this.Build());

		BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(SettingsDialog, Dialog);

	SettingsDialog.prototype.Build = function()
	{
		this.pCont = BX.create('DIV', {props: {className: 'bxhtmled-settings-dialog-cnt'}});
		var
			_this = this,
			r, c,
			pTableWrap = BX.create('TABLE', {props: {className: 'bxhtmled-dialog-tbl'}});

		// Clean spans
		r = this.AddTableRow(pTableWrap);
		this.pCleanSpans = r.leftCell.appendChild(BX.create('INPUT', {props: {id: this.id + '-clean-spans', type: 'checkbox'}}));
		r.rightCell.appendChild(BX.create('LABEL', {html: BX.message('BXEdSettingsCleanSpans')})).setAttribute('for', this.id + '-clean-spans');

		this.pCont.appendChild(pTableWrap);
		return this.pCont;
	};

	SettingsDialog.prototype.Show = function()
	{
		var value = {};
		this.SetValues(value);
		this.SetTitle(BX.message('BXEdSettings'));
		this.pCleanSpans.checked = this.editor.config.cleanEmptySpans;

		// Call parrent Dialog.Show()
		SettingsDialog.superclass.Show.apply(this, arguments);
	};

	SettingsDialog.prototype.Save = function()
	{
		this.editor.config.cleanEmptySpans = this.pCleanSpans.checked;
		this.editor.SaveOption('clean_empty_spans', this.editor.config.cleanEmptySpans ? 'Y' : 'N');
	};

	// Default properties dialog
	function DefaultDialog(editor, params)
	{
		params = {
			id: 'bx_default',
			width: 500,
			resizable: false,
			className: 'bxhtmled-default-dialog'
		};

		this.id = 'default';
		this.action = 'universalFormatStyle';

		// Call parrent constructor
		DefaultDialog.superclass.constructor.apply(this, [editor, params]);

		this.SetContent(this.Build());

		BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(DefaultDialog, Dialog);

	DefaultDialog.prototype.Show = function(nodes, savedRange)
	{
		var
			nodeNames = [],
			i,
			style,
			renewNodes = typeof nodes !== 'object' || nodes.length == 0,
			className;

		this.savedRange = savedRange;
		if (this.savedRange)
		{
			this.editor.selection.SetBookmark(this.savedRange);
		}

		if (renewNodes)
		{
			nodes = this.editor.action.CheckState(this.action);
		}
		if (!nodes)
		{
			nodes = [];
		}

		for (i = 0; i < nodes.length; i++)
		{
			if (style === undefined && className === undefined)
			{
				style = nodes[i].style.cssText;
				className = nodes[i].className;
			}
			else
			{
				style = nodes[i].style.cssText === style ? style : false;
				className = nodes[i].className === className ? className : false;
			}
			nodeNames.push(nodes[i].nodeName);
		}

		this.SetValues({
			nodes: nodes,
			renewNodes: renewNodes,
			style: style,
			className: className
		});

		this.SetTitle(BX.message('BXEdDefaultPropDialog').replace('#NODES_LIST#', nodeNames.join(', ')));

		// Call parrent Dialog.Show()
		DefaultDialog.superclass.Show.apply(this, arguments);
	};

	DefaultDialog.prototype.Build = function()
	{
		var
			r, c,
			cont = BX.create('DIV');

		var pTableWrap = BX.create('TABLE', {props: {className: 'bxhtmled-dialog-tbl'}});

		// Css class
		r = pTableWrap.insertRow(-1);
		c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-left-c'}});
		c.appendChild(BX.create('LABEL', {text: BX.message('BXEdCssClass') + ':', attrs: {'for': this.id + '-css-class'}}));
		c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-right-c'}});
		this.pCssClass = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-css-class'}}));

		// Inline css
		r = pTableWrap.insertRow(-1);
		c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-left-c'}});
		c.appendChild(BX.create('LABEL', {text: BX.message('BXEdCSSStyle') + ':', attrs: {'for': this.id + '-css-style'}}));
		c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled-right-c'}});
		this.pCssStyle = c.appendChild(BX.create('INPUT', {props: {type: 'text', id: this.id + '-css-style'}}));

		cont.appendChild(pTableWrap);
		return cont;
	};

	DefaultDialog.prototype.SetValues = function(values)
	{
		if (!values)
		{
			values = {};
		}

		this.nodes = values.nodes || [];
		this.renewNodes = values.renewNodes;
		this.pCssStyle.value = values.style || '';
		this.pCssClass.value = values.className || '';

		if (!this.oClass)
		{
			this.oClass = new window.BXHtmlEditor.ClassSelector(this.editor,
				{
					id: this.id + '-class-selector',
					input: this.pCssClass,
					filterTag: 'A',
					value: this.pCssClass.value
				}
			);

			var _this = this;
			BX.addCustomEvent(this.oClass, "OnComboPopupClose", function()
			{
				_this.closeByEnter = true;
			});
			BX.addCustomEvent(this.oClass, "OnComboPopupOpen", function()
			{
				_this.closeByEnter = false;
			});
		}
		else
		{
			this.oClass.OnChange();
		}
	};

	DefaultDialog.prototype.GetValues = function()
	{
		return {
			className: this.pCssClass.value,
			style: this.pCssStyle.value,
			nodes: this.renewNodes ? [] : this.nodes
		};
	};

	// Specialchars dialog
	function SpecialcharDialog(editor, params)
	{
		this.editor = editor;
		params = {
			id: 'bx_char',
			width: 570,
			resizable: false,
			className: 'bxhtmled-char-dialog'
		};
		this.id = 'char' + this.editor.id;
		// Call parrent constructor
		SpecialcharDialog.superclass.constructor.apply(this, [editor, params]);

		this.oDialog.ClearButtons();
		this.oDialog.SetButtons([this.oDialog.btnCancel]);

		this.SetContent(this.Build());
		BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(SpecialcharDialog, Dialog);

	SpecialcharDialog.prototype.Build = function()
	{
		var
			_this = this,
			r, c, i,
			cells = 18, ent,
			l = this.editor.HTML_ENTITIES.length,
			cont = BX.create('DIV');

		var pTableWrap = BX.create('TABLE', {props: {className: 'bxhtmled-specialchar-tbl'}});

		for(i = 0; i < l; i++)
		{
			if (i % cells == 0) // new row
			{
				r = pTableWrap.insertRow(-1);
			}

			ent = this.editor.HTML_ENTITIES[i];
			c = r.insertCell(-1);
			c.innerHTML = ent;
			c.setAttribute('data-bx-specialchar', ent);
			c.title = BX.message('BXEdSpecialchar') + ': ' + ent.substr(1, ent.length - 2);
		}

		BX.bind(pTableWrap, 'click', function(e)
		{
			var
				ent,
				target = e.target || e.srcElement;
			if (target.nodeType == 3)
			{
				target = target.parentNode;
			}

			if (target && target.getAttribute && target.getAttribute('data-bx-specialchar') &&
				_this.editor.action.IsSupported('insertHTML'))
			{
				if (_this.savedRange)
				{
					_this.editor.selection.SetBookmark(_this.savedRange);
				}

				ent = target.getAttribute('data-bx-specialchar');
				_this.editor.On('OnSpecialcharInserted', [ent]);
				_this.editor.action.Exec('insertHTML', ent);
			}
			_this.oDialog.Close();
		});

		cont.appendChild(pTableWrap);
		return cont;
	};

	SpecialcharDialog.prototype.SetValues = BX.DoNothing;
	SpecialcharDialog.prototype.GetValues = BX.DoNothing;

	SpecialcharDialog.prototype.Show = function(savedRange)
	{
		this.savedRange = savedRange;
		if (this.savedRange)
		{
			this.editor.selection.SetBookmark(this.savedRange);
		}

		this.SetTitle(BX.message('BXEdSpecialchar'));
		// Call parrent Dialog.Show()
		SpecialcharDialog.superclass.Show.apply(this, arguments);
	};
	// Specialchars dialog END

	// InsertListDialog dialog
	function InsertListDialog(editor, params)
	{
		this.editor = editor;
		params = {
			id: 'bx_list',
			width: 360,
			resizable: false,
			className: 'bxhtmled-list-dialog'
		};
		this.id = 'list' + this.editor.id;
		// Call parrent constructor
		InsertListDialog.superclass.constructor.apply(this, [editor, params]);

		this.SetContent(this.Build());
		BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(InsertListDialog, Dialog);

	InsertListDialog.prototype.Build = function()
	{
		var
			_this = this,
			r, c, i,
			cells = 18, ent,
			l = this.editor.HTML_ENTITIES.length,
			cont = BX.create('DIV');

		this.itemsWrap = cont.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-list-wrap'}}));
		this.addItem = cont.appendChild(BX.create('span', {props: {className: 'bxhtmled-list-add-item'}, text: BX.message('BXEdAddListItem')}));
		BX.bind(this.addItem, 'click', BX.proxy(this.AddItem, this));

		return cont;
	};

	InsertListDialog.prototype.BuildList = function(type)
	{
		if (this.pList)
		{
			BX.remove(this.pList);
		}

		this.pList = this.itemsWrap.appendChild(BX.create(type, {props: {className: 'bxhtmled-list'}}));
		this.AddItem({focus: true});
		this.AddItem({focus: false});
		this.AddItem({focus: false});
	};

	InsertListDialog.prototype.AddItem = function(params)
	{
		if (typeof params !== 'object')
			params = {};

		var
			pLi = BX.create("LI"),
			pInput = pLi.appendChild(BX.create("INPUT", {props: {type: 'text', value: "", size: 35}}));

		this.pList.appendChild(pLi);
		var delBut = pLi.appendChild(BX.create("SPAN", {props: {className: "bxhtmled-list-del-item", title: BX.message('DelListItem')}}));

		if (params.focus !== false)
		{
			setTimeout(function(){BX.focus(pInput);}, 100);
		}

		BX.bind(pInput, 'keyup', BX.proxy(this.CheckList, this));
		BX.bind(pInput, 'mouseup', BX.proxy(this.CheckList, this));
		//BX.bind(pInput, 'keyup', BX.proxy(this.InputKeyNavigation, this));
		BX.bind(pInput, 'focus', BX.proxy(this.CheckList, this));
		BX.bind(delBut, 'click', BX.proxy(this.RemoveItem, this));
	};

	InsertListDialog.prototype.RemoveItem = function(e)
	{
		var
			target = e.target || e.srcElement,
			li = BX.findParent(target, {tag: "LI"});

		if (li)
		{
			BX.remove(li);
		}
	};

	InsertListDialog.prototype.CheckList = function()
	{
		var items = this.pList.getElementsByTagName('LI');

		if (items.length < 3)
		{
			this.AddItem({focus: false});
			this.CheckList({focus: false});
		}
		else
		{
			if (items[items.length - 1].firstChild && items[items.length - 1].firstChild.value !== '')
			{
				this.AddItem({focus: false});
			}
		}
	};

	InsertListDialog.prototype.InputKeyNavigation = function(e)
	{
		var
			target = e.target || e.srcElement,
			key = e.keyCode;
	};

	InsertListDialog.prototype.SetValues = BX.DoNothing;
	InsertListDialog.prototype.GetValues = BX.DoNothing;

	InsertListDialog.prototype.Show = function(params)
	{
		this.type = params.type;
		this.SetTitle(params.type == 'ul' ? BX.message('UnorderedList') : BX.message('OrderedList'));
		this.BuildList(params.type);
		// Call parrent Dialog.Show()
		InsertListDialog.superclass.Show.apply(this, arguments);
	};

	InsertListDialog.prototype.Save = function()
	{
		var
			i, items = [],
			inputs = this.pList.getElementsByTagName('INPUT');

		for (i = 0; i < inputs.length; i++)
		{
			if (inputs[i].value !== '')
			{
				items.push(inputs[i].value);
			}
		}

		this.editor.action.Exec(this.type == 'ul' ? 'insertUnorderedList' : 'insertOrderedList', {items: items});
	};
	// InsertListDialog dialog END

	/* ~~~~ Editor dialogs END~~~~*/

	window.BXHtmlEditor.Controls = {
		SearchButton: SearchButton,
		ChangeView: ChangeView,
		Undo: UndoButton,
		Redo: RedoButton,
		StyleSelector: StyleSelectorList,
		FontSelector: FontSelectorList,
		FontSize: FontSizeButton,
		Bold: BoldButton,
		Italic: ItalicButton,
		Underline: UnderlineButton,
		Strikeout: StrikeoutButton,
		Color: ColorPicker,
		RemoveFormat: RemoveFormatButton,
		TemplateSelector: TemplateSelectorList,
		OrderedList: OrderedListButton,
		UnorderedList: UnorderedListButton,
		IndentButton: IndentButton,
		OutdentButton: OutdentButton,
		AlignList: AlignList,
		InsertLink: InsertLinkButton,
		InsertImage: InsertImageButton,
		InsertVideo: InsertVideoButton,
		InsertAnchor: InsertAnchorButton,
		InsertTable: InsertTableButton,
		InsertChar: InsertCharButton,
		Settings: SettingsButton,
		Fullscreen: FullscreenButton,
		PrintBreak: PrintBreakButton,
		PageBreak: PageBreakButton,
		InsertHr: InsertHrButton,
		Spellcheck: SpellcheckButton,
		Code: CodeButton,
		Quote: QuoteButton,
		Smile: SmileButton,
		Sub: SubButton,
		Sup: SupButton,
		More: MoreButton,
		BbCode: BbCodeButton
	};

	window.BXHtmlEditor.dialogs.Image = ImageDialog;
	window.BXHtmlEditor.dialogs.Link = LinkDialog;
	window.BXHtmlEditor.dialogs.Video = VideoDialog;
	window.BXHtmlEditor.dialogs.Source = SourceDialog;
	window.BXHtmlEditor.dialogs.Anchor = AnchorDialog;
	window.BXHtmlEditor.dialogs.Table = TableDialog;
	window.BXHtmlEditor.dialogs.Settings = SettingsDialog;
	window.BXHtmlEditor.dialogs.Default = DefaultDialog;
	window.BXHtmlEditor.dialogs.Specialchar = SpecialcharDialog;
	window.BXHtmlEditor.dialogs.InsertList = InsertListDialog;
}

if (window.BXHtmlEditor && window.BXHtmlEditor.Button && window.BXHtmlEditor.Dialog)
	__run();
else
	BX.addCustomEvent(window, "OnEditorBaseControlsDefined", __run);

})();

/* End */
;
; /* Start:/bitrix/js/fileman/html_editor/html-components.js*/
/**
 * Bitrix HTML Editor 3.0
 * Date: 24.04.13
 * Time: 4:23
 *
 * Components class
 */
(function()
{
	function BXEditorComponents(editor)
	{
		this.editor = editor;
		this.phpParser = this.editor.phpParser;
		this.listLoaded = false;
		this.components = this.editor.config.components;
		this.compNameIndex = {};
		this.componentIncludeMethod = '$APPLICATION->IncludeComponent';

		this.requestUrl = '/bitrix/admin/fileman_component_params.php';
		this.HandleList();

		this.Init();
	}

	BXEditorComponents.prototype = {
		Init: function()
		{
			BX.addCustomEvent(this.editor, "OnSurrogateDblClick", BX.proxy(this.OnComponentDoubleClick, this));
		},

		GetList: function()
		{
			return this.components;
		},

		HandleList: function()
		{
			if (this.components && this.components.items)
			{
				for(var i = 0; i < this.components.items.length; i++)
					this.compNameIndex[this.components.items[i].name] = i;
			}
		},

		IsComponent: function(code)
		{
			code = this.phpParser.TrimPhpBrackets(code);
			code = this.phpParser.CleanCode(code);

			var oFunction = this.phpParser.ParseFunction(code);
			if (oFunction && oFunction.name.toUpperCase() == this.componentIncludeMethod.toUpperCase())
			{
				var arParams = this.phpParser.ParseParameters(oFunction.params);
				return {
					name: arParams[0],
					template: arParams[1] || "",
					params: arParams[2] || {},
					parentComponent: (arParams[3] && arParams[3] != '={false}') ? arParams[3] : false,
					exParams: arParams[4] || false
				};
			}
			return false;
		},

		IsReady: function()
		{
			return this.listLoaded;
		},

		GetSource: function(params)
		{
			if (!this.arVA)
			{
				this.arVA = {};
			}

			var
				res = "<?" + this.componentIncludeMethod + "(\n" +
					"\t\"" + params.name+"\",\n" +
					"\t\"" + (params.template || "") + "\",\n";

			if (params.params)
			{
				res += "\tArray(\n";

				var
					propValues = params.params,
					i, k, cnt,
					_len1 = "SEF_URL_TEMPLATES_".length,
					_len2 = "VARIABLE_ALIASES_".length,
					SUT, VA, lio, templ_key,
					params_exist = false,
					arVal, arLen, j;

				for (i in propValues)
				{
					if (!propValues.hasOwnProperty(i))
						continue;

					//try{
						if (!params_exist)
							params_exist = true;

						if (typeof(propValues[i]) == 'string')
						{
							propValues[i] = this.editor.util.stripslashes(propValues[i]);
						}
						else if (typeof(propValues[i]) == 'object')
						{
							arVal = 'array(';
							arLen = 0;
							for (j in propValues[i])
							{
								if (propValues[i].hasOwnProperty(j) && typeof(propValues[i][j]) == 'string')
								{
									arLen++;
									arVal += '"' + this.editor.util.stripslashes(propValues[i][j]) + '",';
								}
							}
							if (arLen > 0)
								arVal = arVal.substr(0, arVal.length - 1) + ')';
							else
								arVal += ')';

							propValues[i] = arVal;
						}
						else
						{
							continue;
						}

						if (propValues["SEF_MODE"] && propValues["SEF_MODE"].toUpperCase() == "Y")
						{
							//*** Handling SEF_URL_TEMPLATES in SEF = ON***
							if(i.substr(0, _len1) == "SEF_URL_TEMPLATES_")
							{
								templ_key = i.substr(_len1);
								this.arVA[templ_key] = this.CatchVariableAliases(propValues[i]);

								if (!SUT)
								{
									res += "\t\t\"" + i.substr(0, _len1 - 1) + "\" => Array(\n"
									SUT = true;
								}
								res += "\t\t\t\"" + i.substr(_len1) + "\" => ";
								if (this.IsPHPBracket(propValues[i]))
									res += this.TrimPHPBracket(propValues[i]);
								else
									res += "\"" + this.editor.util.addslashes(propValues[i])+"\"";

								res += ",\n";
								continue;
							}
							else if (SUT)
							{
								lio = res.lastIndexOf(",");
								res = res.substr(0,lio)+res.substr(lio+1);
								SUT = false;
								res += "\t\t),\n";
							}

							//*** Handling  VARIABLE_ALIASES  in SEF = ON***
							if(i.substr(0, _len2) == "VARIABLE_ALIASES_")
								continue;
						}
						else if(propValues["SEF_MODE"] == "N")
						{
							//*** Handling SEF_URL_TEMPLATES in SEF = OFF ***
							if (i.substr(0, _len1)=="SEF_URL_TEMPLATES_" || i == "SEF_FOLDER")
								continue;

							//*** Handling VARIABLE_ALIASES  in SEF = OFF ***
							if(i.substr(0, _len2) == "VARIABLE_ALIASES_")
							{
								if (!VA)
								{
									res += "\t\t\"" + i.substr(0, _len2 - 1) + "\" => Array(\n";
									VA = true;
								}
								res += "\t\t\t\"" + i.substr(_len2) + "\" => \"" + this.editor.util.addslashes(propValues[i]) + "\",\n";
								continue;
							}
							else if (VA)
							{
								lio = res.lastIndexOf(",");
								res = res.substr(0, lio) + res.substr(lio + 1);
								VA = false;
								res += "\t\t),\n";
							}
						}

						res += "\t\t\"" + i + "\" => ";
						if (this.IsPHPBracket(propValues[i]))
							res += this.TrimPHPBracket(propValues[i]);
						else if (propValues[i].substr(0, 6).toLowerCase() == 'array(')
							res += propValues[i];
						else
							res += '"' + this.editor.util.addslashes(propValues[i]) + '"';
						res += ",\n";

					//}catch(e){continue;}
				}

				if (VA || SUT)
				{
					lio = res.lastIndexOf(",");
					res = res.substr(0, lio) + res.substr(lio+1);
					VA = false;
					SUT = false;
					res += "\t\t),\n";
				}

				if (propValues["SEF_MODE"] && propValues["SEF_MODE"].toUpperCase() == "Y")
				{
					res += "\t\t\"VARIABLE_ALIASES\" => Array(\n";

					if (this.arVA)
					{
						for (templ_key in this.arVA)
						{
							if (!this.arVA.hasOwnProperty(templ_key) || typeof(this.arVA[templ_key]) != 'object')
								continue;
							res += "\t\t\t\""+templ_key+"\" => Array(";

							cnt = 0;
							for (k in this.arVA[templ_key])
							{
								if (!this.arVA[templ_key].hasOwnProperty(k) || typeof(this.arVA[templ_key][k]) != 'string')
									continue;
								cnt++;
								res += "\n\t\t\t\t\"" + k +"\" => \"" + this.arVA[templ_key][k]+"\",";
							}

							if (cnt > 0)
							{
								lio = res.lastIndexOf(",");
								res = res.substr(0, lio) + res.substr(lio + 1);
								res += "\n\t\t\t),\n";
							}
							else
							{
								res += "),\n";
							}
						}
					}

					res += "\t\t),\n";
				}

				if (params_exist)
				{
					lio = res.lastIndexOf(",");
					res = res.substr(0, lio) + res.substr(lio + 1);
				}
				res += "\t)";
			}
			else
			{
				res += "Array()"
			}

			if (params.parentComponent !== false || params.exParams !== false)
			{
				var pc = params.parentComponent;
				if (!pc || pc.toLowerCase() == '={false}')
				{
					res += ",\nfalse";
				}
				else
				{
					if (this.IsPHPBracket(pc))
						res += ",\n" + this.TrimPHPBracket(pc);
					else
						res += ",\n'" + pc + "'";
				}

				if (params.exParams !== false && typeof params.exParams == 'object')
				{
					res += ",\nArray(";
					for (i in params.exParams)
					{
						if (params.exParams.hasOwnProperty(i) && typeof(params.exParams[i]) == 'string')
						{
							res += "\n\t'" + i + "' => '" + this.editor.util.stripslashes(params.exParams[i]) + "',";
						}
					}
					if (res.substr(res.length - 1) == ',')
						res = res.substr(0, res.length - 1) + "\n";
					res += ")";
				}
			}
			res += "\n);?>";

//			if (window.lca)
//			{
//				var key = str_pad_left(++_$compLength, 4, '0');
//				_$arComponents[key] = res;
//				return '#COMPONENT'+String(key)+'#';
//			}
//			else

			return res;
		},

		GetOnDropHtml: function(params)
		{
			var _params = {
				name: params.name
			};
			return this.GetSource(_params);
		},

		CatchVariableAliases: function(str)
		{
			var
				arRes = [], i, matchRes,
				res = str.match(/(\?|&)(.+?)=#([^#]+?)#/ig);

			if (!res)
				return arRes;

			for (i = 0; i < res.length; i++)
			{
				matchRes = res[i].match(/(\?|&)(.+?)=#([^#]+?)#/i);
				arRes[matchRes[3]] = matchRes[2];
			}
			return arRes;
		},

		LoadParamsList: function(params)
		{
			oBXComponentParamsManager.LoadComponentParams(
				{
					name: params.name,
					parent: false,
					template: '',
					exParams: false,
					currentValues: {}
				}
			);
		},

		GetComponentData: function(name)
		{
			var item = this.components.items[this.compNameIndex[name]];
			return item || {};
		},

		IsPHPBracket: function(str)
		{
			return str.substr(0, 2) =='={';
		},

		TrimPHPBracket: function(str)
		{
			return str.substr(2, str.length - 3);
		},

		OnComponentDoubleClick: function(bxTag, origTag, target, e)
		{
			if (origTag && origTag.tag == 'component')
			{
				// Show dialog
				this.ShowPropertiesDialog(origTag.params, bxTag);
			}
		},

		ShowPropertiesDialog: function(component, bxTag)
		{
			// Used to prevent influence of oBXComponentParamsManager to this array...
			var comp = BX.clone(component, 1);
			if (!this.oPropertiesDialog)
			{
				//PropertiesDialog
				this.oPropertiesDialog = this.editor.GetDialog('componentProperties', {oBXComponentParamsManager: oBXComponentParamsManager});

				BX.addCustomEvent(this.oPropertiesDialog, "OnDialogSave", BX.proxy(this.SavePropertiesDialog, this));
			}

			this.currentViewedComponentTag = bxTag;
			this.oPropertiesDialog.SetTitle(BX.message('ComponentPropsTitle').replace('#COMPONENT_NAME#', comp.name));

			this.oPropertiesDialog.SetContent('<span class="bxcompprop-wait-notice">' + BX.message('ComponentPropsWait') + '</span>');
			this.oPropertiesDialog.Show();
			if (this.oPropertiesDialog.oDialog.PARTS.CONTENT_DATA)
			{
				BX.addClass(this.oPropertiesDialog.oDialog.PARTS.CONTENT_DATA, 'bxcompprop-outer-wrap');
			}

			var _this = this;
			var pParamsContainer = BX.create("DIV");

			BX.onCustomEvent(oBXComponentParamsManager, 'OnComponentParamsDisplay',
			[{
				name: comp.name,
				parent: !!comp.parentComponent,
				template: comp.template,
				exParams: comp.exParams,
				currentValues: comp.params,
				container: pParamsContainer,
				siteTemplate: this.editor.GetTemplateId(),
				callback: function(params, container){
					_this.PropertiesDialogCallback(params, container);
				}
			}]);
		},

		PropertiesDialogCallback: function(params, container)
		{
			if (this.oPropertiesDialog.oDialog.PARTS.CONTENT_DATA)
				BX.addClass(this.oPropertiesDialog.oDialog.PARTS.CONTENT_DATA, 'bxcompprop-outer-wrap');
			this.oPropertiesDialog.SetContent(container);

			var size = this.oPropertiesDialog.GetContentSize();
			BX.onCustomEvent(oBXComponentParamsManager, 'OnComponentParamsResize', [
				size.width,
				size.height
			]);
		},

		SavePropertiesDialog: function()
		{
			var
				ddBxTag = this.currentViewedComponentTag,
				compBxTag = this.editor.GetBxTag(ddBxTag.params.origId),
				currentValues = oBXComponentParamsManager.GetParamsValues(),
				template = oBXComponentParamsManager.GetTemplateValue();

			ddBxTag.params.origParams.params = compBxTag.params.params = currentValues;
			ddBxTag.params.origParams.template = compBxTag.params.template = template;

			this.editor.synchro.FullSyncFromIframe();
		},

		ReloadList: function()
		{
			var _this = this;
			this.editor.Request({
				getData: this.editor.GetReqData('load_components_list',
					{
						site_template: this.editor.GetTemplateId()
					}
				),
				handler: function(res)
				{
					_this.components = _this.editor.config.components = res;
					_this.HandleList();
					_this.editor.componentsTaskbar.BuildTree(_this.components.groups, _this.components.items);
				}
			});
		},

		SetComponentIcludeMethod: function(method)
		{
			this.componentIncludeMethod = method;
		}
	};

	function __runcomp()
	{
		window.BXHtmlEditor.BXEditorComponents = BXEditorComponents;

		function PropertiesDialog(editor, params)
		{
			params = params || {};
			params.id = 'bx_component_properties';
			params.height = 600;
			params.width =  800;
			params.resizable = true;
			this.oBXComponentParamsManager = params.oBXComponentParamsManager;

			this.id = 'components_properties';

			// Call parrent constructor
			PropertiesDialog.superclass.constructor.apply(this, [editor, params]);

			BX.addClass(this.oDialog.DIV, "bxcompprop-dialog");
			BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
		}
		BX.extend(PropertiesDialog, window.BXHtmlEditor.Dialog);

		PropertiesDialog.prototype.OnResize = function()
		{
			var
				w = this.oDialog.PARTS.CONTENT_DATA.offsetWidth,
				h = this.oDialog.PARTS.CONTENT_DATA.offsetHeight;

			BX.onCustomEvent(this.oBXComponentParamsManager, 'OnComponentParamsResize', [w, h]);
		};

		PropertiesDialog.prototype.OnResizeFinished = function()
		{
		};

		window.BXHtmlEditor.dialogs.componentProperties = PropertiesDialog;
	}

	if (window.BXHtmlEditor && window.BXHtmlEditor.dialogs)
		__runcomp();
	else
		BX.addCustomEvent(window, "OnEditorBaseControlsDefined", __runcomp);

})();
/* End */
;
; /* Start:/bitrix/js/fileman/html_editor/html-snippets.js*/
/**
 * Bitrix HTML Editor 3.0
 * Date: 24.04.13
 * Time: 4:23
 *
 * Snippets class
 */
(function()
{
function __runsnips()
{
	function BXEditorSnippets(editor)
	{
		this.editor = editor;
		this.listLoaded = false;
		this.snippets = this.editor.config.snippets;
		this.HandleList();
		this.Init();
	}

	BXEditorSnippets.prototype = {
		Init: function()
		{
			BX.addCustomEvent(this.editor, "OnApplySiteTemplate", BX.proxy(this.OnTemplateChanged, this));
		},

		SetSnippets: function(snippets)
		{
			this.snippets =
				this.editor.config.snippets =
					this.editor.snippetsTaskbar.snippets = snippets;
			this.HandleList();
		},

		GetList: function()
		{
			return this.snippets[this.editor.GetTemplateId()];
		},

		HandleList: function()
		{
			var
				i,
				items = this.GetList().items;
			if (items)
			{
				for (i in items)
				{
					if (items.hasOwnProperty(i))
					{
						items[i].key = items[i].path.replace('/', ',');
					}
				}
			}
		},

		ReloadList: function(clearCache)
		{
			this.editor.snippetsTaskbar.ClearSearchResult();
			var _this = this;
			this.editor.Request({
				getData: this.editor.GetReqData('load_snippets_list',
					{
						site_template: this.editor.GetTemplateId(),
						clear_cache: clearCache ? 'Y' : 'N'
					}
				),
				handler: function(res)
				{
					if (res.result)
					{
						_this.SetSnippets(res.snippets);
						_this.RebuildAll();
					}
				}
			});
		},

		FetchPlainListOfCategories: function(list, level, result)
		{
			var i, l = list.length;
			for (i = 0; i < l; i++)
			{
				result.push({
					level: level,
					key: list[i].key,
					section: list[i].section
				});

				if (list[i].children && list[i].children.length > 0)
				{
					this.FetchPlainListOfCategories(list[i].children, level + 1, result);
				}
			}
		},

		AddNewCategory: function(params)
		{
			var _this = this;
			this.editor.Request({
				getData: this.editor.GetReqData('snippet_add_category',
					{
						site_template: this.editor.GetTemplateId(),
						category_name: params.name,
						category_parent: params.parent
					}
				),
				handler: function(res)
				{
					if (res.result)
					{
						_this.SetSnippets(res.snippets);
						_this.RebuildAll();
					}
				}
			});
		},

		RemoveCategory: function(params)
		{
			var _this = this;
			this.editor.Request({
				getData: this.editor.GetReqData('snippet_remove_category',
					{
						site_template: this.editor.GetTemplateId(),
						category_path: params.path
					}
				),
				handler: function(res)
				{
					if (res.result)
					{
						_this.SetSnippets(res.snippets);
						_this.RebuildAll();
					}
				}
			});
		},

		RenameCategory: function(params)
		{
			var _this = this;
			this.editor.Request({
				getData: this.editor.GetReqData('snippet_rename_category',
					{
						site_template: this.editor.GetTemplateId(),
						category_path: params.path,
						category_new_name: params.newName
					}
				),
				handler: function(res)
				{
					if (res.result)
					{
						_this.SetSnippets(res.snippets);
						_this.RebuildAll();
					}
				}
			});
		},

		SaveSnippet: function(params)
		{
			var _this = this;
			this.editor.Request({
				postData: this.editor.GetReqData('edit_snippet',
					{
						site_template: this.editor.GetTemplateId(),
						path: params.path.replace(',', '/'),
						name: params.name,
						code: params.code,
						description: params.description,
						current_path: params.currentPath
					}
				),
				handler: function(res)
				{
					if (res.result)
					{
						_this.SetSnippets(res.snippets);
						_this.RebuildAll();
					}
				}
			});
		},

		RemoveSnippet: function(params)
		{
			var _this = this;
			this.editor.Request({
				getData: this.editor.GetReqData('remove_snippet',
					{
						site_template: this.editor.GetTemplateId(),
						path: params.path.replace(',', '/')
					}
				),
				handler: function(res)
				{
					if (res.result)
					{
						_this.SetSnippets(res.snippets);
						_this.RebuildAll();
					}
				}
			});
		},

		RebuildAll: function()
		{
			var snippetsCategories = this.editor.GetDialog('snippetsCategories');
			if (snippetsCategories && snippetsCategories.IsOpen())
			{
				snippetsCategories.DisplayAddForm(false);
				snippetsCategories.BuildTree(this.GetList().groups);
			}

			// Build structure
			if (this.snippets[this.editor.GetTemplateId()] && this.editor.snippetsTaskbar)
			{
				this.editor.snippetsTaskbar.BuildTree(this.snippets[this.editor.GetTemplateId()].groups, this.snippets[this.editor.GetTemplateId()].items);
			}

			var editSnippet = this.editor.GetDialog('editSnippet');
			if (editSnippet && editSnippet.IsOpen())
			{
				editSnippet.SetCategories();
			}
		},

		OnTemplateChanged: function(templateId)
		{
			this.ReloadList(false);
		}
	};

	function SnippetsControl(editor)
	{
		// Call parrent constructor
		SnippetsControl.superclass.constructor.apply(this, arguments);

		this.id = 'snippets';
		this.snippets = this.editor.config.snippets;
		this.templateId = this.editor.templateId;
		this.title = BX.message('BXEdSnippetsTitle');
		this.searchPlaceholder = BX.message('BXEdSnipSearchPlaceHolder');
		this.uniqueId = 'taskbar_' + this.editor.id + '_' + this.id;

		this.Init();
	}

	BX.extend(SnippetsControl, window.BXHtmlEditor.Taskbar);

	SnippetsControl.prototype.Init = function()
	{
		this.BuildSceleton();

		// Build structure
		if (this.snippets[this.templateId])
		{
			this.BuildTree(this.snippets[this.templateId].groups, this.snippets[this.templateId].items);
		}

		var _this = this;
		_this.editor.phpParser.AddBxNode('snippet_icon',
			{
				Parse: function(params)
				{
					return params.code || '';
				}
			}
		);
	};

	SnippetsControl.prototype.GetMenuItems = function()
	{
		var _this = this;

		var arItems = [
			{
				text : BX.message('BXEdAddSnippet'),
				title : BX.message('BXEdAddSnippet'),
				className : "",
				onclick: function()
				{
					_this.editor.GetDialog('editSnippet').Show();
					BX.PopupMenu.destroy(_this.uniqueId + "_menu");
				}
			},
			{
				text : BX.message('RefreshTaskbar'),
				title : BX.message('RefreshTaskbar'),
				className : "",
				onclick: function()
				{
					_this.editor.snippets.ReloadList(true);
					BX.PopupMenu.destroy(_this.uniqueId + "_menu");
				}
			},
			{
				text : BX.message('BXEdManageCategories'),
				title : BX.message('BXEdManageCategories'),
				className : "",
				onclick: function()
				{
					_this.editor.GetDialog('snippetsCategories').Show();
					BX.PopupMenu.destroy(_this.uniqueId + "_menu");
				}
			}
		]
		return arItems;
	};

	SnippetsControl.prototype.HandleElementEx = function(wrap, dd, params)
	{
		this.editor.SetBxTag(dd, {tag: "snippet_icon", params: params});
		wrap.title = params.description || params.title;

		var editBut = wrap.appendChild(BX.create("SPAN", {props: {className: "bxhtmled-right-side-item-edit-btn", title: BX.message('BXEdSnipEdit')}}));
		this.editor.SetBxTag(editBut, {tag: "_snippet", params: params});

		BX.bind(editBut, 'mousedown', BX.proxy(this.EditSnippet, this));
	};

	SnippetsControl.prototype.EditSnippet = function(e)
	{
		var target = e.target || e.srcElement;

		function _editDeactivate()
		{
			BX.removeClass(target, 'bxhtmled-right-side-item-edit-btn-active');
			BX.unbind(document, 'mouseup', _editDeactivate);
		}

		BX.addClass(target, 'bxhtmled-right-side-item-edit-btn-active');
		BX.bind(document, 'mouseup', _editDeactivate);

		this.editor.GetDialog('editSnippet').Show(target);
		return BX.PreventDefault(e);
	};

	SnippetsControl.prototype.BuildTree = function(sections, elements)
	{
		// Call parent method
		SnippetsControl.superclass.BuildTree.apply(this, arguments);
		if ((!sections || sections.length == 0) && (!elements || elements.length == 0))
		{
			this.pTreeCont.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-no-snip'}, text: BX.message('BXEdSnipNoSnippets')}));
		}
	};

	function EditSnippetDialog(editor, params)
	{
		params = params || {};
		params.id = 'bx_edit_snippet';
		params.width =  600;
		this.zIndex = 3007;
		this.id = 'edit_snippet';

		// Call parrent constructor
		EditSnippetDialog.superclass.constructor.apply(this, [editor, params]);
		this.SetContent(this.Build());
		BX.addClass(this.oDialog.DIV, "bx-edit-snip-dialog");
		BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(EditSnippetDialog, window.BXHtmlEditor.Dialog);

	EditSnippetDialog.prototype.Save = function()
	{
		this.editor.snippets.SaveSnippet(
			{
				path: this.pCatSelect.value,
				name: this.pName.value,
				code: this.pCode.value,
				description: this.pDesc.value,
				currentPath: this.currentPath
			}
		);
	};

	EditSnippetDialog.prototype.Build = function()
	{
		this.pCont = BX.create('DIV', {props: {className: 'bxhtmled-edit-snip-cnt'}});

		function addRow(tbl, c1Par, bAdditional)
		{
			var r, c1, c2;

			r = tbl.insertRow(-1);
			if (bAdditional)
			{
				r.className = 'bxhtmled-add-row';
			}

			c1 = r.insertCell(-1);
			c1.className = 'bxhtmled-left-c';

			if (c1Par && c1Par.label)
			{
				c1.appendChild(BX.create('LABEL', {props: {className: c1Par.required ? 'bxhtmled-req' : ''},text: c1Par.label})).setAttribute('for', c1Par.id);
			}

			c2 = r.insertCell(-1);
			c2.className = 'bxhtmled-right-c';
			return {row: r, leftCell: c1, rightCell: c2};
		}

		this.arTabs = [
			{
				id: 'base',
				name: BX.message('BXEdSnipBaseSettings')
			},
			{
				id: 'additional',
				name: BX.message('BXEdSnipAddSettings')
			}
		];


		var res = this.BuildTabControl(this.pCont, this.arTabs);
		this.arTabs = res.tabs;

		// Base params
		var
			_this = this,
			r, c,
			pBaseTbl = BX.create('TABLE', {props: {className: 'bxhtmled-dialog-tbl'}}),
			pAddTbl = BX.create('TABLE', {props: {className: 'bxhtmled-dialog-tbl'}});

		// Name
		r = addRow(pBaseTbl, {label: BX.message('BXEdSnipName') + ':', id: this.id + '-name', required: true});
		this.pName = r.rightCell.appendChild(BX.create('INPUT', {props:
		{
			type: 'text',
			id: this.id + '-name',
			placeholder: BX.message('BXEdSnipNamePlaceHolder')
		}}));

		// Code
		r = addRow(pBaseTbl, {label: BX.message('BXEdSnipCode') + ':', id: this.id + '-code', required: true});
		this.pCode = r.rightCell.appendChild(BX.create('TEXTAREA', {
			props:
			{
				id: this.id + '-code',
				placeholder: BX.message('BXEdSnipCodePlaceHolder')
			},
			style:
			{
				height: '250px'
			}
		}));
		this.arTabs[0].cont.appendChild(pBaseTbl);

		//r.className = 'bxhtmled-add-row';
		//c1.className = 'bxhtmled-left-c';


		//BX.bind(this.pCatSelect, "change", BX.proxy(this.ChangeCat, this));

		// Additional params
		// Site templatesnippet_remove_category
//		r = addRow(pAddTbl, {label: BX.message('BXEdSnipSiteTemplate') + ':', id: this.id + '-template'});
//		this.pTemplate = r.rightCell.appendChild(BX.create('SELECT', {props:
//		{
//			id: this.id + '-template'
//		}}));

		// File name
//		r = addRow(pAddTbl, {label: BX.message('BXEdSnipFileName') + ':', id: this.id + '-file-name'});
//		this.pFileName = r.rightCell.appendChild(BX.create('INPUT', {props:
//			{
//				type: 'text',
//				id: this.id + '-file-name'
//			},
//			style: {
//				width: '150px',
//				textAlign: 'right'
//			}
//		}));
//		r.rightCell.appendChild(document.createTextNode(' .snp'));

		// Category
		r = addRow(pAddTbl, {label: BX.message('BXEdSnipCategory') + ':', id: this.id + '-category'});
		this.pCatSelect = r.rightCell.appendChild(BX.create('SELECT', {
			props: {
				id: this.id + '-category'
			},
			style: {
				maxWidth: '280px'
			}
		}));
		this.pCatManageBut = r.rightCell.appendChild(BX.create('INPUT', {props:
		{
			className: 'bxhtmled-manage-cat',
			type: 'button',
			value: '...',
			title: BX.message('BXEdManageCategories')
		}}));
		this.pCatManageBut.onclick = function()
		{
			_this.editor.GetDialog('snippetsCategories').Show();
		};

		// Description
		r = addRow(pAddTbl, {label: BX.message('BXEdSnipDescription') + ':', id: this.id + '-hint'});
		this.pDesc = r.rightCell.appendChild(BX.create('TEXTAREA', {props:
		{
			id: this.id + '-hint',
			placeholder: BX.message('BXEdSnipDescriptionPlaceholder')
		}}));
		this.arTabs[1].cont.appendChild(pAddTbl);

		// Delete button
		r = BX.adjust(pAddTbl.insertRow(-1), {style: {display: 'none'}});
		c = BX.adjust(r.insertCell(-1), {props: {className: 'bxhtmled--centr-c'}, attrs: {colsPan: 2}});
		c.appendChild(BX.create("INPUT", {
			props:{className: '', type: 'button', value: BX.message('BXEdSnipRemove')},
			events: {
				'click' : function()
				{
					if (confirm(BX.message('BXEdSnipRemoveConfirm')))
					{
						_this.editor.snippets.RemoveSnippet({path: _this.currentPath});
						_this.Close();
					}
				}
			}
		}));
		this.delSnipRow = r;

		return this.pCont;
	};

	EditSnippetDialog.prototype.Show = function(snippetNode)
	{
		this.SetTitle(BX.message('BXEdEditSnippetDialogTitle'));
		this.SetCategories();

		var
			params = {},
			bxTag = this.editor.GetBxTag(snippetNode),
			bNew = !bxTag || !bxTag.tag;

		if (!bNew)
		{
			params = bxTag.params;
			this.currentPath = (params.path == '' ? '' : params.path.replace(',', '/') + '/') + params.name;
			this.delSnipRow.style.display = '';
		}
		else
		{
			this.currentPath = '';
			this.delSnipRow.style.display = 'none';
		}

		this.pName.value = params.title || '';
		this.pCode.value = params.code || '';
		this.pDesc.value = params.description || '';
		this.pCatSelect.value = params.key || '';

		// Call parrent Dialog.Show()
		EditSnippetDialog.superclass.Show.apply(this, arguments);
	};

	EditSnippetDialog.prototype.SetCategories = function()
	{
		// Clear select
		this.pCatSelect.options.length = 0;
		this.pCatSelect.options.add(new Option(BX.message('BXEdSnippetsTitle'), '', true, true));

		var
			name, delim = ' . ', j, i,
			plainList = [],
			list = this.editor.snippetsTaskbar.GetSectionsTreeInfo();

		this.editor.snippets.FetchPlainListOfCategories(list, 1, plainList);

		for (i = 0; i < plainList.length; i++)
		{
			name = '';
			for (j = 0; j < plainList[i].level; j++)
			{
				name += delim;
			}
			name += plainList[i].section.name;

			this.pCatSelect.options.add(new Option(name, plainList[i].key, false, false));
		}
	};

	EditSnippetDialog.prototype.ChangeCat = function(changeFileName)
	{
		var
			defFilename = '',
			path = this.pCatSelect.value;

//		changeFileName = changeFileName !== false;
//		if (path == '')
//		{
//			defFilename = this.editor.snippets.GetList().rootDefaultFilename;
//		}
//		else
//		{
//			var section = this.editor.snippetsTaskbar.treeSectionIndex[path];
//			if (section && section.sect  && section.sect.section)
//			{
//				defFilename = section.sect.section.default_name;
//			}
//		}
//
//		if (changeFileName && defFilename)
//		{
//			this.pFileName.value = defFilename;
//		}
	};


	function SnippetsCategoryDialog(editor, params)
	{
		params = params || {};
		params.id = 'bx_snippets_cats';
		//params.height = 600;
		params.width =  400;
		params.zIndex = 3010;

		this.id = 'snippet_categories';

		// Call parrent constructor
		SnippetsCategoryDialog.superclass.constructor.apply(this, [editor, params]);
		this.SetContent(this.Build());

		this.oDialog.ClearButtons();
		this.oDialog.SetButtons([this.oDialog.btnClose]);

		BX.addClass(this.oDialog.DIV, "bx-edit-snip-cat-dialog");
		//BX.addCustomEvent(this, "OnDialogSave", BX.proxy(this.Save, this));
	}
	BX.extend(SnippetsCategoryDialog, window.BXHtmlEditor.Dialog);

	SnippetsCategoryDialog.prototype.Save = function()
	{
	};

	SnippetsCategoryDialog.prototype.Build = function()
	{
		this.pCont = BX.create('DIV', {props: {className: 'bxhtmled-snip-cat-cnt'}});

		// Add category button & wrap
		this.pAddCatWrap = this.pCont.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-snip-cat-add-wrap'}}));
		this.pAddCatBut = this.pAddCatWrap.appendChild(BX.create('SPAN', {props: {className: 'bxhtmled-snip-cat-add-but'}, text: BX.message('BXEdSnipCatAdd')}));
		BX.bind(this.pAddCatBut, 'click', BX.proxy(this.DisplayAddForm, this));

		var tbl = this.pAddCatWrap.appendChild(BX.create('TABLE', {props: {className: 'bxhtmled-snip-cat-add-tbl'}}));
		var r, c;
		r = tbl.insertRow(-1);
		c = r.insertCell(-1);
		c.className = 'bxhtmled-left-c';
		c.appendChild(BX.create('LABEL', {props: {className: 'bxhtmled-req'}, attrs: {'for': this.id + '-cat-name'}, text: BX.message('BXEdSnipCatAddName') + ':'}));

		c = r.insertCell(-1);
		c.className = 'bxhtmled-right-c';
		this.pCatName = c.appendChild(BX.create('INPUT', {props:
		{
			type: 'text',
			id: this.id + '-cat-name'
		}}));

		r = tbl.insertRow(-1);
		c = r.insertCell(-1);
		c.className = 'bxhtmled-left-c';
		c.appendChild(BX.create('LABEL', {props: {className: 'bxhtmled-req'}, attrs: {'for': this.id + '-cat-par'}, text: BX.message('BXEdSnipParCategory') + ':'}));

		c = r.insertCell(-1);
		c.className = 'bxhtmled-right-c';
		this.pCatPar = c.appendChild(BX.create('SELECT', {props:{id: this.id + '-cat-par'}}));

		r = tbl.insertRow(-1);
		c = r.insertCell(-1);
		c.colSpan = 2;
		c.style.textAlign = 'center';

		this.pSaveCat = c.appendChild(BX.create('INPUT', {props:
		{
			type: 'button',
			className: 'adm-btn-save bxhtmled-snip-save-but',
			value: BX.message('BXEdSnipCatAddBut')
		}}));
		BX.bind(this.pSaveCat, 'click', BX.proxy(this.AddNewCategory, this));

		// Category List
		this.pCatListWrap = this.pCont.appendChild(BX.create('DIV', {props: {className: 'bxhtmled-snip-cat-list-wrap'}}));

		return this.pCont;
	};

	SnippetsCategoryDialog.prototype.AddNewCategory = function()
	{
		this.editor.snippets.AddNewCategory({
			name: this.pCatName.value,
			parent: this.pCatPar.value,
			siteTemplate: ''
		});
	};


	SnippetsCategoryDialog.prototype.DisplayAddForm = function(bShow)
	{
		if (this.animation)
			this.animation.stop();

		if (bShow !== true && bShow !== false)
			bShow = !this.bAddCatOpened;

		bShow = bShow !== false;

		if (this.bAddCatOpened !== bShow)
		{
			if (bShow)
			{
				//jsDD.Disable();
				this.DisableKeyCheck();
				BX.bind(this.pCatName, 'keydown', BX.proxy(this.AddCatKeydown, this));

				this.SetParentCategories();
				this.animationStartHeight = 25;
				this.animationEndHeight = 160;
				BX.focus(this.pCatName);
			}
			else
			{
				//jsDD.Enable();
				this.EnableKeyCheck();
				BX.unbind(this.pCatName, 'keydown', BX.proxy(this.AddCatKeydown, this));
				this.animationStartHeight = 160;
				this.animationEndHeight = 25;
			}

			var _this = this;
			this.animation = new BX.easing({
				duration : 300,
				start : {height: this.animationStartHeight},
				finish : {height: this.animationEndHeight},
				transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),

				step : function(state)
				{
					_this.pAddCatWrap.style.height = state.height + 'px';
				},

				complete : BX.proxy(function()
				{
					this.animation = null;
				}, this)
			});

			this.animation.animate();
			this.bAddCatOpened = bShow;
		}
		this.ResetAddCategoryForm();
	};

	SnippetsCategoryDialog.prototype.SetParentCategories = function()
	{
		// Clear select
		this.pCatPar.options.length = 0;
		this.pCatPar.options.add(new Option(BX.message('BXEdSnippetsTitle'), '', true, true));

		var
			name, delim = ' . ', j, i,
			plainList = [],
			list = this.editor.snippetsTaskbar.GetSectionsTreeInfo();

		this.editor.snippets.FetchPlainListOfCategories(list, 1, plainList);

		for (i = 0; i < plainList.length; i++)
		{
			if (plainList[i].level < 2)
			{
				name = '';
				for (j = 0; j < plainList[i].level; j++)
				{
					name += delim;
				}
				name += plainList[i].section.name;

				this.pCatPar.options.add(new Option(name, plainList[i].key, false, false));
			}
		}
	};

	SnippetsCategoryDialog.prototype.Show = function()
	{
		this.SetTitle(BX.message('BXEdManageCategoriesTitle'));

		this.BuildTree(this.editor.snippets.GetList().groups);
		this.bAddCatOpened = false;
		this.pAddCatWrap.style.height = '';

		// Call parrent Dialog.Show()
		SnippetsCategoryDialog.superclass.Show.apply(this, arguments);
	};

	SnippetsCategoryDialog.prototype.BuildTree = function(sections)
	{
		BX.cleanNode(this.pCatListWrap);
		this.catIndex = {};
		//this.sections = [];
		for (var i = 0; i < sections.length; i++)
		{
			this.BuildCategory(sections[i]);
		}
	};

	SnippetsCategoryDialog.prototype.BuildCategory = function(section)
	{
		var
			_this = this,
			parentCont = this.GetCategoryContByPath(section.path),
			pGroup = BX.create("DIV", {props: {className: "bxhtmled-tskbr-sect-outer"}}),
			pGroupTitle = pGroup.appendChild(BX.create("DIV", {props: {className: "bxhtmled-tskbr-sect"}})),
			icon = pGroupTitle.appendChild(BX.create("SPAN", {props: {className: "bxhtmled-tskbr-sect-icon bxhtmled-tskbr-sect-icon-open"}})),
			title = pGroupTitle.appendChild(BX.create("SPAN", {props: {className: "bxhtmled-tskbr-sect-title"}, text: section.title || section.name})),
			renameInput = pGroupTitle.appendChild(BX.create("INPUT", {props: {
				type: 'text',
				className: "bxhtmled-tskbr-name-input"
			}})),
			childCont = pGroup.appendChild(BX.create("DIV", {props: {className: "bxhtmled-tskb-child"}, style: {display: "block"}})),
			pIconEdit = pGroupTitle.appendChild(BX.create("SPAN", {props: {className: "bxhtmled-right-side-item-edit-btn", title: BX.message('BXEdSnipCatEdit')}})),
			pIconDel = pGroupTitle.appendChild(BX.create("SPAN", {props: {className: "bxhtmled-right-side-item-del-btn", title: BX.message('BXEdSnipCatDelete')}}));

		BX.bind(pIconDel, 'mousedown', BX.proxy(this.DisableDD(), this));
		BX.bind(pIconEdit, 'mousedown', BX.proxy(this.DisableDD(), this));
		BX.bind(renameInput, 'mousedown', BX.proxy(this.DisableDD(), this));

		// Drop category
		BX.bind(pIconDel, 'click', function()
			{
				if (confirm(BX.message('BXEdDropCatConfirm')))
				{
					var path = section.path == '' ? section.name : section.path + '/' + section.name;
					_this.editor.snippets.RemoveCategory({path: path});
				}
			}
		);

		// Rename category
		BX.bind(pIconEdit, 'click', function()
			{
				_this.ShowRename(true, section, renameInput, pGroupTitle);
			}
		);

		childCont.style.display = 'block';

		var key = section.path == '' ? section.name : section.path + ',' + section.name;
		var depth = section.path == '' ? 0 : 1;

		var sect = {
			key: key,
			children: [],
			section: section
		};

		this.catIndex[key] = {
			icon: icon,
			outerCont: pGroup,
			cont: pGroupTitle,
			childCont: childCont,
			sect: sect
		};

		if (depth > 0)
		{
			BX.addClass(pGroupTitle, "bxhtmled-tskbr-sect-" + depth);
			BX.addClass(icon, "bxhtmled-tskbr-sect-icon-" + depth);
		}

		this.InitDragDrop({
			group: pGroupTitle
		});
//		pGroup.setAttribute('data-bx-type', 'taskbargroup');
//		pGroup.setAttribute('data-bx-path', key);
//		pGroup.setAttribute('data-bx-taskbar', this.id);

		parentCont.appendChild(pGroup);
	};

	SnippetsCategoryDialog.prototype.ShowRename = function(bShow, section, renameInput, pGroupTitle)
	{
		bShow = bShow !== false;
		if (bShow)
		{
			BX.addClass(pGroupTitle, 'bxhtmled-tskbr-sect-rename');
			this.currentRenamedCat = {
				section: section,
				renameInput: renameInput,
				pGroupTitle: pGroupTitle
			};
			renameInput.value = section.name;
			//jsDD.Disable();
			this.DisableKeyCheck();
			BX.bind(renameInput, 'keydown', BX.proxy(this.RenameKeydown, this));
			BX.focus(renameInput);
			renameInput.select();
		}
		else
		{
			BX.removeClass(pGroupTitle, 'bxhtmled-tskbr-sect-rename');
			BX.unbind(renameInput, 'keydown', BX.proxy(this.RenameKeydown, this));
			//jsDD.Enable();
			this.EnableKeyCheck();
			this.currentRenamedCat = false;
		}
	};

	SnippetsCategoryDialog.prototype.RenameKeydown = function(e)
	{
		if (e && this.currentRenamedCat)
		{
			if (e.keyCode == this.editor.KEY_CODES['escape'])
			{
				this.ShowRename(false, this.currentRenamedCat.section, this.currentRenamedCat.renameInput, this.currentRenamedCat.pGroupTitle);
				BX.PreventDefault(e);
			}
			else if (e.keyCode == this.editor.KEY_CODES['enter'])
			{
				var
					newName = BX.util.trim(this.currentRenamedCat.renameInput.value),
					section = this.currentRenamedCat.section,
					path = section.path == '' ? section.name : section.path + '/' + section.name;

				if (newName !== '')
				{
					this.editor.snippets.RenameCategory(
					{
						path: path,
						newName: newName
					});
				}
				this.ShowRename(false, this.currentRenamedCat.section, this.currentRenamedCat.renameInput, this.currentRenamedCat.pGroupTitle);
				BX.PreventDefault(e);
			}
		}
	};

	SnippetsCategoryDialog.prototype.AddCatKeydown = function(e)
	{
		if (e && this.bAddCatOpened)
		{
			if (e.keyCode == this.editor.KEY_CODES['escape'])
			{
				this.DisplayAddForm(false);
				BX.PreventDefault(e);
			}
			else if (e.keyCode == this.editor.KEY_CODES['enter'])
			{
				this.AddNewCategory();
				BX.PreventDefault(e);
			}
		}
	};

	SnippetsCategoryDialog.prototype.DisableDD = function()
	{
		jsDD.Disable();
		BX.bind(document, 'mouseup', BX.proxy(this.EnableDD, this));
	};

	SnippetsCategoryDialog.prototype.EnableDD = function()
	{
		jsDD.Enable();
		BX.unbind(document, 'mouseup', BX.proxy(this.EnableDD, this));
	};

	SnippetsCategoryDialog.prototype.InitDragDrop = function(params)
	{
		// TODO: Do correct drag & drop + sorting of categories
		return;
		var
			_this = this,
			obj = params.group;
		jsDD.registerObject(obj);

		obj.style.cursor = 'move';
		obj.onbxdragstart = function()
		{
			_this.dragCat = obj.cloneNode(true);
			BX.addClass(obj, 'bxhtmled-tskbr-sect-old');
			BX.addClass(_this.dragCat, 'bxhtmled-tskbr-sect-drag');
			document.body.appendChild(_this.dragCat);
			_this.dragCat.style.top = '-1000px';
			_this.dragCat.style.left = '-1000px';
		};

		obj.onbxdrag = function(x, y)
		{
			if (_this.dragCat)
			{
				_this.dragCat.style.left = (x - 20) + 'px';
				_this.dragCat.style.top = (y - 10) + 'px';
			}
		};

		obj.onbxdragstop = function(x, y)
		{
			if (_this.dragCat)
			{
				setTimeout(function()
				{
					BX.remove(_this.dragCat);
					_this.dragCat = null;
				}, 100);
			}
			_this.OnDragFinish();
		};

		obj.onbxdragfinish = function(destination, x, y)
		{
			_this.OnDragFinish();
			return true;
		};

		jsDD.registerDest(obj);


		obj.onbxdestdragfinish = function(currentNode, x, y)
		{
			var
				pos = BX.pos(obj),
				beforeNode = y < pos.top + pos.height / 2;

			if (beforeNode)
			{
				BX.addClass(obj, 'bxhtmled-tskbr-sect-dest-top');
				BX.removeClass(obj, 'bxhtmled-tskbr-sect-dest-bottom');
			}
			else
			{
				BX.addClass(obj, 'bxhtmled-tskbr-sect-dest-bottom');
				BX.removeClass(obj, 'bxhtmled-tskbr-sect-dest-top');
			}

			return true;
		};

		obj.onbxdestdraghover = function(currentNode, x, y)
		{
			var pos = BX.pos(obj);
			if (y < pos.top + pos.height / 2)
			{
				BX.addClass(obj, 'bxhtmled-tskbr-sect-dest-top');
				BX.removeClass(obj, 'bxhtmled-tskbr-sect-dest-bottom');
			}
			else
			{
				BX.addClass(obj, 'bxhtmled-tskbr-sect-dest-bottom');
				BX.removeClass(obj, 'bxhtmled-tskbr-sect-dest-top');
			}
		};
		obj.onbxdestdraghout = function(currentNode, x, y)
		{
			BX.removeClass(obj, 'bxhtmled-tskbr-sect-dest-bottom');
			BX.removeClass(obj, 'bxhtmled-tskbr-sect-dest-top');
		};
	};

	SnippetsCategoryDialog.prototype.OnDragFinish = function()
	{
	};


	SnippetsCategoryDialog.prototype.GetCategoryContByPath = function(path)
	{
		if (path == '' || !this.catIndex[path])
		{
			return this.pCatListWrap;
		}
		else
		{
			return this.catIndex[path].childCont;
		}
	};

	SnippetsCategoryDialog.prototype.ResetAddCategoryForm = function(path)
	{
		this.pCatName.value = '';
		this.pCatPar.value = '';
	};


	window.BXHtmlEditor.SnippetsControl = SnippetsControl;
	window.BXHtmlEditor.BXEditorSnippets = BXEditorSnippets;
	window.BXHtmlEditor.dialogs.editSnippet = EditSnippetDialog;
	window.BXHtmlEditor.dialogs.snippetsCategories = SnippetsCategoryDialog;
}

	if (window.BXHtmlEditor && window.BXHtmlEditor.dialogs)
		__runsnips();
	else
		BX.addCustomEvent(window, "OnEditorBaseControlsDefined", __runsnips);

})();
/* End */
;
; /* Start:/bitrix/js/fileman/html_editor/html-editor.js*/
	/**
	 * Bitrix HTML Editor 3.0
	 * Date: 24.04.13
	 * Time: 4:23
	 */
	(function() {
		var __BXHtmlEditorParserRules;

	function BXEditor(config)
	{
		// Container contains links to dom elements
		this.InitUtil();
		this.dom = {
			// cont -
			// iframeCont -
			// textareaCont -
			// iframe -
			// textarea -
		};

		this.bxTags = {};

		this.EMPTY_IMAGE_SRC = '/bitrix/images/1.gif';
		this.HTML5_TAGS = [
			"abbr", "article", "aside", "audio", "bdi", "canvas", "command", "datalist", "details", "figcaption",
			"figure", "footer", "header", "hgroup", "keygen", "mark", "meter", "nav", "output", "progress",
			"rp", "rt", "ruby", "svg", "section", "source", "summary", "time", "track", "video", "wbr"
		];
		this.BLOCK_TAGS = ["H1", "H2", "H3", "H4", "H5", "H6", "P", "BLOCKQUOTE", "DIV", "SECTION", "PRE"];
		this.NESTED_BLOCK_TAGS = ["BLOCKQUOTE", "DIV"];
		this.TABLE_TAGS = ["TD", "TR", "TH", "TABLE", "TBODY", "CAPTION", "COL", "COLGROUP", "TFOOT", "THEAD"];

		this.BBCODE_TAGS = ['U', 'TABLE', 'TR', 'TD', 'TH', 'IMG', 'A', 'CENTER', 'LEFT', 'RIGHT', 'JUSTIFY'];
		//this.BBCODE_TAGS = ['P', 'U', 'DIV', 'TABLE', 'TR', 'TD', 'TH', 'IMG', 'A', 'CENTER', 'LEFT', 'RIGHT', 'JUSTIFY'];

		this.HTML_ENTITIES = ['&iexcl;','&cent;','&pound;','&curren;','&yen;','&brvbar;','&sect;','&uml;','&copy;','&ordf;','&laquo;','&not;','&reg;','&macr;','&deg;','&plusmn;','&sup2;','&sup3;','&acute;','&micro;','&para;','&middot;','&cedil;','&sup1;','&ordm;','&raquo;','&frac14;','&frac12;','&frac34;','&iquest;','&Agrave;','&Aacute;','&Acirc;','&Atilde;','&Auml;','&Aring;','&AElig;','&Ccedil;','&Egrave;','&Eacute;','&Ecirc;','&Euml;','&Igrave;','&Iacute;','&Icirc;','&Iuml;','&ETH;','&Ntilde;','&Ograve;','&Oacute;','&Ocirc;','&Otilde;','&Ouml;','&times;','&Oslash;','&Ugrave;','&Uacute;','&Ucirc;','&Uuml;','&Yacute;','&THORN;','&szlig;','&agrave;','&aacute;','&acirc;','&atilde;','&auml;','&aring;','&aelig;','&ccedil;','&egrave;','&eacute;','&ecirc;','&euml;','&igrave;','&iacute;','&icirc;','&iuml;','&eth;','&ntilde;','&ograve;','&oacute;','&ocirc;','&otilde;','&ouml;','&divide;','&oslash;','&ugrave;','&uacute;','&ucirc;','&uuml;','&yacute;','&thorn;','&yuml;','&OElig;','&oelig;','&Scaron;','&scaron;','&Yuml;','&circ;','&tilde;','&ndash;','&mdash;','&lsquo;','&rsquo;','&sbquo;','&ldquo;','&rdquo;','&bdquo;','&dagger;','&Dagger;','&permil;','&lsaquo;','&rsaquo;','&euro;','&Alpha;','&Beta;','&Gamma;','&Delta;','&Epsilon;','&Zeta;','&Eta;','&Theta;','&Iota;','&Kappa;','&Lambda;','&Mu;','&Nu;','&Xi;','&Omicron;','&Pi;','&Rho;','&Sigma;','&Tau;','&Upsilon;','&Phi;','&Chi;','&Psi;','&Omega;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigmaf;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&bull;','&hellip;','&prime;','&Prime;','&oline;','&frasl;','&trade;','&larr;','&uarr;','&rarr;','&darr;','&harr;','&part;','&sum;','&minus;','&radic;','&infin;','&int;','&asymp;','&ne;','&equiv;','&le;','&ge;','&loz;','&spades;','&clubs;','&hearts;'];

		if(!BX.browser.IsIE())
		{
			this.HTML_ENTITIES = this.HTML_ENTITIES.concat(['&thetasym;','&upsih;','&piv;','&weierp;','&image;','&real;','&alefsym;','&crarr;','&lArr;','&uArr;','&rArr;','&dArr;','&hArr;','&forall;','&exist;','&empty;','&nabla;','&isin;','&notin;','&ni;','&prod;','&lowast;','&prop;','&ang;','&and;','&or;','&cap;','&cup;','&there4;','&sim;','&cong;','&sub;','&sup;','&nsub;','&sube;','&supe;','&oplus;','&otimes;','&perp;','&sdot;','&lceil;','&rceil;','&lfloor;','&rfloor;','&lang;','&rang;','&diams;']);
		}

		this.SHORTCUTS = {
			"66": "bold", // B
			"73": "italic", // I
			"85": "underline" // U
		};

		this.KEY_CODES = {
			'backspace': 8,
			'enter': 13,
			'escape': 27,
			'space': 32,
			'delete': 46,
			'left': 37,
			'right': 39,
			'up': 38,
			'down': 40,
			'z': 90,
			'y': 89,
			'shift': 16,
			'ctrl': 17,
			'alt': 18,
			'cmd': 91, // 93, 224, 17 Browser dependent
			'cmdRight': 93 // 93, 224, 17 Browser dependent?
		};
		this.INVISIBLE_SPACE = "\uFEFF";
		this.INVISIBLE_CURSOR = "\u2060";
		this.NORMAL_WIDTH = 1020;
		this.MIN_WIDTH = 700;
		this.MIN_HEIGHT = 100;

		this.MAX_HANDLED_FORMAT_LENGTH = 50000; // Max length of code which will be formated
		this.MAX_HANDLED_FORMAT_TIME = 500;
		this.iframeCssText = ''; // Here some controls can add additional css

		this.Init(this.CheckConfig(config));
	}

	BXEditor.prototype = {
		Init: function(config)
		{
			this.config = config;
			this.id = this.config.id;
			this.dialogs = {};
			this.bbCode = !!this.config.bbCode;
			this.config.splitVertical = !!this.config.splitVertical;
			this.config.splitRatio = parseFloat(this.config.splitRatio);
			this.config.view = this.config.view || 'wysiwyg';
			this.config.taskbarShown = !!this.config.taskbarShown;
			this.config.taskbarWidth = parseInt(this.config.taskbarWidth);
			this.config.showNodeNavi = this.config.showNodeNavi !== false;
			this.config.setFocusAfterShow = this.config.setFocusAfterShow !== false;
			this.cssCounter = 0;
			this.iframeCssText = this.config.iframeCss;

			if (this.config.bbCodeTags && this.bbCode)
			{
				this.BBCODE_TAGS = this.config.bbCodeTags;
			}

			if (this.config.minBodyWidth)
				this.MIN_WIDTH = parseInt(this.config.minBodyWidth);
			if (this.config.minBodyHeight)
				this.MIN_HEIGHT = parseInt(this.config.minBodyHeight);
			if (this.config.normalBodyWidth)
				this.NORMAL_WIDTH = parseInt(this.config.normalBodyWidth);

			if (this.config.smiles)
			{
				this.smilesIndex = {};
				this.sortedSmiles = [];

				var i, smile, j, arCodes;
				for(i = 0; i < this.config.smiles.length; i++)
				{
					smile = this.config.smiles[i];
					if (!smile['codes'] || smile['codes'] == smile['code'])
					{
						this.smilesIndex[this.config.smiles[i].code] = smile;
						this.sortedSmiles.push(smile);
					}
					else if(smile['codes'].length > 0)
					{
						arCodes = smile['codes'].split(' ');
						for(j = 0; j < arCodes.length; j++)
						{
							this.smilesIndex[arCodes[j]] = smile;
							this.sortedSmiles.push({name: smile.name, path: smile.path, code: arCodes[j]});
						}
					}
				}

				this.sortedSmiles = this.sortedSmiles.sort(function(a, b){return b.code.length - a.code.length;});
			}

			this.allowPhp = !!this.config.allowPhp;
			// Limited Php Access - when user can only move or delete php code or change component params
			this.lpa = !this.config.allowPhp && this.config.limitPhpAccess;
			this.templateId = this.config.templateId;
			this.showSnippets = this.config.showSnippets !== false;
			this.showComponents = this.config.showComponents !== false && (this.allowPhp || this.lpa);
			this.showTaskbars = this.config.showTaskbars !== false && (this.showSnippets || this.showComponents);

			this.templates = {};
			this.templates[this.templateId] = this.config.templateParams;

			// Parser
			this.parser = new BXHtmlEditor.BXEditorParser(this);

			this.On("OnEditorInitedBefore", [this]);

			this.BuildSceleton();
			this.HTMLStyler = HTMLStyler;

			// Textarea
			this.dom.textarea = this.dom.textareaCont.appendChild(BX.create("TEXTAREA", {props: {className: "bxhtmled-textarea"}}));
			this.dom.pValueInput = BX('bxed_' + this.id);
			if (!this.dom.pValueInput)
			{
				this.dom.pValueInput = this.dom.cont.appendChild(BX.create("INPUT", {props: {type: "hidden", id: 'bxed_' + this.id, name: this.config.inputName}}));
			}
			this.dom.pValueInput.value = this.config.content;

			this.dom.form = this.dom.textarea.form || false;
			this.document = null;
			// Protected iframe for wysiwyg

			this.sandbox = this.CreateIframeSandBox();
			var iframe = this.sandbox.GetIframe();

			iframe.style.width = '100%';
			iframe.style.height = '100%';

			// Views:
			// 1. TextareaView
			this.textareaView = new BXEditorTextareaView(this, this.dom.textarea, this.dom.textareaCont);
			// 2. IframeView
			this.iframeView = new BXEditorIframeView(this, this.dom.textarea, this.dom.iframeCont);
			// 3. Syncronizer
			this.synchro = new BXEditorViewsSynchro(this, this.textareaView, this.iframeView);

			if (this.bbCode)
			{
				this.bbParser = new BXHtmlEditor.BXEditorBbCodeParser(this);
			}

			// Php parser
			this.phpParser = new BXHtmlEditor.BXEditorPhpParser(this);
			this.components = new BXHtmlEditor.BXEditorComponents(this);

			// Toolbar
			this.overlay = new BXHtmlEditor.Overlay(this);
			this.BuildToolbar();

			// Taskbars
			if (this.showTaskbars)
			{
				this.taskbarManager = new BXHtmlEditor.TaskbarManager(this, true);

				// Components
				if (this.showComponents)
				{
					this.componentsTaskbar = new BXHtmlEditor.ComponentsControl(this);
					this.taskbarManager.AddTaskbar(this.componentsTaskbar);
				}

				// Snippets
				if (this.showSnippets)
				{
					this.snippets = new BXHtmlEditor.BXEditorSnippets(this);
					this.snippetsTaskbar = new BXHtmlEditor.SnippetsControl(this, this.taskbarManager);
					this.taskbarManager.AddTaskbar(this.snippetsTaskbar);
				}
				this.taskbarManager.ShowTaskbar(this.showComponents ? this.componentsTaskbar.GetId() : this.snippetsTaskbar.GetId());
			}
			else
			{
				this.dom.taskbarCont.style.display = 'none';
			}

			// Context menu
			this.contextMenu = new BXHtmlEditor.ContextMenu(this);

			if (this.config.showNodeNavi)
			{
				this.nodeNavi = new BXHtmlEditor.NodeNavigator(this);
				this.nodeNavi.Show();
			}

			this.styles = new BXStyles(this);

			this.InitEventHandlers();
			this.ResizeSceleton();

			// Restore taskbar mode from user settings
			if (this.showTaskbars && this.config.taskbarShown)
			{
				this.taskbarManager.Show(false);
			}

			this.inited = true;
			this.On("OnEditorInitedAfter", [this]);

			if (!this.CheckBrowserCompatibility())
			{
				this.dom.cont.parentNode.insertBefore(BX.create("DIV", {props: {className: "bxhtmled-warning"}, text: BX.message('BXEdInvalidBrowser')}), this.dom.cont);
			}
		},

		InitEventHandlers: function()
		{
			var _this = this;
			BX.bind(this.dom.cont, 'click', BX.proxy(this.OnClick, this));
			BX.bind(this.dom.cont, 'mousedown', BX.proxy(this.OnMousedown, this));

			BX.bind(window, 'resize', function(){_this.ResizeSceleton();});
			if (BX.adminMenu)
			{
				BX.addCustomEvent(BX.adminMenu, 'onAdminMenuResize', function(){_this.ResizeSceleton();});
			}

			BX.addCustomEvent(this, "OnIframeFocus", function()
			{
				_this.bookmark = null;
				if (_this.statusInterval)
				{
					clearInterval(_this.statusInterval);
				}
				_this.statusInterval = setInterval(BX.proxy(_this.CheckCurrentStatus, _this), 500);
			});

			BX.addCustomEvent(this, "OnIframeBlur", function()
			{
				_this.bookmark = null;
				if (_this.statusInterval)
				{
					clearInterval(_this.statusInterval);
				}
			});
			BX.addCustomEvent(this, "OnTextareaFocus", function()
			{
				_this.bookmark = null;
				if (_this.statusInterval)
				{
					clearInterval(_this.statusInterval);
				}
			});

			// Surrogates
			BX.addCustomEvent(this, "OnSurrogateDblClick", function(bxTag, origTag, target, e)
			{
				if (origTag)
				{
					switch (origTag.tag)
					{
						case 'php':
						case 'javascript':
						case 'htmlcomment':
						case 'iframe':
						case 'style':
							_this.GetDialog('Source').Show(origTag);
							break;
					}
				}
			});

			if (this.dom.form)
			{
				BX.bind(this.dom.form, 'submit', BX.proxy(this.OnSubmit, this));
			}

			BX.addCustomEvent(this, "OnSpecialcharInserted", function(entity)
			{
				var
					lastChars = _this.GetLastSpecialchars(),
					exInd = BX.util.array_search(entity, lastChars);

				if (exInd !== -1)
				{
					lastChars = BX.util.deleteFromArray(lastChars, exInd);
					lastChars.unshift(entity);
				}
				else
				{
					lastChars.unshift(entity);
					lastChars.pop();
				}

				_this.config.lastSpecialchars = lastChars;
				_this.SaveOption('specialchars', lastChars.join('|'));
			});

			this.parentDialog = BX.WindowManager.Get();
			if (this.parentDialog && this.parentDialog.DIV && BX.isNodeInDom(this.parentDialog.DIV)
				&&
				BX.findParent(this.dom.cont, function(n){return n == _this.parentDialog.DIV;}))
			{
				BX.addCustomEvent(this.parentDialog, 'onWindowResizeExt', function(){_this.ResizeSceleton();});
			}

			if (this.config.autoResize)
			{
				BX.addCustomEvent(this, "OnIframeKeyup", BX.proxy(this.AutoResizeSceleton, this));
				BX.addCustomEvent(this, "OnInsertHtml", BX.proxy(this.AutoResizeSceleton, this));
				BX.addCustomEvent(this, "OnIframeSetValue", BX.proxy(this.AutoResizeSceleton, this));
				BX.addCustomEvent(this, "OnFocus", BX.proxy(this.AutoResizeSceleton, this));
			}

			BX.addCustomEvent(this, "OnIframeKeyup", BX.proxy(this.CheckBodyHeight, this));
		},

		BuildSceleton: function()
		{
			// Main container contain all editor parts
			this.dom.cont = BX('bx-html-editor-' + this.id);
			this.dom.toolbarCont = BX('bx-html-editor-tlbr-cnt-' + this.id);
			this.dom.toolbar = BX('bx-html-editor-tlbr-' + this.id);
			this.dom.areaCont = BX('bx-html-editor-area-cnt-' + this.id);

			// Container for content editable iframe
			this.dom.iframeCont = BX('bx-html-editor-iframe-cnt-' + this.id);
			this.dom.textareaCont = BX('bx-html-editor-ta-cnt-' + this.id);

			this.dom.resizerOverlay = BX('bx-html-editor-res-over-' + this.id);
			this.dom.splitResizer = BX('bx-html-editor-split-resizer-' + this.id);
			this.dom.splitResizer.className = this.config.splitVertical ? "bxhtmled-split-resizer-ver" : "bxhtmled-split-resizer-hor";
			BX.bind(this.dom.splitResizer, 'mousedown', BX.proxy(this.StartSplitResize, this));

			// Taskbars
			this.dom.taskbarCont = BX('bx-html-editor-tskbr-cnt-' + this.id);

			// Node navigation at the bottom
			this.dom.navCont = BX('bx-html-editor-nav-cnt-' + this.id);
		},

		ResizeSceleton: function(width, height, params)
		{
			var _this = this;
			if (this.expanded)
			{
				var innerSize = BX.GetWindowInnerSize(document);
				width = this.config.width = innerSize.innerWidth;
				height = this.config.height = innerSize.innerHeight;
			}

			if (!width)
			{
				width = this.config.width;
			}
			if (!height)
			{
				height = this.config.height;
			}

			this.dom.cont.style.minWidth = this.MIN_WIDTH + 'px';
			this.dom.cont.style.minHeight = this.MIN_HEIGHT + 'px';

			var styleW, styleH;

			if (this.resizeTimeout)
			{
				clearTimeout(this.resizeTimeout);
				this.resizeTimeout = null;
			}

			if (width.toString().indexOf('%') !== -1)
			{
				styleW = width;
				width = this.dom.cont.offsetWidth;

				if (!width)
				{
					this.resizeTimeout = setTimeout(function(){_this.ResizeSceleton(width, height, params);}, 500);
					return;
				}
			}
			else
			{
				if (width < this.MIN_WIDTH)
				{
					width = this.MIN_WIDTH;
				}
				styleW = width + 'px';
			}

			this.dom.cont.style.width = styleW;
			this.dom.toolbarCont.style.width = styleW;

			if (height.toString().indexOf('%') !== -1)
			{
				styleH = height;
				height = this.dom.cont.offsetHeight;
			}
			else
			{
				if (height < this.MIN_HEIGHT)
				{
					height = this.MIN_HEIGHT;
				}
				styleH = height + 'px';
			}
			this.dom.cont.style.height = styleH;

			var
				w = Math.max(width, this.MIN_WIDTH),
				h = Math.max(height, this.MIN_HEIGHT),
				toolbarHeight = this.toolbar.GetHeight(),
				taskbarWidth = this.showTaskbars ? (this.taskbarManager.GetWidth(true, w * 0.8)) : 0,
				areaH = h - toolbarHeight - (this.config.showNodeNavi ? this.nodeNavi.GetHeight() : 0),
				areaW = w - taskbarWidth;

			this.dom.areaCont.style.top = toolbarHeight ? toolbarHeight + 'px' : 0;

			// Area
			this.SetAreaContSize(areaW, areaH, params);

			// Taskbars
			this.dom.taskbarCont.style.height = areaH + 'px';
			this.dom.taskbarCont.style.width = taskbarWidth + 'px';
			if (this.showTaskbars)
			{
				this.taskbarManager.Resize(taskbarWidth, areaH);
			}

			this.toolbar.AdaptControls(width);
		},

		CheckBodyHeight: function()
		{
			if (this.iframeView.IsShown())
			{
				var
					padding = 8,
					minHeight,
					doc = this.GetIframeDoc();

				if (doc && doc.body)
				{
					minHeight = doc.body.parentNode.offsetHeight - padding * 2;
					if (minHeight <= 20)
					{
						setTimeout(BX.proxy(this.CheckBodyHeight, this), 300);
					}
					else if (minHeight > doc.body.offsetHeight)
					{
						doc.body.style.minHeight = minHeight + 'px';
					}
				}
			}
		},

		GetSceletonSize: function()
		{
			return {
				width: this.dom.cont.offsetWidth,
				height: this.dom.cont.offsetHeight
			};
		},

		AutoResizeSceleton: function()
		{
			if (this.expanded)
				return;

			var
				maxHeight = parseInt(this.config.autoResizeMaxHeight || 0),
				minHeight = parseInt(this.config.autoResizeMinHeight || 50),
				size = this.GetSceletonSize(),
				newHeight,
				_this = this;

			if (this.autoResizeTimeout)
			{
				clearTimeout(this.autoResizeTimeout);
			}

			this.autoResizeTimeout = setTimeout(function()
			{
				newHeight = _this.GetHeightByContent();
				if (newHeight > parseInt(size.height))
				{
					if (BX.browser.IsIOS())
					{
						maxHeight = Infinity;
					}
					else if (!maxHeight || maxHeight < 10)
					{
						maxHeight = Math.round(BX.GetWindowInnerSize().innerHeight * 0.9); // 90% from screen height
					}

					newHeight = Math.min(newHeight, maxHeight);
					newHeight = Math.max(newHeight, minHeight);

					_this.SmoothResizeSceleton(newHeight);
				}
			}, 300);
		},

		GetHeightByContent: function()
		{
			var
				heightOffset = parseInt(this.config.autoResizeOffset || 80),
				contentHeight;
			if (this.GetViewMode() == 'wysiwyg')
			{
				var
					body = this.GetIframeDoc().body,
					node = body.lastChild,
					offsetTop = false;

				contentHeight = body.offsetHeight;

				while (true)
				{
					if (!node)
					{
						break;
					}
					if (node.offsetTop)
					{
						offsetTop = node.offsetTop + (node.offsetHeight || 0);
						contentHeight = offsetTop + heightOffset;
						break;
					}
					else
					{
						node = node.previousSibling;
					}
				}

				var oEdSize = BX.GetWindowSize(this.GetIframeDoc());
				if (oEdSize.scrollHeight - oEdSize.innerHeight > 5)
				{
					contentHeight = Math.max(oEdSize.scrollHeight + heightOffset, contentHeight);
				}
			}
			else
			{
				contentHeight = (this.textareaView.element.value.split("\n").length /* rows count*/ + 5) * 17;
			}

			return contentHeight;
		},

		SmoothResizeSceleton: function(height)
		{
			var
				_this = this,
				size = this.GetSceletonSize(),
				curHeight = size.height,
				count = 0,
				bRise = height > curHeight,
				timeInt = 50,
				dy = 5;

			if (!bRise)
				return;

			if (this.smoothResizeInt)
			{
				clearInterval(this.smoothResizeInt);
			}

			this.smoothResizeInt = setInterval(function()
				{
					curHeight += Math.round(dy * count);
					if (curHeight > height)
					{
						clearInterval(_this.smoothResizeInt);
						if (curHeight > height)
						{
							curHeight = height;
						}
					}
					_this.config.height = curHeight;
					_this.ResizeSceleton();
					count++;
				},
				timeInt
			);
		},

		SetAreaContSize: function(areaW, areaH, params)
		{
			areaW += 2;
			this.dom.areaCont.style.width = areaW + 'px';
			this.dom.areaCont.style.height = areaH + 'px';

			if (params && params.areaContTop)
			{
				this.dom.areaCont.style.top = params.areaContTop + 'px';
			}

			var WIDTH_DIF = 3;

			if (this.currentViewName == 'split')
			{
				function getValue(value, min, max)
				{
					if (value < min)
					{
						value = min;
					}
					if (value > max)
					{
						value = max;
					}
					return value;
				}

				var MIN_SPLITTER_PAD = 10, delta, a, b;

				if (this.config.splitVertical == true)
				{
					delta = params && params.deltaX ? params.deltaX : 0;
					a = getValue((areaW * this.config.splitRatio / (1 + this.config.splitRatio)) - delta, MIN_SPLITTER_PAD, areaW - MIN_SPLITTER_PAD);
					b = areaW - a;

					this.dom.iframeCont.style.width = (a - WIDTH_DIF) + 'px';
					this.dom.iframeCont.style.height = areaH + 'px';
					this.dom.iframeCont.style.top = 0;
					this.dom.iframeCont.style.left = 0;

					this.dom.textareaCont.style.width = (b - WIDTH_DIF) + 'px';
					this.dom.textareaCont.style.height = areaH + 'px';
					this.dom.textareaCont.style.top = 0;
					this.dom.textareaCont.style.left = a + 'px';

					this.dom.splitResizer.className = 'bxhtmled-split-resizer-ver';
					this.dom.splitResizer.style.top = 0;
					this.dom.splitResizer.style.left = (a - 3) + 'px';

					this.dom.textareaCont.style.height = areaH + 'px';
				}
				else
				{
					delta = params && params.deltaY ? params.deltaY : 0;
					a = getValue((areaH * this.config.splitRatio / (1 + this.config.splitRatio)) - delta, MIN_SPLITTER_PAD, areaH - MIN_SPLITTER_PAD);
					b = areaH - a;

					this.dom.iframeCont.style.width = (areaW - WIDTH_DIF) + 'px';
					this.dom.iframeCont.style.height = a + 'px';
					this.dom.iframeCont.style.top = 0;
					this.dom.iframeCont.style.left = 0;

					this.dom.textareaCont.style.width = (areaW - WIDTH_DIF) + 'px';
					this.dom.textareaCont.style.height = b + 'px';
					this.dom.textareaCont.style.top = a + 'px';
					this.dom.textareaCont.style.left = 0;

					this.dom.splitResizer.className = 'bxhtmled-split-resizer-hor';
					this.dom.splitResizer.style.top = (a - 3) + 'px';
					this.dom.splitResizer.style.left = 0;
				}

				if (params && params.updateSplitRatio)
				{
					this.config.splitRatio = a / b;
					this.SaveOption('split_ratio', this.config.splitRatio);
				}
			}
			else
			{
				// Set size and position of iframe container to the normal state
				this.dom.iframeCont.style.width = (areaW - WIDTH_DIF) + 'px';
				this.dom.iframeCont.style.height = areaH + 'px';
				this.dom.iframeCont.style.top = 0;
				this.dom.iframeCont.style.left = 0;

				// Set size and position of textarea container to the normal state
				this.dom.textareaCont.style.width = (areaW - WIDTH_DIF) + 'px';
				this.dom.textareaCont.style.height = areaH + 'px';
				this.dom.textareaCont.style.top = 0;
				this.dom.textareaCont.style.left = 0;
			}
		},

		BuildToolbar: function()
		{
			this.toolbar = new BXHtmlEditor.Toolbar(this, this.GetTopControls());
		},

		GetTopControls: function()
		{
			this.On("GetTopButtons", [window.BXHtmlEditor.Controls]);
			return window.BXHtmlEditor.Controls;
		},

		CreateIframeSandBox: function()
		{
			return new Sandbox(
				// Callback
				BX.proxy(this.OnCreateIframe, this),
				// Config
				{
					editor: this,
					cont: this.dom.iframeCont
				}
			);
		},

		OnCreateIframe: function()
		{
			this.On('OnCreateIframeBefore');

			this.iframeView.OnCreateIframe();

			this.selection = new BXEditorSelection(this);
			this.action = new BXEditorActions(this);

			this.config.content = this.dom.pValueInput.value;

			this.SetContent(this.config.content, true);
			this.undoManager = new BXEditorUndoManager(this);
			this.action.Exec("styleWithCSS", false, true);
			this.iframeView.InitAutoLinking();
			// Simulate html5 placeholder attribute on contentEditable element
//			var placeholderText = typeof(this.config.placeholder) === "string"
//				? this.config.placeholder
//				: this.textarea.element.getAttribute("placeholder");
//			if (placeholderText) {
//				dom.simulatePlaceholder(this.parent, this, placeholderText);
//			}

			this.SetView(this.config.view, false);
			if (this.config.setFocusAfterShow !== false)
				this.Focus(false);
			this.On('OnCreateIframeAfter');
		},

		GetDialog: function(dialogName, params)
		{
			if (!this.dialogs[dialogName] && window.BXHtmlEditor.dialogs[dialogName])
				this.dialogs[dialogName] = new window.BXHtmlEditor.dialogs[dialogName](this, params);

			return this.dialogs[dialogName] || null;
		},

		Show: function()
		{
			this.dom.cont.style.display = '';
		},

		Hide: function()
		{
			this.dom.cont.style.display = 'none';
		},

		IsShown: function()
		{
			return this.dom.cont.style.display !== 'none' && BX.isNodeInDom(this.dom.cont);
		},

		SetView: function(view, saveValue)
		{
			this.On('OnSetViewBefore');

			if (view == 'split' && this.bbCode)
				view = 'wysiwyg';

			if (this.currentViewName != view)
			{
				if (view == 'wysiwyg')
				{
					this.iframeView.Show();
					this.textareaView.Hide();
					this.dom.splitResizer.style.display = 'none';
					this.CheckBodyHeight();
				}
				else if (view == 'code')
				{
					this.iframeView.Hide();
					this.textareaView.Show();
					this.dom.splitResizer.style.display = 'none';
				}
				else if (view == 'split')
				{
					this.textareaView.Show();
					this.iframeView.Show();
					this.dom.splitResizer.style.display = '';
					this.CheckBodyHeight();
				}

				this.currentViewName = view;
			}

			if (saveValue !== false)
			{
				this.SaveOption('view', view);
			}

			this.ResizeSceleton();
			this.On('OnSetViewAfter');
		},

		GetViewMode: function()
		{
			return this.currentViewName;
		},

		SetContent: function(value, bParse)
		{
			this.On('OnSetContentBefore');
			if (this.bbCode)
			{
				var htmlFromBbCode = this.bbParser.Parse(value);
				this.iframeView.SetValue(htmlFromBbCode, bParse);
			}
			else
			{
				this.iframeView.SetValue(value, bParse);
			}

			this.textareaView.SetValue(value, false);

			this.On('OnSetContentAfter');
		},

		Focus: function(setToEnd)
		{
			if (this.currentViewName == 'wysiwyg')
			{
				this.iframeView.Focus(setToEnd);
			}
			else if (this.currentViewName == 'code')
			{
				this.textareaView.Focus(setToEnd);
			}
			else if (this.currentViewName == 'split')
			{
				if (this.synchro.GetSplitMode() == 'wysiwyg')
				{
					this.iframeView.Focus(setToEnd);
				}
				else
				{
					this.textareaView.Focus(setToEnd);
				}
			}
			this.On('OnFocus');
			return this;
		},

		SaveContent: function()
		{
			if (this.currentViewName == 'wysiwyg' ||
				(this.currentViewName == 'split' && this.synchro.GetSplitMode() == 'wysiwyg'))
			{
				this.synchro.lastIframeValue = '';
				this.synchro.FromIframeToTextarea(true, true);
			}
			else
			{
				this.textareaView.SaveValue();
			}
		},

		GetContent: function()
		{
			this.SaveContent();
			return this.textareaView.GetValue();
		},

		IsExpanded: function()
		{
			return this.expanded;
		},

		Expand: function(bExpand)
		{
			if (bExpand == undefined)
			{
				bExpand = !this.expanded;
			}

			var
				_this = this,
				innerSize = BX.GetWindowInnerSize(document),
				startWidth, startHeight, startTop, startLeft,
				endWidth, endHeight, endTop, endLeft;

			if (bExpand)
			{
				var
					scrollPos = BX.GetWindowScrollPos(document),
					pos = BX.pos(this.dom.cont);

				startWidth = this.dom.cont.offsetWidth;
				startHeight = this.dom.cont.offsetHeight;
				startTop = pos.top;
				startLeft = pos.left;
				endWidth = innerSize.innerWidth;
				endHeight = innerSize.innerHeight;
				endTop = scrollPos.scrollTop;
				endLeft = scrollPos.scrollLeft;

				this.savedSize = {
					width: startWidth,
					height: startHeight,
					top: startTop,
					left: startLeft,
					scrollLeft: scrollPos.scrollLeft,
					scrollTop: scrollPos.scrollTop,
					configWidth: this.config.width,
					configHeight: this.config.height
				};

				this.config.width = endWidth;
				this.config.height = endHeight;

				BX.addClass(this.dom.cont, 'bx-html-editor-absolute');
				this._bodyOverflow = document.body.style.overflow;
				document.body.style.overflow = "hidden";

				// Create dummie div
				this.dummieDiv = BX.create('DIV');
				this.dummieDiv.style.width = startWidth + 'px';
				this.dummieDiv.style.height = startHeight + 'px';
				this.dom.cont.parentNode.insertBefore(this.dummieDiv, this.dom.cont);
				document.body.appendChild(this.dom.cont);

				BX.addCustomEvent(this, 'OnIframeKeydown', BX.proxy(this.CheckEscCollapse, this));
				BX.bind(document.body, "keydown", BX.proxy(this.CheckEscCollapse, this));
				BX.bind(window, "scroll", BX.proxy(this.PreventScroll, this));
			}
			else
			{
				startWidth = this.dom.cont.offsetWidth;
				startHeight = this.dom.cont.offsetHeight;
				startTop = this.savedSize.scrollTop;
				startLeft = this.savedSize.scrollLeft;
				endWidth = this.savedSize.width;
				endHeight = this.savedSize.height;
				endTop = this.savedSize.top;
				endLeft = this.savedSize.left;

				BX.removeCustomEvent(this, 'OnIframeKeydown', BX.proxy(this.CheckEscCollapse, this));
				BX.unbind(document.body, "keydown", BX.proxy(this.CheckEscCollapse, this));
				BX.unbind(window, "scroll", BX.proxy(this.PreventScroll, this));
			}

			this.dom.cont.style.width = startWidth + 'px';
			this.dom.cont.style.height = startHeight + 'px';
			this.dom.cont.style.top = startTop + 'px';
			this.dom.cont.style.left = startLeft + 'px';

			var content = this.GetContent();

			this.expandAnimation = new BX.easing({
				duration : 300,
				start : {
					height: startHeight,
					width: startWidth,
					top: startTop,
					left: startLeft
				},
				finish : {
					height: endHeight,
					width: endWidth,
					top: endTop,
					left: endLeft
				},
				transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step : function(state)
				{
					_this.dom.cont.style.width = state.width + 'px';
					_this.dom.cont.style.height = state.height + 'px';
					_this.dom.cont.style.top = state.top + 'px';
					_this.dom.cont.style.left = state.left + 'px';
					_this.ResizeSceleton(state.width.toString(), state.height.toString());
				},
				complete : function()
				{
					_this.expandAnimation = null;
					if (!bExpand)
					{
						_this.util.ReplaceNode(_this.dummieDiv, _this.dom.cont);
						_this.dummieDiv = null;
						_this.dom.cont.style.width = '';
						_this.dom.cont.style.height = '';
						_this.dom.cont.style.top = '';
						_this.dom.cont.style.left = '';
						BX.removeClass(_this.dom.cont, 'bx-html-editor-absolute');
						document.body.style.overflow = _this._bodyOverflow;
						_this.config.width = _this.savedSize.configWidth;
						_this.config.height = _this.savedSize.configHeight;
						_this.ResizeSceleton();
					}
					setTimeout(function(){_this.CheckAndReInit(content)}, 10);
				}
			});

			this.expandAnimation.animate();
			this.expanded = bExpand;
		},

		CheckEscCollapse: function(e, keyCode, command, selectedNode)
		{
			if (!keyCode)
			{
				keyCode = e.keyCode;
			}

			if (
				this.IsExpanded() &&
					keyCode == this.KEY_CODES['escape'] &&
					!this.IsPopupsOpened()
				)
			{
				this.Expand(false);
				return BX.PreventDefault(e);
			}
		},

		PreventScroll: function(e)
		{
			window.scrollTo(this.savedSize.scrollLeft, this.savedSize.scrollTop);
			return BX.PreventDefault(e);
		},

		IsPopupsOpened: function()
		{
			return !!(this.dialogShown ||
					this.popupShown ||
					this.contextMenuShown ||
					this.overlay.bShown);
		},

		ReInitIframe: function()
		{
			this.sandbox.InitIframe();
			this.iframeView.OnCreateIframe();
			this.synchro.StopSync();
			this.synchro.lastTextareaValue = '';
			this.synchro.FromTextareaToIframe(true);
			this.synchro.StartSync();
			this.iframeView.ReInit();
			this.Focus();
		},

		CheckAndReInit: function(content)
		{
			if (this.sandbox.inited)
			{
				var win = this.sandbox.GetWindow();
				if (win)
				{
					var doc = this.sandbox.GetDocument();
					if (doc !== this.iframeView.document)
					{
						this.iframeView.document = doc;
						this.iframeView.element = doc.body;
						this.ReInitIframe();
					}
				}
				else
				{
					throw new Error("HtmlEditor: CheckAndReInit error iframe isn't in the DOM");
				}
			}

			if (content !== undefined)
			{
				this.SetContent(content, true);
				this.Focus(true);
			}
		},

		Disable: function()
		{
		},

		Enable: function()
		{
		},

		CheckConfig: function(config)
		{
			if (config.content === undefined)
			{
				config.content = '';
			}

			return config;
		},

		GetInnerHtml: function(el)
		{
			var
				TILDA = "%7E",
				AMP = "&amp;",
				innerHTML = el.innerHTML;

			if (innerHTML.indexOf(AMP) !== -1 || innerHTML.indexOf(TILDA) !== -1)
			{
				innerHTML = innerHTML.replace(/(?:href|src)\s*=\s*("|')([\s\S]*?)(\1)/ig, function(s)
				{
					// See https://bugzilla.mozilla.org/show_bug.cgi?id=664398
					s = s.replace(/%7E/ig, '~');
					s = s.replace(/&amp;/ig, '&');
					return s;
				});
			}

			innerHTML = innerHTML.replace(/(?:title|alt)\s*=\s*("|')([\s\S]*?)(\1)/ig, function(s)
			{
				s = s.replace(/</g, '&lt;');
				s = s.replace(/>/g, '&gt;');
				return s;
			});

			if (this.bbCode)
			{
				innerHTML = innerHTML.replace(/[\s\n\r]*?<!--[\s\S]*?-->[\s\n\r]*?/ig, "");
			}

			return innerHTML;
		},

		InitUtil: function()
		{
			var _this = this;

			this.util = {};
			if ("textContent" in document.documentElement)
			{
				this.util.SetTextContent = function(element, text){element.textContent = text;};
				this.util.GetTextContent = function(element){return element.textContent;};
			}
			else if ("innerText" in document.documentElement)
			{
				this.util.SetTextContent = function(element, text){element.innerText = text;};
				this.util.GetTextContent = function(element){return element.innerText;};
			}
			else
			{
				this.util.SetTextContent = function(element, text){element.nodeValue = text;};
				this.util.GetTextContent = function(element){return element.nodeValue;};
			}

			this.util.AutoCloseTagSupported = function()
			{
				var
					element = document.createElement("div"),
					result,
					innerHTML;

				element.innerHTML = "<p><div></div>";
				innerHTML = element.innerHTML.toLowerCase();
				result = innerHTML === "<p></p><div></div>" || innerHTML === "<p><div></div></p>";

				_this.util.AutoCloseTagSupported = function(){return result;};
				return result;
			};

			// IE sometimes gives wrong results for hasAttribute/getAttribute
			this.util.CheckGetAttributeTruth = function()
			{
				var
					td = document.createElement("td"),
					result = td.getAttribute("rowspan") != "1";

				_this.util.CheckGetAttributeTruth = function(){return result;};
				return result;
			};

			// Check if browser supports HTML5
			this.util.CheckHTML5Support = function(doc)
			{
				if (!doc)
				{
					doc = document;
				}

				var
					result = false,
					html = "<article>bitrix</article>",
					el = doc.createElement("div");

				el.innerHTML = html;
				result = el.innerHTML.toLowerCase() === html;

				_this.util.CheckHTML5Support = function(){return result;};
				return result;
			};

			// Check if browser supports HTML5 (checks all tags)
			this.util.CheckHTML5FullSupport = function(doc)
			{
				if (!doc)
				{
					doc = document;
				}

				var
					html,
					tags = _this.GetHTML5Tags(),
					result = false,
					el = doc.createElement("div");

				for (var i = 0; i < tags.length; i++)
				{
					html = "<" + tags[i] + ">bitrix</" + tags[i] + ">";
					el.innerHTML = html;
					result = el.innerHTML.toLowerCase() === html;
					if (!result)
					{
						break;
					}
				}

				_this.util.CheckHTML5FullSupport = function(){return result;};
				return result;
			};

			this.util.GetEmptyImage = function()
			{
				return _this.EMPTY_IMAGE_SRC;
			};

			this.util.CheckDataTransferSupport = function()
			{
				var result = false;
				try {
					result = !!(window.Clipboard || window.DataTransfer).prototype.getData;
				} catch(e) {}
				_this.util.CheckDataTransferSupport = function(){return result;};
				return result;
			};

			this.util.CheckImageSelectSupport = function()
			{
				var result = !(BX.browser.IsChrome() || BX.browser.IsSafari());
				_this.util.CheckImageSelectSupport = function(){return result;};
				return result;
			};

			this.util.CheckPreCursorSupport = function()
			{
				var result = !(BX.browser.IsIE() || BX.browser.IsIE10() || BX.browser.IsIE11());
				_this.util.CheckPreCursorSupport = function(){return result;};
				return result;
			};

			// Following hack is needed for firefox to make sure that image resize handles are properly removed
			this.util.Refresh = function(element)
			{
				if (element && element.parentNode)
				{
					var cn = "bx-editor-refresh";

					BX.addClass(element, cn);
					BX.removeClass(element, cn);

					// Hack for firefox
					if (BX.browser.IsFirefox())
					{
						try {
							var
								i,
								doc = element.ownerDocument,
								italics = doc.getElementsByTagName('I'),
								italicLen = italics.length;

							for (i = 0; i < italics.length; i++)
							{
								italics[i].setAttribute('data-bx-orgig-i', true);
							}

							doc.execCommand("italic", false, null);
							doc.execCommand("italic", false, null);

							var italicsNew = doc.getElementsByTagName('I');
							if (italicsNew.length !== italicLen)
							{
								for (i = 0; i < italicsNew.length; i++)
								{
									if (italicsNew[i].getAttribute('data-bx-orgig-i'))
									{
										italicsNew[i].removeAttribute('data-bx-orgig-i');
									}
									else
									{
										_this.util.ReplaceWithOwnChildren(italicsNew[i]);
									}
								}
							}
						} catch(e) {}
					}
				}
			};

			this.util.addslashes = function(str)
			{
				str = str.replace(/\\/g,'\\\\');
				str = str.replace(/"/g,'\\"');
				return str;
			};

			this.util.stripslashes = function(str)
			{
				str = str.replace(/\\"/g,'"');
				str = str.replace(/\\\\/g,'\\');
				return str;
			};

			this.util.ReplaceNode = function(node, newNode)
			{
				node.parentNode.insertBefore(newNode, node);
				node.parentNode.removeChild(node);
				return newNode;
			};

			// Fast way to check whether an element with a specific tag name is in the given document
			this.util.DocumentHasTag = function(doc, tag)
			{
				var
					LIVE_CACHE = {},
					key = _this.id + ":" + tag,
					cacheEntry = LIVE_CACHE[key];

				if (!cacheEntry)
					cacheEntry = LIVE_CACHE[key] = doc.getElementsByTagName(tag);

				return cacheEntry.length > 0;
			};

			this.util.IsSplitPoint = function(node, offset)
			{
				var res = offset > 0 && offset < node.childNodes.length;
				if (rangy.dom.isCharacterDataNode(node))
				{
					if (offset == 0)
						res = !!node.previousSibling;
					else if (offset == node.length)
						res = !!node.nextSibling;
					else
						res = true;
				}
				return res;
			};

			this.util.SplitNodeAt = function(node, descendantNode, descendantOffset)
			{
				var newNode;
				if (rangy.dom.isCharacterDataNode(descendantNode))
				{
					if (descendantOffset == 0)
					{
						descendantOffset = rangy.dom.getNodeIndex(descendantNode);
						descendantNode = descendantNode.parentNode;
					}
					else if (descendantOffset == descendantNode.length)
					{
						descendantOffset = rangy.dom.getNodeIndex(descendantNode) + 1;
						descendantNode = descendantNode.parentNode;
					}
					else
					{
						newNode = rangy.dom.splitDataNode(descendantNode, descendantOffset);
					}
				}

				if (!newNode)
				{
					newNode = descendantNode.cloneNode(false);
					if (newNode.id)
					{
						newNode.removeAttribute("id");
					}

					var child;
					while ((child = descendantNode.childNodes[descendantOffset]))
					{
						newNode.appendChild(child);
					}

					rangy.dom.insertAfter(newNode, descendantNode);
				}

				if (descendantNode && descendantNode.nodeName == "BODY")
				{
					return newNode;
				}

				return (descendantNode == node) ? newNode : _this.util.SplitNodeAt(node, newNode.parentNode, rangy.dom.getNodeIndex(newNode));
			};

			this.util.ReplaceWithOwnChildren = function (el)
			{
				var parent = el.parentNode;
				while (el.firstChild)
				{
					parent.insertBefore(el.firstChild, el);
				}
				parent.removeChild(el);
			};

			this.util.IsBlockElement = function (node)
			{
				var styleDisplay = BX.style(node, 'display');
				return styleDisplay && styleDisplay.toLowerCase() === "block";
			};

			this.util.IsBlockNode = function (node)
			{
				return node && node.nodeType == 1 && BX.util.in_array(node.nodeName, _this.GetBlockTags());
			};

			this.util.CopyAttributes = function(attributes, from, to)
			{
				if (from && to)
				{
					var
						attribute,
						i,
						length = attributes.length;

					for (i = 0; i < length; i++)
					{
						attribute = attributes[i];
						if (from[attribute])
							to[attribute] = from[attribute];
					}
				}
			};

			this.util.RenameNode = function(node, newNodeName)
			{
				var
					newNode = node.ownerDocument.createElement(newNodeName),
					firstChild;

				while (firstChild = node.firstChild)
					newNode.appendChild(firstChild);

				_this.util.CopyAttributes(["align", "className"], node, newNode);

				if (node.style.cssText != '')
				{
					newNode.style.cssText = node.style.cssText;
				}

				node.parentNode.replaceChild(newNode, node);
				return newNode;
			};

			this.util.GetInvisibleTextNode = function()
			{
				return _this.iframeView.document.createTextNode(_this.INVISIBLE_SPACE);
			};

			this.util.IsEmptyNode = function(node, bCheckNewLine, bCheckSpaces)
			{
				var res;
				if (node.nodeType == 3)
				{
					res = node.data === "" || node.data === _this.INVISIBLE_SPACE || (node.data === '\n' && bCheckNewLine);
					if (!res && bCheckSpaces && node.data.toString().match(/^[\s\n\r\t]+$/ig))
					{
						res = true;
					}
				}
				else if(node.nodeType == 1)
				{
					res = node.innerHTML === "" || node.innerHTML === _this.INVISIBLE_SPACE;
					if (!res && bCheckSpaces && node.innerHTML.toString().match(/^[\s\n\r\t]+$/ig))
					{
						res = true;
					}
				}
				return res;
			};

			var documentElement = document.documentElement;
			if ("textContent" in documentElement)
			{
				this.util.SetTextContent = function(node, text)
				{
					node.textContent = text;
				};

				this.util.GetTextContent = function(node)
				{
					return node.textContent;
				};
			}
			else if ("innerText" in documentElement)
			{
				this.util.SetTextContent = function(node, text)
				{
					node.innerText = text;
				};

				this.util.GetTextContent = function(node)
				{
					return node.innerText;
				};
			}
			else
			{
				this.util.SetTextContent = function(node, text)
				{
					node.nodeValue = text;
				};

				this.util.GetTextContent = function(node)
				{
					return node.nodeValue;
				};
			}


			this.util.GetTextContentEx = function(node)
			{
				var
					i,
					clone = node.cloneNode(true),
					scripts = clone.getElementsByTagName('SCRIPT');

				for (i = scripts.length - 1; i >= 0 ; i--)
				{
					BX.remove(scripts[i]);
				}

				return _this.util.GetTextContent(clone);
			};

			this.util.RgbToHex = function(str)
			{
				var res;
				if (str.search("rgb") == -1)
				{
					res = str;
				}
				else if (str == 'rgba(0, 0, 0, 0)')
				{
					res = 'transparent';
				}
				else
				{
					str = str.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)$/);
					function hex(x)
					{
						return ("0" + parseInt(x).toString(16)).slice(-2);
					}
					res = "#" + hex(str[1]) + hex(str[2]) + hex(str[3]);
				}
				return res;
			};

			this.util.CheckCss = function(node, arCss, bMatch)
			{
				var res = true, i;
				for (i in arCss)
				{
					if (arCss.hasOwnProperty(i))
					{
						if (node.style[i] != '')
						{
							res = res && (bMatch ? node.style[i] == arCss[i] : true);
						}
						else
						{
							res = false;
						}
					}
				}
				return res;
			};

			this.util.SetCss = function(n, arCss)
			{
				if (n && arCss && typeof arCss == 'object')
				{
					for (var i in arCss)
					{
						if (arCss.hasOwnProperty(i))
						{
							n.style[i] = arCss[i];
						}
					}
				}
			};

			this.util.InsertAfter = function(node, precedingNode)
			{
				return rangy.dom.insertAfter(node, precedingNode);
			};

			this.util.GetNodeDomOffset = function(node)
			{
				var i = 0;
				while (node.parentNode && node.parentNode.nodeName !== 'BODY')
				{
					node = node.parentNode;
					i++;
				}
				return i;
			};

			this.util.CheckSurrogateNode = function(node)
			{
				return _this.phpParser.CheckParentSurrogate(node);
			};

			this.util.CheckSurrogateDd = function(node)
			{
				return _this.phpParser.CheckSurrogateDd(node);
			};

			this.util.GetPreviousNotEmptySibling = function(node)
			{
				var prev = node.previousSibling;
				while (prev && prev.nodeType == 3 && _this.util.IsEmptyNode(prev, true, true))
				{
					prev = prev.previousSibling;
				}
				return prev;
			};

			this.util.GetNextNotEmptySibling = function(node)
			{
				var next = node.nextSibling;
				while (next && next.nodeType == 3 && _this.util.IsEmptyNode(next, true, true))
				{
					next = next.nextSibling;
				}
				return next;
			};

			this.util.IsEmptyLi = function(li)
			{
				if (li && li.nodeName == 'LI')
				{
					return _this.util.IsEmptyNode(li, true, true) || li.innerHTML.toLowerCase() == '<br>';
				}
				return false;
			};
		},

		Parse: function(content, bParseBxNodes, bFormat)
		{
			bParseBxNodes = !!bParseBxNodes;
			this.On("OnParse", [bParseBxNodes]);

			if (bParseBxNodes)
			{
				content = this.parser.Parse(content, this.GetParseRules(), this.GetIframeDoc(), true, bParseBxNodes);
				if ((bFormat === true || this.textareaView.IsShown()) && !this.bbCode)
				{
					content = this.FormatHtml(content);
				}

				content = this.phpParser.ParseBxNodes(content);
			}
			else
			{
				content = this.phpParser.ParsePhp(content);
				content = this.parser.Parse(content, this.GetParseRules(), this.GetIframeDoc(), true, bParseBxNodes);
			}

			return content;
		},

		On: function(eventName, arEventParams)
		{
			BX.onCustomEvent(this, eventName, arEventParams || []);
		},

		GetIframeDoc: function()
		{
			if (!this.document)
			{
				this.document = this.sandbox.GetDocument();
				BX.addCustomEvent(this, 'OnIframeReInit', BX.proxy(function(){this.document = this.sandbox.GetDocument();}, this));
			}
			return this.document;
		},

		GetParseRules: function()
		{
			this.rules = __BXHtmlEditorParserRules;
			// Here we can make changes to this.rules
			this.On("OnGetParseRules");
			var _this = this;
			this.GetParseRules = function(){return _this.rules;};
			return this.rules;
		},

		GetHTML5Tags: function()
		{
			return this.HTML5_TAGS;
		},

		GetBlockTags: function()
		{
			return this.BLOCK_TAGS;
		},

		SetBxTag: function(el, params)
		{
			var id;
			if (params.id || el && el.id)
				id = params.id || el.id;

			if (!id)
			{
				id = 'bxid' + Math.round(Math.random() * 1000000000);
			}
			else
			{
				if (this.bxTags[id])
				{
					if (!params.tag)
						params.tag = this.bxTags[id].tag;
				}
			}

			params.id = id;
			if (el)
				el.id = params.id;

			this.bxTags[params.id] = params;
			return params.id;
		},

		GetBxTag: function(element)
		{
			var id;
			if (typeof element == 'object' && element && element.id)
				id = element.id;
			else
				id = element;

			if (id)
			{
				if (typeof id != "string" && id.id)
					id = id.id;

				if (id && id.length > 0 && this.bxTags[id] && this.bxTags[id].tag)
				{
					this.bxTags[id].tag = this.bxTags[id].tag.toLowerCase();
					return this.bxTags[id];
				}
			}

			return {tag: false};
		},

		OnMousedown: function(e)
		{
			var
				node = e.target || e.srcElement;

			if (node && (node.getAttribute || node.parentNode))
			{
				var
					_this = this,
					bxType = node.getAttribute('data-bx-type');

				if (!bxType)
				{
					node = BX.findParent(node, function(n)
					{
						return n == _this.dom.cont || (n.getAttribute && n.getAttribute('data-bx-type'));
					}, this.dom.cont);

					bxType = (node && node.getAttribute) ? node.getAttribute('data-bx-type') : null;
				}

				if (bxType == 'action') // Any type of button or element which runs action
				{
					return BX.PreventDefault(e);
				}
			}
			return true;
		},

		OnClick: function(e)
		{
			var
				target = e.target || e.srcElement,
				bxType = (target && target.getAttribute) ? target.getAttribute('data-bx-type') : false;

			this.On("OnClickBefore", [{e: e, target: target, bxType: bxType}]);
			this.CheckCommand(target);
		},

		CheckCommand: function(node)
		{
			if (node && (node.getAttribute || node.parentNode))
			{
				var
					_this = this,
					bxType = node.getAttribute('data-bx-type');

				if (!bxType)
				{
					node = BX.findParent(node, function(n)
					{
						return n == _this.dom.cont || (n.getAttribute && n.getAttribute('data-bx-type'));
					}, this.dom.cont);

					bxType = (node && node.getAttribute) ? node.getAttribute('data-bx-type') : null;
				}

				if (bxType == 'action') // Any type of button or element which runs action
				{
					var
						action = node.getAttribute('data-bx-action'),
						value = node.getAttribute('data-bx-value');

					if (this.action.IsSupported(action))
					{
						this.action.Exec(action, value);
					}
				}
			}
		},

		SetSplitMode: function(vertical, saveValue)
		{
			this.config.splitVertical = !!vertical;

			if (saveValue !== false)
			{
				this.SaveOption('split_vertical', this.config.splitVertical ? 1 : 0);
			}

			this.SetView('split', saveValue);
		},

		GetSplitMode: function()
		{
			return this.config.splitVertical;
		},

		StartSplitResize: function(e)
		{
			this.dom.resizerOverlay.style.display = 'block';
			var
				dX = 0, dY = 0,
				windowScroll = BX.GetWindowScrollPos(),
				startX = e.clientX + windowScroll.scrollLeft,
				startY = e.clientY + windowScroll.scrollTop,
				_this = this;

			function moveResizer(e, bFinish)
			{
				var
					x = e.clientX + windowScroll.scrollLeft,
					y = e.clientY + windowScroll.scrollTop;

				if(startX == x && startY == y)
				{
					return;
				}

				dX = startX - x;
				dY = startY - y;

				_this.ResizeSceleton(0, 0, {deltaX: dX, deltaY: dY, updateSplitRatio: bFinish});
			}

			function finishResizing(e)
			{
				moveResizer(e, true);
				BX.unbind(document, 'mousemove', moveResizer);
				BX.unbind(document, 'mouseup', finishResizing);
				_this.dom.resizerOverlay.style.display = 'none';
			}

			BX.bind(document, 'mousemove', moveResizer);
			BX.bind(document, 'mouseup', finishResizing);
		},

		Request: function(P)
		{
			if (!P.url)
				P.url = this.config.actionUrl;
			if (P.bIter !== false)
				P.bIter = true;

			if (!P.postData && !P.getData)
				P.getData = this.GetReqData();

//			var errorText;
//			if (!P.errorText)
//				errorText = false;

			var reqId = P.getData ? P.getData.reqId : P.postData.reqId;

			var _this = this, iter = 0;
			var handler = function(result)
			{
				function handleRes()
				{
					//_this.CloseWaitWindow();
//					var erInd = result.toLowerCase().indexOf('bx_event_calendar_action_error');
//					if (!result || result.length <= 0 || erInd != -1)
//					{
//						var errorText = '';
//						if (erInd >= 0)
//						{
//							var
//								ind1 = erInd + 'BX_EVENT_CALENDAR_ACTION_ERROR:'.length,
//								ind2 = result.indexOf('-->', ind1);
//							errorText = result.substr(ind1, ind2 - ind1);
//						}
//						if (P.onerror && typeof P.onerror == 'function')
//							P.onerror();
//
//						return _this.DisplayError(errorText || P.errorText || '');
//					}

					var res = P.handler(_this.GetRequestRes(reqId), result);
					if(res === false && ++iter < 20 && P.bIter)
						setTimeout(handleRes, 5);
					else
						_this.ClearRequestRes(reqId);
				}
				setTimeout(handleRes, 50);
			};
			//this.ShowWaitWindow();

			if (P.postData)
				BX.ajax.post(P.url, P.postData, handler);
			else
				BX.ajax.get(P.url, P.getData, handler);
		},

		GetRequestRes: function(key)
		{
			if (top.BXHtmlEditor && top.BXHtmlEditor.ajaxResponse[key] != undefined)
				return top.BXHtmlEditor.ajaxResponse[key];

			return {};
		},

		ClearRequestRes: function(key)
		{
			if (top.BXHtmlEditor.ajaxResponse)
			{
				top.BXHtmlEditor.ajaxResponse[key] = null;
				delete top.BXHtmlEditor.ajaxResponse[key];
			}
		},

		GetReqData: function(action, O)
		{
			if (!O)
				O = {};
			if (action)
				O.action = action;
			O.sessid = BX.bitrix_sessid();
			O.bx_html_editor_request = 'Y';
			O.reqId = Math.round(Math.random() * 1000000);
			return O;
		},

		GetTemplateId: function()
		{
			return this.templateId;
		},

		GetTemplateParams: function()
		{
			return this.templates[this.templateId];
		},

		GetTemplateStyles: function()
		{
			var params = this.templates[this.templateId] || {};
			return params.STYLES || '';
		},

		ApplyTemplate: function(templateId)
		{
			if (this.templateId !== templateId)
			{
				if (this.templates[templateId])
				{
					this.templateId = templateId;
					var
						i,
						doc = this.sandbox.GetDocument(),
						head = doc.head || doc.getElementsByTagName('HEAD')[0],
						styles = head.getElementsByTagName('STYLE');

					// Clean old template styles
					for (i = 0; i < styles.length; i++)
					{
						if (styles[i].getAttribute('data-bx-template-style') == 'Y')
							BX.cleanNode(styles[i], true);
					}

					// Add new node in the iframe head
					if (this.templates[templateId]['STYLES'])
					{
						head.appendChild(BX.create('STYLE', {props: {type: 'text/css'}, text: this.templates[templateId]['STYLES']}, doc)).setAttribute('data-bx-template-style', 'Y');
					}

					this.On("OnApplySiteTemplate", [templateId]);
				}
				else
				{
					var _this = this;
					this.Request({
						getData: this.GetReqData('load_site_template',
							{
								site_template: templateId
							}
						),
						handler: function(res)
						{
							_this.templates[templateId] = res;
							_this.ApplyTemplate(templateId);
						}
					});
				}
			}
		},

		FormatHtml: function(html, bForceFormating)
		{
			if (html.length < this.MAX_HANDLED_FORMAT_LENGTH || bForceFormating === true)
			{
				if (!this.formatter)
					this.formatter = new window.BXHtmlEditor.BXCodeFormatter(this);

				var time1 = new Date().getTime();
				html = this.formatter.Format(html);
				var time2 = new Date().getTime();

				if (time2 - time1 > this.MAX_HANDLED_FORMAT_TIME)
					this.MAX_HANDLED_FORMAT_LENGTH -= 5000;
			}

			return html;
		},

		GetFontFamilyList: function()
		{
			if (!this.fontFamilyList)
			{
				this.fontFamilyList = [
					{value: ['Times New Roman', 'Times'], name: 'Times New Roman'},
					{value: ['Courier New'], name: 'Courier New'},
					{value: ['Arial', 'Helvetica'], name: 'Arial / Helvetica'},
					{value: ['Arial Black', 'Gadget'], name: 'Arial Black'},
					{value: ['Tahoma','Geneva'], name: 'Tahoma / Geneva'},
					{value: 'Verdana', name: 'Verdana'},
					{value: ['Georgia', 'serif'], name: 'Georgia'},
					{value: 'monospace', name: 'monospace'}
				];
				this.On("GetFontFamilyList", [this.fontFamilyList]);
			}
			return this.fontFamilyList;
		},

		GetStyleList: function()
		{
			if (!this.styleList)
			{
				this.styleList = [
					{value: 'H1', tagName: 'H1', name: BX.message('StyleH1')},
					{value: 'H2', tagName: 'H2', name: BX.message('StyleH2')},
					{value: 'H3', tagName: 'H3', name: BX.message('StyleH3')},
					{value: 'H4', tagName: 'H4', name: BX.message('StyleH4')},
					{value: 'H5', tagName: 'H5', name: BX.message('StyleH5')},
					{value: 'H6', tagName: 'H6', name: BX.message('StyleH6')},
					{value: 'P', name: BX.message('StyleParagraph')},
					{value: 'DIV', name: BX.message('StyleDiv')}
				];
				this.On("GetStyleList", [this.styleList]);
			}
			return this.styleList;
		},

		CheckCurrentStatus: function()
		{
			if (!this.iframeView.IsFocused())
				return this.On("OnIframeBlur");

			var
				arAction, action, actionState, value,
				actionList = this.GetActiveActions(),
				range = this.selection.GetRange();

			if (!range || !range.isValid())
				return this.On("OnIframeBlur");

			for (action in actionList)
			{
				if (actionList.hasOwnProperty(action) && this.action.IsSupported(action))
				{
					arAction = actionList[action];
					actionState = this.action.CheckState(action, arAction.value);
					value = arAction.control.GetValue();

					if (actionState)
					{
						arAction.control.SetValue(true, actionState, action);
					}
					else
					{
						arAction.control.SetValue(false, null, action);
					}
				}
			}
		},

		RegisterCheckableAction: function(action, params)
		{
			if (!this.checkedActionList)
				this.checkedActionList = {};

			this.checkedActionList[action] = params;
		},

		GetActiveActions: function()
		{
			return this.checkedActionList;
		},

		SaveOption: function(name, value)
		{
			BX.userOptions.save('html_editor', this.config.settingsKey, name, value);
		},

		GetCurrentCssClasses: function(filterTag)
		{
			return this.styles.GetCSS(this.templateId, this.templates[this.templateId].STYLES, this.templates[this.templateId].PATH || '', filterTag);
		},

		IsInited: function()
		{
			return !!this.inited;
		},

		IsContentChanged: function()
		{
			var
				cont1 = this.config.content.replace(/[\s\n\r\t]+/ig, ''),
				cont2 = this.GetContent().replace(/[\s\n\r\t]+/ig, '');

			return cont1 != cont2;
		},

		IsSubmited: function()
		{
			return this.isSubmited;
		},

		OnSubmit: function()
		{
			if (!this.isSubmited)
			{
				this.RemoveCursorNode();
				this.isSubmited = true;

				if (this.iframeView.IsFocused())
					this.On("OnIframeBlur");

				this.On('OnSubmit');
				this.SaveContent();
			}
		},

		AllowBeforeUnloadHandler: function()
		{
			this.beforeUnloadHandlerAllowed = true;
		},

		DenyBeforeUnloadHandler: function()
		{
			this.beforeUnloadHandlerAllowed = false;
		},

		Destroy: function()
		{
			this.sandbox.Destroy();
			BX.remove(this.dom.cont);
		},

		Check: function()
		{
			return this.dom.cont && BX.isNodeInDom(this.dom.cont);
		},

		IsVisible: function()
		{
			return this.Check() && this.dom.cont.offsetWidth > 0;
		},

		GetLastSpecialchars: function()
		{
			var def = ['&cent;', '&sect;', '&euro;', '&pound;','&yen;','&copy;', '&reg;', '&laquo;', '&raquo;', '&deg;', '&plusmn;', '&para;', '&hellip;','&prime;','&Prime;', '&trade;', '&asymp;', '&ne;', '&lt;', '&gt;'];

			if (this.config.lastSpecialchars && typeof this.config.lastSpecialchars == 'object' && this.config.lastSpecialchars.length > 1)
			{
				return this.config.lastSpecialchars;
			}
			else
			{
				return def;
			}
		},

		GetIframeElement: function(id)
		{
			return this.GetIframeDoc().getElementById(id);
		},

		RegisterDialog: function(id, dialog)
		{
			window.BXHtmlEditor.dialogs[id] = dialog;
		},

		SetConfigHeight: function(height)
		{
			this.config.height = height;
			if (this.IsExpanded())
			{
				this.savedSize.configHeight = height;
				this.savedSize.height = height;
			}
		},

		CheckBrowserCompatibility: function()
		{
			return !(BX.browser.IsOpera() || BX.browser.IsIE8() || BX.browser.IsIE7() || BX.browser.IsIE6());
		},

		GetCursorHtml: function()
		{
			return '<span id="bx-cursor-node"> </span>';
		},

		SetCursorNode: function(range)
		{
			if (!range)
				range = this.selection.GetRange();
			this.RemoveCursorNode();
			this.selection.InsertHTML(this.GetCursorHtml(), range);
		},

		RestoreCursor: function()
		{
			var doc = this.GetIframeDoc();
			if (doc)
			{
				var cursor = doc.getElementById('bx-cursor-node');
				if (cursor)
				{
					this.selection.SetAfter(cursor);
					BX.remove(cursor);
				}
			}
		},

		RemoveCursorNode: function()
		{
			if (this.synchro.IsFocusedOnTextarea())
			{

			}
			else
			{
				var doc = this.GetIframeDoc();
				if (doc)
				{
					var cursor = doc.getElementById('bx-cursor-node');
					if (cursor)
					{
						this.selection.SetAfter(cursor);
						BX.remove(cursor);
					}
				}
			}
		},

		AddButton: function(params)
		{
			if (params.compact == undefined)
				params.compact = true;
			if (params.toolbarSort == undefined)
				params.toolbarSort = 301;
			if (params.hidden == undefined)
				params.hidden = false;

			// 1. Create Button
			var but = function(editor, wrap)
			{
				// Call parrent constructor
				but.superclass.constructor.apply(this, arguments);
				this.id = params.id;
				this.title = params.name;
				if (params.iconClassName)
					this.className += ' ' + params.iconClassName;
				if (params.action)
					this.action = params.action;

				if (params.disabledForTextarea !== undefined)
					this.disabledForTextarea = params.disabledForTextarea;

				this.Create();

				if (params.src)
					this.pCont.firstChild.style.background = 'url("' + params.src + '") no-repeat scroll 0 0';

				if (wrap)
					wrap.appendChild(this.GetCont());
			};

			BX.extend(but, window.BXHtmlEditor.Button);
			if (params.handler)
				but.prototype.OnClick = params.handler;

			window.BXHtmlEditor.Controls[params.id] = but;

			// 2. Add button to controls map
			BX.addCustomEvent(this, "GetControlsMap", function(controlsMap)
			{
				controlsMap.push({
					id: params.id,
					compact: params.compact,
					hidden: params.hidden,
					sort: params.toolbarSort
				});
			});
		},

		AddCustomParser: function(parser)
		{
			this.phpParser.AddCustomParser(parser);
		},

		AddParser: function(parser)
		{
			if (parser && parser.name && typeof parser.obj == 'object')
			{
				this.parser.specialParsers[parser.name] = parser.obj;
			}
		},

		InsertHtml: function(html, range)
		{
			if (!this.synchro.IsFocusedOnTextarea())
			{
				this.Focus();
				if (!range)
					range = this.selection.GetRange();

				if (!range.collapsed && range.startContainer == range.endContainer && range.startContainer.nodeName !== 'BODY')
				{
					var surNode = this.util.CheckSurrogateNode(range.startContainer);
					if (surNode)
					{
						this.selection.SetAfter(surNode);
					}
				}

				this.selection.InsertHTML(html, range);
			}
		},

		ParseContentFromBbCode: function(content)
		{
			if (this.bbCode)
			{
				content = this.bbParser.Parse(content);
				content = this.Parse(content, true, true);
			}
			return content;
		}
	};
	window.BXEditor = BXEditor;


	function Sandbox(callBack, config)
	{
		this.callback = callBack || BX.DoNothing;
		this.config = config || {};
		this.editor = this.config.editor;
		this.iframe = this.CreateIframe();
		this.bSandbox = false;

		// Properties to unset/protect on the window object
		this.windowProperties = ["parent", "top", "opener", "frameElement", "frames",
			"localStorage", "globalStorage", "sessionStorage", "indexedDB"];
		//Properties on the window object which are set to an empty function
		this.windowProperties2 = ["open", "close", "openDialog", "showModalDialog", "alert", "confirm", "prompt", "openDatabase", "postMessage", "XMLHttpRequest", "XDomainRequest"];
		//Properties to unset/protect on the document object
		this.documentProperties = ["referrer", "write", "open", "close"];
	}

	Sandbox.prototype =
	{
		GetIframe: function()
		{
			return this.iframe;
		},

		GetWindow: function()
		{
			this._readyError();
		},

		GetDocument: function()
		{
			this._readyError();
		},

		Destroy: function()
		{
			var iframe = this.GetIframe();
			iframe.parentNode.removeChild(iframe);
		},

		_readyError: function()
		{
			throw new Error("Sandbox: Sandbox iframe isn't loaded yet");
		},

		CreateIframe: function()
		{
			var
				_this = this,
				iframe = BX.create("IFRAME", {
					props: {
						className: "bx-editor-iframe",
						frameborder: 0,
						allowtransparency: "true",
						width: 0,
						height: 0,
						marginwidth: 0,
						marginheight: 0
					}
				});

			iframe.onload = function()
			{
				iframe.onreadystatechange = iframe.onload = null;
				_this.OnLoadIframe(iframe);
			};

			iframe.onreadystatechange = function()
			{
				if (/loaded|complete/.test(iframe.readyState))
				{
					iframe.onreadystatechange = iframe.onload = null;
					_this.OnLoadIframe(iframe);
				}
			};

			// Append iframe to ext container
			this.config.cont.appendChild(iframe);

			return iframe;
		},

		OnLoadIframe: function(iframe)
		{
			if (BX.isNodeInDom(iframe))
			{
				var
					_this = this,
					iframeWindow = iframe.contentWindow,
					iframeDocument = iframeWindow.document;

				this.InitIframe(iframe);

				// Catch js errors and pass them to the parent's onerror event
				// addEventListener("error") doesn't work properly in some browsers
				iframeWindow.onerror = function(errorMessage, fileName, lineNumber) {
					throw new Error("Sandbox: " + errorMessage, fileName, lineNumber);
				};

				if (this.bSandbox)
				{
					// Unset a bunch of sensitive variables
					// Please note: This isn't hack safe!
					// It more or less just takes care of basic attacks and prevents accidental theft of sensitive information
					// IE is secure though, which is the most important thing, since IE is the only browser, who
					// takes over scripts & styles into contentEditable elements when copied from external websites
					// or applications (Microsoft Word, ...)
					var i, length;
					for (i = 0, length = this.windowProperties.length; i < length; i++)
					{
						this._unset(iframeWindow, this.windowProperties[i]);
					}

					for (i=0, length = this.windowProperties2.length; i < length; i++)
					{
						this._unset(iframeWindow, this.windowProperties2[i], BX.DoNothing());
					}

					for (i = 0, length = this.documentProperties.length; i < length; i++)
					{
						this._unset(iframeDocument, this.documentProperties[i]);
					}

					// This doesn't work in Safari 5
					// See http://stackoverflow.com/questions/992461/is-it-possible-to-override-document-cookie-in-webkit
					this._unset(iframeDocument, "cookie", "", true);
				}

				this.loaded = true;

				// Trigger the callback
				setTimeout(function()
				{
					_this.callback(_this);
				}, 0);
			}
		},

		InitIframe: function(iframe)
		{
			var
				iframe = this.iframe || iframe,
				iframeDocument = iframe.contentWindow.document,
				iframeHtml = this.GetHtml(this.config.stylesheets, this.editor.GetTemplateStyles());

			// Create the basic dom tree including proper DOCTYPE and charset
			iframeDocument.open("text/html", "replace");
			iframeDocument.write(iframeHtml);
			iframeDocument.close();

			this.GetWindow = function()
			{
				return iframe.contentWindow;
			};
			this.GetDocument = function()
			{
				return iframe.contentWindow.document;
			};
			this.inited = true;
			this.editor.On("OnIframeInit");
		},

		GetHtml: function(css, cssText)
		{
			var
				bodyParams = '',
				headHtml = "",
				i;

			css = typeof css === "string" ? [css] : css;
			if (css)
			{
				for (i = 0; i < css.length; i++)
					headHtml += '<link rel="stylesheet" href="' + css[i] + '">';
			}

			if (this.editor.config.bodyClass)
			{
				bodyParams += ' class="' + this.editor.config.bodyClass + '"';
			}
			if (this.editor.config.bodyId)
			{
				bodyParams += ' id="' + this.editor.config.bodyId + '"';
			}

			if (typeof cssText === "string")
			{
				headHtml += '<style type="text/css" data-bx-template-style="Y">' + cssText + '</style>';
			}

			if (this.editor.iframeCssText && this.editor.iframeCssText.length > 0)
			{
				headHtml += '<style type="text/css">' + this.editor.iframeCssText + '</style>';
			}

			headHtml += '<link id="bx-iframe-link" rel="stylesheet" href="' + this.editor.config.cssIframePath + '_' + this.editor.cssCounter++ + '">';

			return '<!DOCTYPE html><html><head>' + headHtml + '</head><body' + bodyParams + '></body></html>';
		},

		/**
		 * Method to unset/override existing variables
		 * @example
		 * // Make cookie unreadable and unwritable
		 * this._unset(document, "cookie", "", true);
		 */
		_unset: function(object, property, value, setter)
		{
			try { object[property] = value; } catch(e) {}

			try { object.__defineGetter__(property, function() { return value; }); } catch(e) {}
			if (setter) {
				try { object.__defineSetter__(property, function() {}); } catch(e) {}
			}

			if (!crashesWhenDefineProperty(property))
			{
				try {
					var config = {
						get: function() { return value; }
					};
					if (setter) {
						config.set = function() {};
					}
					Object.defineProperty(object, property, config);
				} catch(e) {}
			}
		}
	};

	function BXEditorSelection(editor)
	{
		this.editor = editor;
		this.document = editor.sandbox.GetDocument();
		BX.addCustomEvent(this.editor, 'OnIframeReInit', BX.proxy(function(){this.document = this.editor.sandbox.GetDocument();}, this));
		// Make sure that our external range library is initialized
		window.rangy.init();
	}

	BXEditorSelection.prototype =
	{
		// Get the current selection as a bookmark to be able to later restore it
		GetBookmark: function()
		{
			if (this.editor.currentViewName !== 'code')
			{
				var range = this.GetRange();
				return range && range.cloneRange();
			}
			return false;
		},

		// Restore a selection
		SetBookmark: function(bookmark)
		{
			if (bookmark && this.editor.currentViewName !== 'code')
			{
				this.SetSelection(bookmark);
			}
		},

		// Save current selection
		SaveBookmark: function()
		{
			this.lastRange = this.GetBookmark();
			return this.lastRange;
		},

		GetLastRange: function()
		{
			if (this.lastRange)
				return this.lastRange;
		},

		// Save current selection
		RestoreBookmark: function()
		{
			if (this.lastRange)
			{
				this.SetBookmark(this.lastRange);
				this.lastRange = false;
			}
		},

		/**
		 * Set the caret in front of the given node
		 * @param {Object} node The element or text node where to position the caret in front of
		 */
		SetBefore: function(node)
		{
			var range = rangy.createRange(this.document);
			range.setStartBefore(node);
			range.setEndBefore(node);
			return this.SetSelection(range);
		},

		/**
		 * Set the caret after the given node
		 *
		 * @param {Object} node The element or text node where to position the caret in front of
		 */
		SetAfter: function(node)
		{
			var range = rangy.createRange(this.document);
			range.setStartAfter(node);
			range.setEndAfter(node);
			return this.SetSelection(range);
		},

		/**
		 * Ability to select/mark nodes
		 *
		 * @param {Element} node The node/element to select
		 */
		SelectNode: function(node)
		{
			if (!node)
				return;

			var
				range = rangy.createRange(this.document),
				isElement = node.nodeType === 1,
				canHaveHTML = "canHaveHTML" in node ? node.canHaveHTML : (node.nodeName !== "IMG"),
				content = isElement ? node.innerHTML : node.data,
				isEmpty = (content === "" || content === this.editor.INVISIBLE_SPACE),
				styleDisplay = BX.style(node, 'display'),
				bBlock = (styleDisplay === "block" || styleDisplay === "list-item");

			if ((BX.browser.IsIE() || BX.browser.IsIE10() || BX.browser.IsIE11()) && node &&
				BX.util.in_array(node.nodeName.toUpperCase(), this.editor.TABLE_TAGS))
			{
				//"TD", "TR", "TH", "TABLE", "TBODY", "CAPTION", "COL", "COLGROUP", "TFOOT", "THEAD"];
				if (node.tagName == 'TABLE' || node.tagName == 'TBODY')
				{
					var
						firstRow = node.rows[0],
						lastRow = node.rows[node.rows.length - 1];

					range.setStartBefore(firstRow.cells[0]);
					range.setEndAfter(lastRow.cells[lastRow.cells.length - 1]);
				}
				else if (node.tagName == 'TR' || node.tagName == 'TH')
				{
					range.setStartBefore(node.cells[0]);
					range.setEndAfter(node.cells[node.cells.length - 1]);
				}
				else
				{
					range.setStartBefore(node);
					range.setEndAfter(node);
				}

				this.SetSelection(range);
				return range;
			}

			if (isEmpty && isElement && canHaveHTML)
			{
				// Make sure that caret is visible in node by inserting a zero width no breaking space
				try {
					node.innerHTML = this.editor.INVISIBLE_SPACE;
				} catch(e) {}
			}

			if (canHaveHTML)
				range.selectNodeContents(node);
			else
				range.selectNode(node);

			if (canHaveHTML && isEmpty && isElement)
			{
				range.collapse(bBlock);
			}
			else if (canHaveHTML && isEmpty)
			{
				range.setStartAfter(node);
				range.setEndAfter(node);
			}

			try
			{
				this.SetSelection(range);
			}
			catch(e){}

			return range;
		},

		/**
		 * Get the node which contains the selection
		 *
		 * @param {Boolean} [controlRange] (only IE) Whether it should return the selected ControlRange element when the selection type is a "ControlRange"
		 * @return {Object} The node that contains the caret
		 */
		GetSelectedNode: function(controlRange)
		{
			var
				res,
				selection,
				range;

			if (controlRange && this.document.selection && this.document.selection.type === "Control")
			{
				range = this.document.selection.createRange();
				if (range && range.length)
				{
					res = range.item(0);
				}
			}

			if (!res)
			{
				selection = this.GetSelection();
				if (selection.focusNode === selection.anchorNode)
				{
					res = selection.focusNode;
				}
			}

			if (!res)
			{
				range = this.GetRange();
				res = range ? range.commonparentContainer : this.document.body
			}

			if (res && res.ownerDocument != this.editor.GetIframeDoc())
			{
				res = this.document.body;
			}

			return res;
		},

		ExecuteAndRestore: function(method, restoreScrollPosition)
		{
			var
				body = this.document.body,
				oldScrollTop = restoreScrollPosition && body.scrollTop,
				oldScrollLeft = restoreScrollPosition && body.scrollLeft,
				className = "_bx-editor-temp-placeholder",
				placeholderHTML = '<span class="' + className + '">' + this.editor.INVISIBLE_SPACE + '</span>',
				range = this.GetRange(),
				newRange;

			// Nothing selected, execute and say goodbye
			if (!range)
			{
				method(body, body);
				return;
			}

			var node = range.createContextualFragment(placeholderHTML);
			range.insertNode(node);

			// Make sure that a potential error doesn't cause our placeholder element to be left as a placeholder
			try
			{
				method(range.startContainer, range.endContainer);
			}
			catch(e3)
			{
				setTimeout(function() { throw e3; }, 0);
			}

			var caretPlaceholder = this.document.querySelector("." + className);
			if (caretPlaceholder)
			{
				newRange = rangy.createRange(this.document);
				newRange.selectNode(caretPlaceholder);
				newRange.deleteContents();
				this.SetSelection(newRange);
			}
			else
			{
				// fallback for when all hell breaks loose
				body.focus();
			}

			if (restoreScrollPosition)
			{
				body.scrollTop = oldScrollTop;
				body.scrollLeft = oldScrollLeft;
			}

			// Remove it again, just to make sure that the placeholder is definitely out of the dom tree
			try {
				if (caretPlaceholder.parentNode)
					caretPlaceholder.parentNode.removeChild(caretPlaceholder);
			} catch(e4) {}
		},

		/**
		 * Different approach of preserving the selection (doesn't modify the dom)
		 * Takes all text nodes in the selection and saves the selection position in the first and last one
		 */
		ExecuteAndRestoreSimple: function(method)
		{
			var
				range = this.GetRange(),
				body = this.document.body,
				newRange,
				firstNode,
				lastNode,
				textNodes,
				rangeBackup;

			// Nothing selected, execute and say goodbye
			if (!range)
			{
				method(body, body);
				return;
			}

			textNodes = range.getNodes([3]);
			firstNode = textNodes[0] || range.startContainer;
			lastNode = textNodes[textNodes.length - 1] || range.endContainer;

			rangeBackup = {
				collapsed: range.collapsed,
				startContainer: firstNode,
				startOffset: firstNode === range.startContainer ? range.startOffset : 0,
				endContainer: lastNode,
				endOffset: lastNode === range.endContainer ? range.endOffset : lastNode.length
			};

			try
			{
				method(range.startContainer, range.endContainer);
			}
			catch(e)
			{
				setTimeout(function() { throw e; }, 0);
			}

			newRange = rangy.createRange(this.document);
			try { newRange.setStart(rangeBackup.startContainer, rangeBackup.startOffset); } catch(e1) {}
			try { newRange.setEnd(rangeBackup.endContainer, rangeBackup.endOffset); } catch(e2) {}
			try { this.SetSelection(newRange); } catch(e3) {}
		},

		/**
		 * Insert html at the caret position and move the cursor after the inserted html
		 *
		 * @param {String} html HTML string to insert
		 */
		InsertHTML: function(html, range)
		{
			var
				rng = rangy.createRangyRange(this.document),
				node = rng.createContextualFragment(html),
				lastChild = node.lastChild;

			this.InsertNode(node, range);
			if (lastChild)
			{
				this.SetAfter(lastChild);
			}

			this.editor.On('OnInsertHtml');
		},

		/**
		 * Insert a node at the caret position and move the cursor behind it
		 *
		 * @param {Object} node HTML string to insert
		 */
		InsertNode: function(node, range)
		{
			if (!range)
				range = this.GetRange();

			if (range)
			{
				range.insertNode(node);
			}

			this.editor.On('OnInsertHtml');
		},

		RemoveNode: function(node)
		{
			this.editor.On('OnHtmlContentChangedByControl');
			var
				parent = node.parentNode,
				cursorNode = node.nextSibling;
			BX.remove(node);
			this.editor.util.Refresh(parent);

			if (cursorNode)
			{
				this.editor.selection.SetBefore(cursorNode);
				this.editor.Focus();
			}
			this.editor.synchro.StartSync(100);
		},

		/**
		 * Wraps current selection with the given node
		 *
		 * @param {Object} node The node to surround the selected elements with
		 * @param {Object} range Current range
		 */
		Surround: function(node, range)
		{
			range = range || this.GetRange();
			if (range)
			{
				try
				{
					// This only works when the range boundaries are not overlapping other elements
					range.surroundContents(node);
					this.SelectNode(node);
				}
				catch(e)
				{
					node.appendChild(range.extractContents());
					range.insertNode(node);
				}
			}
		},

		/**
		 * Scroll the current caret position into the view
		 * TODO: Dirty hack ...might be a smarter way of doing this
		 */
//		ScrollIntoView: function()
//		{
//			var doc           = this.doc,
//				hasScrollBars = doc.documentElement.scrollHeight > doc.documentElement.offsetHeight,
//				tempElement   = doc._wysihtml5ScrollIntoViewElement = doc._wysihtml5ScrollIntoViewElement || (function() {
//					var element = doc.createElement("span");
//					// The element needs content in order to be able to calculate it's position properly
//					element.innerHTML = wysihtml5.INVISIBLE_SPACE;
//					return element;
//				})(),
//				offsetTop;
//
//			if (hasScrollBars) {
//				this.insertNode(tempElement);
//				offsetTop = _getCumulativeOffsetTop(tempElement);
//				tempElement.parentNode.removeChild(tempElement);
//				if (offsetTop > doc.body.scrollTop) {
//					doc.body.scrollTop = offsetTop;
//				}
//			}
//		},
//

		ScrollIntoView: function()
		{
			var
				node,
				_this = this,
				doc = this.document,
				bScrollBars = doc.documentElement.scrollHeight > doc.documentElement.offsetHeight;

			if (bScrollBars)
			{
				var
					tempNode = doc.__scrollIntoViewElement = doc.__scrollIntoViewElement || (function()
					{
						return BX.create("SPAN", {html: _this.editor.INVISIBLE_SPACE}, doc);
					})(),
					top = 0;

				this.InsertNode(tempNode);

				if (tempNode.parentNode)
				{
					node = tempNode;
					do
					{
						top += node.offsetTop || 0;
						node = node.offsetParent;
					} while (node);
				}
				tempNode.parentNode.removeChild(tempNode);

				// doc.documentElement.scrollTop or doc.body.scrollTop ?
				if (top > doc.documentElement.scrollTop)
				{
					doc.documentElement.scrollTop = top;
				}
			}
		},

		/**
		 * Select line where the caret is in
		 */
		SelectLine: function()
		{
			// See https://developer.mozilla.org/en/DOM/Selection/modify
			var bSelectionModify = "getSelection" in window && "modify" in window.getSelection();
			if (bSelectionModify)
			{
				var
					win = this.document.defaultView,
					selection = win.getSelection();
				selection.modify("move", "left", "lineboundary");
				selection.modify("extend", "right", "lineboundary");
			}
			else if (this.document.selection) // IE
			{
				var
					range = this.document.selection.createRange(),
					rangeTop = range.boundingTop,
					rangeHeight = range.boundingHeight,
					scrollWidth = this.document.body.scrollWidth,
					rangeBottom,
					rangeEnd,
					measureNode,
					i,
					j;

				if (!range.moveToPoint)
					return;

				if (rangeTop === 0)
				{
					// Don't know why, but when the selection ends at the end of a line
					// range.boundingTop is 0
					measureNode = this.document.createElement("span");
					this.insertNode(measureNode);
					rangeTop = measureNode.offsetTop;
					measureNode.parentNode.removeChild(measureNode);
				}
				rangeTop += 1;

				for (i =- 10; i < scrollWidth; i += 2)
				{
					try {
						range.moveToPoint(i, rangeTop);
						break;
					} catch(e1) {}
				}

				// Investigate the following in order to handle multi line selections
				// rangeBottom = rangeTop + (rangeHeight ? (rangeHeight - 1) : 0);
				rangeBottom = rangeTop;
				rangeEnd = this.document.selection.createRange();
				for (j = scrollWidth; j >= 0; j--)
				{
					try
					{
						rangeEnd.moveToPoint(j, rangeBottom);
						break;
					} catch(e2) {}
				}

				range.setEndPoint("EndToEnd", rangeEnd);
				range.select();
			}
		},

		GetText: function()
		{
			var selection = this.GetSelection();
			return selection ? selection.toString() : "";
		},

		GetNodes: function(nodeType, filter)
		{
			var range = this.GetRange();
			if (range)
				return range.getNodes([nodeType], filter);
			else
				return [];
		},

		GetRange: function(selection)
		{
			if (!selection)
			{
				if (!this.editor.iframeView.IsFocused())
				{
					this.editor.iframeView.Focus();
				}

				selection = this.GetSelection();
			}
			return selection && selection.rangeCount && selection.getRangeAt(0);
		},

		GetSelection: function(doc)
		{
			return rangy.getSelection(doc || this.document.defaultView || this.document.parentWindow);
		},

		SetSelection: function(range)
		{
			var
				win = this.document.defaultView || this.document.parentWindow,
				selection = rangy.getSelection(win);
			return selection.setSingleRange(range);
		},

		GetStructuralTags: function()
		{
			if (!this.structuralTags)
			{
				var tblRe = /^TABLE/i;
				this.structuralTags = {
					'LI': /^UL|OL|MENU/i,
					'DT': /^DL/i,
					'DD': /^DL/i,
					// table
					'TD': tblRe,
					'TR': tblRe,
					'TH': tblRe,
					'TBODY': tblRe,
					'TFOOT': tblRe,
					'THEAD': tblRe,
					'CAPTION': tblRe,
					'COL': tblRe,
					'COLGROUP': tblRe
				};
				this.structuralTagsMatchRe = /^LI|DT|DD|TD|TR|TH|TBODY|CAPTION|COL|COLGROUP|TFOOT|THEAD/i;
			}
			return this.structuralTags;
		},

		SetCursorBeforeNode: function(e)
		{

		},

		_GetNonTextLastChild: function(n)
		{
			var res = n.lastChild;
			while (res.nodeType != 1 && res.previousSibling)
				res = res.previousSibling;

			return res.nodeType == 1 ? res : false;
		},

		_GetNonTextFirstChild: function(n)
		{
			var res = n.firstChild;
			while (res.nodeType != 1 && res.nextSibling)
				res = res.nextSibling;

			return res.nodeType == 1 ? res : false;
		},

		_MoveCursorBeforeNode: function(node)
		{
			var
				_this = this,
				possibleParentRe, parNode, isFirstNode;

			this.GetStructuralTags();

			// Check if it's child node which have special parent
			// We can't add text node and put carret <td> and <tr> or between <li>...
			// So we trying handle the only case when carret before beginning of the first child of our structural tags (UL, OL, MENU, DIR, TABLE, DL)
			if (node.nodeType == 1 && node.nodeName.match(this.structuralTagsMatchRe))
			{
				isFirstNode = this._GetNonTextFirstChild(node.parentNode) === node;
				if (!isFirstNode)
				{
					return;
				}

				possibleParentRe = this.structuralTags[node.nodeName];
				if (possibleParentRe)
				{
					parNode = BX.findParent(node, function(n)
					{
						if (n.nodeName.match(possibleParentRe))
						{
							return true;
						}

						isFirstNode = isFirstNode && _this._GetNonTextFirstChild(n.parentNode) === n;
						return false;
					}, node.ownerDocument.BODY);

					if (parNode && isFirstNode)
					{
						node = parNode; // Put carret before parrent tag
					}
					else
					{
						return;
					}
				}
			}

			this.SetInvisibleTextBeforeNode(node);
		},

		_MoveCursorAfterNode: function(node)
		{
			var
				_this = this,
				possibleParentRe, parNode, isLastNode;

			this.GetStructuralTags();
			// Check if it's child node which have special parent
			// We can't add text node and put carret <td> and <tr> or between <li>...
			// So we trying handle the only case when carret in the end of the last child of last child of our structural tags (UL, OL, MENU, DIR, TABLE, DL)
			if (node.nodeType == 1 && node.nodeName.match(this.structuralTagsMatchRe))
			{
				isLastNode = this._GetNonTextLastChild(node.parentNode) === node;
				if (!isLastNode)
				{
					return;
				}

				possibleParentRe = this.structuralTags[node.nodeName];
				if (possibleParentRe)
				{
					parNode = BX.findParent(node, function(n)
					{
						if (n.nodeName.match(possibleParentRe))
						{
							return true;
						}

						isLastNode = isLastNode && _this._GetNonTextLastChild(n.parentNode) === n;
						return false;
					}, node.ownerDocument.BODY);

					if (parNode && isLastNode)
					{
						node = parNode; // Put carret after parrent tag
					}
					else
					{
						return;
					}
				}
			}

			this.SetInvisibleTextAfterNode(node);
		},

		SaveRange: function()
		{
			var range = this.GetRange();
			this.lastCheckedRange = {endOffset: range.endOffset, endContainer: range.endContainer};
		},

		CheckLastRange: function(range)
		{
			return this.lastCheckedRange && this.lastCheckedRange.endOffset == range.endOffset && this.lastCheckedRange.endContainer == range.endContainer;
		},

		SetInvisibleTextAfterNode: function(node, setCursorBefore)
		{
			var invis_text = this.editor.util.GetInvisibleTextNode();
			if (node.nextSibling && node.nextSibling.nodeType == 3 && this.editor.util.IsEmptyNode(node.nextSibling))
			{
				this.editor.util.ReplaceNode(node.nextSibling, invis_text);
			}
			else
			{
				this.editor.util.InsertAfter(invis_text, node);
			}

			if (setCursorBefore)
			{
				this.SetBefore(invis_text);
			}
			else
			{
				this.SetAfter(invis_text);
			}

			this.editor.Focus();
		},

		SetInvisibleTextBeforeNode: function(node)
		{
			var invis_text = this.editor.util.GetInvisibleTextNode();
			if (node.previousSibling && node.previousSibling.nodeType == 3 && this.editor.util.IsEmptyNode(node.previousSibling))
			{
				this.editor.util.ReplaceNode(node.previousSibling, invis_text);
			}
			else
			{
				node.parentNode.insertBefore(invis_text, node);
			}

			this.SetBefore(invis_text);
			this.editor.Focus();
		},

		GetCommonAncestorForRange: function(range)
		{
			return range.collapsed ?
				range.startContainer :
				rangy.dom.getCommonAncestor(range.startContainer, range.endContainer);
		}
	};

	function NodeMerge(firstNode)
	{
		this.isElementMerge = (firstNode.nodeType == 1);
		this.firstTextNode = this.isElementMerge ? firstNode.lastChild : firstNode;
		this.textNodes = [this.firstTextNode];
	}

	NodeMerge.prototype = {
		DoMerge: function()
		{
			var textBits = [], textNode, parent, text;
			for (var i = 0, len = this.textNodes.length; i < len; ++i)
			{
				textNode = this.textNodes[i];
				parent = textNode.parentNode;
				textBits[i] = textNode.data;
				if (i)
				{
					parent.removeChild(textNode);
					if (!parent.hasChildNodes())
						parent.parentNode.removeChild(parent);
				}
			}
			this.firstTextNode.data = text = textBits.join("");
			return text;
		},

		GetLength: function()
		{
			var i = this.textNodes.length, len = 0;
			while (i--)
				len += this.textNodes[i].length;
			return len;
		}

//		ToString: function()
//		{
//			var textBits = [];
//
//			for (var i = 0, len = this.textNodes.length; i < len; ++i)
//				textBits[i] = "'" + this.textNodes[i].data + "'";
//
//			return "[Merge(" + textBits.join(",") + ")]";
//		}
	};

	function HTMLStyler(editor, tagNames, arStyle, cssClass, normalize)
	{
		this.editor = editor;
		this.document = editor.iframeView.document;
		this.tagNames = tagNames || [defaultTagName];
		this.arStyle = arStyle || {};
		this.cssClass = cssClass || "";
		this.similarClassRegExp = null;
		this.normalize = normalize;
		this.applyToAnyTagName = false;
	}

	HTMLStyler.prototype =
	{
		GetStyledParent: function(node, bMatchCss)
		{
			bMatchCss = bMatchCss !== false;
			var cssClassMatch, cssStyleMatch;
			while (node)
			{
				if (node.nodeType == 1)
				{
					cssStyleMatch = this.CheckCssStyle(node, bMatchCss);
					cssClassMatch = this.CheckCssClass(node);

					if (BX.util.in_array(node.tagName.toLowerCase(), this.tagNames) && cssClassMatch && cssStyleMatch)
						return node;
				}

				node = node.parentNode;
			}
			return false;
		},

		CheckCssStyle: function(node, bMatch)
		{
			return this.editor.util.CheckCss(node, this.arStyle, bMatch);
		},

		SimplifyNodesWithCss: function(node)
		{
			var i, parent = node.parentNode;
			if (parent.childNodes.length == 1) // container over our node
			{
				if (node.nodeName == parent.nodeName)
				{
					for (i in this.arStyle)
					{
						if (this.arStyle.hasOwnProperty(i) && node.style[i])
						{
							parent.style[i] = node.style[i];
						}
					}
					this.editor.util.ReplaceWithOwnChildren(node);
				}
				else
				{
					for (i in this.arStyle)
					{
						if (this.arStyle.hasOwnProperty(i) && parent.style[i] && node.style[i])
						{
							parent.style[i] = '';
						}
					}
				}
			}
		},

		CheckCssClass: function(node)
		{
			return !this.cssClass || (this.cssClass && BX.hasClass(node, this.cssClass));
		},

		// Normalizes nodes after applying a CSS class to a Range.
		PostApply: function(textNodes, range)
		{
			var
				i,
				firstNode = textNodes[0],
				lastNode = textNodes[textNodes.length - 1],
				merges = [],
				currentMerge,
				rangeStartNode = firstNode,
				rangeEndNode = lastNode,
				rangeStartOffset = 0,
				rangeEndOffset = lastNode.length,
				textNode, precedingTextNode;

			for (i = 0; i < textNodes.length; ++i)
			{
				textNode = textNodes[i];
				precedingTextNode = this.GetAdjacentMergeableTextNode(textNode.parentNode, false);
				if (precedingTextNode)
				{
					if (!currentMerge)
					{
						currentMerge = new NodeMerge(precedingTextNode);
						merges.push(currentMerge);
					}
					currentMerge.textNodes.push(textNode);

					if (textNode === firstNode)
					{
						rangeStartNode = currentMerge.firstTextNode;
						rangeStartOffset = rangeStartNode.length;
					}

					if (textNode === lastNode)
					{
						rangeEndNode = currentMerge.firstTextNode;
						rangeEndOffset = currentMerge.GetLength();
					}
				}
				else
				{
					currentMerge = null;
				}
			}

			// Test whether the first node after the range needs merging
			var nextTextNode = this.GetAdjacentMergeableTextNode(lastNode.parentNode, true);
			if (nextTextNode)
			{
				if (!currentMerge)
				{
					currentMerge = new NodeMerge(lastNode);
					merges.push(currentMerge);
				}
				currentMerge.textNodes.push(nextTextNode);
			}

			// Do the merges
			if (merges.length)
			{
				for (i = 0; i < merges.length; ++i)
					merges[i].DoMerge();

				// Set the range boundaries
				range.setStart(rangeStartNode, rangeStartOffset);
				range.setEnd(rangeEndNode, rangeEndOffset);
			}


			// Simplify elements
			textNodes = range.getNodes([3]);

			for (i = 0; i < textNodes.length; ++i)
			{
				textNode = textNodes[i];
				this.SimplifyNodesWithCss(textNode.parentNode);
			}
		},

		NormalizeNewNode: function(node, range)
		{
			var
				parent = node.parentNode;

			if (parent && parent.nodeName !== 'BODY')
			{
				var
					childs = this.GetNonEmptyChilds(parent),
					cssStyleMatch = this.CheckCssStyle(parent, false),
					cssClassMatch = this.CheckCssClass(parent);

				if (childs.length == 1 && parent.nodeName == node.nodeName && cssStyleMatch && cssClassMatch)
				{
					parent.parentNode.insertBefore(node, parent);
					BX.remove(parent);
				}
			}

			return range;
		},

		GetNonEmptyChilds: function(node)
		{
			var
				i,
				childs = node.childNodes,
				res = [];

			for (i = 0; i < childs.length; i++)
			{
				if (childs[i].nodeType == 1 ||
					(childs[i].nodeType == 3
						&& childs[i].nodeValue != ""
						&& childs[i].nodeValue != this.editor.INVISIBLE_SPACE
						&& !childs[i].nodeValue.match(/^[\s\n\r\t]+$/ig)))
				{
					res.push(childs[i]);
				}
			}
			return res;
		},

		GetAdjacentMergeableTextNode: function(node, forward)
		{
			var
				isTextNode = (node.nodeType == 3),
				el = isTextNode ? node.parentNode : node,
				adjacentNode,
				propName = forward ? "nextSibling" : "previousSibling";

			if (isTextNode)
			{
				// Can merge if the node's previous/next sibling is a text node
				adjacentNode = node[propName];
				if (adjacentNode && adjacentNode.nodeType == 3)
				{
					return adjacentNode;
				}
			}
			else
			{
				// Compare element with its sibling
				adjacentNode = el[propName];
				if (adjacentNode && this.AreElementsMergeable(node, adjacentNode))
				{
					return adjacentNode[forward ? "firstChild" : "lastChild"];
				}
			}
			return null;
		},

		AreElementsMergeable: function(el1, el2)
		{
			return rangy.dom.arrayContains(this.tagNames, (el1.tagName || "").toLowerCase())
				&& rangy.dom.arrayContains(this.tagNames, (el2.tagName || "").toLowerCase())
				&& el1.className.replace(/\s+/g, " ") == el2.className.replace(/\s+/g, " ")
				&& this.CompareNodeAttributes(el1, el2);
		},

		CompareNodeAttributes: function(el1, el2)
		{
			if (el1.attributes.length != el2.attributes.length)
				return false;

			var i, len = el1.attributes.length, attr1, attr2, name;
			for (i = 0; i < len; i++)
			{
				attr1 = el1.attributes[i];
				name = attr1.name;
				if (name != "class")
				{
					attr2 = el2.attributes.getNamedItem(name);
					if (attr1.specified != attr2.specified)
						return false;

					if (attr1.specified && attr1.nodeValue !== attr2.nodeValue)
					{
						return false;
					}
				}
			}
			return true;
		},

		CreateContainer: function()
		{
			var el = this.document.createElement(this.tagNames[0]);
			if (this.cssClass)
			{
				el.className = this.cssClass;
			}
			if (this.arStyle)
			{
				for (var i in this.arStyle)
				{
					if (this.arStyle.hasOwnProperty(i))
					{
						el.style[i] = this.arStyle[i];
					}
				}
			}
			return el;
		},

		ApplyToTextNode: function(textNode)
		{
			var parent = textNode.parentNode, i;

			if (parent.childNodes.length == 1 && BX.util.in_array(parent.tagName.toLowerCase(), this.tagNames))
			{
				if (this.cssClass)
				{
					BX.addClass(parent, this.cssClass);
				}

				if (this.arStyle)
				{
					for (i in this.arStyle)
					{
						if (this.arStyle.hasOwnProperty(i))
						{
							parent.style[i] = this.arStyle[i];
						}
					}
				}
			}
			else
			{
				if (parent.childNodes.length == 1) // container over the text node
				{
					if (this.cssClass && BX.hasClass(parent, this.cssClass))
					{
						BX.removeClass(parent, this.cssClass);
					}

					if (this.arStyle)
					{
						for (i in this.arStyle)
						{
							if (this.arStyle.hasOwnProperty(i) && parent.style[i])
							{
								parent.style[i] = '';
							}
						}
					}
				}

				var el = this.CreateContainer();
				textNode.parentNode.insertBefore(el, textNode);
				el.appendChild(textNode);
			}
		},

		IsRemovable: function(el)
		{
			return rangy.dom.arrayContains(this.tagNames, el.tagName.toLowerCase()) && BX.util.trim(el.className) == this.cssClass;
		},

		IsAvailableTextNodeParent: function(node)
		{
			return node && node.nodeName &&
				node.nodeName !== 'OL' && node.nodeName !== 'UL' && node.nodeName !== 'MENU' && // LLIST
				node.nodeName !== 'TBODY' && node.nodeName !== 'TFOOT' && node.nodeName !== 'THEAD' && node.nodeName !== 'TABLE' && // TABLE
				node.nodeName !== 'DL';
		},

		UndoToTextNode: function(textNode, range, styledParent)
		{
			if (!range.containsNode(styledParent))
			{
				// Split out the portion of the parent from which we can remove the CSS class
				var parentRange = range.cloneRange();
				parentRange.selectNode(styledParent);

				if (parentRange.isPointInRange(range.endContainer, range.endOffset) && this.editor.util.IsSplitPoint(range.endContainer, range.endOffset) && range.endContainer.nodeName !== 'BODY')
				{
					this.editor.util.SplitNodeAt(styledParent, range.endContainer, range.endOffset);
					range.setEndAfter(styledParent);
				}

				if (parentRange.isPointInRange(range.startContainer, range.startOffset) && this.editor.util.IsSplitPoint(range.startContainer, range.startOffset) && range.startContainer.nodeName !== 'BODY')
				{
					styledParent = this.editor.util.SplitNodeAt(styledParent, range.startContainer, range.startOffset);
				}
			}

			if (styledParent && styledParent.nodeName != 'BODY' && this.IsRemovable(styledParent))
			{
				if (this.arStyle)
				{
					for (var i in this.arStyle)
					{
						if (this.arStyle.hasOwnProperty(i) && styledParent.style[i])
						{
							styledParent.style[i] = '';
						}
					}
				}

				if (!styledParent.style.cssText || BX.util.trim(styledParent.style.cssText) === '')
				{
					this.editor.util.ReplaceWithOwnChildren(styledParent);
				}
				else if (this.tagNames.length > 1 || this.tagNames[0] !== 'span')
				{
					this.editor.util.RenameNode(styledParent, "span");
				}
			}
		},

		ApplyToRange: function(range)
		{
			var textNodes = range.getNodes([3]);
			if (!textNodes.length)
			{
				try {
					var node = this.CreateContainer();
					range.surroundContents(node);

					range = this.NormalizeNewNode(node, range);
					this.SelectNode(range, node);


					return range;
				} catch(e) {}
			}

			range.splitBoundaries();
			textNodes = range.getNodes([3]);

			if (!textNodes.length && range.collapsed && range.startContainer == range.endContainer)
			{
				var inv = this.editor.util.GetInvisibleTextNode();
				this.editor.selection.InsertNode(inv);
				textNodes = [inv];
			}

			if (textNodes.length)
			{
				var textNode;

				for (var i = 0, len = textNodes.length; i < len; ++i)
				{
					textNode = textNodes[i];
					if (!this.GetStyledParent(textNode) && this.IsAvailableTextNodeParent(textNode.parentNode))
					{
						this.ApplyToTextNode(textNode);
					}
				}

				range.setStart(textNodes[0], 0);
				textNode = textNodes[textNodes.length - 1];
				range.setEnd(textNode, textNode.length);

				if (this.normalize)
				{
					this.PostApply(textNodes, range);
				}
			}

			return range;
		},

		UndoToRange: function(range, bMatchCss)
		{
			var
				textNodes = range.getNodes([3]),
				textNode,
				styledParent;

			bMatchCss = bMatchCss !== false;

			if (textNodes.length)
			{
				range.splitBoundaries();
				textNodes = range.getNodes([3]);
			}
			else
			{
				var node = this.editor.util.GetInvisibleTextNode();
				range.insertNode(node);
				range.selectNode(node);
				textNodes = [node];
			}

			var i, len, sorted = [];
			for (i = 0, len = textNodes.length; i < len; i++)
			{
				sorted.push({node: textNodes[i], nesting: this.GetNodeNesting(textNodes[i])});
			}

			sorted = sorted.sort(function(a, b){return b.nesting - a.nesting});

			for (i = 0, len = sorted.length; i < len; i++)
			{
				textNode = sorted[i].node;
				styledParent = this.GetStyledParent(textNode, bMatchCss);
				if (styledParent)
				{
					this.UndoToTextNode(textNode, range, styledParent);
					range = this.editor.selection.GetRange();
				}
			}

			if (len == 1)
			{
				this.SelectNode(range, textNodes[0]);
			}
			else
			{
				range.setStart(textNodes[0], 0);
				range.setEnd(textNodes[textNodes.length - 1], textNodes[textNodes.length - 1].length);
				this.editor.selection.SetSelection(range);

				if (this.normalize)
				{
					this.PostApply(textNodes, range);
				}
			}

			return range;
		},

		// Node dom offset
		GetNodeNesting: function(node)
		{
			return this.editor.util.GetNodeDomOffset(node);
		},

		SelectNode: function(range, node)
		{
			var
				isElement = node.nodeType === 1,
				canHaveHTML = "canHaveHTML" in node ? node.canHaveHTML : true,
				content = isElement ? node.innerHTML : node.data,
				isEmpty = (content === "" || content === this.editor.INVISIBLE_SPACE);

			if (isEmpty && isElement && canHaveHTML)
			{
				// Make sure that caret is visible in node by inserting a zero width no breaking space
				try {node.innerHTML = this.editor.INVISIBLE_SPACE;} catch(e) {}
			}

			range.selectNodeContents(node);
			if (isEmpty && isElement)
			{
				range.collapse(false);
			}
			else if (isEmpty)
			{
				range.setStartAfter(node);
				range.setEndAfter(node);
			}
		},

		GetTextSelectedByRange: function(textNode, range)
		{
			var textRange = range.cloneRange();
			textRange.selectNodeContents(textNode);

			var intersectionRange = textRange.intersection(range);
			var text = intersectionRange ? intersectionRange.toString() : "";
			textRange.detach();

			return text;
		},

		IsAppliedToRange: function(range, bMatchCss)
		{
			var
				parents = [],
				parent,
				textNodes = range.getNodes([3]);
			bMatchCss = bMatchCss !== false;

			if (!textNodes.length)
			{
				parent = this.GetStyledParent(range.startContainer, bMatchCss);
				return parent ? [parent] : false;
			}

			var i, selectedText;
			for (i = 0; i < textNodes.length; ++i)
			{
				selectedText = this.GetTextSelectedByRange(textNodes[i], range);
				parent = this.GetStyledParent(textNodes[i], bMatchCss);
				if (selectedText != "" && !parent)
				{
					return false;
				}
				else
				{
					parents.push(parent);
				}
			}
			return parents;
		},

		ToggleRange: function(range)
		{
			return this.IsAppliedToRange(range) ? this.UndoToRange(range) : this.ApplyToRange(range);
		}
	};

	function BXEditorUndoManager(editor)
	{
		this.editor = editor;
		this.history = [this.editor.iframeView.GetValue()];
		this.position = 1;
		this.document = editor.sandbox.GetDocument();
		this.historyLength = 30;
		BX.addCustomEvent(this.editor, 'OnIframeReInit', BX.proxy(function(){this.document = this.editor.sandbox.GetDocument();}, this));
		this.Init();
	}

	BXEditorUndoManager.prototype = {
		Init: function()
		{
			var _this = this;
			BX.addCustomEvent(this.editor, "OnHtmlContentChangedByControl", BX.delegate(this.Transact, this));
			BX.addCustomEvent(this.editor, "OnIframeNewWord", BX.delegate(this.Transact, this));
			BX.addCustomEvent(this.editor, "OnIframeKeyup", BX.delegate(this.Transact, this));
			BX.addCustomEvent(this.editor, "OnBeforeCommandExec", function(isContentAction)
			{
				if (isContentAction)
				{
					_this.Transact();
				}
			});

			// CTRL+Z and CTRL+Y and handle DEL & BACKSPACE
			BX.addCustomEvent(this.editor, "OnIframeKeydown", BX.proxy(this.Keydown, this));
		},

		Keydown: function(e, keyCode, command, selectedNode)
		{
			if (e.ctrlKey || e.metaKey)
			{
				var
					isUndo = keyCode === this.editor.KEY_CODES['z'] && !e.shiftKey,
					isRedo = (keyCode === this.editor.KEY_CODES['z'] && e.shiftKey) || (keyCode === this.editor.KEY_CODES['y']);

				if (isUndo)
				{
					this.Undo();
					return BX.PreventDefault(e);
				}
				else if (isRedo)
				{
					this.Redo();
					return BX.PreventDefault(e);
				}
			}

			if (keyCode !== this.lastKey)
			{
				if (keyCode === this.editor.KEY_CODES['backspace'] || keyCode === this.editor.KEY_CODES['delete'])
				{
					this.Transact();
				}
				this.lastKey = keyCode;
			}
		},

		Transact: function()
		{
			var
				previousHtml = this.history[this.position - 1],
				currentHtml = this.editor.iframeView.GetValue();

			if (currentHtml !== previousHtml)
			{
				var length = this.history.length = this.position;
				if (length > this.historyLength)
				{
					this.history.shift();
					this.position--;
				}

				this.position++;
				this.history.push(currentHtml);

				this.CheckControls();
			}
		},

		Undo: function()
		{
			if (this.position > 1)
			{
				this.Transact();
				this.position--;
				this.Set(this.history[this.position - 1]);
				this.editor.On("OnUndo");
				this.CheckControls();
			}
		},

		Redo: function()
		{
			if (this.position < this.history.length)
			{
				this.position++;
				this.Set(this.history[this.position - 1]);
				this.editor.On("OnRedo");
				this.CheckControls();
			}
		},

		Set: function(html)
		{
			this.editor.iframeView.SetValue(html);
			this.editor.Focus(true);
		},

		CheckControls: function()
		{
			this.editor.On("OnEnableUndo", [this.position > 1]);
			this.editor.On("OnEnableRedo", [this.position < this.history.length]);
		}
	};

	function BXStyles(editor)
	{
		this.editor = editor;
		this.arStyles = {};
		this.sStyles = '';
	}

	BXStyles.prototype = {
		CreateIframe: function(styles)
		{
			this.cssIframe = document.body.appendChild(BX.create("IFRAME", {props: {className: "bx-editor-css-iframe"}}));
			this.iframeDocument = this.cssIframe.contentDocument || this.cssIframe.contentWindow.document;
			this.iframeDocument.open("text/html", "replace");
			this.iframeDocument.write('<!DOCTYPE html><html><head><style type="text/css" data-bx-template-style="Y">' + styles + '</style></head><body></body></html>');
			this.iframeDocument.close();
		},

		GetCSS: function(templateId, styles, templatePath, filter)
		{
			if (!this.arStyles[templateId])
			{
				if (!this.cssIframe)
				{
					this.cssIframe = this.CreateIframe(styles);
				}
				else
				{
					var
						i,
						doc = this.iframeDocument,
						head = doc.head || doc.getElementsByTagName('HEAD')[0],
						styleNodes = head.getElementsByTagName('STYLE');

					// Clean old template styles
					for (i = 0; i < styleNodes.length; i++)
					{
						if (styleNodes[i].getAttribute('data-bx-template-style') == 'Y')
							BX.cleanNode(styleNodes[i], true);
					}

					// Add new node in the iframe head
					if (styles)
					{
						head.appendChild(BX.create('STYLE', {props: {type: 'text/css'}, text: styles}, doc)).setAttribute('data-bx-template-style', 'Y');
					}
				}

				this.arStyles[templateId] = this.ParseCss();
			}

			var res = this.arStyles[templateId];
			if (filter)
			{
				var filteredRes = [], tag;
				if (typeof filter != 'object' )
				{
					filter = [filter];
				}
				filter.push('DEFAULT');
				for (i = 0; i < filter.length; i++)
				{
					tag = filter[i];
					if (res[tag] && typeof res[tag] == 'object')
					{
						filteredRes = filteredRes.concat(res[tag]);
					}
				}
				res = filteredRes;
			}

			return res;
		},

		ParseCss: function()
		{
			var
				doc = this.iframeDocument,
				arAllSt = [],
				result = {},
				rules,
				cssTag, arTags, i, j, k,
				t1, t2, l1, l2, l3;

			if(!doc.styleSheets)
			{
				return result;
			}

			var x1 = doc.styleSheets;
			for(i = 0, l1 = x1.length; i < l1; i++)
			{
				rules = (x1[i].rules ? x1[i].rules : x1[i].cssRules);
				for(j = 0, l2 = rules.length; j < l2; j++)
				{
					if (rules[j].type != rules[j].STYLE_RULE)
					{
						continue;
					}

					cssTag = rules[j].selectorText;
					arTags = cssTag.split(",");
					for(k = 0, l3 = arTags.length; k < l3; k++)
					{
						t1 = arTags[k].split(" ");
						t1 = t1[t1.length - 1].trim();

						if(t1.substr(0, 1) == '.')
						{
							t1 = t1.substr(1);
							t2 = 'DEFAULT';
						}
						else
						{
							t2 = t1.split(".");
							t1 = (t2.length > 1) ? t2[1] : '';
							t2 = t2[0].toUpperCase();
						}

						if(!arAllSt[t1])
						{
							arAllSt[t1] = true;
							if(!result[t2])
							{
								result[t2] = [];
							}
							result[t2].push({className: t1, original: arTags[k], cssText: rules[j].style.cssText});
						}
					}
				}
			}
			return result;
		}
	};


	// Parse rules
	/**
	 * Full HTML5 compatibility rule set
	 * These rules define which tags and css classes are supported and which tags should be specially treated.
	 *
	 * Examples based on this rule set:
	 *
	 * <a href="http://foobar.com">foo</a>
	 * ... becomes ...
	 * <a href="http://foobar.com" target="_blank" rel="nofollow">foo</a>
	 *
	 * <img align="left" src="http://foobar.com/image.png">
	 * ... becomes ...
	 * <img class="wysiwyg-float-left" src="http://foobar.com/image.png" alt="">
	 *
	 * <div>foo<script>alert(document.cookie)</script></div>
	 * ... becomes ...
	 * <div>foo</div>
	 *
	 * <marquee>foo</marquee>
	 * ... becomes ...
	 * <span>foo</marquee>
	 *
	 * foo <br clear="both"> bar
	 * ... becomes ...
	 * foo <br class="wysiwyg-clear-both"> bar
	 *
	 * <div>hello <iframe src="http://google.com"></iframe></div>
	 * ... becomes ...
	 * <div>hello </div>
	 *
	 * <center>hello</center>
	 * ... becomes ...
	 * <div class="wysiwyg-text-align-center">hello</div>
	 */
	__BXHtmlEditorParserRules = {
		/**
		 * CSS Class white-list
		 * Following css classes won't be removed when parsed by the parser
		 */
		classes: {},

		"tags": {
			"b": {clean_empty: true},
			"strong": {clean_empty: true},
			"i": {clean_empty: true},
			"em": {clean_empty: true},
			"u": {clean_empty: true},
			"del": {clean_empty: true},
			"s": {rename_tag: "del"},
			"strike": {rename_tag: "del"},

			// headers
			"h1": {},
			"h2": {},
			"h3": {},
			"h4": {},
			"h5": {},
			"h6": {},

			// popular tags
			"span": {clean_empty: true},
			"p": {},
			"br": {},
			"div": {},
			"hr": {},
			"nobr": {},
			"code": {},
			"section": {},
			"figure": {},
			"figcaption": {},
			"fieldset": {},
			"address": {},
			"nav": {},
			"aside": {},
			"article": {},
			"main": {},

			// Lists
			"menu": {rename_tag: "ul"}, // ??
			"ol": {},
			"ul": {},
			"li": {},
			"pre": {},

			// Table
			"table": {},
			"tr": {
				"add_class": {
					"align": "align_text"
				}
			},
			"td": {
				"check_attributes": {
					"rowspan": "numbers",
					"colspan": "numbers"
				},
				"add_class": {
					"align": "align_text"
				}
			},
			"tbody": {
				"add_class": {
					"align": "align_text"
				}
			},
			"tfoot": {
				"add_class": {
					"align": "align_text"
				}
			},
			"thead": {
				"add_class": {
					"align": "align_text"
				}
			},
			"th": {
				"check_attributes": {
					"rowspan": "numbers",
					"colspan": "numbers"
				},
				"add_class": {
					"align": "align_text"
				}
			},
			"caption": {
				"add_class": {
					"align": "align_text"
				}
			},
			// Definitions //  <dl>, <dt>, <dd>
			"dl": {rename_tag: ""},
			"dd": {rename_tag: ""},
			"dt": {rename_tag: ""},

			"iframe": {},
			"noindex": {},

			"font": {replace_with_children: 1},

			"embed": {},
			"noembed": {},
			"object": {},
			"param": {},

			"sup": {},
			"sub": {},

			// tags to remove
			"title": {remove: 1},
			"area": {remove: 1},
			"command": {remove: 1},
			"noframes": {remove: 1},
			"bgsound": {remove: 1},
			"basefont": {remove: 1},
			"head": {remove: 1},
			"track": {remove: 1},
			"wbr": {remove: 1},
			"noscript": {remove: 1},
			"svg": {remove: 1},
			"keygen": {remove: 1},
			"meta": {remove: 1},
			"isindex": {remove: 1},
			"base": {remove: 1},
			"video": {remove: 1},
			"canvas": {remove: 1},
			"applet": {remove: 1},
			"spacer": {remove: 1},
			"source": {remove: 1},
			"frame": {remove: 1},
			"style": {remove: 1},
			"device": {remove: 1},
			"xml": {remove: 1},
			"nextid": {remove: 1},
			"audio": {remove: 1},
			"col": {remove: 1},
			"link": {remove: 1},
			"script": {remove: 1},
			"colgroup": {remove: 1},
			"comment": {remove: 1},
			"frameset": {remove: 1},

			// Tags to rename
			// to DIV
			"details": {rename_tag: "div"},
			"multicol": {rename_tag: "div"},
			"footer": {rename_tag: "div"},
			"map": {rename_tag: "div"},
			"body": {rename_tag: "div"},
			"html": {rename_tag: "div"},
			"hgroup": {rename_tag: "div"},
			"listing": {rename_tag: "div"},
			"header": {rename_tag: "div"},
			// to SPAN
			"rt": {rename_tag: "span"},
			"acronym": {rename_tag: "span"},
			"xmp": {rename_tag: "span"},
			"small": {rename_tag: "span"},
			"big": {rename_tag: "span"},
			"time": {rename_tag: "span"},
			"bdi": {rename_tag: "span"},
			"progress": {rename_tag: "span"},
			"dfn": {rename_tag: "span"},
			"rb": {rename_tag: "span"},
			"abbr": {rename_tag: "span"},
			"mark": {rename_tag: "span"},
			"output": {rename_tag: "span"},
			"marquee": {rename_tag: "span"},
			"rp": {rename_tag: "span"},
			"summary": {rename_tag: "span"},
			"var": {rename_tag: "span"},
			"tt": {rename_tag: "span"},
			"blink": {rename_tag: "span"},
			"plaintext": {rename_tag: "span"},
			"legend": {rename_tag: "span"},
			"label": {rename_tag: "span"},
			"kbd": {rename_tag: "span"},
			"meter": {rename_tag: "span"},
			"datalist": {rename_tag: "span"},
			"samp": {rename_tag: "span"},
			"bdo": {rename_tag: "span"},
			"ruby": {rename_tag: "span"},
			"ins": {rename_tag: "span"},
			"optgroup": {rename_tag: "span"},

			// Form elements
			"form": {},
			"option": {},
			"select": {},
			"textarea": {},
			"button": {},
			"input": {},

			"dir": {rename_tag: "ul"},
			"a": {},
			"img": {
				"check_attributes": {
				"width": "numbers",
				"alt": "alt",
				"src": "url",
				"height": "numbers"
				},
				"add_class": {
				"align": "align_img"
				}
			},
			"q": {
				"check_attributes": {
				"cite": "url"
				}
			},
			"blockquote": {
				"check_attributes": {
				"cite": "url"
				}
			},
			"center": {
				rename_tag: "div",
				add_css:
				{
					textAlign : 'center'
				}
			},
			"cite": {}
		}
	};
})();

/* End */
;