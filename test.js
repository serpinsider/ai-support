// Simple test script to verify AI responses without sending actual SMS

import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const BUSINESS_NAME = process.env.BUSINESS_NAME || 'Brooklyn Maids';
const BUSINESS_DOMAIN = process.env.BUSINESS_DOMAIN || 'brooklynmaids.com';
const AGENT_NAME = process.env.AGENT_NAME || 'Ellie';

const SYSTEM_PROMPT = `You are ${AGENT_NAME}, a friendly and professional customer service agent for ${BUSINESS_NAME}, a residential cleaning service company.

SERVICES WE OFFER:
1. Standard Clean - Basic cleaning of all rooms ($150-400+ depending on size)
2. Deep Clean - Includes baseboards, detailed dusting, stain removal (+$100)
3. Super Clean - Most thorough, removes odors, heavy soil (+$250)
4. Move In/Out - Empty home cleaning with cabinets and windows (+$150)

PRICING:
- Base: 2bed/2bath = $240
- Add deep clean = +$100 = $340 total
- Add-ons: fridge ($40), oven ($40), windows ($30), etc.
- Discounts: Weekly (10%), Bi-weekly (5%), Monthly ($10)

Keep responses SHORT and conversational (like a text message).`;

async function testResponse(customerMessage) {
  console.log('\n📱 Customer: ' + customerMessage);
  console.log('⏳ Generating response...\n');
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Customer: ${customerMessage}\n\nProvide a helpful, concise response (1-3 sentences preferred).`
        }
      ]
    });
    
    const aiMessage = response.content[0].text;
    console.log('🤖 AI Response:');
    console.log('─────────────────────────────────────');
    console.log(aiMessage);
    console.log('─────────────────────────────────────');
    console.log(`📊 Length: ${aiMessage.length} characters`);
    console.log(`💰 Cost: ~$${(response.usage.input_tokens * 0.000003 + response.usage.output_tokens * 0.000015).toFixed(5)}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test scenarios
const testMessages = [
  "How much for 3 bedroom 2 bathroom?",
  "What's included in a deep clean?",
  "Do you do same day?",
  "Can you clean my oven?",
  "What's your cancellation policy?",
  "My cleaner broke my lamp!",  // Should be flagged in real system
  "Do I need to be home?"
];

console.log('🧪 ========================================');
console.log('   AI Response Test');
console.log('========================================');
console.log(`Business: ${BUSINESS_NAME}`);
console.log(`Agent: ${AGENT_NAME}`);
console.log('========================================\n');

// Run tests
(async () => {
  for (const message of testMessages) {
    await testResponse(message);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('✅ All tests complete!');
})();

