import fs from 'node:fs';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not configured');
  process.exit(1);
}

const path = 'telegram-bot/queue.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const now = Date.now();

async function telegram(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(payload)
  });
  const body = await res.json();
  if (!body.ok) throw new Error(`${method}: ${JSON.stringify(body)}`);
  return body.result;
}

let changed = false;

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
