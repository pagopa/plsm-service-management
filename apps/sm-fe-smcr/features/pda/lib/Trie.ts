type TrieNode = {
  children: Map<string, TrieNode | Record<string, string>>;
};
function isTrieNode(node: TrieNode | Record<string, string>): node is TrieNode {
  return "children" in node;
}

export default class Trie {
  public root: TrieNode;

  constructor() {
    this.root = {
      children: new Map(),
    };
  }
  search(
    word: string,
  ): { value: string; data: Record<string, string> } | undefined {
    let currentNode: TrieNode = this.root;
    for (const char of word) {
      if (currentNode.children.has(char)) {
        const node = currentNode.children.get(char);
        if (node && isTrieNode(node)) {
          currentNode = node;
        }
      } else {
        return undefined;
      }
    }
    if (!currentNode.children.has("*")) return undefined;
    return {
      value: word,
      data: currentNode.children.get("*") as Record<string, string>,
    };
  }

  searchPrefix(word: string) {
    let currentNode: TrieNode = this.root;
    for (const char of word) {
      if (currentNode.children.has(char)) {
        const node = currentNode.children.get(char);
        if (node && isTrieNode(node)) {
          currentNode = node;
        }
      } else {
        return undefined;
      }
    }
    return currentNode;
  }
  autocorrect(word: string) {
    let currentNode: TrieNode = this.root;
    let wordFoundSoFar = "";
    for (const char of word) {
      if (currentNode.children.has(char)) {
        const node = currentNode.children.get(char);
        if (node && isTrieNode(node)) {
          currentNode = node;
          wordFoundSoFar += char;
        }
      } else {
        return wordFoundSoFar + this.collectAllWords(currentNode)[0];
      }
    }
    return word;
  }
  insert(word: string, data: Record<string, string>) {
    let currentNode = this.root;
    for (const char of word) {
      if (currentNode.children.has(char)) {
        const node = currentNode.children.get(char);
        if (node && isTrieNode(node)) {
          currentNode = node;
        }
      } else {
        const newNode: TrieNode = {
          children: new Map(),
        };
        currentNode.children.set(char, newNode);
        currentNode = newNode;
      }
    }
    currentNode.children.set("*", data);
  }
  collectAllWords(
    node = this.root,
    word = { value: "", index: 0 },
    words: Array<{ value: string; data: Record<string, string> }> = [],
  ) {
    const currentNode = node;
    for (const [key, childNode] of currentNode.children) {
      if (key === "*" && !isTrieNode(childNode)) {
        words.push({
          value: word.value,
          data: childNode,
        });
      } else if (childNode && isTrieNode(childNode)) {
        this.collectAllWords(
          childNode,
          { value: word.value + key, index: 0 },
          words,
        );
      }
    }
    return words;
  }
  autocomplete(prefix: string) {
    const currentNode = this.searchPrefix(prefix);
    if (!currentNode) return undefined;
    return this.collectAllWords(currentNode);
  }
  print(node = this.root) {
    const currentNode = node;
    for (const [key, childNode] of currentNode.children) {
      console.log(key);
      if (key !== "*" && childNode && isTrieNode(childNode)) {
        this.print(childNode);
      }
    }
  }
}
