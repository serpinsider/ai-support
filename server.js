import express from 'express';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';
import { buildSystemPrompt } from './config/prompt-builder.js';
import { parsePropertyDetails } from './integrations/mesa-maids-api.js';
import { createQuoteInSystem, extractPriceFromResponse, responseContainsPricing } from './integrations/quote-creator.js';
import { isInBookingFlow, handleBookingFlowStep, startBookingFlow } from './integrations/booking-flow.js';
import { getCustomerContext, formatContextForPrompt } from './integrations/hubspot-lookup.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// CONFIGURATION
// ============================================

const OPENPHONE_API_KEY = process.env.OPENPHONE_API_KEY;
const OPENPHONE_API = 'https://api.openphone.com/v1';
const OPENPHONE_USER_ID = process.env.OPENPHONE_USER_ID || 'US4XHj7ZrY';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const BUSINESS_NAME = process.env.BUSINESS_NAME || 'Mesa Maids';
const BUSINESS_DOMAIN = process.env.BUSINESS_DOMAIN || 'mesamaids.com';
const AGENT_NAME = process.env.AGENT_NAME || 'Sarah';
const TEST_PHONE = process.env.TEST_PHONE_NUMBER;

// MESA MAIDS PHONE NUMBER ONLY - Filter all other numbers
const MESA_PHONE_NUMBER = '+14805200202';

const MAX_RESPONSES_PER_HOUR = parseInt(process.env.MAX_RESPONSES_PER_HOUR) || 10;
const ENABLE_AUTO_RESPONSE = process.env.ENABLE_AUTO_RESPONSE !== 'false';
const BUSINESS_HOURS_START = parseInt(process.env.BUSINESS_HOURS_START) || 8;
const BUSINESS_HOURS_END = parseInt(process.env.BUSINESS_HOURS_END) || 18;

// Validate API keys
if (!OPENPHONE_API_KEY) {
  console.error('OpenPhone API key is not set!');
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.error('Anthropic API key is not set!');
  process.exit(1);
}

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// Rate limiting storage (in production, use Redis or database)
const responseTracker = new Map();

// ============================================
// SYSTEM PROMPT FOR CLAUDE
// ============================================

const SYSTEM_PROMPT = buildSystemPrompt();

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format phone number
function formatPhoneNumber(phone) {
  const phoneNumber = phone.replace(/\D/g, '');
  if (phoneNumber.length === 10) {
    return `+1${phoneNumber}`;
  } else if (phoneNumber.length > 10) {
    return `+${phoneNumber}`;
  }
  return null;
}

// Check if within business hours
function isBusinessHours() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  // Sunday = 0, Saturday = 6
  if (day === 0) return false;
  
  return hour >= BUSINESS_HOURS_START && hour < BUSINESS_HOURS_END;
}

// Check rate limit
function checkRateLimit(phoneNumber) {
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  
  if (!responseTracker.has(phoneNumber)) {
    responseTracker.set(phoneNumber, []);
  }
  
  const timestamps = responseTracker.get(phoneNumber);
  const recentResponses = timestamps.filter(t => t > hourAgo);
  
  responseTracker.set(phoneNumber, recentResponses);
  
  return recentResponses.length < MAX_RESPONSES_PER_HOUR;
}

function recordResponse(phoneNumber) {
  const timestamps = responseTracker.get(phoneNumber) || [];
  timestamps.push(Date.now());
  responseTracker.set(phoneNumber, timestamps);
}

// Send SMS via OpenPhone
async function sendSMS(toNumber, message, fromNumber = TEST_PHONE) {
  try {
    const response = await axios({
      method: 'post',
      url: `${OPENPHONE_API}/messages`,
      headers: {
        'Authorization': OPENPHONE_API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        content: message,
        from: fromNumber,
        to: [toNumber],
        userId: OPENPHONE_USER_ID
        // Don't auto-mark as done - let team review AI conversations
      }
    });

    if (response.status === 202) {
      console.log(`✅ SMS sent successfully to ${toNumber}`);
      return { success: true };
    }
    return { success: false, error: 'Unexpected status code' };
  } catch (error) {
    console.error('❌ SMS sending failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Simple conversation memory (in-memory storage)
// TODO: Replace with database for persistence across server restarts
const conversationMemory = new Map();
const conversationQuotes = new Map(); // Track quotes per conversation

function storeMessage(conversationId, message) {
  if (!conversationMemory.has(conversationId)) {
    conversationMemory.set(conversationId, []);
  }
  const messages = conversationMemory.get(conversationId);
  messages.push({
    direction: message.direction,
    body: message.body || message.content,
    timestamp: message.createdAt || new Date().toISOString()
  });
  
  // Keep last 20 messages only
  if (messages.length > 20) {
    messages.shift();
  }
}

function getStoredMessages(conversationId) {
  return conversationMemory.get(conversationId) || [];
}

// Get conversation history from OpenPhone (with fallback to memory)
async function getConversationHistory(conversationId) {
  // First try our local memory
  const storedMessages = getStoredMessages(conversationId);
  
  // If memory is empty or has very few messages, try to backfill from OpenPhone
  if (storedMessages.length < 3) {
    try {
      console.log(`🔍 Backfilling conversation history from OpenPhone...`);
      const response = await axios({
        method: 'get',
        url: `${OPENPHONE_API}/conversations/${conversationId}/messages`,
        headers: {
          'Authorization': OPENPHONE_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.data) {
        const apiMessages = response.data.data
          .map(msg => ({
            direction: msg.direction,
            body: msg.body || msg.content,
            timestamp: msg.createdAt
          }))
          .reverse(); // Oldest first
        
        // Store these messages in memory for future use
        if (apiMessages.length > 0) {
          conversationMemory.set(conversationId, apiMessages);
          console.log(`📋 Backfilled ${apiMessages.length} messages from OpenPhone`);
          return apiMessages;
        }
      }
      
    } catch (error) {
      console.log(`⚠️ OpenPhone API backfill failed (${error.response?.status}), using memory: ${storedMessages.length} messages`);
    }
  }
  
  console.log(`📋 Using stored conversation history: ${storedMessages.length} messages`);
  return storedMessages;
}

// Build conversation context for Claude
function buildConversationContext(messages) {
  if (!messages || messages.length === 0) return '';
  
  const context = messages.map(msg => {
    const role = msg.direction === 'incoming' ? 'Customer' : 'You (Sarah)';
    const content = msg.body || msg.content || '';
    return `${role}: ${content}`;
  }).join('\n');
  
  return context;
}

// Check if quote/link was already sent in conversation
function wasQuoteSent(messages) {
  if (!messages || messages.length === 0) return false;
  
  const ourMessages = messages.filter(m => m.direction === 'outgoing');
  
  for (const msg of ourMessages) {
    const content = (msg.body || msg.content || '').toLowerCase();
    // Check if message contains pricing ($XXX) or booking link
    if (content.includes('mesamaids.com') || content.match(/\$\d+/)) {
      return true;
    }
  }
  
  return false;
}

// Decision logic: Should we auto-respond?
async function shouldAutoRespond(message, conversationHistory) {
  const messageContent = (message.body || message.content || '').toLowerCase();
  
  // Keywords that should flag for human
  const escalationKeywords = [
    'complaint', 'complain', 'terrible', 'awful', 'horrible', 'worst',
    'sue', 'lawsuit', 'lawyer', 'attorney',
    'refund', 'money back', 'charge',
    'cancel my booking', 'reschedule my booking',
    'angry', 'upset', 'disappointed', 'unsatisfied',
    'damaged', 'broke', 'broken', 'stole', 'stolen', 'missing'
  ];
  
  // Check for escalation keywords
  for (const keyword of escalationKeywords) {
    if (messageContent.includes(keyword)) {
      console.log(`Escalation keyword detected: "${keyword}"`);
      return { shouldRespond: false, reason: `Contains escalation keyword: ${keyword}` };
    }
  }
  
  // Check if too many messages in this conversation
  const incomingCount = conversationHistory.filter(m => m.direction === 'incoming').length;
  if (incomingCount > 15) {
    console.log('Too many messages in conversation');
    return { shouldRespond: false, reason: 'Too many messages (>15)' };
  }
  
  // Check rate limit
  if (!checkRateLimit(message.from)) {
    console.log('Rate limit exceeded');
    return { shouldRespond: false, reason: 'Rate limit exceeded' };
  }
  
  // Business hours check disabled for 24/7 customer service
  // if (!isBusinessHours() && process.env.NODE_ENV === 'production') {
  //   console.log('🚨 Outside business hours');
  //   return { shouldRespond: false, reason: 'Outside business hours' };
  // }
  
  // All checks passed
  return { shouldRespond: true, reason: 'All checks passed' };
}

// Generate AI response using Claude
async function generateAIResponse(message, conversationHistory, customerContext = null) {
  try {
    const messageContent = message.body || message.content;
    
    // Parse property details from current message and history
    const propertyDetails = parsePropertyDetails(messageContent, conversationHistory);
    
    // If we have HubSpot context and no property details from conversation, use HubSpot
    if (customerContext && customerContext.hasRecentQuote && !propertyDetails.bedrooms) {
      const quote = customerContext.recentQuote;
      propertyDetails.bedrooms = quote.bedrooms;
      propertyDetails.bathrooms = quote.bathrooms;
      propertyDetails.serviceType = quote.serviceType;
      console.log('Using property details from HubSpot context:', propertyDetails);
    }
    
    // Build context from conversation history
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = buildConversationContext(conversationHistory);
    }
    
    // Add customer context if available
    if (customerContext) {
      const contextInfo = formatContextForPrompt(customerContext);
      conversationContext = `Customer Context: ${contextInfo}\n\n${conversationContext}`;
    }
    
    // Check if quote/link was already sent
    const quoteSent = wasQuoteSent(conversationHistory);
    
    console.log('Context extraction:', {
      bedrooms: propertyDetails.bedrooms,
      bathrooms: propertyDetails.bathrooms,
      serviceType: propertyDetails.serviceType,
      quoteSent,
      historyLength: conversationHistory.length,
      hasHubSpotContext: !!customerContext
    });
    
    // Build enhanced prompt with extracted context
    let promptContext = '';
    
    if (conversationContext && conversationHistory.length > 0) {
      promptContext = `PREVIOUS MESSAGES IN THIS CONVERSATION:
${conversationContext}

IMPORTANT CONTEXT YOU MUST REMEMBER:
The customer asked about a ${propertyDetails.bedrooms} bedroom, ${propertyDetails.bathrooms} bathroom ${propertyDetails.serviceType}.
${quoteSent ? 'You already gave them a price and booking link.' : 'This is their first pricing question.'}

THEIR NEW QUESTION:
${messageContent}

RULES:
1. They're asking about the SAME property (${propertyDetails.bedrooms}bd/${propertyDetails.bathrooms}ba) unless they specify different
2. ${quoteSent ? 'DON\'T send the booking link again - you already sent it' : 'Include the booking link'}
3. Calculate the price based on what they originally asked about
4. Keep it short and friendly

Answer their question:`;
    } else {
      promptContext = `Customer: ${messageContent}

Answer helpfully. If giving a price, include the booking link.`;
    }
    
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      temperature: 0.5,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: promptContext
        }
      ]
    });
    
    let aiMessage = response.content[0].text;
    
    // Add line breaks between sentences if not present
    // Replace ". " with ".\n\n" to add breathing room
    if (!aiMessage.includes('\n')) {
      aiMessage = aiMessage
        .replace(/\. ([A-Z])/g, '.\n\n$1')  // Add breaks between sentences
        .replace(/! ([A-Z])/g, '!\n\n$1')   // After exclamations
        .replace(/\? ([A-Z])/g, '?\n\n$1'); // After questions
    }
    
    // Log confidence (based on response structure)
    console.log(`AI Response generated (${response.usage.input_tokens} input tokens, ${response.usage.output_tokens} output tokens)`);
    
    return {
      success: true,
      message: aiMessage,
      usage: response.usage
    };
    
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Validate AI response (sanity checks)
function validateAIResponse(response) {
  // Too short
  if (response.length < 10) {
    return { valid: false, reason: 'Response too short' };
  }
  
  // Too long (SMS limit is 1600 chars but we should keep shorter)
  if (response.length > 800) {
    return { valid: false, reason: 'Response too long for SMS' };
  }
  
  // Contains placeholder text
  const placeholders = ['[INSERT', '[FILL IN', 'XXX', 'TODO', 'PLACEHOLDER'];
  for (const placeholder of placeholders) {
    if (response.includes(placeholder)) {
      return { valid: false, reason: 'Contains placeholder text' };
    }
  }
  
  return { valid: true };
}

// ============================================
// MAIN WEBHOOK HANDLER - INCOMING MESSAGES
// ============================================

app.post('/webhook/incoming-message', async (req, res) => {
  try {
    console.log('\n=== Incoming Message Webhook ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { object, type, data } = req.body;
    
    // OpenPhone v3 API sends events with nested structure
    // Handle both old and new formats
    let messageData;
    
    if (object === 'event' && type === 'message.received' && data?.object) {
      // OpenPhone v3 API format
      messageData = data.object;
    } else if (object === 'message' && data) {
      // Legacy format
      messageData = data;
    } else {
      console.log('Not a message event');
      return res.sendStatus(200);
    }
    
    // Only process incoming messages (not our outgoing ones)
    if (messageData.direction !== 'incoming') {
      console.log('Skipping outgoing message');
      return res.sendStatus(200);
    }
    
    const customerPhone = messageData.from;
    const messageContent = messageData.body || messageData.content;
    const conversationId = messageData.conversationId;
    const toPhone = messageData.to;
    
    console.log(`From: ${customerPhone}`);
    console.log(`To: ${toPhone}`);
    console.log(`Message: ${messageContent}`);
    console.log(`Conversation ID: ${conversationId}`);
    
    // CRITICAL: Only respond to Mesa Maids phone number
    if (toPhone !== MESA_PHONE_NUMBER) {
      console.log(`Ignoring message - not for Mesa (${toPhone} !== ${MESA_PHONE_NUMBER})`);
      return res.sendStatus(200);
    }
    
    console.log('✅ Message is for Mesa Maids - processing');
    
    // Store this incoming message in memory (for context)
    storeMessage(conversationId, {
      direction: 'incoming',
      body: messageContent,
      createdAt: messageData.createdAt
    });
    
    // Check if customer is in booking flow
    if (isInBookingFlow(conversationId)) {
      console.log('📝 Customer in booking flow, handling step...');
      const flowResponse = await handleBookingFlowStep(messageData, conversationId);
      
      if (flowResponse) {
        await sendSMS(customerPhone, flowResponse, messageData.to);
        storeMessage(conversationId, {
          direction: 'outgoing',
          body: flowResponse,
          createdAt: new Date().toISOString()
        });
        console.log('✅ Booking flow step handled');
        return res.sendStatus(200);
      }
    }
    
    // Check for customer's choice after quote
    const messageLower = messageContent.toLowerCase();
    if (messageLower.includes('link') || messageLower.includes('send me')) {
      // Customer wants link - get the most recent quote
      const quotes = await getQuotesForConversation(conversationId);
      if (quotes.length > 0) {
        const latest = quotes[0];
        await sendSMS(customerPhone, `Here's your link with ${latest.bedrooms}bd/${latest.bathrooms}ba ${latest.serviceType} saved:

${latest.bookingUrl}`, messageData.to);
        return res.sendStatus(200);
      }
    } else if (messageLower.includes('book it') || messageLower.includes('book for me')) {
      // Customer wants direct booking
      const quotes = await getQuotesForConversation(conversationId);
      if (quotes.length > 0) {
        const latest = quotes[0];
        startBookingFlow(conversationId, {
          bedrooms: latest.bedrooms,
          bathrooms: latest.bathrooms,
          serviceType: latest.serviceType,
          addons: latest.addons,
          totalPrice: latest.totalPrice
        });
        
        await sendSMS(customerPhone, "Sure! What's your home address?", messageData.to);
        return res.sendStatus(200);
      }
    }
    
    // Check if auto-response is enabled
    if (!ENABLE_AUTO_RESPONSE) {
      console.log('⚠️  Auto-response disabled, skipping');
      return res.sendStatus(200);
    }
    
    // Get conversation history
    console.log('Fetching conversation history...');
    const conversationHistory = await getConversationHistory(conversationId);
    console.log(`Found ${conversationHistory.length} previous messages`);

    // Look up customer context in HubSpot
    console.log('Looking up customer context in HubSpot...');
    const customerContext = await getCustomerContext(customerPhone);
    const contextInfo = formatContextForPrompt(customerContext);
    
    if (conversationHistory.length > 0) {
      console.log('📝 Recent messages:', conversationHistory.slice(-3).map(m => ({
        direction: m.direction,
        content: (m.body || m.content || '').substring(0, 50)
      })));
    }
    
    // Decide if we should auto-respond
    const decision = await shouldAutoRespond(messageData, conversationHistory);
    console.log(`🤔 Decision: ${decision.shouldRespond ? '✅ Auto-respond' : '❌ Flag for human'}`);
    console.log(`📝 Reason: ${decision.reason}`);
    
    if (!decision.shouldRespond) {
      // Flag for human - don't mark as done, leave in inbox
      console.log('👤 Leaving in inbox for human response');
      return res.sendStatus(200);
    }
    
    // Parse property details first (needed for quote creation)
    const propertyDetails = parsePropertyDetails(messageContent, conversationHistory);
    
    // Check if quote/link was already sent
    const quoteSent = wasQuoteSent(conversationHistory);
    
    // Generate AI response with customer context
    console.log('Generating AI response...');
    const aiResponse = await generateAIResponse(messageData, conversationHistory, customerContext);
    
    if (!aiResponse.success) {
      console.log('❌ AI generation failed, flagging for human');
      return res.sendStatus(200);
    }
    
    console.log(`💭 AI Response: ${aiResponse.message}`);
    
    // Validate response
    const validation = validateAIResponse(aiResponse.message);
    if (!validation.valid) {
      console.log(`❌ Response validation failed: ${validation.reason}`);
      console.log('👤 Flagging for human review');
      return res.sendStatus(200);
    }
    
    // Check if this is a pricing response and create quote
    let finalMessage = aiResponse.message;
    
    if (responseContainsPricing(aiResponse.message) && !quoteSent) {
      // This is the first price quote - create it in the system
      const price = extractPriceFromResponse(aiResponse.message);
      
      if (price && propertyDetails.bedrooms && propertyDetails.bathrooms) {
        console.log('💰 Creating quote in Mesa system...');
        
        const quoteResult = await createQuoteInSystem({
          phoneNumber: customerPhone,
          bedrooms: propertyDetails.bedrooms,
          bathrooms: propertyDetails.bathrooms,
          serviceType: propertyDetails.serviceType,
          addons: propertyDetails.addons,
          totalPrice: price,
          conversationId: conversationId
        });
        
        if (quoteResult.success) {
          console.log('✅ Quote created:', quoteResult.quoteCode);
          
          // Store quote for this conversation
          if (!conversationQuotes.has(conversationId)) {
            conversationQuotes.set(conversationId, []);
          }
          conversationQuotes.get(conversationId).unshift({
            ...quoteResult,
            bedrooms: propertyDetails.bedrooms,
            bathrooms: propertyDetails.bathrooms,
            serviceType: propertyDetails.serviceType,
            addons: propertyDetails.addons,
            totalPrice: price
          });
          
          // Add option for customer to choose
          finalMessage = `${aiResponse.message}

Want a booking link with this saved, or want me to book it for you now?`;
        }
      }
    }
    
    // Helper function to get quotes for conversation
    async function getQuotesForConversation(convId) {
      return conversationQuotes.get(convId) || [];
    }
    
    // Send response
    console.log('📤 Sending AI response...');
    const sendResult = await sendSMS(customerPhone, finalMessage, messageData.to);
    
    if (sendResult.success) {
      recordResponse(customerPhone);
      
      // Store our response in memory
      storeMessage(conversationId, {
        direction: 'outgoing',
        body: finalMessage,
        createdAt: new Date().toISOString()
      });
      
      console.log('✅ AI response sent successfully!');
    } else {
      console.log('❌ Failed to send AI response');
    }
    
    console.log('=== End Incoming Message Handler ===\n');
    res.sendStatus(200);
    
  } catch (error) {
    console.error('❌ Error in incoming message handler:', error);
    res.sendStatus(500);
  }
});

// ============================================
// HEALTH CHECK & TEST ENDPOINTS
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'brooklyn-bot-ai',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check conversation memory
app.get('/debug/conversation/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const storedMessages = getStoredMessages(id);
    const apiHistory = await getConversationHistory(id);
    
    res.json({
      conversationId: id,
      storedMessages: storedMessages,
      apiHistory: apiHistory,
      memorySize: conversationMemory.size,
      allConversations: Array.from(conversationMemory.keys())
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/test', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Brooklyn Bot AI Server',
    config: {
      hasOpenPhoneKey: !!OPENPHONE_API_KEY,
      hasAnthropicKey: !!ANTHROPIC_API_KEY,
      autoResponseEnabled: ENABLE_AUTO_RESPONSE,
      businessName: BUSINESS_NAME,
      testPhone: TEST_PHONE || 'Not set'
    }
  });
});

// Test Claude connection
app.get('/test-claude', async (req, res) => {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from Claude!"'
        }
      ]
    });
    
    res.json({
      success: true,
      message: response.content[0].text,
      usage: response.usage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test AI response without sending (for testing prompts)
app.post('/test-ai-response', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const mockMessage = {
      content: message,
      from: '+11234567890'
    };
    
    const decision = await shouldAutoRespond(mockMessage, conversationHistory);
    const aiResponse = await generateAIResponse(mockMessage, conversationHistory);
    const validation = validateAIResponse(aiResponse.message);
    
    res.json({
      decision,
      aiResponse,
      validation,
      wouldSend: decision.shouldRespond && aiResponse.success && validation.valid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log('\n🤖 ========================================');
  console.log(`   Brooklyn Bot AI Server`);
  console.log('========================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🏢 Business: ${BUSINESS_NAME}`);
  console.log(`🤖 Agent: ${AGENT_NAME}`);
  console.log(`📞 Test Phone: ${TEST_PHONE || 'Not configured'}`);
  console.log(`🔄 Auto-response: ${ENABLE_AUTO_RESPONSE ? 'ENABLED' : 'DISABLED'}`);
  console.log(`⏰ Business hours: ${BUSINESS_HOURS_START}:00 - ${BUSINESS_HOURS_END}:00`);
  console.log(`🚦 Rate limit: ${MAX_RESPONSES_PER_HOUR} per hour`);
  console.log('========================================\n');
  console.log('✅ Ready to receive webhooks!');
  console.log('');
});

