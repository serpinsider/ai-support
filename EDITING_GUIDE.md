# How to Edit Your AI Bot

Everything is now organized into easy-to-edit config files. You don't need to touch the main server code.

---

## 📋 What Information the AI Has

**File:** `config/mesa-maids-knowledge.js`

Edit this to update:
- **Services** - What cleaning types you offer, what's included, pricing
- **Pricing** - Base rates, add-ons, discounts
- **Policies** - Cancellation, payment, booking rules
- **Availability** - Business hours, booking windows
- **FAQ** - Common questions and answers

### Example Edit:

Change Deep Clean price from +$100 to +$120:

```javascript
'Deep Clean': {
  description: 'More thorough cleaning...',
  additionalCost: '+$120 on top of base price',  // Changed from +$100
  ...
}
```

Add a new add-on:

```javascript
addons: {
  'Inside fridge': 40,
  'Inside oven': 40,
  'Garage cleaning': 80,  // NEW
  ...
}
```

Update a FAQ answer:

```javascript
FAQ = {
  'Do I need to be home?': 'Nope! We can use a lockbox or garage code.',  // Updated
  ...
}
```

---

## 🎭 How the AI Talks

**File:** `config/agent-personality.js`

Edit this to change:
- **Tone** - Friendly, professional, casual, enthusiastic, empathetic
- **Style** - How long/short responses are, emojis, using customer names
- **Templates** - How the AI formats greetings, closings, pricing responses
- **Rules** - What it should always/never do, when to escalate

### Example Edit:

Make the AI more enthusiastic:

```javascript
tone: {
  friendly: true,
  professional: true,
  casual: true,
  enthusiastic: true,  // Changed from false
  empathetic: true
}
```

Change response length:

```javascript
style: {
  brevity: 'detailed',        // Changed from 'concise'
  maxLength: 500,             // Changed from 300
  preferredLength: '2-4 sentences'  // Changed from '1-3 sentences'
}
```

Add emoji use:

```javascript
style: {
  ...
  useEmojis: true,  // Changed from false
}
```

Change how it greets customers:

```javascript
greeting: {
  firstTime: "Hi there! I'm Sarah from Mesa Maids.",  // Updated
  withName: "Hi {{firstName}}! Sarah here from Mesa Maids.",  // Updated
}
```

---

## 🚀 After Making Changes

### Test Locally (Optional):

```bash
npm run dev
node test.js  # See how AI responds to test questions
```

### Deploy to Production:

```bash
git add -A
git commit -m "Updated pricing/personality"
git push
```

Render will auto-deploy in 1-2 minutes.

---

## 📁 File Structure

```
brooklyn-bot-ai/
├── config/
│   ├── mesa-maids-knowledge.js   ← Edit business info here
│   ├── agent-personality.js      ← Edit how AI talks here
│   └── prompt-builder.js         ← Don't edit (builds prompt automatically)
├── server.js                     ← Don't edit (main server code)
├── business-knowledge.js         ← OLD FILE (not used anymore)
└── test.js                       ← Run to test AI responses
```

---

## 🎯 Common Edits

### Change Pricing:

Edit `config/mesa-maids-knowledge.js`:
```javascript
'Deep Clean': {
  additionalCost: '+$150 on top of base price',  // Change this
}
```

### Add a New Service:

Edit `config/mesa-maids-knowledge.js`:
```javascript
SERVICES = {
  ...existing services,
  
  'Post Construction': {  // NEW
    description: 'Heavy duty cleaning after construction/renovation',
    additionalCost: '+$200 on top of base price',
    includes: [
      'Dust removal from all surfaces',
      'Window cleaning',
      'Floor deep clean'
    ],
    duration: '4-6 hours'
  }
}
```

### Make AI More Casual:

Edit `config/agent-personality.js`:
```javascript
tone: {
  friendly: true,
  professional: false,  // Less formal
  casual: true,
  enthusiastic: true,   // More energy
}

RESPONSE_TEMPLATES = {
  greeting: {
    withName: "Hey {{firstName}}! What's up?",  // More casual
  }
}
```

### Add New FAQ:

Edit `config/mesa-maids-knowledge.js`:
```javascript
FAQ = {
  ...existing FAQs,
  
  'Do you clean Airbnbs?': 'Yes! We have special Airbnb turnover packages. Want details?'
}
```

---

## 🔍 Testing Your Changes

### Test Specific Scenarios:

Edit `test.js` to add your own test messages:

```javascript
const testMessages = [
  "How much for 3 bedroom 2 bathroom?",
  "Do you clean Airbnbs?",  // Test your new FAQ
  "Can you come same day?",
];
```

Then run:
```bash
node test.js
```

---

## 💡 Tips

1. **Small changes** - Test one thing at a time
2. **Keep it simple** - The AI works best with clear, direct information
3. **Test locally first** - Run `node test.js` before deploying
4. **Short responses** - SMS customers prefer brief answers
5. **Be specific** - "Deep clean is +$100" is better than "Deep clean costs more"

---

## ⚠️ What NOT to Edit

- `server.js` - Main server code (unless you know what you're doing)
- `prompt-builder.js` - Automatically builds the prompt from your configs
- `.env` - Contains API keys (edit for different businesses)
- `node_modules/` - Third-party code

---

## 🆘 Need Help?

**AI not responding how you want?**
1. Check `config/agent-personality.js` for tone/style settings
2. Add more examples in `EXAMPLE_RESPONSES`
3. Update `COMMUNICATION_RULES` to be more specific

**Wrong information?**
1. Update `config/mesa-maids-knowledge.js`
2. Make sure pricing is current
3. Update FAQ with common customer questions

**Want different brands (Brooklyn, STL)?**
1. Create `config/brooklyn-maids-knowledge.js`
2. Create `config/brooklyn-agent-personality.js`
3. Update `.env` to point to different configs
4. Deploy separate instances on Render

---

**Everything is designed to be edited without touching code. Just update the config files and push!**

