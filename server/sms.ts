export async function sendSms(to: string, message: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    console.log(`[SMS DISABLED] To: ${to} — ${message}`);
    return false;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const body = new URLSearchParams({ To: to, From: from, Body: message });

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!resp.ok) {
      console.error("[SMS] Failed:", await resp.text());
      return false;
    }

    console.log(`[SMS] Sent to ${to}`);
    return true;
  } catch (err) {
    console.error("[SMS] Error:", err);
    return false;
  }
}
