# Brooklyn Bot AI - Intelligent SMS Customer Service

AI-powered SMS customer service bot that uses Claude (Anthropic) to automatically respond to customer texts via OpenPhone.

## Overview

This bot sits between your customers and your team:
- **Customer texts your OpenPhone number** → Webhook fires
- **AI analyzes message** → Decides if it can handle it
- **AI responds automatically** OR **Flags for human** team member

Your team keeps using OpenPhone's interface normally - they'll only see messages the AI couldn't handle.

---

## What It Does

### Auto-Responds To:
✅ Pricing questions ("How much for 3bd/2ba?")  
✅ Service explanations ("What's in a deep clean?")  
✅ Availability questions ("When can you come?")  
✅ Policy questions ("Do I need to be home?")  
✅ General questions about services  
✅ Booking guidance  

### Flags For Human:
🚨 Complaints or quality issues  
🚨 Payment disputes  
🚨 Rescheduling requests  
🚨 Complex custom requests  
🚨 Angry/upset customers  
🚨 Anything it's not confident about  

---

## Architecture

```
Customer texts
    ↓
OpenPhone receives message
    ↓
OpenPhone webhook → Your server (this code)
    ↓
Fetch conversation history from OpenPhone
    ↓
Run decision logic (should we auto-respond?)
    ↓
    ├─ YES → Send to Claude AI
    │         ↓
    │       Generate response
    │         ↓
    │       Validate response
    │         ↓
    │       Send via OpenPhone
    │         ↓
    │       Mark conversation as "done"
    │
    └─ NO → Leave in OpenPhone inbox
             ↓
           Your team responds manually
```

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- OpenPhone account with API access
- Anthropic API key (sign up at https://console.anthropic.com)
- A test OpenPhone number (or create new one)

### 2. Install Dependencies

```bash
cd brooklyn-bot-ai
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# OpenPhone Configuration
OPENPHONE_API_KEY=your_openphone_api_key_here
OPENPHONE_USER_ID=US4XHj7ZrY

# Claude AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Server Configuration
PORT=8000
NODE_ENV=development

# Test Phone Number (your OpenPhone test number)
TEST_PHONE_NUMBER=+1XXXXXXXXXX

# Business Configuration
BUSINESS_NAME=Brooklyn Maids
BUSINESS_DOMAIN=brooklynmaids.com
AGENT_NAME=Ellie

# Safety Settings
MAX_RESPONSES_PER_HOUR=10
ENABLE_AUTO_RESPONSE=true
BUSINESS_HOURS_START=8
BUSINESS_HOURS_END=18
```

### 4. Get Your API Keys

#### OpenPhone API Key:
1. Log into OpenPhone dashboard
2. Go to Settings → Integrations → API
3. Generate new API key
4. Copy and paste into `.env`

#### Anthropic API Key:
1. Sign up at https://console.anthropic.com
2. Go to API Keys section
3. Create new key
4. You get $5 free credit to start
5. Copy and paste into `.env`

### 5. Test Locally

Start the server:
```bash
npm run dev
```

Test endpoints:
```bash
# Health check
curl http://localhost:8000/health

# Configuration check
curl http://localhost:8000/test

# Test Claude connection
curl http://localhost:8000/test-claude

# Test AI response (without sending)
curl -X POST http://localhost:8000/test-ai-response \
  -H "Content-Type: application/json" \
  -d '{"message": "How much for a 2 bedroom 2 bathroom?"}'
```

---

## OpenPhone Webhook Setup

### 1. Deploy Your Server

Deploy to Render, Railway, or any hosting service:

**Render.com (Recommended):**
1. Push code to GitHub
2. Connect Render to your repo
3. Create new Web Service
4. Add environment variables
5. Deploy
6. Note your URL (e.g., `https://brooklyn-bot-ai.onrender.com`)

**Or use ngrok for local testing:**
```bash
ngrok http 8000
# Copy the https URL (e.g., https://abc123.ngrok.io)
```

### 2. Configure OpenPhone Webhook

1. Go to OpenPhone dashboard
2. Settings → Integrations → Webhooks
3. Click "Add Webhook"
4. Configuration:
   - **URL:** `https://your-server.com/webhook/incoming-message`
   - **Events:** Select `message.created`
   - **Phone Number:** Select your TEST number only
5. Save

### 3. Test It

Send a text to your test OpenPhone number:
```
"How much for a 3 bedroom 2 bathroom deep clean?"
```

Check your server logs - you should see:
```
📩 Incoming Message Webhook
📱 From: +1234567890
💬 Message: How much for a 3 bedroom 2 bathroom deep clean?
🤔 Decision: ✅ Auto-respond
🤖 Generating AI response...
💭 AI Response: Hey! For a 3bd/2ba deep clean...
📤 Sending AI response...
✅ AI response sent successfully!
```

---

## Testing Guide

### Phase 1: Test Without Sending (Safe)

Use the test endpoint:
```bash
curl -X POST http://localhost:8000/test-ai-response \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How much is a standard clean?",
    "conversationHistory": []
  }'
```

This shows you what the AI would respond WITHOUT actually sending the SMS.

### Phase 2: Test With Your Own Phone

1. Send texts to your test OpenPhone number
2. Watch server logs
3. Receive AI responses
4. Verify quality

**Test these scenarios:**

✅ **Pricing question:**  
Text: "How much for 2 bed 2 bath?"  
Expected: AI gives price breakdown

✅ **Service question:**  
Text: "What's included in deep clean?"  
Expected: AI explains what's included

✅ **Complaint (should flag):**  
Text: "My cleaner broke my vase!"  
Expected: NO auto-response, stays in inbox

✅ **Complex request:**  
Text: "I need someone tomorrow at 7am with special supplies"  
Expected: May or may not respond (test it)

### Phase 3: Test With Team Member Phones

Have your assistants text the number with real customer-style questions.

### Phase 4: Go Live (Optional)

Once confident:
1. Change webhook to your LIVE OpenPhone number(s)
2. Set `ENABLE_AUTO_RESPONSE=true` in production
3. Monitor closely for first few days
4. Adjust system prompt as needed

---

## Configuration

### Business Knowledge

Edit `business-knowledge.js` to update:
- Service descriptions
- Pricing information
- Policies
- Common Q&A

### System Prompt

Edit the `SYSTEM_PROMPT` in `server.js` to change:
- AI agent personality
- What it can/can't handle
- Response style
- Business rules

### Decision Logic

Edit the `shouldAutoRespond()` function to change:
- Which keywords trigger human escalation
- Rate limiting rules
- Business hours enforcement
- Message count limits

---

## Safety Features

### 1. Rate Limiting
Max 10 responses per customer per hour (configurable)

### 2. Escalation Keywords
Auto-flags if message contains:
- complaint, terrible, awful, worst
- refund, lawsuit, sue, lawyer
- angry, upset, damaged, broke, stolen

### 3. Response Validation
Checks if AI response is:
- Not too short (<10 chars)
- Not too long (>800 chars)
- No placeholder text

### 4. Conversation Limit
Flags if customer has sent >5 messages in conversation

### 5. Business Hours
Optionally only respond during business hours

### 6. Manual Override
Set `ENABLE_AUTO_RESPONSE=false` to disable all auto-responses

---

## Monitoring

### Server Logs

Watch logs in real-time:
```bash
# If running locally
npm run dev

# If on Render
View logs in Render dashboard
```

### OpenPhone Dashboard

- Conversations marked "done" = AI handled
- Conversations still "open" = Needs human attention

### Cost Tracking

Check Claude usage at https://console.anthropic.com/settings/usage

Typical costs:
- ~$0.003-0.01 per customer conversation
- $5 credit = ~500-1000 conversations

---

## Customization

### Change AI Model

In `server.js`, change model name:
```javascript
model: 'claude-3-5-sonnet-20240620'  // Current (best quality)
// or
model: 'claude-3-haiku-20240307'     // Cheaper, faster, less smart
```

### Add Business-Specific Logic

Example: Check if customer has existing booking
```javascript
// In shouldAutoRespond function
const customer = await lookupCustomerByPhone(message.from);
if (customer && customer.hasActiveBooking) {
  // Customer has booking, handle differently
}
```

### Integrate With Your CRM

```javascript
// In incoming message handler
const customer = await fetchFromHubspot(customerPhone);
// Pass customer data to AI for personalized responses
```

---

## Troubleshooting

### Problem: Webhook not firing

**Check:**
- Is webhook URL correct in OpenPhone?
- Is server running and accessible?
- Is webhook configured for correct phone number?
- Check OpenPhone webhook logs

### Problem: AI responses are bad

**Fix:**
- Update SYSTEM_PROMPT with better examples
- Add more business knowledge
- Adjust temperature (lower = more consistent)
- Review logs to see what it's struggling with

### Problem: Too many human escalations

**Fix:**
- Review escalation keywords (may be too aggressive)
- Increase confidence threshold
- Update decision logic

### Problem: Not enough human escalations

**Fix:**
- Add more escalation keywords
- Lower confidence threshold
- Increase validation strictness

### Problem: Rate limit hit

**Fix:**
- Increase MAX_RESPONSES_PER_HOUR
- Or customer is spamming (good that it's blocked)

---

## Deployment Options

### Option 1: Render (Recommended)

```bash
1. Push to GitHub
2. Connect Render to repo
3. Set environment variables
4. Deploy
```

Free tier: Sleeps after 15min inactivity (fine for testing)  
Paid tier: $7/mo, always on

### Option 2: Railway

Similar to Render, good alternative

### Option 3: Heroku

Classic option, $7/mo minimum

### Option 4: Your Own VPS

If you have a server, just:
```bash
pm2 start server.js
```

---

## File Structure

```
brooklyn-bot-ai/
├── server.js              # Main server with AI logic
├── business-knowledge.js  # Services, pricing, policies
├── package.json          # Dependencies
├── .env                  # Environment variables (create this)
├── .gitignore           # Git ignore rules
├── Procfile             # For deployment
└── README.md            # This file
```

---

## API Endpoints

### `POST /webhook/incoming-message`
Receives incoming messages from OpenPhone webhook

### `GET /health`
Health check endpoint

### `GET /test`
Shows configuration and status

### `GET /test-claude`
Tests Claude API connection

### `POST /test-ai-response`
Test AI response without sending
```json
{
  "message": "How much for 3bd/2ba?",
  "conversationHistory": []
}
```

---

## Cost Breakdown

**Development:**
- Setup: ~2 hours
- Testing: ~2 hours
- Refinement: Ongoing

**Monthly Operating:**
- OpenPhone: Already paying (add test number ~$10-20/mo)
- Claude API: ~$5-20/mo (depends on volume)
- Hosting (Render): $0 (free tier) or $7/mo (paid)

**Per Conversation:**
- AI: ~$0.003-0.01
- SMS: ~$0.01-0.03 (OpenPhone charges)
- **Total: ~$0.01-0.04 per automated conversation**

---

## Next Steps

### For Testing:
1. ✅ Install dependencies (`npm install`)
2. ✅ Configure `.env` with API keys
3. ✅ Start server (`npm run dev`)
4. ✅ Test endpoints (health, test-claude, test-ai-response)
5. ✅ Deploy to Render or use ngrok
6. ✅ Configure OpenPhone webhook
7. ✅ Send test messages
8. ✅ Review AI responses
9. ✅ Adjust prompts/logic as needed

### For Production:
1. Test thoroughly with your team
2. Update business knowledge with accurate info
3. Refine system prompt based on real conversations
4. Set up monitoring/alerts
5. Start with just test number
6. Monitor for 1-2 weeks
7. Add more numbers if working well
8. Continue to improve based on data

---

## Support

Questions? Issues? Check:
1. Server logs for detailed error messages
2. OpenPhone webhook logs
3. Claude API usage dashboard

Common issues are usually:
- Missing/incorrect API keys
- Webhook URL typo
- Firewall blocking webhooks
- Test phone number not set

---

## Security Notes

- Never commit `.env` file to git (already in .gitignore)
- Keep API keys secret
- Use separate test/production API keys if possible
- Monitor usage to detect abuse
- Rate limiting protects against spam

---

## License & Credits

Built for Brooklyn Maids and related cleaning service brands.

Uses:
- OpenPhone API (https://openphone.com)
- Anthropic Claude AI (https://anthropic.com)
- Express.js
- Node.js

---

**Ready to test!** Install dependencies and configure your `.env` file to get started.

