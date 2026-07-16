#!/bin/bash

# Test if prioridade column exists by trying UPDATE
curl -s -X PATCH \
  "https://lezwuwkrkpmzyooimqvk.supabase.co/rest/v1/processos?id=eq.d13fe0b3-1182-46d8-8d8a-185504308b5b" \
  -H "apikey: sb_publishable_T4aEnk2608tojqtkG6AJYw_EGW2BbMO" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlend1d2tya3Btenlvb2ltcXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkwOTQ2MSwiZXhwIjoyMDk5NDg1NDYxfQ.ijJvxPI1XHGlQ2bHZbZWqdNtxRrYOJjGo1FFgxjyDIU" \
  -H "Content-Type: application/json" \
  -d '{"prioridade":"alta","status_tarefa":"em_andamento"}' \
  -w "\nStatus: %{http_code}\n"
