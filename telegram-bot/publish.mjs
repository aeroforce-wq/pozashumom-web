import fs from 'node:fs';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not configured');
  process.exit(1);
}

const path = 'telegram-bot/queue.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const now = Date.now();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const RETRYABLE_NETWORK_CODES = new Set(['ETIMEDOUT', 'ENETUNREACH', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN']);

function collectErrorCodes(error, out = new Set()) {
  if (!error) return out;
  if (error.code) out.add(error.code);
  if (error.cause) collectErrorCodes(error.cause, out);
  if (Array.isArray(error.errors)) {
    for (const nested of error.errors) collectErrorCodes(nested, out);
  }
  return out;
}

function isRetryableNetworkError(error) {
  const codes = collectErrorCodes(error);
  return [...codes].some(code => RETRYABLE_NETWORK_CODES.has(code));
}

async function telegram(method, payload) {
  const delays = [3000, 7000, 15000];

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      if (!body.ok) throw new Error(`${method}: ${JSON.stringify(body)}`);
      return body.result;
    } catch (error) {
      const retryable = isRetryableNetworkError(error);
      const finalAttempt = attempt === 3;

      if (!retryable || finalAttempt) throw error;

      const waitMs = delays[attempt];
      console.warn(
        `Telegram network error on ${method}; retrying in ${waitMs} ms (attempt ${attempt + 2}/4)`
      );
      await sleep(waitMs);
    }
  }
}

let changed = false;

if (Array.isArray(data.delete_requests)) {
  for (const request of data.delete_requests) {
    if (request.status !== 'pending') continue;

    const result = await telegram('deleteMessage', {
      chat_id: request.chat_id || data.channel,
      message_id: request.message_id
    });

    request.status = result ? 'deleted' : 'failed';
    request.deleted_at = result ? new Date().toISOString() : null;
    changed = true;

    const linked = data.items.find(item => item.telegram_message_id === request.message_id);
    if (linked && result) {
      linked.status = 'deleted';
      linked.deleted_at = request.deleted_at;
    }

    console.log(`Deleted Telegram message ${request.message_id}`);
  }
}


for (const item of data.items) {
  if (item.status !== 'pending') continue;
  if (!item.scheduled_at) continue;

  const scheduled = Date.parse(item.scheduled_at);
  if (!Number.isFinite(scheduled) || scheduled > now) continue;

  const base = {
    chat_id: item.chat_id || data.channel,
    disable_notification: Boolean(item.silent)
  };

  let result;
  if (item.type === 'photo') {
    result = await telegram('sendPhoto', {
      ...base,
      photo: item.media_url,
      caption: item.text || '',
      parse_mode: item.parse_mode || 'HTML'
    });
  } else if (item.type === 'video') {
    result = await telegram('sendVideo', {
      ...base,
      video: item.media_url,
      caption: item.text || '',
      parse_mode: item.parse_mode || 'HTML',
      supports_streaming: true
    });
  } else {
    result = await telegram('sendMessage', {
      ...base,
      text: item.text || '',
      parse_mode: item.parse_mode || 'HTML',
      disable_web_page_preview: Boolean(item.disable_web_page_preview)
    });
  }

  item.status = 'published';
  item.published_at = new Date().toISOString();
  item.telegram_message_id = result.message_id;
  changed = true;
  console.log(`Published ${item.id} -> Telegram message ${result.message_id}`);
}

if (changed) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}
