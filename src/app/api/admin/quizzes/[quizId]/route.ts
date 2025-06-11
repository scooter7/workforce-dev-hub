import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  _request: Request,
  { params }: { params: { quizId: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // You might want to add another check here to ensure the user is an admin
    // For now, we assume any logged-in user who can access the API route is authorized.

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', params.quizId);

    if (error) {
      console.error('API Delete Error:', error);
      return NextResponse.json({ error: 'Failed to delete quiz', details: error.message }, { status: 500 });
    }

    // Return a success response with no content
    return new Response(null, { status: 204 });

  } catch (e: any) {
    return NextResponse.json({ error: 'An unexpected error occurred', details: e.message }, { status: 500 });
  }
}
