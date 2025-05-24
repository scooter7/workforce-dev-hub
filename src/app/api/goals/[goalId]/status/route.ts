import { NextRequest, NextResponse } from 'next/server';
// --- CORRECTED IMPORT FOR BOTH CLIENTS ---
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
// --- END CORRECTION ---
//import { GoalStatus } from '@/app/(dashboard)/goals/page'; // Import GoalStatus type
import { POINTS_FOR_GOAL_STATUS_CHANGE, POINTS_FOR_COMPLETING_GOAL } from '@/lib/constants';
import { z } from 'zod';

const statusUpdateSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed'] as const, {
    required_error: "New status is required."
  }),
});

const paramsSchema = z.object({
  goalId: z.string().uuid({ message: "Invalid Goal ID format." }),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { goalId: string } }
) {
  const supabaseUserClient = createSupabaseServerClient(); // For user-context operations
  const supabaseAdmin = createSupabaseAdminClient(); // For privileged operations like point updates/logs

  try {
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !user) {
      console.error('PATCH /api/goals/[goalId]/status - Auth Error:', authError);
      return NextResponse.json({ error: 'Unauthorized: User not authenticated.' }, { status: 401 });
    }

    const paramsValidation = paramsSchema.safeParse(params);
    if (!paramsValidation.success) {
      console.error('PATCH /api/goals/[goalId]/status - Params Validation Error:', paramsValidation.error.flatten().fieldErrors);
      return NextResponse.json({ error: 'Invalid Goal ID.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { goalId } = paramsValidation.data;

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }

    const bodyValidation = statusUpdateSchema.safeParse(body);
    if (!bodyValidation.success) {
      console.error('PATCH /api/goals/[goalId]/status - Body Validation Error:', bodyValidation.error.flatten().fieldErrors);
      return NextResponse.json({ error: 'Invalid new status provided.', details: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { status: newStatus } = bodyValidation.data;

    // Use supabaseUserClient (or createSupabaseServerClient() directly) for the update,
    // as RLS policies on user_goals are set for user_id = auth.uid()
    const { data: updatedGoal, error: updateError } = await createSupabaseServerClient()
      .from('user_goals')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', user.id) // Ensure user owns the goal
      .select('id, title, status') // Select enough info for logging and response
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') { // No rows found or RLS violation
        console.warn(`PATCH /api/goals/[goalId]/status - Goal not found or not owned by user: ${goalId}`);
        return NextResponse.json({ error: 'Goal not found or access denied.' }, { status: 404 });
      }
      console.error('PATCH /api/goals/[goalId]/status - Update Error:', updateError);
      return NextResponse.json({ error: 'Failed to update goal status.', details: updateError.message }, { status: 500 });
    }

    if (!updatedGoal) { // Should ideally be caught by PGRST116 but as a safeguard
        return NextResponse.json({ error: 'Goal not found after update attempt or access denied.' }, { status: 404 });
    }

    let pointsToAward = 0;
    let reasonCode = '';
    let reasonMessage = '';

    if (newStatus === 'completed') {
      pointsToAward = POINTS_FOR_COMPLETING_GOAL;
      reasonCode = 'GOAL_STATUS_COMPLETED';
      reasonMessage = `Completed goal: "${updatedGoal.title}"`;
    } else if (newStatus === 'in_progress') {
      pointsToAward = POINTS_FOR_GOAL_STATUS_CHANGE;
      reasonCode = 'GOAL_STATUS_IN_PROGRESS';
      reasonMessage = `Set goal "${updatedGoal.title}" to In Progress`;
    }
    // Add other status change point logic if necessary

    if (pointsToAward > 0) {
      const { error: pointsError } = await supabaseAdmin // Use admin client for RPC
        .rpc('increment_user_points', { user_id_param: user.id, points_to_add: pointsToAward });

      if (pointsError) {
        console.error('PATCH /api/goals/[goalId]/status - Points Update Error:', pointsError);
      } else {
        console.log(`Awarded ${pointsToAward} points to user ${user.id} for updating goal ${goalId} to ${newStatus}.`);
        
        // Log the point transaction using supabaseAdmin
        const { error: logError } = await supabaseAdmin.from('point_logs').insert({
          user_id: user.id,
          points_awarded: pointsToAward,
          reason_code: reasonCode,
          reason_message: reasonMessage,
          related_entity_id: updatedGoal.id,
          related_entity_type: 'user_goal',
        });
        if (logError) {
          console.error(`Error logging points for ${reasonCode}:`, logError);
        }
      }
    }

    return NextResponse.json(updatedGoal, { status: 200 });

  } catch (error: any) {
    console.error('PATCH /api/goals/[goalId]/status - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}