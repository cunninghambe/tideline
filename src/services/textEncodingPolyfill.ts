/**
 * Hermes runtime polyfills for Web APIs that pure-JS libs in this project expect.
 *
 * 1. TextDecoder utf-16le — Hermes ships TextDecoder but not utf-16le. h3-js
 *    needs it for WASM string interop.
 * 2. crypto.getRandomValues — Hermes has no Web Crypto. ulid needs it for ID
 *    generation. We provide a Math.random shim; this is NOT cryptographically
 *    secure but is fine for ULID row IDs in a local-first app. For production
 *    builds, swap to `react-native-get-random-values` (requires native rebuild).
 */

// ---------- TextDecoder utf-16le ----------

const NativeTextDecoder = (globalThis as { TextDecoder?: typeof TextDecoder }).TextDecoder;

type DecodeInput = Uint8Array | ArrayBuffer | undefined;

function normalize(label: string): string {
  return label.toLowerCase().replace(/[-_\s]/g, '');
}

function decodeUtf16LE(input: Uint8Array): string {
  let result = '';
  const len = input.length - (input.length % 2);
  for (let i = 0; i < len; i += 2) {
    result += String.fromCharCode(input[i] | (input[i + 1] << 8));
  }
  return result;
}

function toUint8(buf: DecodeInput): Uint8Array {
  if (!buf) return new Uint8Array(0);
  if (buf instanceof Uint8Array) return buf;
  if (buf instanceof ArrayBuffer) return new Uint8Array(buf);
  return new Uint8Array((buf as ArrayBufferView).buffer);
}

class PatchedTextDecoder {
  private readonly _isUtf16LE: boolean;
  private readonly _native: TextDecoder | null;
  readonly encoding: string;

  constructor(label: string = 'utf-8', options?: TextDecoderOptions) {
    const norm = normalize(label);
    if (norm === 'utf16le' || norm === 'utf16') {
      this._isUtf16LE = true;
      this._native = null;
      this.encoding = 'utf-16le';
    } else {
      this._isUtf16LE = false;
      if (!NativeTextDecoder) throw new Error('TextDecoder not available');
      this._native = new NativeTextDecoder(label, options);
      this.encoding = this._native.encoding;
    }
  }

  decode(input?: DecodeInput, options?: TextDecodeOptions): string {
    if (this._isUtf16LE) return decodeUtf16LE(toUint8(input));
    return this._native!.decode(input as ArrayBufferView | undefined, options);
  }
}

(globalThis as { TextDecoder?: unknown }).TextDecoder = PatchedTextDecoder;

// ---------- crypto.getRandomValues (Math.random shim) ----------

type CryptoLike = { getRandomValues?: (arr: ArrayBufferView) => ArrayBufferView };

const g = globalThis as { crypto?: CryptoLike };
if (!g.crypto) g.crypto = {};
if (typeof g.crypto.getRandomValues !== 'function') {
  g.crypto.getRandomValues = function getRandomValues(arr: ArrayBufferView): ArrayBufferView {
    const view = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
    for (let i = 0; i < view.length; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  };
}
