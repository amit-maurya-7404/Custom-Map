import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Itinerary from '@/models/Itinerary';

export const dynamic = 'force-dynamic';

let inMemoryItineraries: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = await connectToDatabase();

    if (id) {
      if (db) {
        let itin = null;
        try {
          itin = await Itinerary.findById(id).lean();
        } catch {
          itin = await Itinerary.findOne({ id }).lean();
        }
        if (itin) {
          return NextResponse.json({ success: true, data: itin });
        }
      }
      const mockFound = inMemoryItineraries.find((i) => i.id === id || i._id === id);
      if (mockFound) {
        return NextResponse.json({ success: true, data: mockFound });
      }
      return NextResponse.json({ success: false, error: 'Itinerary not found' }, { status: 404 });
    }

    if (db) {
      const itineraries = await Itinerary.find({}).sort({ updatedAt: -1 }).lean();
      return NextResponse.json({ success: true, data: itineraries });
    }
    return NextResponse.json({ success: true, data: inMemoryItineraries });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      title, 
      description, 
      destination, 
      days, 
      curatedBy, 
      approvalStatus, 
      reviewedBy, 
      reviewRemarks,
      reviewedAt
    } = body;

    const planData = {
      title: title || 'Custom Itinerary Plan',
      description: description || '',
      destination: destination || 'Rajasthan, India',
      days: days || [],
      curatedBy: curatedBy || 'Operations Executive',
      approvalStatus: approvalStatus || 'pending_approval',
      reviewedBy: reviewedBy || '',
      reviewRemarks: reviewRemarks || '',
      reviewedAt: reviewedAt || null,
    };

    const db = await connectToDatabase();
    if (db) {
      let saved;
      if (id && id.length === 24) {
        saved = await Itinerary.findByIdAndUpdate(id, planData, { new: true, upsert: true }).lean();
      } else {
        saved = await Itinerary.create(planData);
      }
      return NextResponse.json(
        { success: true, data: saved, message: 'Itinerary saved to database' },
        { status: 201 }
      );
    } else {
      const existingIdx = inMemoryItineraries.findIndex((i) => i.id === id || i._id === id);
      const generatedId = id || `itin-${Date.now()}`;
      const mockCreated = {
        ...planData,
        _id: generatedId,
        id: generatedId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        inMemoryItineraries[existingIdx] = mockCreated;
      } else {
        inMemoryItineraries.unshift(mockCreated);
      }

      return NextResponse.json(
        { success: true, data: mockCreated, message: 'Itinerary saved successfully' },
        { status: 201 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Senior Review Approval / Rejection Endpoint
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, approvalStatus, reviewedBy, reviewRemarks } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Itinerary ID is required' }, { status: 400 });
    }

    if (!['approved', 'rejected', 'pending_approval'].includes(approvalStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid approval status' }, { status: 400 });
    }

    const reviewUpdate = {
      approvalStatus,
      reviewedBy: reviewedBy || 'Senior Operations Head',
      reviewRemarks: reviewRemarks || '',
      reviewedAt: new Date(),
    };

    const db = await connectToDatabase();
    if (db) {
      let updated;
      try {
        updated = await Itinerary.findByIdAndUpdate(id, reviewUpdate, { new: true }).lean();
      } catch {
        updated = await Itinerary.findOneAndUpdate({ id }, reviewUpdate, { new: true }).lean();
      }
      if (updated) {
        return NextResponse.json({ success: true, data: updated, message: `Itinerary ${approvalStatus} successfully` });
      }
    }

    const mockIdx = inMemoryItineraries.findIndex((i) => i.id === id || i._id === id);
    if (mockIdx >= 0) {
      inMemoryItineraries[mockIdx] = {
        ...inMemoryItineraries[mockIdx],
        ...reviewUpdate,
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({
        success: true,
        data: inMemoryItineraries[mockIdx],
        message: `Itinerary ${approvalStatus} successfully`,
      });
    }

    return NextResponse.json({ success: false, error: 'Itinerary not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
