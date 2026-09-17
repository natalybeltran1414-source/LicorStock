from rest_framework.routers import DefaultRouter

from .views import CategoriaViewSet, ProductoViewSet, MovimientoInventarioViewSet

router = DefaultRouter()
router.register('categorias', CategoriaViewSet, basename='categorias')
router.register('productos', ProductoViewSet, basename='productos')
router.register('movimientos', MovimientoInventarioViewSet, basename='movimientos')

urlpatterns = router.urls
