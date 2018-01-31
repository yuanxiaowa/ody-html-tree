"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const attribute_1 = require("./libs/attribute");
var NodeType;
(function (NodeType) {
    NodeType[NodeType["TEXT"] = 0] = "TEXT";
    NodeType[NodeType["ELEMENT"] = 1] = "ELEMENT";
    NodeType[NodeType["COMMENT"] = 2] = "COMMENT";
    NodeType[NodeType["DOCTYPE"] = 3] = "DOCTYPE";
})(NodeType = exports.NodeType || (exports.NodeType = {}));
class Node {
    constructor(nodeType) {
        this.nodeType = nodeType;
    }
    isElement() {
        return Node.isElement(this);
    }
    isText() {
        return Node.isText(this);
    }
    isComment() {
        return Node.isComment(this);
    }
    isDoctype() {
        return Node.isDoctype(this);
    }
    static isElement(node) {
        return node.nodeType === NodeType.ELEMENT;
    }
    static isText(node) {
        return node.nodeType === NodeType.TEXT;
    }
    static isComment(node) {
        return node.nodeType === NodeType.COMMENT;
    }
    static isDoctype(node) {
        return node.nodeType === NodeType.DOCTYPE;
    }
    /**
     * 移除当前节点
     */
    remove() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
        return this;
    }
    replaceWith(newNode) {
        if (newNode.parentNode) {
            newNode.remove();
        }
        this.after(newNode);
        return this.remove();
    }
    nextElement() {
        if (this.parentNode) {
            let childNodes = this.parentNode.childNodes;
            let i = childNodes.indexOf(this);
            let node;
            while (++i < childNodes.length) {
                node = childNodes[i];
                if (node instanceof ElementNode) {
                    return node;
                }
            }
        }
    }
    nextNode() {
        if (this.parentNode) {
            let childNodes = this.parentNode.childNodes;
            let i = childNodes.indexOf(this);
            return childNodes[i + 1];
        }
    }
    prevElement() {
        if (this.parentNode) {
            let childNodes = this.parentNode.childNodes;
            let i = childNodes.indexOf(this);
            let node;
            while (--i > -1) {
                node = childNodes[i];
                if (node instanceof ElementNode) {
                    return node;
                }
            }
        }
    }
    prevNode() {
        if (this.parentNode) {
            let childNodes = this.parentNode.childNodes;
            let i = childNodes.indexOf(this);
            return childNodes[i - 1];
        }
    }
    /**
     * 在当前节点前面插入新节点
     * @param newNode 新节点
     */
    before(newNode) {
        if (this.parentNode) {
            this.parentNode.insertBefore(newNode, this);
        }
        return this;
    }
    /**
     * 在当前节点后面插入新节点
     * @param newNode 新节点
     */
    after(newNode) {
        if (this.parentNode) {
            this.parentNode.insertAfter(newNode, this);
        }
        return this;
    }
}
exports.Node = Node;
class TextNode extends Node {
    constructor(text) {
        super(NodeType.TEXT);
        this.text = text;
    }
    get textContent() {
        return this.text;
    }
    clone() {
        var node = new TextNode(this.text);
        node.source = this.source;
        return node;
    }
}
exports.TextNode = TextNode;
class CommentNode extends Node {
    constructor(text) {
        super(NodeType.COMMENT);
        this.text = text;
    }
    get textContent() {
        return `<!--${this.text}-->`;
    }
    clone() {
        var node = new CommentNode(this.text);
        node.source = this.source;
        return node;
    }
}
exports.CommentNode = CommentNode;
class DoctypeNode extends Node {
    constructor(text) {
        super(NodeType.COMMENT);
        this.text = text;
    }
    get textContent() {
        return `<${this.text}>`;
    }
    clone() {
        var node = new DoctypeNode(this.text);
        node.source = this.source;
        return node;
    }
}
exports.DoctypeNode = DoctypeNode;
var singleTags = [
    'input', 'link', 'meta', 'img', 'br', 'hr',
    'path', 'use'
];
function isSingleTag(name) {
    return singleTags.includes(name);
}
exports.isSingleTag = isSingleTag;
class ElementNode extends Node {
    constructor(name, attrs) {
        super(NodeType.ELEMENT);
        this.name = name;
        this._childNodes = [];
        this.external = {};
        this.attributes = new attribute_1.Attributes(attrs);
    }
    /**
     * 孩子节点
     */
    set childNodes(nodes) {
        this._childNodes.forEach(node => {
            if (node.parentNode === this) {
                node.remove();
            }
        });
        this._childNodes = nodes.map(node => {
            node.parentNode = this;
            return node;
        });
    }
    get childNodes() {
        return this._childNodes;
    }
    get classList() {
        return this.attributes.classList;
    }
    get style() {
        return this.attributes.styleObj;
    }
    /**
     * 孩子元素节点
     */
    get children() {
        return this.childNodes.filter(node => node.isElement());
    }
    /**
     * 第一个孩子节点
     */
    get firstChild() {
        return this.childNodes[0];
    }
    /**
     * 第一个孩子元素节点
     */
    get firstElementChild() {
        return this.children[0];
    }
    /**
     * 节点里面的文本内容
     */
    get textContent() {
        return this.childNodes.map(node => node.textContent).join('');
    }
    /**
     * 是否为单标签节点
     */
    isSingleTag() {
        return isSingleTag(this.name);
    }
    /**
     * 获取属性值
     * @param key 属性名
     */
    getAttribute(key) {
        return this.attributes.get(key);
    }
    /**
     * 设置属性值
     * @param key 属性名
     * @param value 属性值
     */
    setAttribute(key, value) {
        this.attributes.set(key, value);
    }
    /**
     * 移除属性
     * @param key 属性值
     */
    removeAttribute(key) {
        this.attributes.remove(key);
    }
    /**
     * 是否有属性
     * @param key 属性名
     */
    hasAttribute(key) {
        return this.attributes.has(key);
    }
    /**
     * 根据获取指定标签名的元素节点
     * @param name 标签名
     */
    getElementsByTagName(name) {
        var rets = this.children.map(node => {
            var ret = node.getElementsByTagName(name);
            if (node.isElement()) {
                ret.unshift(node);
            }
            return ret;
        });
        return [].concat(...rets);
    }
    getElementById(id) {
        for (let elem of this.children) {
            if (elem.getAttribute('id') === id) {
                return elem;
            }
            let ret = elem.getElementById(id);
            if (ret) {
                return ret;
            }
        }
    }
    /**
     * 尾部插入节点
     * @param newNode 新节点
     */
    appendChild(newNode) {
        if (newNode.parentNode) {
            newNode.remove();
        }
        this.childNodes.push(newNode);
        newNode.parentNode = this;
        return newNode;
    }
    /**
     * 首部插入节点
     * @param newNode 新节点
     */
    prependChild(newNode) {
        if (newNode.parentNode) {
            newNode.remove();
        }
        this.childNodes.unshift(newNode);
        newNode.parentNode = this;
        return newNode;
    }
    /**
     * 在指定节点前插入节点
     * @param newNode 新节点
     * @param refNode 映射节点
     */
    insertBefore(newNode, refNode) {
        if (newNode.parentNode) {
            newNode.remove();
        }
        var i = this.childNodes.indexOf(refNode);
        this.childNodes.splice(i, 0, newNode);
        newNode.parentNode = this;
        return newNode;
    }
    /**
     * 在指定节点后插入节点
     * @param newNode 新节点
     * @param refNode 映射节点
     */
    insertAfter(newNode, refNode) {
        if (newNode.parentNode) {
            newNode.remove();
        }
        var i = this.childNodes.indexOf(refNode);
        this.childNodes.splice(i + 1, 0, newNode);
        newNode.parentNode = this;
        return newNode;
    }
    /**
     * 移除节点
     * @param node 待移除的节点
     */
    removeChild(node) {
        var i = this.childNodes.indexOf(node);
        this.childNodes.splice(i, 1);
        node.parentNode = undefined;
        return node;
    }
    /**
     * 清空孩子节点
     */
    empty() {
        this.childNodes.forEach(node => {
            node.parentNode = undefined;
        });
        this.childNodes = [];
    }
    text(text) {
        this.empty();
        this.appendChild(new TextNode(text));
    }
    /**
     * 清空属性
     */
    clearAttributes() {
        this.attributes.clear();
    }
    clone() {
        var instance = new ElementNode(this.name);
        instance.attributes = this.attributes.clone();
        this.childNodes.forEach(node => {
            instance.appendChild(node.clone());
        });
        instance.source = this.source;
        return instance;
    }
}
exports.ElementNode = ElementNode;
class RootNode extends ElementNode {
    constructor() {
        super('template');
    }
    after(newNode) {
        this.childNodes.push(newNode);
        return this;
    }
    before(newNode) {
        this.childNodes.unshift(newNode);
        return this;
    }
    clone() {
        var instance = new RootNode();
        instance.attributes = this.attributes.clone();
        this.childNodes.forEach(node => {
            instance.appendChild(node.clone());
        });
        instance.source = this.source;
        return instance;
    }
}
exports.RootNode = RootNode;
