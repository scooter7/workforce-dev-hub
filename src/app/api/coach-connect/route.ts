// src/app/api/coach-connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
// The admin client is not needed for this operation, so its import is removed.
// import { supabaseAdminClient } from '@/lib/supabaseAdminClient';
import { z } from 'zod';

const submissionSchema = z.object({
  had_coach_before: z.boolean(),
  support_needed: z.string(),
  life_stage: z.string(),
  coach_gender_preference: z.string(),
  coach_language_preference: z.string(),
  coaching_style_preference: z.string(),
});

export async function POST(req: NextRequest) {
  // Use the cookie-based client which operates in the user's context
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const validation = submissionSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid submission data.', details: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  // CORRECTED: Use the user-context client ('supabase') for the insert.
  // This client correctly applies the RLS policy allowing users to insert their own data.
  const { data: submission, error: insertError } = await supabase
    .from('coach_connect_submissions')
    .insert({
      user_id: user.id, // Securely obtained user ID
      ...validation.data,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting coach connect submission:", JSON.stringify(insertError, null, 2));
    return NextResponse.json({ error: 'Failed to save submission.', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Submission saved successfully!', submission }, { status: 201 });
}