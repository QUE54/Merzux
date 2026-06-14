import { NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { codename } = await request.json();

    if (!codename || codename.length < 3 || codename.length > 20) {
      return NextResponse.json({ error: 'Codename must be 3-20 characters' }, { status: 400 });
    }

    if (!/^[A-Za-z0-9_]+$/.test(codename)) {
      return NextResponse.json({ error: 'Invalid characters in codename' }, { status: 400 });
    }

    // Check if codename exists
    const existing = await sql`SELECT id FROM players WHERE codename = ${codename} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Codename already taken' }, { status: 409 });
    }

    // Generate secure ID (using UUID v4 as a base for cryptographic security)
    const id = (uuidv4() + uuidv4()).replace(/-/g, '').substring(0, 24).toUpperCase();

    await sql`INSERT INTO players (id, codename) VALUES (${id}, ${codename})`;

    return NextResponse.json({ id, codename });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json({ error: 'Failed to register codename' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const codename = searchParams.get('codename');

  if (!codename) return NextResponse.json({ available: false });

  const existing = await sql`SELECT id FROM players WHERE codename = ${codename} LIMIT 1`;
  return NextResponse.json({ available: existing.length === 0 });
}
