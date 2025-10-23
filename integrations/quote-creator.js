// Integration with Mesa Maids to create quotes
import axios from 'axios';

const MESA_MAIDS_URL = process.env.MESA_MAIDS_URL || 'https://mesamaids.com';

export async function createQuoteInSystem(quoteData) {
  try {
    const response = await axios.post(
      `${MESA_MAIDS_URL}/api/bot/create-quote`,
      {
        phoneNumber: quoteData.phoneNumber,
        bedrooms: quoteData.bedrooms,
        bathrooms: quoteData.bathrooms,
        serviceType: quoteData.serviceType,
        addons: quoteData.addons || [],
        totalPrice: quoteData.totalPrice,
        conversationId: quoteData.conversationId,
        source: 'sms_bot'
      },
      {
        timeout: 10000
      }
    );

    if (response.data && response.data.success) {
      console.log('✅ Quote created in Mesa system:', response.data.quoteCode);
      return {
        success: true,
        quoteCode: response.data.quoteCode,
        quoteId: response.data.quoteId,
        bookingUrl: response.data.bookingUrl
      };
    }

    return { success: false, error: 'Invalid response from server' };
  } catch (error) {
    console.error('❌ Failed to create quote in Mesa system:', error.message);
    return { success: false, error: error.message };
  }
}

// Helper to extract numeric price from AI response
export function extractPriceFromResponse(response) {
  const match = response.match(/\$(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Check if response contains pricing
export function responseContainsPricing(response) {
  return /\$\d+/.test(response);
}

