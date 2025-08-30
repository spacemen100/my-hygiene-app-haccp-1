-- Migration pour créer la table des créneaux horaires multiples
-- Date: 2025-01-XX

CREATE TABLE IF NOT EXISTS public.opening_hours_slots (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    opening_hours_id uuid NOT NULL,
    open_time time without time zone NOT NULL,
    close_time time without time zone NOT NULL,
    slot_order integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT opening_hours_slots_pkey PRIMARY KEY (id),
    CONSTRAINT opening_hours_slots_opening_hours_id_fkey FOREIGN KEY (opening_hours_id) 
      REFERENCES public.opening_hours(id) ON DELETE CASCADE,
    CONSTRAINT opening_hours_slots_valid_times CHECK (open_time < close_time),
    CONSTRAINT opening_hours_slots_unique_order UNIQUE (opening_hours_id, slot_order)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_opening_hours_slots_opening_hours_id 
ON public.opening_hours_slots(opening_hours_id);

CREATE INDEX IF NOT EXISTS idx_opening_hours_slots_order 
ON public.opening_hours_slots(opening_hours_id, slot_order);

-- Commentaires
COMMENT ON TABLE public.opening_hours_slots IS 'Table pour stocker les créneaux horaires multiples pour un même jour';
COMMENT ON COLUMN public.opening_hours_slots.opening_hours_id IS 'Référence vers la table opening_hours';
COMMENT ON COLUMN public.opening_hours_slots.slot_order IS 'Ordre du créneau dans la journée (1, 2, 3...)';