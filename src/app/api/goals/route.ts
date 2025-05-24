import { NextRequest, NextResponse } from 'next/server';
// CORRECTED IMPORT: Both server client and admin client are from @/lib/supabase/server
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { UserGoal } from '@/app/(dashboard)/goals/page'; // Import types
import { POINTS_FOR_GOAL_ADD } from '@/lib/constants';
import { z } from 'zod';

const goalSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(255),
  description: z.string().max(1000).optional().nullable(),
  type: z.enum(['personal', 'academic', 'professional', 'other'] as const),
  status: z.enum(['not_started', 'in_progress', 'completed'] as const).default('not_started'),
  target_date: z.string().date().optional().nullable(), // Validates 'YYYY-MM-DD'
});

export async function POST(req: NextRequest) {
  const supabaseUserClient = createSupabaseServerClient(); // For getting the user session
  const supabaseAdmin = createSupabaseAdminClient(); // For privileged operations like point logs & RPC

  try {
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      console.error('POST /api/goals - Auth Error:', authError);
      return NextResponse.json({ error: 'Unauthorized: User not authenticated.' }, { status: 401 });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }

    const validation = goalSchema.safeParse(body);

    if (!validation.success) {
      console.error('POST /api/goals - Validation Error:', validation.error.flatten().fieldErrors);
      return NextResponse.json({ error: 'Invalid input.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, description, type, status, target_date } = validation.data;

    // Use supabaseUserClient for the insert, as RLS policies on user_goals are set for user_id = auth.uid()
    // The newGoalData object construction ensures user_id is set to the authenticated user's ID.
    const newGoalData: Omit<UserGoal, 'id' | 'created_at' | 'updated_at'> & { user_id: string } = {
      user_id: user.id,
      title,
      description: description || null,
      type,
      status, // Will default to 'not_started' from schema if not provided, but GoalForm sends it
      target_date: target_date ? new Date(target_date).toISOString() : null,
    };

    const { data: createdGoal, error: insertError } = await createSupabaseServerClient() // Use a client scoped to this user for insert
      .from('user_goals')
      .insert(newGoalData)
      .select()
      .single();

    if (insertError) {
      console.error('POST /api/goals - Insert Error:', insertError);
      return NextResponse.json({ error: 'Failed to create goal.', details: insertError.message }, { status: 500 });
    }

    if (createdGoal && POINTS_FOR_GOAL_ADD > 0) {
      const { error: pointsError } = await supabaseAdmin // Use admin client for RPC to update points
        .rpc('increment_user_points', { user_id_param: user.id, points_to_add: POINTS_FOR_GOAL_ADD });

      if (pointsError) {
        console.error('POST /api/goals - Points Update Error:', pointsError);
      } else {
        console.log(`Awarded ${POINTS_FOR_GOAL_ADD} points to user ${user.id} for adding a goal via RPC.`);
        const { error: logError } = await supabaseAdmin.from('point_logs').insert({ // Use admin client for logging
          user_id: user.id,
          points_awarded: POINTS_FOR_GOAL_ADD,
          reason_code: 'GOAL_ADDED',
          reason_message: `Added new goal: "${createdGoal.title}"`,
          related_entity_id: createdGoal.id,
          related_entity_type: 'user_goal',
        });
        if (logError) {
          console.error('Error logging points for GOAL_ADDED:', logError);
        }
      }
    }

    return NextResponse.json(createdGoal, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/goals - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}