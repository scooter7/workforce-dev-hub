-- This function safely adds a given number of points to a user's total in the profiles table.
-- Using a function like this is more secure and performant than doing a SELECT then UPDATE in the API.
create
or replace function public.award_points (user_id_input uuid, points_to_add integer) returns void as $$
begin
  update public.profiles
  set points = points + points_to_add
  where id = user_id_input;
end;
$$ language plpgsql volatile security definer;
