import { NextRequest, NextResponse } from 'next/server';
import { OpenAIStream, StreamingTextResponse, Message as VercelAIMessage } from 'ai';
import OpenAI from 'openai';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { POINTS_FOR_CHAT_MESSAGE } from '@/lib/constants';

if (!process.env.OPENAI_API_KEY) {
  console.error("FATAL ERROR: Missing environment variable OPENAI_API_KEY for ingestion.");
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LLM_MODEL = 'gpt-4o-mini';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

export const runtime = 'edge';

async function getEmbedding(text: string): Promise<number[]> {
  try {
    if (!text.trim()) {
        console.warn("getEmbedding called with empty or whitespace-only text.");
        return [];
    }
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error getting embedding:", error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const body = await req.json();
    const messages: VercelAIMessage[] = body.messages || [];
    const knowledgeBaseScope: { topicId: string; subtopicId?: string } = body.knowledgeBaseScope;
    const userId: string | undefined = body.userId;

    console.log('API received knowledgeBaseScope:', knowledgeBaseScope);

    if (!messages.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const currentMessage = messages[messages.length - 1];
    
    let contextText = '';
    if (knowledgeBaseScope?.topicId && currentMessage.role === 'user' && currentMessage.content && currentMessage.content.trim() !== '') {
        try {
            const queryEmbedding = await getEmbedding(currentMessage.content);
            console.log("Query Embedding for SQL Test (copy this array if needed):", JSON.stringify(queryEmbedding));

            if (queryEmbedding.length > 0) {
                const rpcParams = {
                  query_embedding: queryEmbedding,
                  match_topic_id: knowledgeBaseScope.topicId,
                  match_subtopic_id: knowledgeBaseScope.subtopicId || null,
                  match_threshold: 0.3, // Keep your test value (e.g., 0.3)
                  match_count: 1,       // Keep your test value (e.g., 1)
                };
                console.log("Calling match_knowledge_chunks with params:", JSON.stringify(rpcParams, null, 2));

                const { data: chunks, error: dbError } = await supabaseAdmin.rpc('match_knowledge_chunks', rpcParams);

                console.log("RPC response - dbError:", JSON.stringify(dbError, null, 2));
                console.log("RPC response - chunks:", JSON.stringify(chunks, null, 2));

                if (dbError) {
                    console.error('Supabase DB error fetching chunks:', dbError);
                } else if (chunks && chunks.length > 0) {
                    // --- THIS IS THE CORRECTED LINE ---
                    contextText = "Relevant information from the knowledge base:\n" +
                                chunks.map((chunk: { chunk_text: string; }) => `- ${chunk.chunk_text}`).join("\n\n");
                    // --- END CORRECTION ---
                    console.log(`Retrieved ${chunks.length} relevant chunks for topic: ${knowledgeBaseScope.topicId}`);
                } else {
                    console.log(`No specific knowledge base chunks found for query on topic: ${knowledgeBaseScope.topicId}. (Query: "${currentMessage.content}")`);
                }
            } else {
                console.log("Query embedding was empty, skipping RAG retrieval.");
            }
        } catch (e) {
            console.error("Error in RAG retrieval step:", e);
        }
    }

    console.log("---------------- CONTEXT TEXT BEING SENT TO LLM ----------------");
    console.log(contextText); 
    console.log("-----------------------------------------------------------------");

    const systemPrompt = `You are an AI assistant for a Workforce Development Hub${knowledgeBaseScope?.topicId ? `, specializing in "${knowledgeBaseScope.topicId}${knowledgeBaseScope.subtopicId ? ` / ${knowledgeBaseScope.subtopicId}` : ''}"` : ''}.
${contextText ? `${contextText}\n\nPlease use this information to answer the user's question. If the information isn't sufficient or the question is outside this scope, use your general knowledge but clearly state if you are doing so.` : "Answer the user's questions. If a specific topic is mentioned, focus on that. Be concise, helpful, and encouraging."}
Format responses clearly. Use markdown for lists, bolding, and italics where appropriate.`;

    const processedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10)
    ];

    console.log("---------------- FINAL PROCESSED MESSAGES SENT TO LLM ----------------");
    console.log(JSON.stringify(processedMessages, null, 2)); 
    console.log("-----------------------------------------------------------------------");

    const openaiResponse = await openai.chat.completions.create({
      model: LLM_MODEL,
      stream: true,
      messages: processedMessages as any,
      temperature: 0.7,
    });

    const stream = OpenAIStream(openaiResponse, {
      onCompletion: async (completion: string) => {
        console.log(`AI response completed. UserID: ${userId}, Completion length: ${completion.length}`);
        if (userId && POINTS_FOR_CHAT_MESSAGE > 0) {
          const { error: pointsError } = await supabaseAdmin
            .rpc('increment_user_points', { user_id_param: userId, points_to_add: POINTS_FOR_CHAT_MESSAGE });

          if (pointsError) {
            console.error('POST /api/chat - Points Update Error:', pointsError);
          } else {
            console.log(`Awarded ${POINTS_FOR_CHAT_MESSAGE} points to user ${userId} for chat interaction.`);
            const { error: logError } = await supabaseAdmin.from('point_logs').insert({
              user_id: userId,
              points_awarded: POINTS_FOR_CHAT_MESSAGE,
              reason_code: 'CHAT_INTERACTION',
              reason_message: `Engaged in AI chat ${knowledgeBaseScope?.topicId ? `on topic: ${knowledgeBaseScope.topicId}` : ''}`.trim(),
              related_entity_type: 'chat_message',
            });
            if (logError) {
              console.error('Error logging points for CHAT_INTERACTION:', logError);
            }
          }
        }
      },
    });

    return new StreamingTextResponse(stream);

  } catch (error: any) {
    console.error('[CHAT API ERROR]', error);
    let errorMessage = 'An internal error occurred.';
    if (error.message) errorMessage = error.message;
    if (error.name === 'SyntaxError') errorMessage = 'Invalid JSON in request body.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}