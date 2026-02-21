import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/lib/gcp';
import { PermissionLevel, PERMISSIONS } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, inviterId, inviteeEmail, permissionLevel } = body;

    if (!inviterId || !documentId || !inviteeEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const firestore = getFirestore();
    
    const docRef = firestore.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = doc.data();
    const currentPermission = document?.permissions?.[inviterId] || 0;
    
    if (currentPermission < PERMISSIONS.EDITOR) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const invitationId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await firestore.collection('share_invitations').doc(invitationId).set({
      id: invitationId,
      documentId,
      inviterId,
      inviteeEmail,
      permissionLevel: permissionLevel || PERMISSIONS.VIEWER,
      status: 'pending',
      createdAt: new Date(),
      expiresAt,
    });

    return NextResponse.json({ 
      invitationId,
      message: 'Invitation sent successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error sharing document:', error);
    return NextResponse.json(
      { error: 'Failed to share document' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, userId, targetUserId, permissionLevel } = body;

    if (!userId || !documentId || !targetUserId || permissionLevel === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const firestore = getFirestore();
    const docRef = firestore.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = doc.data();
    const currentPermission = document?.permissions?.[userId] || 0;
    
    if (currentPermission < PERMISSIONS.OWNER) {
      return NextResponse.json(
        { error: 'Only owners can modify permissions' },
        { status: 403 }
      );
    }

    const newPermissions = {
      ...document?.permissions,
      [targetUserId]: permissionLevel,
    };

    if (permissionLevel === 0) {
      delete newPermissions[targetUserId];
    }

    await docRef.update({
      permissions: newPermissions,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}
