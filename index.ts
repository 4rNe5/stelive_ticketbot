import * as core from "@actions/core";
import axios from "axios";
import * as qs from "querystring";

(async () => {
  // Validate parameters
  const [ productId, scheduleId, seatId, webhookUrl ] = [
    "product-id",
    "schedule-id",
    "seat-id",
    "discord-webhook-url",
  ].map((name) => {
    const value = core.getInput(name);
    if (!value) {
      throw new Error(`melon-ticket-actions: Please set ${name} input parameter`);
    }

    return value;
  });

  const message = core.getInput("message") ?? "티켓사세요";

  console.log("Requesting with params:", { productId, scheduleId, seatId });

  const res = await axios({
    method: "POST",
    url: "https://ticket.melon.com/tktapi/product/seatStateInfo.json",
    params: {
      v: "1",
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": `http://ticket.melon.com/performance/index.htm?prodId=${productId}`,
    },
    data: qs.stringify({
      prodId: productId,
      scheduleNo: scheduleId,
      seatId,
      volume: 1,
      selectedGradeVolume: 1,
    }),
    validateStatus: () => true, // Don't throw on any status code
  });

  // tslint:disable-next-line
  console.log("Got response status:", res.status);
  console.log("Got response data:", JSON.stringify(res.data));

  if (res.status !== 200) {
    throw new Error(`API returned status ${res.status}: ${JSON.stringify(res.data)}`);
  }

  if (res.data.chkResult) {
    const link = `http://ticket.melon.com/performance/index.htm?${qs.stringify({
      prodId: productId,
    })}`;

    console.log("Tickets available! Sending Discord notification...");

    // Send Discord webhook notification
    await axios.post(webhookUrl, {
      content: `${message} ${link}`,
      allowed_mentions: {
        parse: ["everyone", "roles", "users"], // Enable @here, @everyone, role and user mentions
      },
    });

    console.log("Discord notification sent!");
  } else {
    console.log("No tickets available (chkResult: false)");
  }
})().catch((e) => {
  console.error("Error occurred:", e.message); // tslint:disable-line
  if (e.response) {
    console.error("Response status:", e.response.status);
    console.error("Response data:", e.response.data);
  }
  console.error(e.stack); // tslint:disable-line
  core.setFailed(e.message);
});
