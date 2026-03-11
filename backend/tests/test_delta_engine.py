from datetime import datetime

from services.temporal_delta_engine import TemporalDeltaEngine


def test_compute_deltas_counts_events() -> None:
    engine = TemporalDeltaEngine()
    events = [
        {"timestamp": datetime(2024, 1, 1), "event_type": "PO_CREATED"},
        {"timestamp": datetime(2024, 1, 2), "event_type": "INVOICE"},
    ]
    result = engine.compute_deltas(events)
    assert result["delta_count"] == 2
