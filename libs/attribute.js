"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ramda_1 = require("ramda");
class ClassList {
    constructor(str) {
        this.items = [];
        if (str) {
            this.items = str.split(/\s+/);
        }
    }
    add(...names) {
        this.items.push(...names);
    }
    remove(...names) {
        names.forEach(name => {
            var i = this.items.indexOf(name);
            this.items.splice(i, 1);
        });
    }
    toString() {
        return this.items.join(' ');
    }
}
exports.ClassList = ClassList;
class StyleObj {
    constructor(str) {
        this.styles = {};
        if (str) {
            this.addString(str);
        }
    }
    addString(str) {
        str.split(/\s*;\s*/).reduce((state, item) => {
            if (!item) {
                return state;
            }
            var [name, value] = item.split(/\s*:\s*/);
            state[name] = value;
            return state;
        }, this.styles);
    }
    add(obj) {
        this.styles = Object.assign(this.styles, obj);
    }
    merge(obj) {
        Object.assign(this.styles, obj.styles);
    }
    toString() {
        return Object.keys(this.styles).map(name => `${name}:${this.styles[name]}`).join(';');
    }
}
exports.StyleObj = StyleObj;
class Attributes {
    constructor(attrs = {}) {
        this.attrs = attrs;
        this.classList = new ClassList(attrs.class);
        this.styleObj = new StyleObj(attrs.style);
        Object.defineProperties(attrs, {
            class: {
                get: () => this.classList.toString(),
                set: (v) => this.classList = new ClassList(v),
                enumerable: true
            },
            style: {
                get: () => this.styleObj.toString(),
                set: (v) => this.styleObj = new StyleObj(v),
                enumerable: true
            }
        });
    }
    get keys() {
        return Object.keys(this.attrs);
    }
    get values() {
        return this.keys.map(key => this.attrs[key]);
    }
    clear() {
        this.attrs = {};
    }
    get(key) {
        return this.attrs[key];
    }
    set(key, value) {
        this.attrs[key] = value;
    }
    remove(key) {
        var v = this.attrs[key];
        delete this.attrs[key];
        return v;
    }
    has(key) {
        return key in this.attrs;
    }
    add(obj) {
        Object.keys(obj).forEach(name => {
            this.attrs[name] = obj[name];
        });
    }
    clone() {
        return new Attributes(ramda_1.clone(this.attrs));
    }
}
exports.Attributes = Attributes;
