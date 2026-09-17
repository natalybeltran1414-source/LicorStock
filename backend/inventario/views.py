from django.db import transaction
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Categoria, Producto, Inventario, MovimientoInventario
from .serializers import (CategoriaSerializer, ProductoSerializer,
                          ProductoWriteSerializer, MovimientoInventarioSerializer,
                          AjusteSerializer)


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all().annotate(
        total_productos=Count('productos', filter=F('productos__estado'))
    ).order_by('nombre')
    serializer_class = CategoriaSerializer

    def destroy(self, request, *args, **kwargs):
        categoria = self.get_object()
        if categoria.productos.exists():
            # No se eliminan productos asociados; se desactiva la categoría.
            categoria.estado = False
            categoria.save()
            return Response({'detail': 'La categoría tiene productos asociados. Se desactivó.'},
                            status=status.HTTP_200_OK)
        return super().destroy(request, *args, **kwargs)


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.select_related('categoria', 'inventario').order_by('nombre')
    filterset_fields = []
    search_fields = []

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductoWriteSerializer
        return ProductoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        categoria = self.request.query_params.get('categoria')
        estado = self.request.query_params.get('estado')

        if search:
            qs = qs.filter(nombre__icontains=search) | qs.filter(descripcion__icontains=search)
        if categoria:
            qs = qs.filter(categoria_id=categoria)
        if estado is not None:
            qs = qs.filter(estado=estado.lower() == 'true')
        return qs

    @action(detail=False, methods=['get'])
    def bajo_stock(self, request):
        """Productos cuyo stock actual está en o por debajo del mínimo."""
        productos = self.get_queryset().filter(inventario__stock_actual__lte=F('stock_minimo'))
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Totales generales del inventario para el panel."""
        qs = self.get_queryset().filter(estado=True)
        dec = DecimalField(max_digits=14, decimal_places=2)
        valor_unitario = ExpressionWrapper(
            F('inventario__stock_actual') * F('precio_compra'), output_field=dec
        )
        agg = qs.aggregate(
            total_productos=Count('id'),
            unidades_totales=Coalesce(Sum('inventario__stock_actual'), Value(0)),
            valor_inventario=Coalesce(Sum(valor_unitario), Value(0), output_field=dec),
        )
        bajo = qs.filter(inventario__stock_actual__lte=F('stock_minimo')).count()
        return Response({**agg, 'bajo_stock': bajo})

    @action(detail=True, methods=['post'])
    def toggle_estado(self, request, pk=None):
        """Activa/desactiva la disponibilidad del producto."""
        producto = self.get_object()
        producto.estado = not producto.estado
        producto.save(update_fields=['estado'])
        return Response(ProductoSerializer(producto).data)

    @action(detail=True, methods=['post', 'delete'])
    def imagen(self, request, pk=None):
        """
        POST: sube/reemplaza la foto del producto (multipart, campo 'imagen').
        DELETE: elimina la foto actual.
        """
        producto = self.get_object()

        if request.method == 'DELETE':
            if producto.imagen:
                producto.imagen.delete(save=False)
                producto.save(update_fields=['imagen'])
            return Response({'detail': 'Imagen eliminada.'})

        archivo = request.FILES.get('imagen')
        if archivo is None:
            return Response({'imagen': 'No se envió ningún archivo.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if archivo.size > 5 * 1024 * 1024:
            return Response({'imagen': 'La imagen no debe superar 5 MB.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if producto.imagen:
            producto.imagen.delete(save=False)
        producto.imagen = archivo
        producto.save(update_fields=['imagen'])
        return Response(ProductoSerializer(producto, context={'request': request}).data)


class MovimientoInventarioViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Los movimientos se generan desde: registro de producto (entrada inicial),
    ajustes manuales (acción `ajustar`) y ventas (salidas automáticas).
    """
    queryset = MovimientoInventario.objects.select_related('producto', 'usuario').order_by('-fecha')
    serializer_class = MovimientoInventarioSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        producto = self.request.query_params.get('producto')
        tipo = self.request.query_params.get('tipo')
        if producto:
            qs = qs.filter(producto_id=producto)
        if tipo:
            qs = qs.filter(tipo_movimiento=tipo.upper())
        return qs

    @action(detail=False, methods=['post'])
    def ajustar(self, request):
        """
        Registra un movimiento y actualiza el stock de forma atómica.
        Body: { producto, tipo_movimiento: ENTRADA|SALIDA|AJUSTE, cantidad, motivo? }
        - ENTRADA: suma la cantidad al stock actual.
        - SALIDA: resta la cantidad (valida stock suficiente).
        - AJUSTE: fija el stock exactamente en la cantidad indicada.
        """
        serializer = AjusteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data

        with transaction.atomic():
            inventario = Inventario.objects.select_for_update().filter(
                producto_id=datos['producto'].id
            ).first()
            if inventario is None:
                inventario = Inventario.objects.create(producto=datos['producto'])

            tipo = datos['tipo_movimiento']
            cantidad = datos['cantidad']
            anterior = inventario.stock_actual

            if tipo == 'ENTRADA':
                nuevo = anterior + cantidad
            elif tipo == 'SALIDA':
                if cantidad > anterior:
                    return Response(
                        {'cantidad': f'Stock insuficiente. Disponible: {anterior}.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                nuevo = anterior - cantidad
            else:  # AJUSTE
                nuevo = cantidad

            inventario.stock_actual = nuevo
            inventario.save(update_fields=['stock_actual', 'fecha_actualizacion'])

            movimiento = MovimientoInventario.objects.create(
                producto=datos['producto'],
                usuario=request.user,
                tipo_movimiento=tipo,
                cantidad=cantidad,
                motivo=datos.get('motivo') or {
                    'ENTRADA': 'Entrada manual de productos',
                    'SALIDA': 'Salida manual de productos',
                    'AJUSTE': 'Ajuste de inventario',
                }[tipo],
            )

        return Response({
            'movimiento': MovimientoInventarioSerializer(movimiento).data,
            'stock_anterior': anterior,
            'stock_actual': nuevo,
        }, status=status.HTTP_201_CREATED)
