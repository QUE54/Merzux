import { NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET() {
  try {
    const topScores = await sql`
      SELECT 
        l.score, 
        l.kills, 
        l.time_survived, 
        l.build_summary, 
        p.codename,
        l.created_at
      FROM leaderboard l
      JOIN players p ON l.player_id = p.id
      ORDER BY l.score DESC
      LIMIT 100
    `;
    return NextResponse.json(topScores);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, score, kills, time_survived, build_summary, replay_data } = body;

    if (!id) return NextResponse.json({ error: 'Missing player ID' }, { status: 401 });

    // Validate player exists
    const player = await sql`SELECT id FROM players WHERE id = ${id} LIMIT 1`;
    if (player.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // In a real production scenario, we would run the replay_data through a server-side
    // physics simulation here to verify the score. For now, we store it for manual verification.

    await sql`
      INSERT INTO leaderboard (player_id, score, kills, time_survived, build_summary, replay_data)
      VALUES (${id}, ${score}, ${kills}, ${time_survived}, ${build_summary}, ${replay_data})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting score:', error);
    return NextResponse.json({ error: 'Failed to submit score' }, { status: 500 });
  }
}
