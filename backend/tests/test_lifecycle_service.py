from services.lifecycle_service import LifecycleService


def test_get_lifecycle_has_events() -> None:
    service = LifecycleService()
    lifecycle = service.get_lifecycle("lifecycle_001")
    assert lifecycle.lifecycle_id == "lifecycle_001"
    assert lifecycle.events
