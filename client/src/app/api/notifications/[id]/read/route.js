import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { parseIdParam } from '@/lib/http';
import { markRead } from '@/lib/notifications.service';

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const { id } = await params;
    const notificationId = parseIdParam(id);
    if (notificationId === null) {
      return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });
    }
    const ok = await markRead(notificationId, user.id);
    return NextResponse.json({ marked: ok });
  } catch (err) {
    console.error('markRead error:', err);
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
  }
}
