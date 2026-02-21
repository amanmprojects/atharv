import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, getStorage } from '@/lib/gcp';
import { Document, PERMISSIONS } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const firestore = getFirestore();
    
    const doc = await firestore.collection('documents').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = { id: doc.id, ...doc.data() } as Document;
    
    return NextResponse.json({ document }, { status: 200 });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, permissions, aiConsent, aiFeatures } = body;

    const firestore = getFirestore();
    const docRef = firestore.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (aiConsent !== undefined) updateData.aiConsent = aiConsent;
    if (aiFeatures !== undefined) updateData.aiFeatures = aiFeatures;

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return NextResponse.json(
      { document: { id: updatedDoc.id, ...updatedDoc.data() } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const firestore = getFirestore();
    const docRef = firestore.collection('documents').doc(id);
    
    await docRef.update({
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
