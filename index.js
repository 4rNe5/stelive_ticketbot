"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const axios_1 = require("axios");
const qs = require("querystring");

// Sleep function for exponential backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if response is HTML (server error page)
const isHtmlResponse = (data) => {
    if (typeof data === 'string') {
        return data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html');
    }
    return false;
};

// Retry logic with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 4, baseDelay = 1000) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await fn();

            // Check if we got HTML instead of JSON
            if (isHtmlResponse(result.data)) {
                throw new Error('Server returned HTML error page (likely overloaded)');
            }

            // If status is 500, retry
            if (result.status === 500) {
                throw new Error(`Server returned 500 error`);
            }

            // If status is not 200, throw error
            if (result.status !== 200) {
                throw new Error(`API returned status ${result.status}`);
            }

            return result;
        } catch (error) {
            const isLastAttempt = attempt === maxRetries;

            if (isLastAttempt) {
                throw error;
            }

            // Calculate delay with exponential backoff
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Attempt ${attempt + 1} failed: ${error.message}`);
            console.log(`Retrying in ${delay}ms... (${maxRetries - attempt} attempts remaining)`);
            await sleep(delay);
        }
    }
};

(async () => {
    var _a;
    // Validate parameters
    const [productId, scheduleId, seatId, webhookUrl] = [
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
    const message = (_a = core.getInput("message")) !== null && _a !== void 0 ? _a : "티켓사세요";
    console.log("Requesting with params:", { productId, scheduleId, seatId });

    const res = await retryWithBackoff(async () => {
        const response = await axios_1.default({
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
            timeout: 10000, // 10 second timeout
            validateStatus: () => true,
        });

        // tslint:disable-next-line
        console.log("Got response status:", response.status);
        console.log("Got response data:", typeof response.data === 'string' ? response.data.substring(0, 200) + '...' : JSON.stringify(response.data));

        return response;
    });

    console.log("Request successful after retries!");
    if (res.data.chkResult) {
        const link = `http://ticket.melon.com/performance/index.htm?${qs.stringify({
            prodId: productId,
        })}`;
        console.log("Tickets available! Sending Discord notification...");
        // Send Discord webhook notification
        await axios_1.default.post(webhookUrl, {
            content: `${message} ${link}`,
            allowed_mentions: {
                parse: ["everyone", "roles", "users"],
            },
        });
        console.log("Discord notification sent!");
    }
    else {
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
