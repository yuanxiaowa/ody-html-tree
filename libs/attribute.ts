import { KeyToString, KeyToAny } from "./structs";
import { clone } from 'ramda'

export class ClassList {
  items: string[] = []
  constructor(str?: string) {
    if (str) {
      this.items = str.split(/\s+/);
    }
  }
  add(...names: string[]) {
    this.items.push(...names);
  }
  remove(...names: string[]) {
    names.forEach(name => {
      var i = this.items.indexOf(name);
      this.items.splice(i, 1);
    })
  }
  toString() {
    return this.items.join(' ');
  }
}

export class StyleObj {
  styles: KeyToString = {}
  constructor(str?: string) {
    if (str) {
      this.addString(str);
    }
  }
  addString(str: string) {
    str.split(/\s*;\s*/).reduce((state, item) => {
      if (!item) {
        return state;
      }
      var [name, value] = item.split(/\s*:\s*/);
      state[name] = value;
      return state;
    }, this.styles);
  }
  add(obj: KeyToString) {
    this.styles = Object.assign(this.styles, obj);
  }
  merge(obj: StyleObj) {
    Object.assign(this.styles, obj.styles)
  }
  toString() {
    return Object.keys(this.styles).map(name => `${name}:${this.styles[name]}`).join(';')
  }
}

export class Attributes {
  classList: ClassList;
  styleObj: StyleObj
  constructor(public attrs: KeyToAny = {}) {
    this.classList = new ClassList(<string>attrs.class);
    this.styleObj = new StyleObj(<string>attrs.style);
    Object.defineProperties(attrs, {
      class: {
        get: () => this.classList.toString(),
        set: (v: string) => this.classList = new ClassList(v),
        enumerable: true
      },
      style: {
        get: () => this.styleObj.toString(),
        set: (v: string) => this.styleObj = new StyleObj(v),
        enumerable: true
      }
    })
  }
  get keys(): string[] {
    return Object.keys(this.attrs);
  }
  get values() {
    return this.keys.map(key => this.attrs[key]);
  }
  clear() {
    this.attrs = {};
  }
  get(key: string) {
    return this.attrs[key];
  }
  set(key: string, value: string) {
    this.attrs[key] = value;
  }
  remove(key: string) {
    var v = this.attrs[key];
    delete this.attrs[key];
    return v;
  }
  has(key: string) {
    return key in this.attrs;
  }
  add(obj: KeyToString) {
    Object.keys(obj).forEach(name => {
      this.attrs[name] = obj[name];
    })
  }
  clone() {
    return new Attributes(clone(this.attrs));
  }
}