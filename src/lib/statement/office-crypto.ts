/**
 * Opens a password-protected .xlsx in the browser (MS-OFFCRYPTO "agile"
 * encryption, used by Excel 2010+, LibreOffice and most bank systems).
 * The file is an OLE compound file holding EncryptionInfo and
 * EncryptedPackage; with the password we derive the key, check it against
 * the stored verifier, and AES-decrypt the package back into a normal .xlsx.
 * Uses only Web Crypto, so it runs in browsers and in Node for tests.
 */

const END_OF_CHAIN = 0xfffffffe;

const u16 = (b: Uint8Array, o: number) => b[o]! | (b[o + 1]! << 8);
const u32 = (b: Uint8Array, o: number) => (b[o]! | (b[o + 1]! << 8) | (b[o + 2]! << 16) | (b[o + 3]! << 24)) >>> 0;

/** Top-level streams of a compound (OLE) file, by name. */
export function readCompoundFile(bytes: Uint8Array): Map<string, Uint8Array> {
  const sectorSize = 1 << u16(bytes, 0x1e);
  const miniSectorSize = 1 << u16(bytes, 0x20);
  const firstDir = u32(bytes, 0x30);
  const cutoff = u32(bytes, 0x38);
  const firstMiniFat = u32(bytes, 0x3c);
  let difatSector = u32(bytes, 0x44);
  const sector = (n: number) => bytes.subarray((n + 1) * sectorSize, (n + 2) * sectorSize);

  // FAT sector numbers: 109 in the header, then chained DIFAT sectors.
  const fatSectors: number[] = [];
  for (let i = 0; i < 109; i += 1) {
    const s = u32(bytes, 0x4c + i * 4);
    if (s < END_OF_CHAIN - 2) fatSectors.push(s);
  }
  for (let guard = 0; difatSector < END_OF_CHAIN - 2 && guard < 10_000; guard += 1) {
    const d = sector(difatSector);
    for (let i = 0; i < sectorSize / 4 - 1; i += 1) {
      const s = u32(d, i * 4);
      if (s < END_OF_CHAIN - 2) fatSectors.push(s);
    }
    difatSector = u32(d, sectorSize - 4);
  }
  const fat: number[] = [];
  for (const s of fatSectors) {
    const d = sector(s);
    for (let i = 0; i < sectorSize / 4; i += 1) fat.push(u32(d, i * 4));
  }
  const chain = (start: number, table: number[]) => {
    const out: number[] = [];
    for (let s = start; s < END_OF_CHAIN - 2 && out.length <= table.length; s = table[s] ?? END_OF_CHAIN) out.push(s);
    return out;
  };
  const readChain = (start: number) => {
    const parts = chain(start, fat).map(sector);
    const all = new Uint8Array(parts.length * sectorSize);
    parts.forEach((p, i) => all.set(p, i * sectorSize));
    return all;
  };

  const dir = readChain(firstDir);
  type Entry = { name: string; type: number; start: number; size: number };
  const entries: Entry[] = [];
  for (let o = 0; o + 128 <= dir.length; o += 128) {
    const nameLength = u16(dir, o + 64);
    let name = "";
    for (let i = 0; i + 2 < nameLength; i += 2) name += String.fromCharCode(u16(dir, o + i));
    entries.push({ name, type: dir[o + 66]!, start: u32(dir, o + 116), size: u32(dir, o + 120) });
  }
  const root = entries[0];
  const miniStream = root ? readChain(root.start) : new Uint8Array();
  const miniFatBytes = firstMiniFat < END_OF_CHAIN - 2 ? readChain(firstMiniFat) : new Uint8Array();
  const miniFat: number[] = [];
  for (let i = 0; i + 4 <= miniFatBytes.length; i += 4) miniFat.push(u32(miniFatBytes, i));

  const streams = new Map<string, Uint8Array>();
  for (const e of entries) {
    if (e.type !== 2) continue;
    if (e.size < cutoff) {
      const parts = chain(e.start, miniFat);
      const data = new Uint8Array(parts.length * miniSectorSize);
      parts.forEach((s, i) => data.set(miniStream.subarray(s * miniSectorSize, (s + 1) * miniSectorSize), i * miniSectorSize));
      streams.set(e.name, data.subarray(0, e.size));
    } else {
      streams.set(e.name, readChain(e.start).subarray(0, e.size));
    }
  }
  return streams;
}

const HASHES: Record<string, string> = { SHA512: "SHA-512", SHA384: "SHA-384", SHA256: "SHA-256", SHA1: "SHA-1" };

const attrs = (tag: string) => Object.fromEntries([...tag.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1]!, m[2]!]));
const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
const le32 = (n: number) => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
/** Truncate, or pad with 0x36, to `length` bytes. */
const fit = (b: Uint8Array, length: number) => (b.length >= length ? b.slice(0, length) : concat(b, new Uint8Array(length - b.length).fill(0x36)));

async function digest(hash: string, data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest(hash, data as BufferSource));
}

/** AES-CBC without padding (Web Crypto always expects PKCS#7, so we append a block that decrypts to valid padding). */
async function aesDecrypt(keyBytes: Uint8Array, iv: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", keyBytes as BufferSource, "AES-CBC", false, ["encrypt", "decrypt"]);
  const last = data.slice(data.length - 16);
  const filler = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv: last as BufferSource }, key, new Uint8Array(16).fill(16) as BufferSource)).slice(0, 16);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-CBC", iv: iv as BufferSource }, key, concat(data, filler) as BufferSource));
}

export type DecryptResult = { ok: true; xlsx: Uint8Array } | { ok: false; reason: "wrong-password" | "unsupported" };

const isZip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b;
const pwdBytes = (password: string) => new Uint8Array([...password].flatMap((ch) => [ch.charCodeAt(0) & 255, ch.charCodeAt(0) >>> 8]));

/** H0 = H(salt + password), then H(iteration + H) `spin` times (shared by both schemes). */
async function spinHash(hash: string, salt: Uint8Array, password: string, spin: number): Promise<Uint8Array> {
  let h = await digest(hash, concat(salt, pwdBytes(password)));
  for (let i = 0; i < spin; i += 1) h = await digest(hash, concat(le32(i), h));
  return h;
}

/** "Agile" encryption (EncryptionInfo version 4.4): XML parameters, AES-CBC, per-4096-byte segments. */
export async function decryptAgile(info: Uint8Array, pkg: Uint8Array, password: string): Promise<DecryptResult> {
  const xml = new TextDecoder().decode(info.subarray(8));
  const keyDataTag = /<(?:\w+:)?keyData\b[^>]*>/.exec(xml)?.[0];
  const keyTag = /<(?:\w+:)?encryptedKey\b[^>]*>/.exec(xml)?.[0];
  if (!keyDataTag || !keyTag) return { ok: false, reason: "unsupported" };
  const kd = attrs(keyDataTag);
  const ek = attrs(keyTag);
  const hash = HASHES[ek.hashAlgorithm ?? ""];
  const dataHash = HASHES[kd.hashAlgorithm ?? ""];
  if (!hash || !dataHash || (ek.cipherAlgorithm ?? "AES") !== "AES" || (ek.cipherChaining ?? "ChainingModeCBC") !== "ChainingModeCBC") {
    return { ok: false, reason: "unsupported" };
  }
  const salt = b64(ek.saltValue!);
  const blockSize = Number(ek.blockSize ?? 16);
  const keyBytes = Number(ek.keyBits ?? 256) / 8;
  const hashSize = Number(ek.hashSize ?? 64);
  const h = await spinHash(hash, salt, password, Number(ek.spinCount ?? 100000));
  const keyFor = async (block: number[]) => fit(await digest(hash, concat(h, new Uint8Array(block))), keyBytes);
  const iv = fit(salt, blockSize);

  const verifierInput = (await aesDecrypt(await keyFor([0xfe, 0xa7, 0xd2, 0x76, 0x3b, 0x4b, 0x9e, 0x79]), iv, b64(ek.encryptedVerifierHashInput!))).slice(0, salt.length);
  const verifierHash = (await aesDecrypt(await keyFor([0xd7, 0xaa, 0x0f, 0x6d, 0x30, 0x61, 0x34, 0x4e]), iv, b64(ek.encryptedVerifierHashValue!))).slice(0, hashSize);
  const expected = (await digest(hash, verifierInput)).slice(0, hashSize);
  if (expected.length !== verifierHash.length || expected.some((b, i) => b !== verifierHash[i])) return { ok: false, reason: "wrong-password" };

  const secret = (await aesDecrypt(await keyFor([0x14, 0x6e, 0x0b, 0xe7, 0xab, 0xac, 0xd0, 0xd6]), iv, b64(ek.encryptedKeyValue!))).slice(0, Number(kd.keyBits ?? 256) / 8);
  const dataSalt = b64(kd.saltValue!);
  const dataBlock = Number(kd.blockSize ?? 16);
  const size = u32(pkg, 0) + u32(pkg, 4) * 2 ** 32;
  const parts: Uint8Array[] = [];
  for (let offset = 8, i = 0; offset < pkg.length; offset += 4096, i += 1) {
    const segment = pkg.subarray(offset, Math.min(offset + 4096, pkg.length));
    const usable = segment.subarray(0, segment.length - (segment.length % 16));
    if (!usable.length) break;
    parts.push(await aesDecrypt(secret, fit(await digest(dataHash, concat(dataSalt, le32(i))), dataBlock), usable));
  }
  const xlsx = concat(...parts).subarray(0, size);
  return isZip(xlsx) ? { ok: true, xlsx } : { ok: false, reason: "unsupported" };
}

/** AES-ECB decrypt through Web Crypto's CBC: decrypt with a zero IV, then undo the chaining XOR. */
async function aesEcbDecrypt(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const out = await aesDecrypt(keyBytes, new Uint8Array(16), data);
  for (let i = out.length - 1; i >= 16; i -= 1) out[i]! ^= data[i - 16]!;
  return out;
}

/** "Standard" encryption (version 2/3/4 . 2): binary header, SHA-1, AES-ECB. */
export async function decryptStandard(info: Uint8Array, pkg: Uint8Array, password: string): Promise<DecryptResult> {
  const headerSize = u32(info, 8);
  const h = 12;
  const algId = u32(info, h + 8);
  const keyBits = u32(info, h + 16);
  if (![0x660e, 0x660f, 0x6610].includes(algId)) return { ok: false, reason: "unsupported" };
  const v = 12 + headerSize;
  const saltSize = u32(info, v);
  const salt = info.slice(v + 4, v + 4 + saltSize);
  const encVerifier = info.slice(v + 4 + saltSize, v + 20 + saltSize);
  const verifierHashSize = u32(info, v + 20 + saltSize);
  const encVerifierHash = info.slice(v + 24 + saltSize, v + 24 + saltSize + 32);

  const hn = await spinHash("SHA-1", salt, password, 50_000);
  const hfinal = await digest("SHA-1", concat(hn, le32(0)));
  const xorPad = (byte: number) => {
    const b = new Uint8Array(64).fill(byte);
    hfinal.forEach((x, i) => (b[i] = b[i]! ^ x));
    return b;
  };
  const key = concat(await digest("SHA-1", xorPad(0x36)), await digest("SHA-1", xorPad(0x5c))).slice(0, keyBits / 8);

  const verifier = await aesEcbDecrypt(key, encVerifier);
  const verifierHash = (await aesEcbDecrypt(key, encVerifierHash)).slice(0, verifierHashSize);
  const expected = await digest("SHA-1", verifier);
  if (expected.some((b, i) => b !== verifierHash[i])) return { ok: false, reason: "wrong-password" };

  const size = u32(pkg, 0) + u32(pkg, 4) * 2 ** 32;
  const body = pkg.subarray(8, 8 + Math.floor((pkg.length - 8) / 16) * 16);
  const xlsx = (await aesEcbDecrypt(key, body)).subarray(0, size);
  return isZip(xlsx) ? { ok: true, xlsx } : { ok: false, reason: "unsupported" };
}

export async function decryptXlsx(bytes: Uint8Array, password: string): Promise<DecryptResult> {
  const streams = readCompoundFile(bytes);
  const info = streams.get("EncryptionInfo");
  const pkg = streams.get("EncryptedPackage");
  if (!info || !pkg) return { ok: false, reason: "unsupported" };
  const major = u16(info, 0);
  const minor = u16(info, 2);
  if (major === 4 && minor === 4) return decryptAgile(info, pkg, password);
  if ((major === 2 || major === 3 || major === 4) && minor === 2) return decryptStandard(info, pkg, password);
  return { ok: false, reason: "unsupported" };
}
