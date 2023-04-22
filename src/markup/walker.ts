import { TokenData } from './types';

export type CodeWalkerEvent = {
  node: TokenData;
  entering: boolean;
}

export class CodeWalker {

  readonly rootNode: TokenData;
  /**
   * [0]: node
   * [1]: next children index
   */
  private readonly _nodes: [TokenData, number][];
  private _firstStep: boolean;

  private get currentNodeInner(): [TokenData | undefined, number] {
    if (this._nodes.length === 0)
      return [undefined, -1];
    return this._nodes[this._nodes.length - 1];
  }

  get currentNode() {
    return this.currentNodeInner[0];
  }

  get hasNext() {
    return this._nodes.length > 0;
  }


  constructor(rootNode: TokenData) {
    this.rootNode = rootNode;
    this._nodes = [];
    this._firstStep = false;
    this.reset();
  }

  reset() {
    this._nodes.splice(0, this._nodes.length);
    if (this.rootNode != undefined){
      this._firstStep = true;
      this._nodes.push([this.rootNode, 0]);
    } else {
      this._firstStep = false;
    }
  }

  /**
   * 
   * @returns `CodeWalkerEvent` if `this.hasNext` else `undefined`
   */
  step(): CodeWalkerEvent | undefined {
    if (this._firstStep) {
      this._firstStep = false;
      return { node: this.rootNode, entering: true };
    }

    const [cur, ind] = this.currentNodeInner;
    if (cur == undefined) {
      // we have already reached the end
      return undefined;
    }
    if (cur.children !== undefined && cur.children.length > 0) {
      // cur has children
      if (ind < cur.children.length) {
        // cur has looked for its partial children
        this.currentNodeInner[1] += 1;
        this._nodes.push([cur.children[ind], 0]);
        return { node: this.currentNode!, entering: true };
      }
    }
    // either cur has no children, or all of its children are visited
    // pop the current node
    this._nodes.pop();
    return { node: cur, entering: false };
  }
  
  skip(): CodeWalkerEvent | undefined {
    if (this._firstStep) {
      this._firstStep = false;
      return { node: this.rootNode, entering: true };
    }
    
    const [cur] = this.currentNodeInner;
    if (cur == undefined) {
      return undefined;
    }
    this._nodes.pop();
    return { node: cur, entering: false };
  }

}