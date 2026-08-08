# Connected Island Journey summary

VI Guide now has a product layer that can present a ferry trip as a connected traveler movement line. The initial implementation is deliberately compositional: Ferry Planner owns published ferry truth; Island Journey owns the sequence; Mobility owns ground-transfer execution; Concierge owns coordination; Planner owns itinerary editing; My Trip owns the saved traveler command center.

This prevents the new experience from becoming another isolated module and establishes the architecture for arbitrary door-to-door routing next.
