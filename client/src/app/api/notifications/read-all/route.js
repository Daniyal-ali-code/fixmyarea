import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { markAllRead } from '@/lib/notifications.service';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const count = await markAllRead(user.id);
    return NextResponse.json({ marked: count });
  } catch (err) {
    console.error('markAllRead error:', err);
    return NextResponse.json({ error: 'Failed to mark all read' }, { status: 500 });
  }
}
