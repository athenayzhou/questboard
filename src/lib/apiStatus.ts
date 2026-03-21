export async function checkStatus(): Promise<boolean>{
  try{
    const res = await fetch("/api/me/status", {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}