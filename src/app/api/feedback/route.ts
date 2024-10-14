import { MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server'

const client = new MongoClient(process.env.MONGODB_URI,
  { useNewUrlParser: true, useUnifiedTopology: true })

export async function POST(req: NextRequest) {
  const { rating } = await req.json()
  if (rating !== "1" && rating !== "-1") {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }
  try {
    await client.connect();
    const database = client.db('tychomapsmongodb');
    const collection = database.collection('searches');
    // Find the most recent search for this user's IP
    const ip = req.headers.get('x-forwarded-for');
    const mostRecentSearch = await collection.findOne(
      { ip: ip },
      { sort: { timestamp: -1 } }
    );
    if (mostRecentSearch) {
      await collection.updateOne(
        { _id: mostRecentSearch._id },
        { $set: { userRating: parseInt(rating) } }
      );
      return NextResponse.json({ message: "Feedback recorded successfully" }, { status: 200 });
    } else {
      return NextResponse.json({ error: "No recent search found" }, { status: 404 });
    }
  } catch (error) {
    console.error('Error recording feedback:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await client.close();
  }
}