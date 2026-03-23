import crypto from "crypto";

function inviteHmacSecret(){
  const secret = process.env.INVITE_HMAC_SECRET;
  if (!secret) {
    throw new Error("missing INVITE_HMAC_SECRET env var");
  }
  return secret;
}

export function hashInviteKey(inviteKey: string){
  return crypto
    .createHmac("sha256", inviteHmacSecret())
    .update(inviteKey)
    .digest("hex");
}

export function hashSessionToken(token: string){
  return crypto.createHmac("sha256", inviteHmacSecret()).update(token).digest("hex");
}

export function makeSessionToken(){
  return crypto.randomBytes(32).toString("hex");
}