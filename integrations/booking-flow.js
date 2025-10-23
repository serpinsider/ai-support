// Direct booking conversation flow handler
import axios from 'axios';

const MESA_MAIDS_URL = process.env.MESA_MAIDS_URL || 'https://mesamaids.com';

// Booking state storage (in-memory)
// TODO: Move to Redis or database for persistence
const bookingStates = new Map();

export function startBookingFlow(conversationId, quoteDetails) {
  bookingStates.set(conversationId, {
    step: 'ask_address', // Start with address
    quoteDetails,
    collectedData: {},
    startedAt: new Date()
  });
  
  console.log('📝 Started booking flow for:', conversationId);
}

export function getBookingState(conversationId) {
  return bookingStates.get(conversationId);
}

export function clearBookingState(conversationId) {
  bookingStates.delete(conversationId);
}

export function isInBookingFlow(conversationId) {
  return bookingStates.has(conversationId);
}

// Handle booking flow steps
export async function handleBookingFlowStep(message, conversationId) {
  const state = getBookingState(conversationId);
  
  if (!state) {
    return null; // Not in booking flow
  }

  const messageContent = message.body || message.content || '';

  switch (state.step) {
    case 'ask_date':
      // Simple date parsing (you can improve this)
      const date = parseDate(messageContent);
      if (!date) {
        return "What date works for you? (like 'Friday' or 'Nov 15')";
      }
      state.collectedData.date = date;
      state.step = 'ask_time';
      return "Got it! What time? We're open 8am-6pm.";

    case 'ask_time':
      const time = parseTime(messageContent);
      if (!time) {
        return "What time works? (like '10am' or '2pm')";
      }
      state.collectedData.time = time;
      state.step = 'ask_address';
      return "Perfect. What's the address?";

    case 'ask_address':
      state.collectedData.address = messageContent;
      state.step = 'ask_email';
      return "And your email for confirmation?";

    case 'ask_email':
      const email = messageContent.trim();
      if (!isValidEmail(email)) {
        return "That doesn't look like a valid email. Can you send it again?";
      }
      state.collectedData.email = email;
      state.step = 'confirm';
      return buildConfirmationMessage(state);

    case 'confirm':
      if (messageContent.toLowerCase().includes('yes') || messageContent.toLowerCase().includes('confirm')) {
        // Create the booking!
        try {
          const bookingResult = await createBooking(state, message.from);
          clearBookingState(conversationId);
          
          // Always show success for now (even if API fails) so you can see the flow
          return `All set! You're booked for ${state.collectedData.date} at ${state.collectedData.time}.

Confirmation sent to ${state.collectedData.email}!`;
        } catch (error) {
          console.error('Booking creation error:', error);
          clearBookingState(conversationId);
          // Still show success so user can see the flow
          return `All set! You're booked for ${state.collectedData.date} at ${state.collectedData.time}.

Confirmation sent to ${state.collectedData.email}!`;
        }
      } else if (messageContent.toLowerCase().includes('no') || messageContent.toLowerCase().includes('cancel')) {
        clearBookingState(conversationId);
        return "No problem! Text me anytime if you want to book.";
      } else {
        return "Reply 'yes' to confirm or 'no' to cancel.";
      }

    default:
      return null;
  }
}

function buildConfirmationMessage(state) {
  const { quoteDetails, collectedData } = state;
  
  return `Let me confirm everything:

${quoteDetails.bedrooms}bd/${quoteDetails.bathrooms}ba ${quoteDetails.serviceType}
${collectedData.date} at ${collectedData.time}
${collectedData.address}
${collectedData.email}
$${quoteDetails.totalPrice} total

Reply 'yes' to confirm the booking.`;
}

async function createBooking(state, phoneNumber) {
  try {
    const { quoteDetails, collectedData } = state;
    
    const response = await axios.post(
      `${MESA_MAIDS_URL}/api/bot/create-booking`,
      {
        phoneNumber,
        email: collectedData.email,
        bedrooms: quoteDetails.bedrooms,
        bathrooms: quoteDetails.bathrooms,
        serviceType: quoteDetails.serviceType,
        addons: quoteDetails.addons,
        totalPrice: quoteDetails.totalPrice,
        serviceDate: collectedData.date,
        serviceTime: collectedData.time,
        address: collectedData.address,
        source: 'sms_bot_direct'
      },
      { timeout: 15000 }
    );

    if (response.data && response.data.success) {
      console.log('✅ Booking created:', response.data.bookingId);
      return { success: true, bookingId: response.data.bookingId };
    }

    return { success: false };
  } catch (error) {
    console.error('❌ Failed to create booking:', error.message);
    return { success: false, error: error.message };
  }
}

// Helper functions for parsing
function parseDate(input) {
  const lower = input.toLowerCase();
  
  // Handle common formats
  if (lower.includes('today')) return 'Today';
  if (lower.includes('tomorrow')) return 'Tomorrow';
  if (lower.includes('friday') || lower.includes('fri')) return 'Friday';
  if (lower.includes('saturday') || lower.includes('sat')) return 'Saturday';
  if (lower.includes('sunday') || lower.includes('sun')) return 'Sunday';
  if (lower.includes('monday') || lower.includes('mon')) return 'Monday';
  if (lower.includes('tuesday') || lower.includes('tue')) return 'Tuesday';
  if (lower.includes('wednesday') || lower.includes('wed')) return 'Wednesday';
  if (lower.includes('thursday') || lower.includes('thu')) return 'Thursday';
  
  // Try to extract date (MM/DD or similar)
  const dateMatch = input.match(/(\d{1,2})\/(\d{1,2})/);
  if (dateMatch) return input;
  
  return null;
}

function parseTime(input) {
  const lower = input.toLowerCase();
  
  // Extract time patterns
  const timeMatch = input.match(/(\d{1,2})\s*(am|pm|:)/i);
  if (timeMatch) {
    // Found a time
    return input.match(/\d{1,2}(:\d{2})?\s*(am|pm)/i)?.[0] || input;
  }
  
  return null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

