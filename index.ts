import { clone } from 'ramda'
import { Attributes } from './libs/attribute';
import { T2, PluginHandler, Transformer } from './libs/structs';

export enum NodeType {
  TEXT,
  ELEMENT,
  COMMENT,
  DOCTYPE
}

export abstract class Node {
  parentNode?: ElementNode
  /**
   * 根节点
   */
  abstract get textContent(): string
  source: {
    filename: string
    startIndex: number
    endIndex: number
  }
  constructor(public nodeType: NodeType) { }
  isElement(): this is ElementNode {
    return Node.isElement(this);
  }
  isText(): this is TextNode {
    return Node.isText(this);
  }
  isComment(): this is CommentNode {
    return Node.isComment(this);
  }
  isDoctype(): this is DoctypeNode {
    return Node.isDoctype(this);
  }
  static isElement(node: Node): node is ElementNode {
    return node.nodeType === NodeType.ELEMENT;
  }
  static isText(node: Node): node is TextNode {
    return node.nodeType === NodeType.TEXT
  }
  static isComment(node: Node): node is CommentNode {
    return node.nodeType === NodeType.COMMENT
  }
  static isDoctype(node: Node): node is DoctypeNode {
    return node.nodeType === NodeType.DOCTYPE
  }
  abstract clone(): Node
  /**
   * 移除当前节点
   */
  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
    return this;
  }
  replaceWith(newNode: Node) {
    if (newNode.parentNode) {
      newNode.remove();
    }
    this.after(newNode);
    return this.remove();
  }
  nextElement(): ElementNode | undefined {
    if (this.parentNode) {
      let childNodes = this.parentNode.childNodes
      let i = childNodes.indexOf(this)
      let node: Node;
      while (++i < childNodes.length) {
        node = childNodes[i];
        if (node instanceof ElementNode) {
          return node
        }
      }
    }
  }
  nextNode() {
    if (this.parentNode) {
      let childNodes = this.parentNode.childNodes
      let i = childNodes.indexOf(this)
      return childNodes[i + 1]
    }
  }
  prevElement(): ElementNode | undefined {
    if (this.parentNode) {
      let childNodes = this.parentNode.childNodes
      let i = childNodes.indexOf(this)
      let node: Node;
      while (--i > -1) {
        node = childNodes[i];
        if (node instanceof ElementNode) {
          return node
        }
      }
    }
  }
  prevNode() {
    if (this.parentNode) {
      let childNodes = this.parentNode.childNodes
      let i = childNodes.indexOf(this)
      return childNodes[i - 1]
    }
  }
  /**
   * 在当前节点前面插入新节点
   * @param newNode 新节点
   */
  before(newNode: Node) {
    if (this.parentNode) {
      this.parentNode.insertBefore(newNode, this);
    }
    return this;
  }
  /**
   * 在当前节点后面插入新节点
   * @param newNode 新节点
   */
  after(newNode: Node) {
    if (this.parentNode) {
      this.parentNode.insertAfter(newNode, this);
    }
    return this;
  }
}

export class TextNode extends Node {
  constructor(public text: string) {
    super(NodeType.TEXT);
  }
  get textContent() {
    return this.text;
  }
  clone() {
    var node = new TextNode(this.text);
    node.source = this.source
    return node
  }
}

export class CommentNode extends Node {
  constructor(public text: string) {
    super(NodeType.COMMENT);
  }
  get textContent() {
    return `<!--${this.text}-->`;
  }
  clone() {
    var node = new CommentNode(this.text);
    node.source = this.source
    return node
  }
}

export class DoctypeNode extends Node {
  constructor(public text: string) {
    super(NodeType.COMMENT);
  }
  get textContent() {
    return `<${this.text}>`;
  }
  clone() {
    var node = new DoctypeNode(this.text);
    node.source = this.source
    return node
  }
}

/**
 * 资源标识
 */
interface T1 {
  // 属性名
  key: string
  // 动态值
  ids: string[]
  // 字串值
  raws: string[]
}

var singleTags = [
  'input', 'link', 'meta', 'img', 'br', 'hr',
  'path', 'use'
];
export function isSingleTag(name: string) {
  return singleTags.includes(name);
}
export class ElementNode extends Node {
  private _childNodes: Node[] = []
  /**
   * 孩子节点
   */
  set childNodes(nodes: Node[]) {
    this._childNodes.forEach(node => {
      if (node.parentNode === this) {
        node.remove()
      }
    })
    this._childNodes = nodes.map(node => {
      node.parentNode = this;
      return node;
    });
  }
  get childNodes() {
    return this._childNodes;
  }
  /**
   * 属性
   */
  attributes: Attributes
  external: any = {}
  get classList() {
    return this.attributes.classList;
  }
  get style() {
    return this.attributes.styleObj;
  }
  constructor(public name: string, attrs?: any) {
    super(NodeType.ELEMENT);
    this.attributes = new Attributes(attrs);
  }
  /**
   * 孩子元素节点
   */
  get children() {
    return <ElementNode[]>this.childNodes.filter(node => node.isElement());
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
  getAttribute(key: string) {
    return this.attributes.get(key);
  }
  /**
   * 设置属性值
   * @param key 属性名
   * @param value 属性值
   */
  setAttribute(key: string, value: string) {
    this.attributes.set(key, value);
  }
  /**
   * 移除属性
   * @param key 属性值
   */
  removeAttribute(key: string) {
    this.attributes.remove(key);
  }
  /**
   * 是否有属性
   * @param key 属性名
   */
  hasAttribute(key: string) {
    return this.attributes.has(key);
  }
  /**
   * 根据获取指定标签名的元素节点
   * @param name 标签名
   */
  getElementsByTagName(name: string): ElementNode[] {
    var rets = this.children.map(node => {
      var ret: ElementNode[] = node.getElementsByTagName(name);
      if (node.isElement()) {
        ret.unshift(node);
      }
      return ret;
    });
    return (<ElementNode[]>[]).concat(...rets);
  }
  getElementById(id: string): ElementNode | undefined {
    for (let elem of this.children) {
      if (elem.getAttribute('id') === id) {
        return elem
      }
      let ret = elem.getElementById(id)
      if (ret) {
        return ret
      }
    }
  }
  /**
   * 尾部插入节点
   * @param newNode 新节点
   */
  appendChild(newNode: Node) {
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
  prependChild(newNode: Node) {
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
  insertBefore(newNode: Node, refNode: Node) {
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
  insertAfter(newNode: Node, refNode: Node) {
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
  removeChild(node: Node) {
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
    })
    this.childNodes = [];
  }
  text(text: string) {
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
    instance.source = this.source
    return instance
  }
}

export class RootNode extends ElementNode {
  constructor() {
    super('template');
  }
  after(newNode: Node) {
    this.childNodes.push(newNode)
    return this;
  }
  before(newNode: Node) {
    this.childNodes.unshift(newNode)
    return this;
  }
  clone() {
    var instance = new RootNode();
    instance.attributes = this.attributes.clone();
    this.childNodes.forEach(node => {
      instance.appendChild(node.clone());
    });
    instance.source = this.source
    return instance
  }
}