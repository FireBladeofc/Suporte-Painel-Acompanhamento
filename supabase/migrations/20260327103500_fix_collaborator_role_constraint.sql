-- Fix collaborator role constraint to allow additional roles beyond N1/N2
-- The original constraint only allowed 'N1' and 'N2', but new roles have been added:
-- 'implantador', 'financeiro', 'cs', 'tecnico_treinamento'

-- Step 1: Drop the existing restrictive check constraint
ALTER TABLE public.collaborators
  DROP CONSTRAINT IF EXISTS collaborators_role_check;

-- Step 2: Add a new, expanded check constraint with all valid roles
ALTER TABLE public.collaborators
  ADD CONSTRAINT collaborators_role_check
  CHECK (role IN ('N1', 'N2', 'implantador', 'financeiro', 'cs', 'tecnico_treinamento'));
