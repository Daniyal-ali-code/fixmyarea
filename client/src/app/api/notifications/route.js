import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getNotifications } from '@/lib/notifications.service';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || 30;
    const data = await getNotifications(user.id, { limit });
    return NextResponse.json(data);
  } catch (err) {
    console.error('getNotifications error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
