import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await query('SELECT id FROM reports WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await query('DELETE FROM reports WHERE id = $1', [id]);

    return NextResponse.json({ deleted: true, id: Number(id) });
  } catch (err) {
    console.error('admin.deleteReport error:', err);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
