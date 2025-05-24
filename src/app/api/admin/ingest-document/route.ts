import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const KNOWLEDGE_BASE_BUCKET = 'knowledge-base-uploads'; // Ensure this is hyphenated

if (!process.env.OPENAI_API_KEY) {
  console.error("FATAL ERROR: Missing environment variable OPENAI_API_KEY.");
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

function chunkText(text: string, chunkSize: number = 800, chunkOverlap: number = 100): string[] {
  const chunks: string[] = [];
  if (!text || typeof text !== 'string') return chunks;
  let effectiveChunkSize = chunkSize - chunkOverlap;
  if (effectiveChunkSize <= 0) effectiveChunkSize = chunkSize;
  for (let i = 0; i < text.length; i += effectiveChunkSize) {
    chunks.push(text.substring(i, i + chunkSize).trim());
  }
  return chunks.filter(chunk => chunk.length > 10);
}

export async function POST(req: NextRequest) {
  const supabaseAuth = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ADMIN_USER_ID || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const topicId = formData.get('topicId') as string | null;
    const subtopicId = formData.get('subtopicId') as string | null;
    const sourceName = formData.get('sourceName') as string | null;

    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    if (!topicId) return NextResponse.json({ error: 'Topic ID is required.' }, { status: 400 });
    if (!sourceName) return NextResponse.json({ error: 'Source name is required.' }, { status: 400 });

    let storagePath = `pending_ingestion/${topicId}/`;
    if (subtopicId && subtopicId !== '') storagePath += `${subtopicId}/`;
    storagePath += file.name;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(KNOWLEDGE_BASE_BUCKET)
      .upload(storagePath, file, { upsert: true });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
    } else {
      console.log(`File ${file.name} uploaded to Supabase Storage at path: ${uploadData?.path}`);
    }

    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      console.log(`Processing .txt/.md file synchronously: ${file.name}`);
      const fileContent = await file.text();
      const textChunks = chunkText(fileContent);

      if (textChunks.length === 0) {
        return NextResponse.json({ error: 'No processable text chunks found in the file.' }, { status: 400 });
      }
      console.log(`Generated ${textChunks.length} chunks for document: ${sourceName}`);

      const chunksToInsert = [];
      let chunksProcessed = 0;
      for (const chunk of textChunks) {
        try {
          if (!process.env.OPENAI_API_KEY) {
             console.error("OpenAI API Key missing, cannot generate embeddings.");
             throw new Error("OpenAI API Key missing.");
          }
          const embeddingResponse = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: chunk,
            dimensions: EMBEDDING_DIMENSIONS,
          });
          const embedding = embeddingResponse.data[0].embedding;

          chunksToInsert.push({
            topic_id: topicId,
            subtopic_id: subtopicId || null,
            source_document_name: sourceName,
            chunk_text: chunk,
            embedding: JSON.stringify(embedding), // <<< CORRECTED HERE
          });
          chunksProcessed++;
        } catch (embeddingError: any) {
          console.error(`Failed to generate embedding for a chunk of ${sourceName}:`, embeddingError.message);
        }
        if (textChunks.length > 1 && chunksProcessed < textChunks.length) {
            await new Promise(resolve => setTimeout(resolve, 250));
        }
      }

      if (chunksToInsert.length === 0 && textChunks.length > 0) {
        return NextResponse.json({ error: 'No chunks could be embedded. Check OpenAI API key and connection.' }, { status: 500 });
      }
      if (chunksToInsert.length === 0 && textChunks.length === 0){
        return NextResponse.json({ error: 'No text chunks found to process.' }, { status: 400 });
      }

      const { error: insertError, count: insertedCount } = await supabaseAdmin
        .from('knowledge_base_chunks')
        .insert(chunksToInsert);

      if (insertError) {
        console.error('Error inserting chunks into Supabase:', insertError);
        return NextResponse.json({ error: 'Failed to store document chunks.', details: insertError.message }, { status: 500 });
      }

      const numAttemptedToStore = chunksToInsert.length;
      const numConfirmedByDbCount = insertedCount;
      let successMessage = `TEST MODE: Synchronously processed ${textChunks.length} text chunks from "${sourceName}". `;
      successMessage += `Attempted to embed and store ${numAttemptedToStore} chunks. `;
      if (numConfirmedByDbCount !== null) {
          successMessage += `${numConfirmedByDbCount} chunks confirmed stored by database count. `;
      } else {
          successMessage += `Database did not return an explicit count, but insert operation was attempted for ${numAttemptedToStore} chunks. `;
      }
      successMessage += "File also uploaded to storage.";

      return NextResponse.json({
          message: successMessage,
          fileName: file.name,
          chunksGenerated: textChunks.length,
          chunksAttemptedToEmbedAndStore: numAttemptedToStore,
          chunksConfirmedStoredByDbCount: numConfirmedByDbCount,
      }, { status: 201 });

    } else if (file.type === 'application/pdf') {
      return NextResponse.json({
        message: `PDF "${file.name}" uploaded successfully to storage and is awaiting asynchronous processing by an Edge Function (which needs to be implemented).`,
        storagePath: uploadData?.path,
      }, { status: 202 });
    } else {
      return NextResponse.json({ error: `Unsupported file type for synchronous processing: ${file.type}. Only .txt and .md are processed synchronously in this test mode.` }, { status: 415 });
    }

  } catch (error: any) {
    console.error('POST /api/admin/ingest-document - Generic Error:', error);
    let errorMessage = 'An unexpected error occurred during ingestion.';
    if (error.message) errorMessage = error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}