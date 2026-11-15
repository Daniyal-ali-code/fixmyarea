import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await query(
      'SELECT id, name FROM categories ORDER BY id'
    );
    return NextResponse.json({ categories: rows });
  } catch (err) {
    console.error('listCategories error:', err);
    return NextResponse.json({ error: 'Failed to list categories' }, { status: 500 });
  }
}
