import { getCDN } from '../utils';

/**
 * Based on: https://github.com/tensorflow/tfjs-models/blob/master/qna/src/bert_tokenizer.ts
 * Modified by @bloodbare
 */

const SEPARATOR = '\u2581';
export const UNK_INDEX = 100;
export const CLS_INDEX = 101;
export const CLS_TOKEN = '[CLS]';
export const SEP_INDEX = 102;
export const SEP_TOKEN = '[SEP]';
export const NFKC_TOKEN = 'NFKC';

class TrieNode {
  parent?: TrieNode;
  children: { [key: string]: TrieNode } = {};
  end = false;
  score?: number;
  index?: number;

  constructor(private key: string | null) {}

  getWord(): [string[], number, number] {
    const output = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: TrieNode = this;

    while (node != null) {
      if (node.key != null) {
        output.unshift(node.key);
      }
      node = node.parent as TrieNode;
    }

    return [output, this.score as number, this.index as number];
  }
}

class Trie {
  private root = new TrieNode(null);

  insert(word: string, score: number, index: number) {
    let node = this.root;

    const symbols = [];
    for (const symbol of word) {
      symbols.push(symbol);
    }

    for (let i = 0; i < symbols.length; i++) {
      if (node.children[symbols[i]] == null) {
        node.children[symbols[i]] = new TrieNode(symbols[i]);
        node.children[symbols[i]].parent = node;
      }

      node = node.children[symbols[i]];

      if (i === symbols.length - 1) {
        node.end = true;
        node.score = score;
        node.index = index;
      }
    }
  }

  find(token: string): TrieNode {
    let node = this.root;
    let iter = 0;

    while (iter < token.length && node != null) {
      node = node.children[token[iter]];
      iter++;
    }

    return node;
  }
}

function isWhitespace(ch: string): boolean {
  return /\s/.test(ch);
}

function isInvalid(ch: string): boolean {
  return ch.charCodeAt(0) === 0 || ch.charCodeAt(0) === 0xfffd;
}

const punctuations = '[~`!@#$%^&*(){}[];:"\'<,.>?/\\|-_+=';

function isPunctuation(ch: string): boolean {
  return punctuations.indexOf(ch) !== -1;
}

export interface Token {
  text: string;
  index: number;
}

export class BertTokenizer {
  private vocab?: string[];
  private trie?: Trie;
  private tf = (window as any)['tf'];
  private modelType;

  constructor(modelType: string) {
    this.modelType = modelType;
  }

  async load() {
    this.vocab = await this.loadVocab();

    this.trie = new Trie();
    for (let vocabIndex = 999; vocabIndex < this.vocab.length; vocabIndex++) {
      const word = this.vocab[vocabIndex];
      this.trie.insert(word, 1, vocabIndex);
    }
  }

  encodeText(inputText: string, inputSize: number) {
    inputText = inputText.toString();
    inputText = inputText.replace(/\?/g, '');
    inputText = inputText.trim();

    const queryTokens = this.tokenize(inputText);

    const tokens: number[] = [];
    const segmentIds: number[] = [];
    tokens.push(CLS_INDEX);
    segmentIds.push(0);
    for (let i = 0; i < queryTokens.length; i++) {
      const queryToken = queryTokens[i];
      tokens.push(queryToken);
      segmentIds.push(0);
    }
    tokens.push(SEP_INDEX);
    segmentIds.push(0);

    const inputIds = tokens;
    const inputMask = inputIds.map(() => 1);
    while (inputIds.length < inputSize) {
      inputIds.push(0);
      inputMask.push(0);
      segmentIds.push(0);
    }

    return { inputIds, inputMask, segmentIds };
  }

  private async loadVocab(): Promise<[]> {
    return this.tf.util
      .fetch(`${getCDN()}models/classifier/${this.modelType}/vocab.json`)
      .then((d: Response) => d.json());
  }

  private async loadMultiVocab(): Promise<[]> {
    return this.tf.util
      .fetch(`${getCDN()}models/classifier/${this.modelType}/vocab_multi.txt`)
      .then((d: Response) => d.text());
  }

  processInput(text: string): Token[] {
    const charOriginalIndex: number[] = [];
    const cleanedText = this.cleanText(text, charOriginalIndex);
    const origTokens = cleanedText.split(' ');

    let charCount = 0;
    const tokens = origTokens.map((token) => {
      token = token.toLowerCase();
      const tokens = this.runSplitOnPunc(token, charCount, charOriginalIndex);
      charCount += token.length + 1;
      return tokens;
    });

    let flattenTokens: Token[] = [];
    for (let index = 0; index < tokens.length; index++) {
      flattenTokens = flattenTokens.concat(tokens[index]);
    }
    return flattenTokens;
  }

  private cleanText(text: string, charOriginalIndex: number[]): string {
    const stringBuilder = [];
    let originalCharIndex = 0,
      newCharIndex = 0;
    for (const ch of text) {
      if (isInvalid(ch)) {
        originalCharIndex += ch.length;
        continue;
      }
      if (isWhitespace(ch)) {
        if (stringBuilder.length > 0 && stringBuilder[stringBuilder.length - 1] !== ' ') {
          stringBuilder.push(' ');
          charOriginalIndex[newCharIndex] = originalCharIndex;
          originalCharIndex += ch.length;
        } else {
          originalCharIndex += ch.length;
          continue;
        }
      } else {
        stringBuilder.push(ch);
        charOriginalIndex[newCharIndex] = originalCharIndex;
        originalCharIndex += ch.length;
      }
      newCharIndex++;
    }
    return stringBuilder.join('');
  }

  private runSplitOnPunc(text: string, count: number, charOriginalIndex: number[]): Token[] {
    const tokens = [];
    let startNewWord = true;
    for (const ch of text) {
      if (isPunctuation(ch)) {
        tokens.push({ text: ch, index: charOriginalIndex[count] });
        count += ch.length;
        startNewWord = true;
      } else {
        if (startNewWord) {
          tokens.push({ text: '', index: charOriginalIndex[count] });
          startNewWord = false;
        }
        tokens[tokens.length - 1].text += ch;
        count += ch.length;
      }
    }
    return tokens;
  }

  tokenize(text: string): number[] {
    // Source:
    // https://github.com/google-research/bert/blob/88a817c37f788702a363ff935fd173b6dc6ac0d6/tokenization.py#L311

    let outputTokens: number[] = [];

    const words = this.processInput(text);
    words.forEach((word) => {
      if (word.text !== CLS_TOKEN && word.text !== SEP_TOKEN) {
        word.text = `${SEPARATOR}${word.text.normalize(NFKC_TOKEN)}`;
      }
    });

    for (let i = 0; i < words.length; i++) {
      const chars = [];
      for (const symbol of words[i].text) {
        chars.push(symbol);
      }

      let isUnknown = false;
      let start = 0;
      const subTokens: number[] = [];

      const charsLength = chars.length;

      while (start < charsLength) {
        let end = charsLength;
        let currIndex;

        while (start < end) {
          const substr = chars.slice(start, end).join('');

          const match = this.trie?.find(substr);
          if (match != null && match.end != null) {
            currIndex = match.getWord()[2];
            break;
          }

          end = end - 1;
        }

        if (currIndex == null) {
          isUnknown = true;
          break;
        }

        subTokens.push(currIndex);
        start = end;
      }

      if (isUnknown) {
        outputTokens.push(UNK_INDEX);
      } else {
        outputTokens = outputTokens.concat(subTokens);
      }
    }

    return outputTokens;
  }
}

export async function loadTokenizer(modelType: string): Promise<BertTokenizer> {
  const tokenizer = new BertTokenizer(modelType);
  await tokenizer.load();
  return tokenizer;
}
