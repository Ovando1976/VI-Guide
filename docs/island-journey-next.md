# Next connected-journey iteration

After this release slice is stable, extend the same architecture rather than creating another planner:

1. Accept arbitrary VI Guide place/address origin and destination.
2. Resolve the correct ferry terminal pair from island context.
3. Accept desired depart-by or arrive-by time.
4. Select the best published sailing and calculate terminal check-in buffer.
5. Estimate ground-transfer timing using the existing route/mobility system.
6. Save the generated legs as structured stops in the existing Journey Plan and cloud-sync path.
7. Surface the same movement line on Living Map and My Day.
