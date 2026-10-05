import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Location from '@/models/Location';
import { USER_JAIPUR_LOCATIONS } from '@/lib/jaipur-data';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        success: false,
        message: 'No MONGODB_URI configured. Sample locations are loaded in memory.',
      });
    }

    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset') === 'true';

    if (reset) {
      await Location.deleteMany({});
    }

    const cleanSeeds = USER_JAIPUR_LOCATIONS.map(({ id, _id, ...rest }) => rest);
    const inserted = await Location.insertMany(cleanSeeds);

    return NextResponse.json({
      success: true,
      count: inserted.length,
      message: `Successfully seeded ${inserted.length} Jaipur locations into MongoDB Atlas.`,
      data: inserted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Seed failed' },
      { status: 500 }
    );
  }
}
