# Quick Start Guide - 10 Minutes to Testing

## Step 1: Install (1 min)

```bash
cd brooklyn-bot-ai
npm install
```

## Step 2: Get API Keys (5 min)

### OpenPhone API Key:
1. Go to https://app.openphone.com
2. Settings → Integrations → API
3. Generate API key
4. Copy it

### Anthropic API Key:
1. Go to https://console.anthropic.com
2. Sign up (free $5 credit)
3. Go to API Keys
4. Create new key
5. Copy it

## Step 3: Configure (2 min)

Create `.env` file:
```bash
cp env-template.txt .env
```

Edit `.env` and add your keys:
```env
OPENPHONE_API_KEY=pk_live_your_key_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
TEST_PHONE_NUMBER=+13477504380
```

## Step 4: Test AI Locally (2 min)

```bash
npm run dev
```

In another terminal:
```bash
# Test if Claude is working
curl http://localhost:8000/test-claude

# Test AI response (won't actually send SMS)
curl -X POST http://localhost:8000/test-ai-response \
  -H "Content-Type: application/json" \
  -d '{"message": "How much for 2 bed 2 bath?"}'
```

Or run the test script:
```bash
node test.js
```

You should see AI responses to various customer questions.

## Step 5: Deploy & Connect OpenPhone (Optional)

### Quick Deploy to Render:
1. Push to GitHub
2. Go to https://render.com
3. New → Web Service
4. Connect your repo
5. Add environment variables
6. Deploy

### Configure Webhook:
1. OpenPhone → Settings → Webhooks
2. Add Webhook:
   - URL: `https://your-app.onrender.com/webhook/incoming-message`
   - Event: `message.created`
   - Phone: Your test number
3. Save

### Test:
Send a text to your OpenPhone test number and watch it respond!

---

## What's Next?

Read the full `README.md` for:
- Detailed testing strategies
- Customization options
- Troubleshooting
- Production deployment

---

## Common Issues

**"ANTHROPIC_API_KEY is not set"**
→ Make sure you created `.env` file with the key

**"OpenPhone API key is not set"**  
→ Add OPENPHONE_API_KEY to `.env`

**AI responses are weird**  
→ Edit SYSTEM_PROMPT in `server.js`

**Nothing happens when I text**  
→ Check webhook is configured correctly in OpenPhone

