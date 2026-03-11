from datetime import datetime

from models.outcome import OutcomeCreate
from services.outcome_service import OutcomeService


def main() -> None:
    service = OutcomeService()
    sample = OutcomeCreate(
        lifecycle_id="lifecycle_001",
        outcome_type="COST_OVERRUN",
        value=12500.0,
        recorded_at=datetime.utcnow(),
    )
    outcome = service.create_outcome(sample)
    print(f"Seeded outcome {outcome.outcome_id} for {outcome.lifecycle_id}")


if __name__ == "__main__":
    main()
