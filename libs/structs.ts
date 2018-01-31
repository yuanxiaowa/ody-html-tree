import { RootNode } from "../index";

export interface KeyToAny {
  [index: string]: any
}
export interface KeyToString {
  [index: string]: string
}
export interface KeyToBase {
  [index: string]: string | boolean
}
export interface T2 {
  (id: string): string
}

export interface Transformer {
  (node: RootNode): Promise<RootNode>
}

export interface PluginHandler {
  (node: string | RootNode): Promise<string | RootNode>
}