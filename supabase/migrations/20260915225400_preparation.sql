BEGIN;
ALTER TABLE public.order_items ADD COLUMN preparation_status text NOT NULL DEFAULT 'PENDING'
  CHECK (preparation_status IN ('PENDING', 'PREPARING', 'READY', 'DELIVERED'));
-- Histórico já encerrado não entra na fila de preparo.
UPDATE public.order_items i SET preparation_status = 'DELIVERED'
FROM public.orders o WHERE o.id = i.order_id AND o.status <> 'SENT';
CREATE INDEX order_items_preparation_idx ON public.order_items(preparation_status, order_id);

CREATE VIEW public.sabom_preparation WITH (security_invoker = true) AS
SELECT i.id, i.order_id, i.name, i.quantity, i.destination, i.notes, i.preparation_status,
  o.sent_at, o.table_name, t.number AS table_number
FROM public.order_items i JOIN public.orders o ON o.id = i.order_id
JOIN public.dining_tables t ON t.id = o.table_id
WHERE o.status IN ('SENT', 'CLOSED') AND i.preparation_status <> 'DELIVERED';
REVOKE ALL ON public.sabom_preparation FROM anon, authenticated;
GRANT SELECT ON public.sabom_preparation TO service_role;

CREATE FUNCTION public.sabom_advance_preparation(p_item_id integer, p_user_id integer, p_expected text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE next_status text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND active = 1) THEN
    RAISE EXCEPTION 'Usuário inválido.';
  END IF;
  next_status := CASE p_expected WHEN 'PENDING' THEN 'PREPARING' WHEN 'PREPARING' THEN 'READY' WHEN 'READY' THEN 'DELIVERED' END;
  IF next_status IS NULL THEN RAISE EXCEPTION 'Etapa inválida.'; END IF;
  UPDATE public.order_items i SET preparation_status = next_status
  WHERE i.id = p_item_id AND i.preparation_status = p_expected
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = i.order_id AND o.status IN ('SENT', 'CLOSED'));
  IF NOT FOUND THEN RAISE EXCEPTION 'Item atualizado por outro dispositivo ou indisponível. Atualize o painel.'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.sabom_advance_preparation(integer, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sabom_advance_preparation(integer, integer, text) TO service_role;
COMMIT;
