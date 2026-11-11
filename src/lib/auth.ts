import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ATHLETE_COOKIE = 'sh_athlete';
const TRAINER_COOKIE = 'sh_trainer';
const YEAR = 60 * 60 * 24 * 365;
const MONTH = 60 * 60 * 24 * 30;

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const secret = () => sha(`stabhochsprung-v2:${process.env.SUPABASE_SECRET_KEY || ''}:${process.env.TRAINER_PASSWORD || ''}`);

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function sign(payload: object) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = createHmac('sha256', secret()).update(data).digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString()) as T;
  } catch {
    return null;
  }
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge,
});

// Ein geänderter Gruppen-Code bzw. ein geändertes Passwort meldet alle automatisch ab.
const groupTag = () => sha(`g:${process.env.GROUP_CODE || ''}`).slice(0, 10);
const trainerTag = () => sha(`t:${process.env.TRAINER_PASSWORD || ''}`).slice(0, 10);

/* ---------- Athletinnen und Athleten ---------- */

export const groupCodeRequired = () => Boolean(process.env.GROUP_CODE);

export function checkGroupCode(code: string) {
  const expected = process.env.GROUP_CODE;
  if (!expected) return true;
  return safeEqual(code.trim(), expected);
}

export async function getAthlete(): Promise<string | null> {
  const store = await cookies();
  const p = verify<{ n: string; g: string }>(store.get(ATHLETE_COOKIE)?.value);
  return p && p.g === groupTag() ? p.n : null;
}

export async function requireAthlete(): Promise<string> {
  const name = await getAthlete();
  if (!name) redirect('/start');
  return name;
}

export async function setAthlete(name: string) {
  const store = await cookies();
  store.set(ATHLETE_COOKIE, sign({ n: name, g: groupTag() }), cookieOptions(YEAR));
}

export async function clearAthlete() {
  const store = await cookies();
  store.delete(ATHLETE_COOKIE);
}

/* ---------- Trainer ---------- */

export function checkTrainerPassword(pw: string) {
  const expected = process.env.TRAINER_PASSWORD;
  return Boolean(expected) && safeEqual(pw, expected as string);
}

export async function isTrainer(): Promise<boolean> {
  const store = await cookies();
  const p = verify<{ t: string; exp: number }>(store.get(TRAINER_COOKIE)?.value);
  return Boolean(p && p.t === trainerTag() && p.exp > Date.now());
}

export async function requireTrainer() {
  if (!(await isTrainer())) redirect('/trainer/login');
}

export async function setTrainer() {
  const store = await cookies();
  store.set(TRAINER_COOKIE, sign({ t: trainerTag(), exp: Date.now() + MONTH * 1000 }), cookieOptions(MONTH));
}

export async function clearTrainer() {
  const store = await cookies();
  store.delete(TRAINER_COOKIE);
}
