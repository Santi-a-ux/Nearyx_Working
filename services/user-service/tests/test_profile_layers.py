from app.models import UserProfile
from app.repositories.profile_repository import ProfileRepository
from app.services.profile_service import ProfileService
from app.controllers.profile_controller import router


def test_profile_layers_are_available():
    assert ProfileRepository is not None
    assert ProfileService is not None
    assert UserProfile is not None
    assert hasattr(ProfileRepository, "get_by_user_id")
    assert hasattr(ProfileService, "create_profile")
    assert hasattr(router, "routes")
