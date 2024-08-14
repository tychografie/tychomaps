import { clerkClient } from '@clerk/clerk-sdk-node';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 days from now

    const user = await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        premium: true,
        premiumStartDate: startDate.toISOString(),
        premiumEndDate: endDate.toISOString(),
      },
    });

    if (!user) {
      throw new Error('Failed to update user');
    }

    return res.status(200).json({ message: 'Premium status updated successfully' });
  } catch (error) {
    console.error('Error updating premium status:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}