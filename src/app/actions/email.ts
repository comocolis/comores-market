
export async function sendNewMessageEmail(
  receiverId: string, 
  senderName: string, 
  messageContent: string,
  productId: string
) {
  console.warn('Email sending disabled in static export');
  return { success: false, error: 'Disabled' };
}

