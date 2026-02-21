import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, getPubSub } from '@/lib/gcp';
import { AIFeature, AIRequest } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const AI_FEATURES: Record<AIFeature, { requiresConsent: boolean; costPerToken: number }> = {
  summarize: { requiresConsent: true, costPerToken: 0.0001 },
  translate: { requiresConsent: true, costPerToken: 0.0001 },
  'grammar-check': { requiresConsent: true, costPerToken: 0.00005 },
  'tone-adjustment': { requiresConsent: true, costPerToken: 0.0001 },
  expand: { requiresConsent: true, costPerToken: 0.0001 },
  shorten: { requiresConsent: true, costPerToken: 0.0001 },
  'generate-outline': { requiresConsent: true, costPerToken: 0.00015 },
  'help-me-write': { requiresConsent: true, costPerToken: 0.0002 },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ feature: string }> }
) {
  try {
    const { feature } = await params;
    const body = await request.json();
    const { userId, documentId, input, aiConsent } = body;

    if (!userId || !documentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const featureConfig = AI_FEATURES[feature as AIFeature];
    if (!featureConfig) {
      return NextResponse.json(
        { error: 'Invalid AI feature' },
        { status: 400 }
      );
    }

    if (featureConfig.requiresConsent && !aiConsent) {
      return NextResponse.json(
        { error: 'AI consent required for this feature' },
        { status: 403 }
      );
    }

    const firestore = getFirestore();
    
    const usageDoc = await firestore.collection('ai_usage').doc(userId).get();
    const currentUsage = usageDoc.exists ? usageDoc.data()?.tokensUsed || 0 : 0;
    const dailyLimit = 100000;

    if (currentUsage >= dailyLimit) {
      return NextResponse.json(
        { error: 'Daily AI usage limit exceeded' },
        { status: 429 }
      );
    }

    const requestId = uuidv4();
    const aiRequest: AIRequest = {
      id: requestId,
      userId,
      documentId,
      feature: feature as AIFeature,
      status: 'pending',
      input,
      createdAt: new Date(),
    };

    await firestore.collection('ai_requests').doc(requestId).set(aiRequest);

    const pubsub = getPubSub();
    const topic = pubsub.topic('ai-document-processing');
    
    await topic.publishMessage({
      json: {
        requestId,
        feature,
        userId,
        documentId,
        input,
      },
    });

    return NextResponse.json({ 
      requestId,
      status: 'processing',
      message: 'AI request queued for processing'
    }, { status: 202 });
  } catch (error) {
    console.error('Error processing AI request:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feature: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const firestore = getFirestore();
    const doc = await firestore.collection('ai_requests').doc(requestId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: doc.data() }, { status: 200 });
  } catch (error) {
    console.error('Error fetching AI request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI request' },
      { status: 500 }
    );
  }
}
