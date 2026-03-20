import crypto from "crypto";

const INVITE_HMAC_SECRET = process.env.INVITE_HMAC_SECRET!;
if(!INVITE_HMAC_SECRET){
  throw new Error("missing INVITE_HMAC_SECRET env var");
}

export function hashInviteKey(inviteKey: string){
  return crypto
    .createHmac("sha256", INVITE_HMAC_SECRET)
    .update(inviteKey)
    .digest("hex");
}

export function hashSessionToken(token: string){
  return crypto.createHmac("sha256", INVITE_HMAC_SECRET).update(token).digest("hex");
}

export function makeSessionToken(){
  return crypto.randomBytes(32).toString("hex");
}