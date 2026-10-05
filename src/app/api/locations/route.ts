import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Location from '@/models/Location';
import { ALL_INITIAL_LOCATIONS } from '@/lib/destinations-data';
import { ILocation } from '@/types/location';

export const dynamic = 'force-dynamic';

// Initialize with multi-destination library
let inMemoryLocations: ILocation[] = [...ALL_INITIAL_LOCATIONS];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const country = searchParams.get('country');

    const db = await connectToDatabase();

    if (db) {
      // Build MongoDB query
      const query: Record<string, any> = {};

      if (category && category !== 'all') {
        query.category = category;
      }

      if (city && city !== 'all') {
        query.city = { $regex: city, $options: 'i' };
      }

      if (country && country !== 'all') {
        query.country = { $regex: country, $options: 'i' };
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { region: { $regex: search, $options: 'i' } },
          { country: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ];
      }

      let locations = await Location.find(query).sort({ createdAt: -1 }).lean();

      // If database is empty, seed initial dataset
      if (locations.length === 0 && !category && !search && !city && !country) {
        console.log('🌱 Populating MongoDB Atlas with initial destination locations...');
        const cleanSeeds = ALL_INITIAL_LOCATIONS.map(({ id, _id, ...rest }) => rest);
        await Location.insertMany(cleanSeeds);
        locations = await Location.find({}).sort({ createdAt: -1 }).lean();
      }

      return NextResponse.json({
        success: true,
        count: locations.length,
        data: locations,
        source: 'mongodb',
      });
    } else {
      // Fallback in-memory store
      let results = [...inMemoryLocations];

      if (category && category !== 'all') {
        results = results.filter((loc) => loc.category === category);
      }

      if (city && city !== 'all') {
        results = results.filter(
          (loc) => loc.city?.toLowerCase() === city.toLowerCase()
        );
      }

      if (search) {
        const queryLower = search.toLowerCase();
        results = results.filter(
          (loc) =>
            loc.name.toLowerCase().includes(queryLower) ||
            loc.description?.toLowerCase().includes(queryLower) ||
            loc.city?.toLowerCase().includes(queryLower) ||
            loc.tags?.some((t) => t.toLowerCase().includes(queryLower))
        );
      }

      return NextResponse.json({
        success: true,
        count: results.length,
        data: results,
        source: 'in-memory',
      });
    }
  } catch (error: any) {
    console.error('API Error in GET /api/locations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch locations',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await connectToDatabase();

    // Check if bulk array is provided
    if (Array.isArray(body)) {
      const itemsToInsert = body.map((item) => ({
        name: item.name?.trim(),
        category: item.category || 'sightseeing',
        lat: Number(item.lat),
        lng: Number(item.lng),
        description: item.description?.trim() || '',
        city: item.city?.trim() || 'Jaipur',
        region: item.region?.trim() || 'Rajasthan',
        imageUrl: item.imageUrl?.trim() || '',
        rating: item.rating ? Number(item.rating) : 4.8,
        estimatedDuration: item.estimatedDuration ? Number(item.estimatedDuration) : 60,
        estimatedCost: item.estimatedCost !== undefined ? Number(item.estimatedCost) : 0,
        tags: Array.isArray(item.tags) ? item.tags : [],
      }));

      if (db) {
        const inserted = await Location.insertMany(itemsToInsert);
        return NextResponse.json({
          success: true,
          count: inserted.length,
          data: inserted,
          message: `Successfully inserted ${inserted.length} custom locations.`,
        }, { status: 201 });
      } else {
        const mockInserted = itemsToInsert.map((item, idx) => ({
          ...item,
          _id: `custom-${Date.now()}-${idx}`,
          id: `custom-${Date.now()}-${idx}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        inMemoryLocations.unshift(...mockInserted);
        return NextResponse.json({
          success: true,
          count: mockInserted.length,
          data: mockInserted,
          message: `Successfully loaded ${mockInserted.length} custom locations in memory.`,
        }, { status: 201 });
      }
    }

    // Single item insertion
    const { name, category, lat, lng, description, city, region, imageUrl, estimatedDuration, estimatedCost, tags } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Location name is required.' },
        { status: 400 }
      );
    }

    if (!category || !['sightseeing', 'activity', 'experience'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Category must be one of: sightseeing, activity, experience.' },
        { status: 400 }
      );
    }

    if (lat === undefined || lat === null || isNaN(Number(lat)) || Number(lat) < -90 || Number(lat) > 90) {
      return NextResponse.json(
        { success: false, error: 'Valid latitude between -90 and 90 is required.' },
        { status: 400 }
      );
    }

    if (lng === undefined || lng === null || isNaN(Number(lng)) || Number(lng) < -180 || Number(lng) > 180) {
      return NextResponse.json(
        { success: false, error: 'Valid longitude between -180 and 180 is required.' },
        { status: 400 }
      );
    }

    const locationData = {
      name: name.trim(),
      category,
      lat: Number(lat),
      lng: Number(lng),
      description: description ? description.trim() : '',
      city: city ? city.trim() : 'Jaipur',
      region: region ? region.trim() : 'Rajasthan',
      country: body.country ? body.country.trim() : 'India',
      imageUrl: imageUrl ? imageUrl.trim() : '',
      rating: 4.8,
      estimatedDuration: estimatedDuration ? Number(estimatedDuration) : 60,
      estimatedCost: estimatedCost !== undefined ? Number(estimatedCost) : 0,
      tags: Array.isArray(tags) ? tags : [],
    };

    if (db) {
      const newLocation = await Location.create(locationData);
      return NextResponse.json(
        {
          success: true,
          data: newLocation,
          message: 'Location successfully created in MongoDB Atlas',
        },
        { status: 201 }
      );
    } else {
      const mockCreated: ILocation = {
        ...locationData,
        _id: `loc-${Date.now()}`,
        id: `loc-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryLocations.unshift(mockCreated);

      return NextResponse.json(
        {
          success: true,
          data: mockCreated,
          message: 'Location saved.',
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error('API Error in POST /api/locations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create location',
      },
      { status: 500 }
    );
  }
}

// DELETE all locations or clear database
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    if (db) {
      await Location.deleteMany({});
    }
    inMemoryLocations = [];
    return NextResponse.json({
      success: true,
      message: 'All locations cleared.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
