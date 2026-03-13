BEGIN;

ALTER TABLE public.debtors
  ALTER COLUMN total_amount TYPE numeric(14,0)
  USING ROUND(total_amount),
  ALTER COLUMN paid_amount TYPE numeric(14,0)
  USING ROUND(paid_amount),
  ALTER COLUMN paid_amount SET DEFAULT 0;

COMMIT;
