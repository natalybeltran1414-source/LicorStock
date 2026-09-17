from rest_framework.routers import DefaultRouter

from .views import DeudaViewSet

router = DefaultRouter()
router.register('deudas', DeudaViewSet, basename='deudas')

urlpatterns = router.urls
