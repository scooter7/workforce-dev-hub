import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GoalStatus, GoalType } from '@/app/(dashboard)/goals/page'; // Import types
import { z } from 'zod';

// Schema for validating route parameters (goalId) - used by both PATCH and DELETE
const paramsSchema = z.object({
  goalId: z.string().uuid({ message: "Invalid Goal ID format." }),
});

// Schema for validating the request body for PATCH (all fields optional)
const goalUpdateSchema = z.object({
  title: z.string().min(1, { message: 'Title cannot be empty if provided' }).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  type: z.enum(['personal', 'academic', 'professional', 'other'] as const).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed'] as const).optional(),
  target_date: z.string().date().nullable().optional(), // Validates if string is 'YYYY-MM-DD'
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for an update."
});


// --- PATCH Handler for Updating a Goal ---
export async function PATCH(
  req: NextRequest,
  { params }: { params: { goalId: string } }
) {
  const supabase = createSupabaseServerClient();

  try {
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('PATCH /api/goals/[goalId] - Auth Error:', authError);
      return NextResponse.json({ error: 'Unauthorized: User not authenticated.' }, { status: 401 });
    }

    // 2. Validate route parameter (goalId)
    const paramsValidation = paramsSchema.safeParse(params);
    if (!paramsValidation.success) {
      console.error('PATCH /api/goals/[goalId] - Params Validation Error:', paramsValidation.error.flatten().fieldErrors);
      return NextResponse.json({ error: 'Invalid Goal ID.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { goalId } = paramsValidation.data;

    // 3. Validate request body (fields to update)
    const body = await req.json();
    const bodyValidation = goalUpdateSchema.safeParse(body);

    if (!bodyValidation.success) {
      console.error('PATCH /api/goals/[goalId] - Body Validation Error:', bodyValidation.error.flatten().fieldErrors);
      return NextResponse.json({ error: 'Invalid update data provided.', details: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
    }

    const updatePayload = { ...bodyValidation.data };

    // Handle specific field transformations for DB
    if (Object.prototype.hasOwnProperty.call(updatePayload, 'target_date')) {
        updatePayload.target_date = updatePayload.target_date ? new Date(updatePayload.target_date).toISOString() : null;
    }

    // Add updated_at timestamp
    // @ts-ignore - We are adding updated_at to a validated structure
    updatePayload.updated_at = new Date().toISOString();


    // 4. Update the goal
    const { data: updatedGoal, error: updateError } = await supabase
      .from('user_goals')
      .update(updatePayload) // Pass only validated and transformed fields
      .eq('id', goalId)
      .eq('user_id', user.id) // Crucial: ensure user owns the goal
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') { // No rows found or RLS violation
        console.warn(`PATCH /api/goals/[goalId] - Goal not found or not owned by user: ${goalId}`);
        return NextResponse.json({ error: 'Goal not found or access denied.' }, { status: 404 });
      }
      console.error('PATCH /api/goals/[goalId] - Update Error:', updateError);
      return NextResponse.json({ error: 'Failed to update goal.', details: updateError.message }, { status: 500 });
    }

    if (!updatedGoal) {
        return NextResponse.json({ error: 'Goal not found after update attempt or access denied.' }, { status: 404 });
    }

    // Points for general update are omitted for now, assuming specific actions handle points.

    return NextResponse.json(updatedGoal, { status: 200 });

  } catch (error: any) {
    console.error('PATCH /api/goals/[goalId] - Generic Error:', error);
    if (error.name === 'SyntaxError') { // JSON parsing error
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}


// --- DELETE Handler for Deleting a Goal ---
export async function DELETE(
  req: NextRequest, // req might not be used directly but is part of the signature
  { params }: { params: { goalId: string } }
) {
  const supabase = createSupabaseServerClient();

  try {
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('DELETE /api/goals/[goalId] - Auth Error:', authError);
      return NextResponse.json({ error: 'Unauthorized: User not authenticated.' }, { status: 401 });
    }

    // 2. Validate route parameter (goalId)
    const paramsValidation = paramsSchema.safeParse(params); // paramsSchema is already defined above
    if (!paramsValidation.success) {
      console.error('DELETE /api/goals/[goalId] - Params Validation Error:', paramsValidation.error.flatten().fieldErrors);
      return NextResponse.json({ error: 'Invalid Goal ID.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { goalId } = paramsValidation.data;

    // 3. Delete the goal
    const { error: deleteError, count } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id); // Crucial: ensure user owns the goal

    if (deleteError) {
      console.error('DELETE /api/goals/[goalId] - Delete Error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete goal.', details: deleteError.message }, { status: 500 });
    }

    if (count === 0) {
      console.warn(`DELETE /api/goals/[goalId] - Goal not found or not owned by user for deletion: ${goalId}`);
      return NextResponse.json({ error: 'Goal not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Goal deleted successfully.' }, { status: 200 });
    // Or: return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error('DELETE /api/goals/[goalId] - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}