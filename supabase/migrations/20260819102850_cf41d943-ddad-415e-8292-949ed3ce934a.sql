CREATE OR REPLACE FUNCTION public.task_analytics()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM tasks WHERE user_id = auth.uid()),
    'todo', (SELECT count(*) FROM tasks WHERE user_id = auth.uid() AND status = 'todo'),
    'in_progress', (SELECT count(*) FROM tasks WHERE user_id = auth.uid() AND status = 'in_progress'),
    'done', (SELECT count(*) FROM tasks WHERE user_id = auth.uid() AND status = 'done'),
    'overdue', (SELECT count(*) FROM tasks WHERE user_id = auth.uid() AND status <> 'done' AND due_date < current_date),
    'priority', (SELECT jsonb_object_agg(priority, c) FROM (
        SELECT priority::text AS priority, count(*) AS c FROM tasks WHERE user_id = auth.uid() GROUP BY priority) p),
    'weekly', (SELECT jsonb_agg(jsonb_build_object('day', d::date, 'completed', (
        SELECT count(*) FROM tasks t WHERE t.user_id = auth.uid() AND t.completed_at::date = d::date)))
      FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') d),
    'prev_week_completed', (SELECT count(*) FROM tasks WHERE user_id = auth.uid()
        AND completed_at::date BETWEEN current_date - 13 AND current_date - 7),
    'trend', (SELECT jsonb_agg(jsonb_build_object('day', d::date, 'completed', (
        SELECT count(*) FROM tasks t WHERE t.user_id = auth.uid() AND t.completed_at::date = d::date)))
      FROM generate_series(current_date - interval '29 days', current_date, interval '1 day') d)
  );
$$;
REVOKE EXECUTE ON FUNCTION public.task_analytics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.task_analytics() TO authenticated;