import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/lib/gcp';
import { Document, PERMISSIONS } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, ownerId } = body;

    if (!ownerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const docId = uuidv4();
    const now = new Date();
    
    const document: Document = {
      id: docId,
      title: title || 'Untitled Document',
      ownerId,
      permissions: { [ownerId]: PERMISSIONS.OWNER },
      contentHash: '',
      storagePath: `documents/${ownerId}/${docId}.json`,
      createdAt: now,
      updatedAt: now,
      version: 1,
      aiConsent: false,
      aiFeatures: [],
      isDeleted: false,
    };

    const firestore = getFirestore();
    await firestore.collection('documents').doc(docId).set({
      ...document,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const firestore = getFirestore();
    
    const snapshot = await firestore
      .collection('documents')
      .where(`permissions.${userId}`, '>=', PERMISSIONS.VIEWER)
      .get();

    let documents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (!includeDeleted) {
      documents = documents.filter((doc: Record<string, unknown>) => !doc.isDeleted);
    }

    return NextResponse.json({ documents }, { status: 200 });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
