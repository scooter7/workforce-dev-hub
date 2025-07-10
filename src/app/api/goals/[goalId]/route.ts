import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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
  target_date: z.string().date().nullable().optional(),
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('PATCH /api/goals/[goalId] - Auth Error:', authError);
      return NextResponse.json({ error: 'Unauthorized: User not authenticated.' }, { status: 401 });
    }

    const paramsValidation = paramsSchema.safeParse(params);
    if (!paramsValidation.success) {
      console.error('PATCH /api/goals/[goalId] - Params Validation Error:', paramsValidation.error.flatten().fieldErrors);
      return NextResponse.json({ error: 'Invalid Goal ID.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { goalId } = paramsValidation.data;

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    const bodyValidation = goalUpdateSchema.safeParse(body);

    if (!bodyValidation.success) {
      console.error('PATCH /api/goals/[goalId] - Body Validation Error:', bodyValidation.error.flatten().fieldErrors);
      return NextResponse.json({ error: 'Invalid update data provided.', details: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
    }

    const updatePayload: { [key: string]: any } = { ...bodyValidation.data }; // Use an index signature for flexibility

    if (Object.prototype.hasOwnProperty.call(updatePayload, 'target_date')) {
        updatePayload.target_date = updatePayload.target_date ? new Date(updatePayload.target_date).toISOString() : null;
    }
    
    updatePayload.updated_at = new Date().toISOString();

    const { data: updatedGoal, error: updateError } = await supabase
      .from('user_goals')
      .update(updatePayload)
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        console.warn(`PATCH /api/goals/[goalId] - Goal not found or not owned by user: ${goalId}`);
        return NextResponse.json({ error: 'Goal not found or access denied.' }, { status: 404 });
      }
      console.error('PATCH /api/goals/[goalId] - Update Error:', updateError);
      return NextResponse.json({ error: 'Failed to update goal.', details: updateError.message }, { status: 500 });
    }

    if (!updatedGoal) {
        return NextResponse.json({ error: 'Goal not found after update attempt or access denied.' }, { status: 404 });
    }

    return NextResponse.json(updatedGoal, { status: 200 });

  } catch (error: any) {
    console.error('PATCH /api/goals/[goalId] - Generic Error:', error);
    if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}


// --- DELETE Handler for Deleting a Goal ---
export async function DELETE(
  _req: NextRequest, // CHANGED: req to _req to indicate it's unused
  { params }: { params: { goalId: string } }
) {
  const supabase = createSupabaseServerClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('DELETE /api/goals/[goalId] - Auth Error:', authError);
      return NextResponse.json({ error: 'Unauthorized: User not authenticated.' }, { status: 401 });
    }

    const paramsValidation = paramsSchema.safeParse(params);
    if (!paramsValidation.success) {
      console.error('DELETE /api/goals/[goalId] - Params Validation Error:', paramsValidation.error.flatten().fieldErrors);
      return NextResponse.json({ error: 'Invalid Goal ID.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { goalId } = paramsValidation.data;

    const { error: deleteError, count } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('DELETE /api/goals/[goalId] - Delete Error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete goal.', details: deleteError.message }, { status: 500 });
    }

    if (count === 0) {
      console.warn(`DELETE /api/goals/[goalId] - Goal not found or not owned by user for deletion: ${goalId}`);
      return NextResponse.json({ error: 'Goal not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Goal deleted successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('DELETE /api/goals/[goalId] - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}