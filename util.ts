import {
  Node,
  TextNode,
  ElementNode,
  CommentNode,
  DoctypeNode,
  RootNode
} from './index'
import * as htmlParser from 'htmlparser2'
import { Attributes } from './libs/attribute';
import { KeyToString } from './libs/structs';

/**
 * 将html串转化为html树
 * @param html html字串
 * @param id 文件名
 */
export function parse(html: string, id: string) {
  var source = {
    filename: id
  }
  var root = new RootNode();
  root.source = source
  var stacks: ElementNode[] = [root];
  var con = stacks[0];
  var parser = new htmlParser.Parser({
    onopentag(name, attrs) {
      var node = new ElementNode(name, attrs);
      node.source = source
      stacks.push(node);
      con.appendChild(node);
      con = node;
    },
    onclosetag(name) {
      stacks.pop();
      con = stacks[stacks.length - 1]
    },
    ontext(text) {
      var node = new TextNode(text);
      node.source = source
      con.appendChild(node);
    },
    oncomment(data) {
      var node = new CommentNode(data);
      node.source = source
      con.appendChild(node);
    },
    onprocessinginstruction(name, data) {
      var node = new DoctypeNode(data)
      node.source = source
      con.appendChild(node);
    }
  }, {
      decodeEntities: true,
      recognizeSelfClosing: true,
      lowerCaseTags: true
    });
  parser.write(html);
  parser.end();
  return root;
}

var requiredAttributeNames = [
  'name', 'class', 'style', 'srcset', 'id', 'href', 'src', 'alt', 'title', 'value', 'type', 'charset', 'lang', 'content', 'rel',
  'xlink:href'
];

let keyIE = '__ie'
/**
 * 节点属性转化为字符串
 * @param attrs 属性
 */
export function renderAttrs(attrs: Attributes, keepQuote = true) {
  var ret: string[] = [];
  attrs.keys.forEach(key => {
    if (key === keyIE) {
      return
    }
    var value = attrs.attrs[key];
    if (value === true || !value) {
      if (!requiredAttributeNames.includes(key)) {
        ret.push(key);
      }
      return;
    }
    value = String(value);
    if (/[\s<>]/.test(value)) {
      if (value.indexOf('"') > -1) {
        value = `'${value}'`;
      } else {
        value = `"${value}"`;
      }
    } else if (keepQuote) {
      value = `"${value}"`
    }
    ret.push(`${key}=${value}`);
  });
  return ret.join(' ');
}

/**
 * 将节点数组转化为html串
 * @param nodes 节点数组
 */
export function render(nodes: Node[]) {
  return nodes.map(node => {
    if (node instanceof ElementNode) {
      var isPlaceholder = node.name === 'template'
      var ret = ''
      if (!isPlaceholder) {
        ret += '<' + node.name;
        var attrs = renderAttrs(node.attributes);
        if (attrs.length > 0) {
          ret += ' ' + attrs;
        }
        ret += '>';
      }
      ret += render(node.childNodes);
      if (!isPlaceholder && !node.isSingleTag()) {
        ret += `</${node.name}>`;
      }
      if (node.hasAttribute(keyIE)) {
        let stacks = resolveIEExpression(node.getAttribute(keyIE))
        ret = `<!--[if${stacks.join(' ')}]>${ret}<![endif]-->`
      }
      return ret;
    }
    return node.textContent;
  }).join('')
}

/**
 * 将节点数组转化为压缩的html串
 * @param nodes 节点数组
 */
export function renderMini(nodes: Node[]) {
  return nodes.map(node => {
    if (node instanceof ElementNode) {
      var isPlaceholder = node.name === 'template'
      var ret = ''
      if (!isPlaceholder) {
        ret = '<' + node.name;
        if (node.name === 'script') {
          if (node.getAttribute('type') === 'text/javascript') {
            node.removeAttribute('type');
          }
          if (node.hasAttribute('lang')) {
            node.removeAttribute('lang');
          }
        }
        var attrs = renderAttrs(node.attributes, false);
        if (attrs.length > 0) {
          ret += ' ' + attrs;
        }
        ret += '>';
      }
      ret += renderMini(node.childNodes);
      if (!isPlaceholder && !node.isSingleTag()) {
        ret += `</${node.name}>`;
      }
      return ret;
    }
    if (node instanceof CommentNode) {
      return '';
    }
    return node.textContent.trim().replace(/\s+/g, ' ');
  }).join('')
}

const mappingBrowser:KeyToString = {
  '>': ' gt',
  '<': ' lt',
  '>=': ' gte',
  '<=': ' lte',
  '=': ''
}
function resolveIEExpression(expr: string) {
  let arr = <string[]>expr.match(/[>=<]+|\d+/g);
  let stacks = [];
  if (/[>=<]/.test(arr[0])) {
    stacks.push(mappingBrowser[arr[0]]);
    stacks.push('IE');
    stacks.push(arr[1]);
  } else {
    stacks.push(mappingBrowser['=']);
    stacks.push('IE');
    stacks.push(arr[0]);
  }
  return stacks
}

interface Handler<T> {
  (node: T): void
}
/**
 * 遍历元素和文本节点
 * @param nodes 节点
 * @param handler 处理函数
 */
export function traverseElementAndTextNodes(nodes: Node[], handler: Handler<ElementNode | TextNode>) {
  nodes.forEach(node => {
    if (node instanceof ElementNode) {
      handler(node);
      if (node.childNodes.length > 0) {
        traverseElementAndTextNodes(node.childNodes, handler);
      }
    } else if (node instanceof TextNode) {
      handler(node);
    }
  })
}

/**
 * 遍历元素节点
 * @param nodes 节点
 * @param handler 处理函数
 */
export function traverseElementNodes(nodes: Node[], handler: Handler<ElementNode>) {
  nodes.forEach(node => {
    if (node instanceof ElementNode) {
      handler(node);
      if (node.childNodes.length > 0) {
        traverseElementNodes(node.childNodes, handler);
      }
    }
  })
}

export function getElementByTagName(name: string, ast: RootNode) {
  var ret: ElementNode[] = []
  traverseElementNodes(ast.childNodes, node => {
    if (node.name === name) {
      ret.push(node)
    }
  })
  return ret
}