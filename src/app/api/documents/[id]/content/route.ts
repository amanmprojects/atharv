import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/gcp';
import { hashContent } from '@/lib/utils';

const BUCKET_NAME = 'common-project-by-aman-documents';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storage = getStorage();
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`documents/${id}/content.json`);

    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ content: null }, { status: 200 });
    }

    const [content] = await file.download();
    const jsonContent = JSON.parse(content.toString());

    return NextResponse.json({ content: jsonContent }, { status: 200 });
  } catch (error) {
    console.error('Error fetching document content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document content' },
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
    const { content, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storage = getStorage();
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`documents/${id}/content.json`);

    const contentString = JSON.stringify(content);
    await file.save(contentString, {
      contentType: 'application/json',
      metadata: {
        documentId: id,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      },
    });

    const contentHash = await hashContent(contentString);

    return NextResponse.json({ 
      success: true,
      contentHash,
    }, { status: 200 });
  } catch (error) {
    console.error('Error saving document content:', error);
    return NextResponse.json(
      { error: 'Failed to save document content' },
      { status: 500 }
    );
  }
}
