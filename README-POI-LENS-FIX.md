# VI Guide POI Lens Fix

Fixes a category contract mismatch introduced by the unified territory model.

The territory catalog uses normalized kinds such as `beach`, `stay`, and
`historic`, while the existing map lens filters expect `Beach`, `Hotel`, and
`Landmark`. This adapter now translates unified kinds into the display
categories consumed by the map, while preserving the normalized kind in the
`type` field.

After extracting, restart Next.js because the coordinate registry is imported
at build/start time.
